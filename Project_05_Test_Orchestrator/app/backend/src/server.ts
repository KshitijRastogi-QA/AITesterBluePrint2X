import express from 'express';
import cors from 'cors';
import pipelineRouter from './routes/pipeline';
import executeRouter from './routes/execute';
import bugsRouter from './routes/bugs';
import jiraRouter from './routes/jira';
import generateRouter from './routes/generate';

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());
app.use('/api', pipelineRouter);
app.use('/api', executeRouter);
app.use('/api', bugsRouter);
app.use('/api', jiraRouter);
app.use('/api', generateRouter);

app.listen(PORT, () => {
  console.log(`TestGen Orchestrator backend running on http://localhost:${PORT}`);
});
