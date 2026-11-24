import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';

import { testDatabaseConnection } from './config/database.js';
import { configureSaml } from './services/saml.service.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure SAML only when selected as the authentication provider
configureSaml();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'InfraFlow API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/db-health', async (_req, res) => {
  const isConnected = await testDatabaseConnection();

  if (!isConnected) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'InfraFlow database connected successfully'
  });
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`InfraFlow API running on http://localhost:${PORT}`);
});
