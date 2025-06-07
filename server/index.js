import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active rooms and users
const rooms = new Map();
const userSockets = new Map();

// Generate random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// API endpoint to create a new room
app.post('/api/create-room', (req, res) => {
  const roomCode = generateRoomCode();
  rooms.set(roomCode, {
    code: roomCode,
    users: new Map(),
    createdAt: new Date()
  });
  
  res.json({ roomCode });
});

// API endpoint to check if room exists
app.get('/api/room/:code', (req, res) => {
  const { code } = req.params;
  const room = rooms.get(code.toUpperCase());
  
  if (room) {
    res.json({ exists: true, userCount: room.users.size });
  } else {
    res.json({ exists: false });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomCode, userName }) => {
    const code = roomCode.toUpperCase();
    const room = rooms.get(code);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Leave previous room if any
    const previousRoom = userSockets.get(socket.id);
    if (previousRoom) {
      socket.leave(previousRoom.roomCode);
      const prevRoom = rooms.get(previousRoom.roomCode);
      if (prevRoom) {
        prevRoom.users.delete(socket.id);
        socket.to(previousRoom.roomCode).emit('user-left', {
          userId: socket.id,
          userName: previousRoom.userName
        });
      }
    }

    // Join new room
    socket.join(code);
    room.users.set(socket.id, {
      id: socket.id,
      name: userName,
      location: null,
      lastSeen: new Date()
    });
    
    userSockets.set(socket.id, { roomCode: code, userName });

    // Send current users to the new user
    const roomUsers = Array.from(room.users.values());
    socket.emit('room-joined', { roomCode: code, users: roomUsers });
    
    // Notify others about new user
    socket.to(code).emit('user-joined', {
      userId: socket.id,
      userName: userName
    });

    // Send updated user count
    io.to(code).emit('user-count-updated', { count: room.users.size });
  });

  socket.on('location-update', ({ roomCode, location }) => {
    const code = roomCode.toUpperCase();
    const room = rooms.get(code);
    
    if (room && room.users.has(socket.id)) {
      const user = room.users.get(socket.id);
      user.location = location;
      user.lastSeen = new Date();
      
      // Broadcast location to all users in the room
      socket.to(code).emit('user-location-updated', {
        userId: socket.id,
        userName: user.name,
        location: location
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const userRoom = userSockets.get(socket.id);
    if (userRoom) {
      const room = rooms.get(userRoom.roomCode);
      if (room) {
        room.users.delete(socket.id);
        socket.to(userRoom.roomCode).emit('user-left', {
          userId: socket.id,
          userName: userRoom.userName
        });
        
        // Send updated user count
        io.to(userRoom.roomCode).emit('user-count-updated', { count: room.users.size });
        
        // Clean up empty rooms
        if (room.users.size === 0) {
          rooms.delete(userRoom.roomCode);
        }
      }
      userSockets.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});