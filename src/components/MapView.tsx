import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, MapPin, Settings, Share, Copy, Check } from 'lucide-react';

interface User {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  } | null;
  lastSeen: Date;
}

interface MapViewProps {
  roomCode: string;
  userName: string;
  users: User[];
  userCount: number;
  onLocationUpdate: (location: { lat: number; lng: number }) => void;
  onBack: () => void;
}

const MapView: React.FC<MapViewProps> = ({
  roomCode,
  userName,
  users,
  userCount,
  onLocationUpdate,
  onBack
}) => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get user's location
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setLocationEnabled(true);
          onLocationUpdate(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationEnabled(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [onLocationUpdate]);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = () => {
      if (currentLocation && window.google) {
        const map = new window.google.maps.Map(document.getElementById('map'), {
          zoom: 15,
          center: currentLocation,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ saturation: -70 }]
            },
            {
              featureType: 'all',
              elementType: 'labels',
              stylers: [{ lightness: 20 }]
            }
          ]
        });

        // Add markers for all users
        const markers = new Map();

        // Add current user marker
        if (currentLocation) {
          const currentUserMarker = new window.google.maps.Marker({
            position: currentLocation,
            map,
            title: `${userName} (You)`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3
            }
          });
          markers.set('current-user', currentUserMarker);
        }

        // Add other users' markers
        users.forEach(user => {
          if (user.location && user.id !== 'current-user') {
            const marker = new window.google.maps.Marker({
              position: user.location,
              map,
              title: user.name,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#10B981',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
              }
            });
            markers.set(user.id, marker);
          }
        });

        setMapLoaded(true);
      }
    };

    if (currentLocation) {
      if (window.google) {
        initMap();
      } else {
        // Load Google Maps API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap`;
        script.async = true;
        window.initMap = initMap;
        document.head.appendChild(script);
      }
    }
  }, [currentLocation, users, userName]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-green-400 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
          >
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-white font-semibold text-lg">{roomCode}</h1>
            <p className="text-white/70 text-sm">{userCount} member{userCount !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUsersList(!showUsersList)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
            >
              <Users size={24} />
            </button>
            
            <button
              onClick={copyRoomCode}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
            >
              {copied ? <Check size={24} /> : <Share size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-screen pt-20">
        {!locationEnabled ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
              <MapPin className="mx-auto mb-4 text-white\" size={48} />
              <h3 className="text-white text-xl font-semibold mb-2">Location Required</h3>
              <p className="text-white/80">Please enable location services to share your position</p>
            </div>
          </div>
        ) : !mapLoaded ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mx-auto mb-4"></div>
              <p className="text-white">Loading map...</p>
            </div>
          </div>
        ) : (
          <div id="map" className="w-full h-full rounded-t-3xl overflow-hidden shadow-2xl"></div>
        )}
      </div>

      {/* Users List Sidebar */}
      {showUsersList && (
        <div className="absolute right-4 top-24 bottom-4 w-80 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden z-10">
          <div className="p-4 border-b border-white/20">
            <h3 className="text-white font-semibold text-lg">Active Members</h3>
          </div>
          
          <div className="overflow-y-auto h-full pb-20">
            {/* Current User */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{userName} (You)</p>
                  <p className="text-white/60 text-sm">
                    {locationEnabled ? 'Location shared' : 'Location disabled'}
                  </p>
                </div>
              </div>
            </div>

            {/* Other Users */}
            {users.map((user) => (
              <div key={user.id} className="p-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.name}</p>
                    <p className="text-white/60 text-sm">
                      {user.location ? 'Location shared' : 'Location not available'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room Code Display */}
      <div className="absolute bottom-6 left-6 right-6 z-10">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Share this code with friends:</p>
              <p className="text-white font-mono text-2xl font-bold tracking-wider">{roomCode}</p>
            </div>
            <button
              onClick={copyRoomCode}
              className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-all duration-200"
            >
              {copied ? (
                <Check className="text-white\" size={20} />
              ) : (
                <Copy className="text-white" size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;