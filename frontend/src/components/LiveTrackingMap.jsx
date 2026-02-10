/**
 * LiveTrackingMap Component
 * Real-time tracking with Google Maps showing technician location, user location, and ETA
 * Similar to Zomato/Swiggy delivery tracking
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Google Maps API key should be in environment variable
const GOOGLE_MAPS_API_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || window.GOOGLE_MAPS_API_KEY || '';

// Map styles for dark/light mode
const mapStyles = {
    light: [],
    dark: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    ]
};

// Custom marker icons
const markerIcons = {
    technician: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
                <circle cx="20" cy="20" r="18" fill="#10B981" stroke="#fff" stroke-width="3"/>
                <path d="M20 12c-3.3 0-6 2.7-6 6 0 1.7.7 3.2 1.8 4.3l4.2 5.7 4.2-5.7c1.1-1.1 1.8-2.6 1.8-4.3 0-3.3-2.7-6-6-6zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="#fff"/>
            </svg>
        `),
        scaledSize: { width: 40, height: 40 },
        anchor: { x: 20, y: 40 }
    },
    user: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
                <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="#fff" stroke-width="3"/>
                <circle cx="20" cy="16" r="5" fill="#fff"/>
                <path d="M12 28c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="#fff"/>
            </svg>
        `),
        scaledSize: { width: 40, height: 40 },
        anchor: { x: 20, y: 40 }
    }
};

const LiveTrackingMap = ({
    jobId,
    userLocation,
    technicianLocation,
    eta,
    technicianName,
    technicianPhone,
    technicianPhoto,
    jobStatus,
    onRefresh,
    darkMode = false,
    showChat = true,
    height = '400px'
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const technicianMarkerRef = useRef(null);
    const userMarkerRef = useRef(null);
    const directionsRendererRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    const [routeInfo, setRouteInfo] = useState(null);
    const [showTechnicianDetails, setShowTechnicianDetails] = useState(false);

    // Load Google Maps API
    useEffect(() => {
        if (window.google && window.google.maps) {
            setMapLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);

        return () => {
            // Cleanup if needed
        };
    }, []);

    // Initialize map
    useEffect(() => {
        if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

        const center = technicianLocation || userLocation || { lat: 28.6139, lng: 77.2090 }; // Default to Delhi

        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: 14,
            styles: darkMode ? mapStyles.dark : mapStyles.light,
            disableDefaultUI: true,
            zoomControl: true,
            fullscreenControl: true,
            gestureHandling: 'greedy'
        });

        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#10B981',
                strokeWeight: 5,
                strokeOpacity: 0.8
            }
        });

        setIsMapReady(true);
    }, [mapLoaded, darkMode]);

    // Update markers and route
    useEffect(() => {
        if (!isMapReady || !mapInstanceRef.current) return;

        // Update technician marker
        if (technicianLocation) {
            if (technicianMarkerRef.current) {
                technicianMarkerRef.current.setPosition(technicianLocation);
            } else {
                technicianMarkerRef.current = new window.google.maps.Marker({
                    position: technicianLocation,
                    map: mapInstanceRef.current,
                    icon: markerIcons.technician,
                    title: technicianName || 'Technician',
                    animation: window.google.maps.Animation.DROP
                });

                technicianMarkerRef.current.addListener('click', () => {
                    setShowTechnicianDetails(true);
                });
            }
        }

        // Update user marker
        if (userLocation) {
            if (userMarkerRef.current) {
                userMarkerRef.current.setPosition(userLocation);
            } else {
                userMarkerRef.current = new window.google.maps.Marker({
                    position: userLocation,
                    map: mapInstanceRef.current,
                    icon: markerIcons.user,
                    title: 'Your Location'
                });
            }
        }

        // Calculate and display route
        if (technicianLocation && userLocation && jobStatus === 'en_route') {
            const directionsService = new window.google.maps.DirectionsService();
            directionsService.route({
                origin: technicianLocation,
                destination: userLocation,
                travelMode: window.google.maps.TravelMode.DRIVING
            }, (result, status) => {
                if (status === 'OK' && directionsRendererRef.current) {
                    directionsRendererRef.current.setDirections(result);
                    const route = result.routes[0];
                    if (route && route.legs[0]) {
                        setRouteInfo({
                            distance: route.legs[0].distance.text,
                            duration: route.legs[0].duration.text
                        });
                    }
                }
            });
        }

        // Fit bounds to show both markers
        if (technicianLocation && userLocation) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(technicianLocation);
            bounds.extend(userLocation);
            mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
        }
    }, [isMapReady, technicianLocation, userLocation, technicianName, jobStatus]);

    // Status labels
    const statusLabels = {
        'pending': { text: 'Finding Technician...', color: 'bg-yellow-500', icon: '🔍' },
        'assigned': { text: 'Technician Assigned', color: 'bg-blue-500', icon: '✓' },
        'accepted': { text: 'Technician on the way', color: 'bg-green-500', icon: '🚗' },
        'en_route': { text: 'On the way to you', color: 'bg-green-500', icon: '🚗' },
        'arrived': { text: 'Technician Arrived', color: 'bg-emerald-600', icon: '📍' },
        'in_progress': { text: 'Work in Progress', color: 'bg-purple-500', icon: '🔧' },
        'completed': { text: 'Completed', color: 'bg-gray-500', icon: '✅' }
    };

    const currentStatus = statusLabels[jobStatus] || statusLabels['pending'];

    // Format ETA
    const formatETA = (minutes) => {
        if (!minutes) return 'Calculating...';
        if (minutes < 1) return 'Arriving now';
        if (minutes < 60) return `${Math.round(minutes)} mins`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="live-tracking-container relative rounded-xl overflow-hidden shadow-lg" style={{ height }}>
            {/* Map Container */}
            <div ref={mapRef} className="w-full h-full" />

            {/* Loading Overlay */}
            {!mapLoaded && (
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
                    </div>
                </div>
            )}

            {/* Status Bar */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-4 left-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className={`${currentStatus.color} text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2`}>
                            <span>{currentStatus.icon}</span>
                            {currentStatus.text}
                        </span>
                    </div>
                    {eta && (
                        <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">ETA</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatETA(eta)}
                            </p>
                        </div>
                    )}
                </div>

                {routeInfo && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                            📍 Distance: <span className="font-medium text-gray-800 dark:text-gray-200">{routeInfo.distance}</span>
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                            ⏱️ Est. Time: <span className="font-medium text-gray-800 dark:text-gray-200">{routeInfo.duration}</span>
                        </span>
                    </div>
                )}
            </motion.div>

            {/* Technician Info Card */}
            {technicianName && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-4 left-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
                >
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <img
                                src={technicianPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(technicianName)}&background=10B981&color=fff`}
                                alt={technicianName}
                                className="w-14 h-14 rounded-full object-cover border-2 border-green-500"
                            />
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 dark:text-white">{technicianName}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Your Technician</p>
                        </div>
                        <div className="flex gap-2">
                            {technicianPhone && (
                                <motion.a
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    href={`tel:${technicianPhone}`}
                                    className="p-3 bg-green-500 text-white rounded-full shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </motion.a>
                            )}
                            {showChat && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-3 bg-blue-500 text-white rounded-full shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            {['Assigned', 'On Way', 'Arrived', 'Working'].map((step, index) => {
                                const stepStatuses = ['assigned', 'en_route', 'arrived', 'in_progress'];
                                const currentIndex = stepStatuses.indexOf(jobStatus);
                                const isActive = index <= currentIndex;
                                const isCurrent = index === currentIndex;

                                return (
                                    <React.Fragment key={step}>
                                        <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                                ${isActive ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}
                                                ${isCurrent ? 'ring-4 ring-green-200 dark:ring-green-900' : ''}`}
                                            >
                                                {isActive ? '✓' : index + 1}
                                            </div>
                                            <span className={`text-xs mt-1 ${isActive ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}`}>
                                                {step}
                                            </span>
                                        </div>
                                        {index < 3 && (
                                            <div className={`flex-1 h-1 mx-2 rounded ${index < currentIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Refresh Button */}
            {onRefresh && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onRefresh}
                    className="absolute top-20 right-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg text-gray-600 dark:text-gray-400"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </motion.button>
            )}

            {/* Legend */}
            <div className="absolute bottom-32 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Technician</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Your Location</span>
                </div>
            </div>
        </div>
    );
};

// Hook for real-time tracking data
export const useJobTracking = (jobId, refreshInterval = 10000) => {
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTracking = useCallback(async () => {
        if (!jobId) return;

        try {
            const response = await fetch(`/api/tracking/job/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                setTrackingData(data.data);
                setError(null);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch tracking data');
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchTracking();
        const interval = setInterval(fetchTracking, refreshInterval);
        return () => clearInterval(interval);
    }, [fetchTracking, refreshInterval]);

    return { trackingData, loading, error, refresh: fetchTracking };
};

// Hook for technician location updates
export const useTechnicianLocation = (isOnline = true) => {
    const [location, setLocation] = useState(null);
    const watchIdRef = useRef(null);

    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            console.error('Geolocation not supported');
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setLocation(newLocation);

                // Send to backend
                if (isOnline) {
                    fetch('/api/tracking/technician/location', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            latitude: newLocation.lat,
                            longitude: newLocation.lng
                        })
                    }).catch(console.error);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }, [isOnline]);

    const stopTracking = useCallback(() => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isOnline) {
            startTracking();
        } else {
            stopTracking();
        }
        return stopTracking;
    }, [isOnline, startTracking, stopTracking]);

    return { location, startTracking, stopTracking };
};

export default LiveTrackingMap;
