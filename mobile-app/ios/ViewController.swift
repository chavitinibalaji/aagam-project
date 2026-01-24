//
//  ViewController.swift
//  AAGAM Delivery
//
//  Created by AAGAM Team
//  Copyright © 2024 AAGAM. All rights reserved.
//

import UIKit
import CoreLocation
import MapKit

class ViewController: UIViewController, CLLocationManagerDelegate, MKMapViewDelegate {

    // MARK: - IBOutlets
    @IBOutlet weak var mapView: MKMapView!
    @IBOutlet weak var statusLabel: UILabel!
    @IBOutlet weak var statusIndicator: UIView!
    @IBOutlet weak var toggleStatusButton: UIButton!
    @IBOutlet weak var deliveriesTableView: UITableView!
    @IBOutlet weak var earningsLabel: UILabel!
    @IBOutlet weak var deliveriesCountLabel: UILabel!

    // MARK: - Properties
    private let locationManager = CLLocationManager()
    private var isOnline = false
    private var currentLocation: CLLocation?
    private var deliveries: [Delivery] = []
    private var timer: Timer?

    // MARK: - Lifecycle Methods
    override func viewDidLoad() {
        super.viewDidLoad()

        setupUI()
        setupLocationManager()
        setupMapView()
        setupTableView()
        loadDeliveries()
        startStatusUpdates()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(true, animated: animated)
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        navigationController?.setNavigationBarHidden(false, animated: animated)
    }

    // MARK: - Setup Methods
    private func setupUI() {
        // Round status indicator
        statusIndicator.layer.cornerRadius = statusIndicator.frame.width / 2
        statusIndicator.layer.masksToBounds = true

        // Style toggle button
        toggleStatusButton.layer.cornerRadius = 8
        toggleStatusButton.layer.masksToBounds = true

        updateStatusDisplay()
    }

    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
    }

    private func setupMapView() {
        mapView.delegate = self
        mapView.showsUserLocation = true
        mapView.userTrackingMode = .follow
    }

    private func setupTableView() {
        deliveriesTableView.delegate = self
        deliveriesTableView.dataSource = self
        deliveriesTableView.register(DeliveryCell.self, forCellReuseIdentifier: "DeliveryCell")
    }

    // MARK: - Status Management
    private func updateStatusDisplay() {
        if isOnline {
            statusLabel.text = "Online - Available for deliveries"
            statusIndicator.backgroundColor = .systemGreen
            toggleStatusButton.setTitle("Go Offline", for: .normal)
            toggleStatusButton.backgroundColor = .systemRed
        } else {
            statusLabel.text = "Offline"
            statusIndicator.backgroundColor = .systemGray
            toggleStatusButton.setTitle("Go Online", for: .normal)
            toggleStatusButton.backgroundColor = .systemGreen
        }
    }

    @IBAction func toggleStatus(_ sender: UIButton) {
        isOnline.toggle()
        updateStatusDisplay()

        if isOnline {
            startDeliveryMode()
            showToast(message: "You're now online and available for deliveries")
        } else {
            stopDeliveryMode()
            showToast(message: "You're now offline")
        }
    }

    private func startDeliveryMode() {
        locationManager.startUpdatingLocation()
        startStatusUpdates()
        loadDeliveries()
    }

    private func stopDeliveryMode() {
        locationManager.stopUpdatingLocation()
        stopStatusUpdates()
        deliveries.removeAll()
        deliveriesTableView.reloadData()
    }

    // MARK: - Data Loading
    private func loadDeliveries() {
        guard isOnline else { return }

        // Simulate API call
        APIManager.shared.getAvailableDeliveries { [weak self] result in
            switch result {
            case .success(let deliveries):
                self?.deliveries = deliveries
                DispatchQueue.main.async {
                    self?.deliveriesTableView.reloadData()
                    self?.updateDeliveriesCount()
                }
            case .failure(let error):
                print("Failed to load deliveries: \(error.localizedDescription)")
                self?.showToast(message: "Failed to load deliveries")
            }
        }
    }

    private func updateDeliveriesCount() {
        deliveriesCountLabel.text = "\(deliveries.count) deliveries available"
    }

    private func loadEarnings() {
        APIManager.shared.getEarnings { [weak self] result in
            switch result {
            case .success(let earnings):
                DispatchQueue.main.async {
                    self?.earningsLabel.text = "₹\(earnings.today.formattedString())"
                }
            case .failure(let error):
                print("Failed to load earnings: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Timer Methods
    private func startStatusUpdates() {
        timer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
            self?.updateLocationAndStatus()
        }
    }

    private func stopStatusUpdates() {
        timer?.invalidate()
        timer = nil
    }

    private func updateLocationAndStatus() {
        guard let location = currentLocation, isOnline else { return }

        let locationData = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "timestamp": Date().timeIntervalSince1970
        ]

        APIManager.shared.updateLocation(data: locationData) { success in
            if !success {
                print("Failed to update location")
            }
        }
    }

    // MARK: - CLLocationManagerDelegate
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        currentLocation = location

        // Update map
        let region = MKCoordinateRegion(center: location.coordinate, latitudinalMeters: 1000, longitudinalMeters: 1000)
        mapView.setRegion(region, animated: true)

        // Update location on server if online
        if isOnline {
            updateLocationAndStatus()
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location manager error: \(error.localizedDescription)")
        showToast(message: "Location services unavailable")
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        switch status {
        case .authorizedWhenInUse, .authorizedAlways:
            locationManager.startUpdatingLocation()
        case .denied, .restricted:
            showLocationPermissionAlert()
        default:
            break
        }
    }

    // MARK: - MKMapViewDelegate
    func mapView(_ mapView: MKMapView, didUpdate userLocation: MKUserLocation) {
        // Handle user location updates on map
    }

    // MARK: - Helper Methods
    private func showLocationPermissionAlert() {
        let alert = UIAlertController(
            title: "Location Permission Required",
            message: "Please enable location services to track deliveries.",
            preferredStyle: .alert
        )

        alert.addAction(UIAlertAction(title: "Settings", style: .default) { _ in
            if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(settingsUrl)
            }
        })

        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))

        present(alert, animated: true)
    }

    private func showToast(message: String) {
        let toast = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        present(toast, animated: true)

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            toast.dismiss(animated: true)
        }
    }
}

// MARK: - UITableViewDelegate & UITableViewDataSource
extension ViewController: UITableViewDelegate, UITableViewDataSource {

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return deliveries.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "DeliveryCell", for: indexPath) as! DeliveryCell
        let delivery = deliveries[indexPath.row]
        cell.configure(with: delivery)
        return cell
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)

        let delivery = deliveries[indexPath.row]
        showDeliveryDetails(for: delivery)
    }

    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> Float {
        return 100.0
    }
}

// MARK: - Delivery Details
extension ViewController {
    private func showDeliveryDetails(for delivery: Delivery) {
        let alert = UIAlertController(title: "Delivery Details", message: delivery.description, preferredStyle: .alert)

        alert.addAction(UIAlertAction(title: "Accept", style: .default) { _ in
            self.acceptDelivery(delivery)
        })

        alert.addAction(UIAlertAction(title: "View on Map", style: .default) { _ in
            self.showDeliveryOnMap(delivery)
        })

        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))

        present(alert, animated: true)
    }

    private func acceptDelivery(_ delivery: Delivery) {
        APIManager.shared.acceptDelivery(deliveryId: delivery.id) { [weak self] success in
            if success {
                DispatchQueue.main.async {
                    self?.showToast(message: "Delivery accepted!")
                    self?.loadDeliveries() // Refresh list
                }
            } else {
                DispatchQueue.main.async {
                    self?.showToast(message: "Failed to accept delivery")
                }
            }
        }
    }

    private func showDeliveryOnMap(_ delivery: Delivery) {
        // Center map on delivery location
        let coordinate = CLLocationCoordinate2D(latitude: delivery.latitude, longitude: delivery.longitude)
        let region = MKCoordinateRegion(center: coordinate, latitudinalMeters: 500, longitudinalMeters: 500)
        mapView.setRegion(region, animated: true)

        // Add delivery annotation
        let annotation = MKPointAnnotation()
        annotation.coordinate = coordinate
        annotation.title = "Delivery #\(delivery.id)"
        annotation.subtitle = delivery.address
        mapView.addAnnotation(annotation)
    }
}

// MARK: - Supporting Classes
class Delivery {
    let id: String
    let customerName: String
    let address: String
    let latitude: Double
    let longitude: Double
    let items: [String]
    let totalAmount: Double
    let estimatedTime: Int // in minutes

    init(id: String, customerName: String, address: String, latitude: Double, longitude: Double, items: [String], totalAmount: Double, estimatedTime: Int) {
        self.id = id
        self.customerName = customerName
        self.address = address
        self.latitude = latitude
        self.longitude = longitude
        self.items = items
        self.totalAmount = totalAmount
        self.estimatedTime = estimatedTime
    }

    var description: String {
        return """
        Customer: \(customerName)
        Address: \(address)
        Items: \(items.joined(separator: ", "))
        Amount: ₹\(totalAmount.formattedString())
        ETA: \(estimatedTime) mins
        """
    }
}

class DeliveryCell: UITableViewCell {
    private let customerNameLabel = UILabel()
    private let addressLabel = UILabel()
    private let itemsLabel = UILabel()
    private let amountLabel = UILabel()
    private let timeLabel = UILabel()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupViews()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupViews() {
        // Configure labels
        customerNameLabel.font = .boldSystemFont(ofSize: 16)
        addressLabel.font = .systemFont(ofSize: 14)
        addressLabel.textColor = .gray
        itemsLabel.font = .systemFont(ofSize: 12)
        itemsLabel.textColor = .darkGray
        amountLabel.font = .boldSystemFont(ofSize: 16)
        amountLabel.textColor = .systemGreen
        timeLabel.font = .systemFont(ofSize: 12)
        timeLabel.textColor = .systemBlue

        // Add to content view
        contentView.addSubview(customerNameLabel)
        contentView.addSubview(addressLabel)
        contentView.addSubview(itemsLabel)
        contentView.addSubview(amountLabel)
        contentView.addSubview(timeLabel)

        // Layout constraints would be set here in a real implementation
    }

    func configure(with delivery: Delivery) {
        customerNameLabel.text = delivery.customerName
        addressLabel.text = delivery.address
        itemsLabel.text = delivery.items.joined(separator: ", ")
        amountLabel.text = "₹\(delivery.totalAmount.formattedString())"
        timeLabel.text = "\(delivery.estimatedTime) mins away"
    }
}

// MARK: - Extensions
extension Double {
    func formattedString() -> String {
        return String(format: "%.2f", self)
    }
}