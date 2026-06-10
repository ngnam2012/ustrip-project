import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import paymentRoutes from './routes/payment.routes.js';
import { errorHandler, notFound } from './middlewares/error.js';

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: [process.env.CLIENT_URL, process.env.MOBILE_CLIENT_URL].filter(Boolean), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'ustrip-api' }));
app.use('/api', paymentRoutes);
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
