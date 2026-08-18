import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import hubspotRoutes from '../routes/hubspot.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  })
);

app.use(express.json());
app.use('/api/hubspot', hubspotRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ICHIKAWA SOLUTIONS LTD. CRM Manager Backend',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log('======================================');
  console.log(`ICHIKAWA SOLUTIONS LTD. CRM Manager backend running on ${PORT}`);
  console.log('======================================');
});