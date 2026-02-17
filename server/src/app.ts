import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';

dotenv.config();

import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initSocket } from './socket/socket.js';
import { startWhatsAppWorker } from './workers/whatsapp.worker.js';
import { startSOSWorker } from './workers/sos.worker.js';

import authRoutes from './modules/auth/routes/auth.route.js';
import stationRoutes from './modules/station/routes/station.route.js' ;
import officerRoutes from './modules/officer/routes/officer.routes.js';
import sosRoutes from './modules/sos/routes/sos.route.js';
import userRoutes from './modules/user/routes/user.routes.js';

const app = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Women Safety API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await connectRedis();

  // Init Socket.io after Redis is ready
  initSocket(httpServer);

  // Start BullMQ workers
  startWhatsAppWorker();
  startSOSWorker();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();

export { httpServer };
export default app;