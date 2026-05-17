import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import analyseRoutes from './routes/analyse';
import generateRoutes from './routes/generate';
import executeRoutes from './routes/execute';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.use('/api', analyseRoutes);
app.use('/api', generateRoutes);
app.use('/api', executeRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'QA Platform Backend' }));

app.listen(PORT, () => {
  console.log(`QA Platform backend running on http://localhost:${PORT}`);
});
