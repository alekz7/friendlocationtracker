import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, MapPin, Settings, Share, Copy, Check } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color: string, isCurrentUser: boolean = false) => {
  const size = isCurrentUser ? 25 : 20;
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${isCurrentUser ? 'animation: pulse 2s infinite;' : ''}
      "></div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 ${color}40; }
          70% { box-shadow: 0 0 0 10px ${color}00; }
          100% { box-shadow: 0 0 0 0 ${color}00; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

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

// Component to update map center when current location changes
const MapUpdater: React.FC<{ center: [number, number] | null }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  
  return null;
};

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
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

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
          setMapCenter([location.lat, location.lng]);
          setLocationEnabled(true);
          onLocationUpdate(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationEnabled(false);
          // Set default location (New York City) if geolocation fails
          const defaultLocation = { lat: 40.7128, lng: -74.0060 };
          setCurrentLocation(defaultLocation);
          setMapCenter([defaultLocation.lat, defaultLocation.lng]);
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
    } else {
      // Fallback for browsers without geolocation
      const defaultLocation = { lat: 40.7128, lng: -74.0060 };
      setCurrentLocation(defaultLocation);
      setMapCenter([defaultLocation.lat, defaultLocation.lng]);
    }
  }, [onLocationUpdate]);

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
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/10 backdrop-blur-lg border-b border-white/20">
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
        {!mapCenter ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mx-auto mb-4"></div>
              <p className="text-white">Loading map...</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full rounded-t-3xl overflow-hidden shadow-2xl">
            <MapContainer
              center={mapCenter}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapUpdater center={mapCenter} />
              
              {/* Current user marker */}
              {currentLocation && (
                <Marker
                  position={[currentLocation.lat, currentLocation.lng]}
                  icon={createCustomIcon('#3B82F6', true)}
                >
                  <Popup>
                    <div className="text-center">
                      <strong>{userName} (You)</strong>
                      <br />
                      {locationEnabled ? 'Location shared' : 'Location disabled'}
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Other users' markers */}
              {users.map((user) => (
                user.location && (
                  <Marker
                    key={user.id}
                    position={[user.location.lat, user.location.lng]}
                    icon={createCustomIcon('#10B981')}
                  >
                    <Popup>
                      <div className="text-center">
                        <strong>{user.name}</strong>
                        <br />
                        Last seen: {formatLastSeen(new Date(user.lastSeen))}
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        )}
      </div>

      {/* Users List Sidebar */}
      {showUsersList && (
        <div className="absolute right-4 top-24 bottom-4 w-80 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden z-[999]">
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
      <div className="absolute bottom-6 left-6 right-6 z-[999]">
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
                <Check className="text-white" size={20} />
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