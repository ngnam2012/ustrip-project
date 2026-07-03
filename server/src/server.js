import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { initSocket } from './socket.js';

const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL, process.env.MOBILE_CLIENT_URL].filter(Boolean),
    credentials: true,
  }
});

initSocket(io);

server.listen(port, () => console.log(`UsTrip API running on http://localhost:${port}`));
