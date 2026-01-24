package com.aagam.delivery;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.tasks.OnSuccessListener;

public class MainActivity extends AppCompatActivity {

    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1001;

    private FusedLocationProviderClient fusedLocationClient;
    private TextView statusTextView;
    private TextView locationTextView;
    private Button toggleStatusButton;
    private Button viewDeliveriesButton;

    private boolean isOnline = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize views
        statusTextView = findViewById(R.id.statusTextView);
        locationTextView = findViewById(R.id.locationTextView);
        toggleStatusButton = findViewById(R.id.toggleStatusButton);
        viewDeliveriesButton = findViewById(R.id.viewDeliveriesButton);

        // Initialize location client
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);

        // Check location permissions
        checkLocationPermission();

        // Set up button listeners
        toggleStatusButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                toggleOnlineStatus();
            }
        });

        viewDeliveriesButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                viewAvailableDeliveries();
            }
        });

        // Update initial status
        updateStatusDisplay();
    }

    private void checkLocationPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION},
                    LOCATION_PERMISSION_REQUEST_CODE);
        } else {
            getCurrentLocation();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                getCurrentLocation();
            } else {
                Toast.makeText(this, "Location permission is required for delivery tracking", Toast.LENGTH_LONG).show();
            }
        }
    }

    private void getCurrentLocation() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        fusedLocationClient.getLastLocation()
                .addOnSuccessListener(this, new OnSuccessListener<Location>() {
                    @Override
                    public void onSuccess(Location location) {
                        if (location != null) {
                            double latitude = location.getLatitude();
                            double longitude = location.getLongitude();
                            updateLocationDisplay(latitude, longitude);
                        } else {
                            locationTextView.setText("Location not available");
                        }
                    }
                });
    }

    private void updateLocationDisplay(double latitude, double longitude) {
        String locationText = String.format("Location: %.4f, %.4f", latitude, longitude);
        locationTextView.setText(locationText);
    }

    private void toggleOnlineStatus() {
        isOnline = !isOnline;
        updateStatusDisplay();

        if (isOnline) {
            Toast.makeText(this, "You're now online and available for deliveries", Toast.LENGTH_SHORT).show();
            startLocationUpdates();
        } else {
            Toast.makeText(this, "You're now offline", Toast.LENGTH_SHORT).show();
            stopLocationUpdates();
        }
    }

    private void updateStatusDisplay() {
        if (isOnline) {
            statusTextView.setText("🟢 Online - Available for deliveries");
            toggleStatusButton.setText("Go Offline");
            toggleStatusButton.setBackgroundColor(getResources().getColor(android.R.color.holo_red_dark));
        } else {
            statusTextView.setText("🔴 Offline");
            toggleStatusButton.setText("Go Online");
            toggleStatusButton.setBackgroundColor(getResources().getColor(android.R.color.holo_green_dark));
        }
    }

    private void viewAvailableDeliveries() {
        if (!isOnline) {
            Toast.makeText(this, "Please go online to view available deliveries", Toast.LENGTH_SHORT).show();
            return;
        }

        Intent intent = new Intent(this, DeliveriesActivity.class);
        startActivity(intent);
    }

    private void startLocationUpdates() {
        // In a real app, this would start periodic location updates
        // for tracking the rider's position during deliveries
        getCurrentLocation();
    }

    private void stopLocationUpdates() {
        // Stop location updates when offline
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (isOnline) {
            getCurrentLocation();
        }
    }
}