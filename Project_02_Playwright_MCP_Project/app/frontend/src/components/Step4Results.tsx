import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, CheckCircle, XCircle, Loader } from 'lucide-react';
import { TestCase, SSEEvent, LLMConfig } from '../types';

interface Props {
  url: string;
  testCasesMarkdown: string;
  initialCases: TestCase[];
  config: LLMConfig;
  onRestart: () => void;
}

export default function Step4Results({ url, testCasesMarkdown, initialCases, config, onRestart }: Props) {
  const [cases, setCases] = useState<TestCase[]>(initialCases.map(tc => ({ ...tc, status: 'idle', stepLogs: [] })));
  const [running, setRunning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const updateCase = (id: string, patch: Partial<TestCase>) => {
    setCases(prev => prev.map(tc => tc.id === id ? { ...tc, ...patch } : tc));
  };

  const addLog = (id: string, message: string) => {
    setCases(prev => prev.map(tc =>
      tc.id === id ? { ...tc, stepLogs: [...tc.stepLogs, message] } : tc
    ));
  };

  const runTests = async (ids?: string[]) => {
    setRunning(true);
    setDone(false);
    const idsToRun = ids || selectedIds;

    setCases(prev => prev.map(tc =>
      (!idsToRun.length || idsToRun.includes(tc.id))
        ? { ...tc, status: 'idle', observedMessage: '', stepLogs: [] }
        : tc
    ));

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, testCasesMarkdown, testCaseIds: idsToRun, config })
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const dataPart = line.replace(/^data: /, '').trim();
          if (!dataPart) continue;
          try {
            const event: SSEEvent = JSON.parse(dataPart);
            if (event.type === 'tc_start' && event.id) {
              updateCase(event.id, { status: 'running' });
            } else if (event.type === 'step' && event.id) {
              addLog(event.id, event.message || '');
            } else if (event.type === 'tc_result' && event.id) {
              updateCase(event.id, {
                status: event.pass ? 'pass' : 'fail',
                observedMessage: event.observedMessage || ''
              });
            } else if (event.type === 'done') {
              setDone(true);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const passed = cases.filter(tc => tc.status === 'pass').length;
  const failed = cases.filter(tc => tc.status === 'fail').length;
  const total = cases.length;

  return (
    <div>
      {done && (
        <div className="results-summary">
          <div className="summary-card total">
            <div className="number">{total}</div>
            <div className="label">Total</div>
          </div>
          <div className="summary-card pass">
            <div className="number">{passed}</div>
            <div className="label">Passed</div>
          </div>
          <div className="summary-card fail">
            <div className="number">{failed}</div>
            <div className="label">Failed</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <p className="card-title" style={{ marginBottom: 0 }}>Test Execution</p>
          <div className="flex gap-8">
            <button
              className="btn btn-primary"
              onClick={() => runTests([])}
              disabled={running}
            >
              {running ? <><span className="spinner" />Running...</> : <><Play size={15} />Run All</>}
            </button>
            {selectedIds.length > 0 && (
              <button className="btn btn-secondary" onClick={() => runTests(selectedIds)} disabled={running}>
                <Play size={15} />Run Selected ({selectedIds.length})
              </button>
            )}
            <button className="btn btn-secondary" onClick={onRestart} disabled={running}>
              <RotateCcw size={15} />New Test
            </button>
          </div>
        </div>

        <table className="tc-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>TC ID</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Observed</th>
              <th>Logs</th>
            </tr>
          </thead>
          <tbody>
            {cases.map(tc => (
              <tr key={tc.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(tc.id)}
                    onChange={() => toggleSelect(tc.id)}
                    disabled={running}
                  />
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{tc.id}</td>
                <td style={{ maxWidth: 220 }}>{tc.title}</td>
                <td>
                  <span className={`badge badge-${tc.priority.toLowerCase()}`}>{tc.priority}</span>
                </td>
                <td>
                  <span className={`badge badge-${tc.status}`}>
                    {tc.status === 'running' && <Loader size={11} />}
                    {tc.status === 'pass' && <CheckCircle size={11} />}
                    {tc.status === 'fail' && <XCircle size={11} />}
                    {tc.status.charAt(0).toUpperCase() + tc.status.slice(1)}
                  </span>
                </td>
                <td style={{ maxWidth: 200, fontSize: '0.78rem', color: tc.status === 'fail' ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {tc.observedMessage || '—'}
                </td>
                <td>
                  <div className="step-logs">
                    {tc.stepLogs.map((log, i) => <div key={i}>› {log}</div>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
