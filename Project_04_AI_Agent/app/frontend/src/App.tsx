import React, { useState, useCallback } from 'react';
import axios from 'axios';
import GoalPanel, { LLMConfig } from './components/GoalPanel';
import AgentFeed, { AgentEvent } from './components/AgentFeed';

const MAX_ITERATIONS = 30;

export default function App() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [iteration, setIteration] = useState(0);
  const [dotState, setDotState] = useState<'idle' | 'running' | 'pass' | 'fail' | 'partial'>('idle');

  const handleRun = useCallback(async (spec: string, url: string, config: LLMConfig) => {
    setEvents([]);
    setResult(null);
    setIteration(0);
    setRunning(true);
    setDotState('running');

    try {
      // Start the run
      const { data } = await axios.post('/api/run', { spec, url, config });
      const { runId } = data;

      // Connect to SSE stream
      const es = new EventSource(`/api/run/${runId}/stream`);

      es.onmessage = (e) => {
        const event: AgentEvent = JSON.parse(e.data);

        if (event.type === 'status') {
          const m = event.content.match(/Iteration (\d+)/);
          if (m) setIteration(parseInt(m[1]));
          return; // Don't add status events to feed
        }

        setEvents(prev => [...prev, event]);

        if (event.type === 'complete') {
          const verdict = event.data?.verdict?.toLowerCase();
          setResult(event.data);
          setDotState(verdict || 'pass');
          setRunning(false);
          es.close();
        }

        if (event.type === 'error' && event.content?.includes('fatal')) {
          setRunning(false);
          setDotState('fail');
          es.close();
        }
      };

      es.onerror = () => {
        setRunning(false);
        setDotState(result ? (result.verdict?.toLowerCase() || 'partial') : 'fail');
        es.close();
      };
    } catch (err: any) {
      setEvents([{
        type: 'error',
        content: err.response?.data?.error || err.message,
        timestamp: Date.now(),
      }]);
      setRunning(false);
      setDotState('fail');
    }
  }, [result]);

  return (
    <div id="root">
      <header className="app-header">
        <div className={`agent-dot ${dotState}`} />
        <div>
          <h1>QA Agent</h1>
          <p>Give it a spec. Go make coffee. Come back to results.</p>
        </div>
      </header>

      <div className="main-layout">
        <GoalPanel onRun={handleRun} running={running} />
        <AgentFeed
          events={events}
          running={running}
          result={result}
          iteration={iteration}
          maxIterations={MAX_ITERATIONS}
        />
      </div>
    </div>
  );
}
