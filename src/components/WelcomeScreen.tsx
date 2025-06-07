import React, { useState } from 'react';
import { Users, MapPin, Plus, Hash, Plane, Mountain, Palmtree } from 'lucide-react';

interface WelcomeScreenProps {
  onJoinRoom: (roomCode: string, userName: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onJoinRoom }) => {
  const [mode, setMode] = useState<'main' | 'create' | 'join'>('main');
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const { roomCode } = await response.json();
      onJoinRoom(roomCode, userName.trim());
    } catch (error) {
      alert('Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!userName.trim() || !roomCode.trim()) {
      alert('Please enter both your name and room code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/room/${roomCode.trim()}`);
      const { exists } = await response.json();
      
      if (exists) {
        onJoinRoom(roomCode.trim(), userName.trim());
      } else {
        alert('Room not found. Please check the code and try again.');
      }
    } catch (error) {
      alert('Failed to join room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const BackButton = () => (
    <button
      onClick={() => setMode('main')}
      className="absolute top-6 left-6 text-white/70 hover:text-white transition-colors z-10"
    >
      ← Back
    </button>
  );

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-purple-400 relative overflow-hidden">
        <BackButton />
        
        {/* 3D Decorative Elements */}
        <div className="absolute top-20 right-10 transform rotate-12 opacity-20">
          <Plane size={80} className="text-white" />
        </div>
        <div className="absolute bottom-32 left-10 transform -rotate-12 opacity-15">
          <Mountain size={100} className="text-white" />
        </div>
        
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Create Space</h1>
              <p className="text-white/80">Start a new location sharing space</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Your Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? 'Creating...' : 'Create Space'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-green-400 relative overflow-hidden">
        <BackButton />
        
        {/* 3D Decorative Elements */}
        <div className="absolute top-16 left-10 transform rotate-45 opacity-20">
          <Palmtree size={70} className="text-white" />
        </div>
        <div className="absolute bottom-40 right-16 transform -rotate-45 opacity-15">
          <MapPin size={90} className="text-white" />
        </div>
        
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Hash className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Join Space</h1>
              <p className="text-white/80">Enter a code to join your friends</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Your Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-center text-lg font-mono tracking-wider"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? 'Joining...' : 'Join Space'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-purple-400 relative overflow-hidden">
      {/* 3D Decorative Elements */}
      <div className="absolute top-10 right-20 transform rotate-12 opacity-20">
        <Plane size={120} className="text-white" />
      </div>
      <div className="absolute bottom-10 left-20 transform -rotate-12 opacity-15">
        <Mountain size={140} className="text-white" />
      </div>
      <div className="absolute top-1/2 left-10 transform -translate-y-1/2 rotate-45 opacity-10">
        <Palmtree size={100} className="text-white" />
      </div>
      
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20">
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="text-white" size={40} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">FriendTracker</h1>
            <p className="text-white/80 text-lg">Share your location with friends in real-time</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-3"
            >
              <Plus size={24} />
              <span>Create New Space</span>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-3"
            >
              <Hash size={24} />
              <span>Join Space</span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-2 text-white/60">
              <Users size={16} />
              <span className="text-sm">Secure • Private • Real-time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;