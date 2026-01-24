//
//  AppDelegate.swift
//  AAGAM Delivery
//
//  Created by AAGAM Team
//  Copyright © 2024 AAGAM. All rights reserved.
//

import UIKit
import CoreLocation
import UserNotifications
import FirebaseCore
import FirebaseMessaging

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate, CLLocationManagerDelegate {

    var window: UIWindow?
    let locationManager = CLLocationManager()
    var backgroundTask: UIBackgroundTaskIdentifier = .invalid

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // Configure Firebase
        FirebaseApp.configure()

        // Configure notifications
        configureNotifications()

        // Configure location services
        configureLocationServices()

        // Configure background tasks
        configureBackgroundTasks()

        return true
    }

    // MARK: - Notification Configuration
    private func configureNotifications() {
        UNUserNotificationCenter.current().delegate = self

        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        UNUserNotificationCenter.current().requestAuthorization(options: authOptions) { granted, error in
            if granted {
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }

        Messaging.messaging().delegate = self
    }

    // MARK: - Location Configuration
    private func configureLocationServices() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.requestAlwaysAuthorization()
    }

    // MARK: - Background Tasks Configuration
    private func configureBackgroundTasks() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.aagam.delivery.locationUpdate", using: nil) { task in
            self.handleLocationUpdateTask(task as! BGProcessingTask)
        }

        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.aagam.delivery.syncData", using: nil) { task in
            self.handleDataSyncTask(task as! BGProcessingTask)
        }
    }

    // MARK: - UIApplicationDelegate Methods
    func applicationDidEnterBackground(_ application: UIApplication) {
        scheduleBackgroundTasks()
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Refresh app state when becoming active
        NotificationCenter.default.post(name: .appDidBecomeActive, object: nil)
    }

    // MARK: - Push Notification Methods
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for remote notifications: \(error.localizedDescription)")
    }

    // MARK: - UNUserNotificationCenterDelegate Methods
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.alert, .badge, .sound])
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {

        let userInfo = response.notification.request.content.userInfo

        // Handle notification tap
        if let deliveryId = userInfo["delivery_id"] as? String {
            handleDeliveryNotification(deliveryId: deliveryId)
        }

        completionHandler()
    }

    // MARK: - MessagingDelegate Methods
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        if let token = fcmToken {
            print("FCM Token: \(token)")
            // Send token to server for push notifications
            sendTokenToServer(token: token)
        }
    }

    // MARK: - CLLocationManagerDelegate Methods
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        // Send location update to server
        sendLocationUpdate(location: location)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location manager failed: \(error.localizedDescription)")
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        switch status {
        case .authorizedAlways, .authorizedWhenInUse:
            locationManager.startUpdatingLocation()
        case .denied, .restricted:
            showLocationPermissionAlert()
        default:
            break
        }
    }

    // MARK: - Background Task Handlers
    private func handleLocationUpdateTask(_ task: BGProcessingTask) {
        // Perform location update in background
        scheduleLocationUpdate()

        task.setTaskCompleted(success: true)
    }

    private func handleDataSyncTask(_ task: BGProcessingTask) {
        // Perform data synchronization
        syncDeliveryData()

        task.setTaskCompleted(success: true)
    }

    // MARK: - Helper Methods
    private func scheduleBackgroundTasks() {
        let locationUpdateRequest = BGProcessingTaskRequest(identifier: "com.aagam.delivery.locationUpdate")
        locationUpdateRequest.requiresNetworkConnectivity = true
        locationUpdateRequest.requiresExternalPower = false

        let syncDataRequest = BGProcessingTaskRequest(identifier: "com.aagam.delivery.syncData")
        syncDataRequest.requiresNetworkConnectivity = true
        syncDataRequest.requiresExternalPower = false

        do {
            try BGTaskScheduler.shared.submit(locationUpdateRequest)
            try BGTaskScheduler.shared.submit(syncDataRequest)
        } catch {
            print("Failed to schedule background tasks: \(error.localizedDescription)")
        }
    }

    private func scheduleLocationUpdate() {
        // Schedule next location update
        let request = BGProcessingTaskRequest(identifier: "com.aagam.delivery.locationUpdate")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes

        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Failed to schedule location update: \(error.localizedDescription)")
        }
    }

    private func sendLocationUpdate(location: CLLocation) {
        let locationData = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "timestamp": location.timestamp.timeIntervalSince1970,
            "accuracy": location.horizontalAccuracy
        ] as [String: Any]

        // Send to server via API
        APIManager.shared.sendLocationUpdate(data: locationData) { success in
            if success {
                print("Location update sent successfully")
            } else {
                print("Failed to send location update")
            }
        }
    }

    private func sendTokenToServer(token: String) {
        let tokenData = ["fcm_token": token]

        APIManager.shared.updateFCMToken(data: tokenData) { success in
            if success {
                print("FCM token updated successfully")
            } else {
                print("Failed to update FCM token")
            }
        }
    }

    private func handleDeliveryNotification(deliveryId: String) {
        // Navigate to delivery details
        if let rootViewController = window?.rootViewController as? UINavigationController {
            // Navigate to delivery details view
            NotificationCenter.default.post(name: .showDeliveryDetails, object: nil, userInfo: ["deliveryId": deliveryId])
        }
    }

    private func showLocationPermissionAlert() {
        let alert = UIAlertController(
            title: "Location Permission Required",
            message: "Please enable location services to track deliveries and provide accurate service.",
            preferredStyle: .alert
        )

        alert.addAction(UIAlertAction(title: "Settings", style: .default) { _ in
            if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(settingsUrl)
            }
        })

        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))

        window?.rootViewController?.present(alert, animated: true)
    }

    private func syncDeliveryData() {
        // Sync pending deliveries, earnings, etc.
        APIManager.shared.syncData { success in
            if success {
                print("Data sync completed")
            } else {
                print("Data sync failed")
            }
        }
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let appDidBecomeActive = Notification.Name("appDidBecomeActive")
    static let showDeliveryDetails = Notification.Name("showDeliveryDetails")
}