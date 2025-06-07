import React, { useState, useEffect } from 'react';
import { Users, MapPin, Plus, Hash } from 'lucide-react';
import WelcomeScreen from './components/WelcomeScreen';
import MapView from './components/MapView';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  } | null;
  lastSeen: Date;
}

interface AppState {
  currentScreen: 'welcome' | 'map';
  roomCode: string | null;
  userName: string | null;
  users: User[];
  userCount: number;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<AppState>({
    currentScreen: 'welcome',
    roomCode: null,
    userName: null,
    users: [],
    userCount: 0
  });

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('room-joined', ({ roomCode, users }) => {
      setState(prev => ({
        ...prev,
        currentScreen: 'map',
        roomCode,
        users,
        userCount: users.length
      }));
    });

    newSocket.on('user-joined', ({ userId, userName }) => {
      setState(prev => ({
        ...prev,
        users: [...prev.users, { id: userId, name: userName, location: null, lastSeen: new Date() }]
      }));
    });

    newSocket.on('user-left', ({ userId }) => {
      setState(prev => ({
        ...prev,
        users: prev.users.filter(user => user.id !== userId)
      }));
    });

    newSocket.on('user-location-updated', ({ userId, location }) => {
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === userId ? { ...user, location, lastSeen: new Date() } : user
        )
      }));
    });

    newSocket.on('user-count-updated', ({ count }) => {
      setState(prev => ({ ...prev, userCount: count }));
    });

    newSocket.on('error', ({ message }) => {
      alert(message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleJoinRoom = (roomCode: string, userName: string) => {
    if (socket) {
      setState(prev => ({ ...prev, userName }));
      socket.emit('join-room', { roomCode, userName });
    }
  };

  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    if (socket && state.roomCode) {
      socket.emit('location-update', { roomCode: state.roomCode, location });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-purple-400">
      {state.currentScreen === 'welcome' ? (
        <WelcomeScreen onJoinRoom={handleJoinRoom} />
      ) : (
        <MapView
          roomCode={state.roomCode!}
          userName={state.userName!}
          users={state.users}
          userCount={state.userCount}
          onLocationUpdate={handleLocationUpdate}
          onBack={() => setState(prev => ({ ...prev, currentScreen: 'welcome' }))}
        />
      )}
    </div>
  );
}

export default App;