import express from 'express';
import cors from 'cors';
import runRouter from './routes/run';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/api', runRouter);

app.listen(PORT, () => {
  console.log(`QA Agent backend running on http://localhost:${PORT}`);
});

export default app;
