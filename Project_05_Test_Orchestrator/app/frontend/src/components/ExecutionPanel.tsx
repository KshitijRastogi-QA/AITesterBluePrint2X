import React, { useState, useEffect, useRef } from 'react';

import { LLMConfig } from '../App';

interface Props {
  selectedTc: { tcId: string; tcTitle: string; steps: string } | null;
  onBugReady: (tc: any) => void;
  llmConfig: LLMConfig;
  testBaseUrl?: string;
}

interface ExecEvent {
  type: 'thought' | 'action' | 'observation' | 'adapt' | 'complete' | 'error';
  content: string;
  data?: any;
  timestamp: number;
}

const EVENT_ICON: Record<string, string> = {
  thought: '🧠', action: '⚡', observation: '👁', adapt: '🔄', complete: '🏁', error: '❌',
};
const EVENT_COLOR: Record<string, string> = {
  thought: '#4f46e5', action: '#0891b2', observation: '#64748b', adapt: '#d97706', complete: '#16a34a', error: '#dc2626',
};

export default function ExecutionPanel({ selectedTc, onBugReady, llmConfig, testBaseUrl }: Props) {
  const [url, setUrl] = useState(testBaseUrl || '');
  const [events, setEvents] = useState<ExecEvent[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [running, setRunning] = useState(false);
  const [execError, setExecError] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (testBaseUrl && !url) setUrl(testBaseUrl);
  }, [testBaseUrl]);

  useEffect(() => {
    fetch('/api/executions').then(r => r.json()).then(setHistory).catch(() => {});
  }, [verdict]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [events]);

  const handleRun = async () => {
    if (!url || !hasApiKey || !selectedTc) return;
    setEvents([]);
    setVerdict(null);
    setReason('');
    setExecError('');
    setRunning(true);

    try {
      const resp = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tcId: selectedTc.tcId,
          tcTitle: selectedTc.tcTitle,
          steps: selectedTc.steps,
          url,
          config: { provider: llmConfig.provider, model: llmConfig.model, apiKey: llmConfig.apiKey, baseUrl: llmConfig.baseUrl },
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setExecError(data.error || `Server error ${resp.status}`);
        setRunning(false);
        return;
      }

      const { runId } = data;
      const es = new EventSource(`/api/execute/${runId}/stream`);
      es.onmessage = (e) => {
        const event: ExecEvent = JSON.parse(e.data);
        setEvents(prev => [...prev, event]);
        if (event.type === 'complete') {
          setVerdict(event.data?.verdict || 'BLOCKED');
          setReason(event.data?.reason || '');
          setRunning(false);
          es.close();
          if (event.data?.verdict === 'FAIL') {
            onBugReady({ tcId: selectedTc.tcId, tcTitle: selectedTc.tcTitle, verdict: 'FAIL', reason: event.data.reason, observations: event.data.observations || '' });
          }
        }
        if (event.type === 'error') { setRunning(false); es.close(); }
      };
      es.onerror = () => {
        setExecError('Lost connection to execution stream. Check backend.');
        setRunning(false);
        es.close();
      };
    } catch (err: any) {
      setExecError(`Network error: ${err.message}`);
      setRunning(false);
    }
  };

  const inp: React.CSSProperties = { border: '1px solid #d1d5db', borderRadius: 4, padding: '6px 10px', fontSize: 13, background: '#fff', width: '100%', boxSizing: 'border-box' as const, marginBottom: 10, color: '#1e293b', outline: 'none' };
  const lbl: React.CSSProperties = { fontSize: 12, color: '#374151', marginBottom: 4, display: 'block' };

  const verdictColor = verdict === 'PASS' ? '#16a34a' : verdict === 'FAIL' ? '#dc2626' : '#64748b';
  const hasApiKey = ['ollama', 'lmstudio'].includes(llmConfig.provider) || !!llmConfig.apiKey;
  const canRun = !running && !!url && hasApiKey && !!selectedTc;

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Execute Test Cases</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Runs test cases in a live browser using AI — Playwright + LLM</div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left — config form */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>Selected Test Case</div>
          {selectedTc ? (
            <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 4, padding: '8px 10px', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', marginBottom: 2 }}>{selectedTc.tcId}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{selectedTc.tcTitle}</div>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '8px 10px', marginBottom: 12, fontSize: 12, color: '#94a3b8' }}>
              No test case selected. Go to Test Cases tab and click Execute on any TC.
            </div>
          )}

          <label style={lbl}>Base URL</label>
          <input style={inp} placeholder="https://staging.yourapp.com" value={url} onChange={e => setUrl(e.target.value)} />
          {!url && (
            <div style={{ fontSize: 11, color: '#d97706', marginTop: -6, marginBottom: 10 }}>
              Set this in Step 1 (Setup) or enter it here
            </div>
          )}

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '8px 12px', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>LLM (configured in Setup)</div>
            <div style={{ fontSize: 12, color: '#1e293b' }}>
              <strong>{llmConfig.provider}</strong> / {llmConfig.model}
            </div>
            {!hasApiKey && (
              <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>
                No API key — go back to Setup (Step 1)
              </div>
            )}
          </div>

          <button
            style={{ background: canRun ? '#4f46e5' : '#f1f5f9', border: 'none', color: canRun ? '#fff' : '#94a3b8', borderRadius: 4, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: canRun ? 'pointer' : 'not-allowed', width: '100%' }}
            onClick={handleRun} disabled={!canRun}>
            {running ? '⏳ Executing...' : 'Run Test Case'}
          </button>

          {/* Why is the button disabled? */}
          {!canRun && !running && (
            <div style={{ fontSize: 11, color: '#d97706', marginTop: 6, lineHeight: 1.6 }}>
              {!selectedTc && '• No test case selected — go to Test Cases tab and click Execute\n'}
              {!url && '• Base URL is required\n'}
              {!hasApiKey && '• No LLM API key — go to Step 1 (Setup)'}
            </div>
          )}

          {/* Visible error from API */}
          {execError && (
            <div style={{ marginTop: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '8px 10px', fontSize: 12, color: '#dc2626' }}>
              {execError}
            </div>
          )}

          {/* Execution history */}
          {history.length > 0 && (
            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 16, paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Execution History</div>
              {history.slice(0, 8).map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                  <span style={{ background: h.verdict === 'PASS' ? '#f0fdf4' : h.verdict === 'FAIL' ? '#fef2f2' : '#f8fafc', color: h.verdict === 'PASS' ? '#16a34a' : h.verdict === 'FAIL' ? '#dc2626' : '#64748b', border: `1px solid ${h.verdict === 'PASS' ? '#bbf7d0' : h.verdict === 'FAIL' ? '#fecaca' : '#e2e8f0'}`, borderRadius: 3, padding: '1px 6px', fontWeight: 700, fontSize: 11 }}>{h.verdict}</span>
                  <span style={{ color: '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{h.tcId}</span>
                  <span style={{ color: '#94a3b8', fontSize: 11 }}>{h.duration ? `${(h.duration / 1000).toFixed(1)}s` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — live feed */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Live Execution Feed</div>

          {verdict && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: verdictColor }}>{verdict === 'PASS' ? 'PASS' : verdict === 'FAIL' ? 'FAIL' : 'BLOCKED'}</span>
              {reason && <span style={{ fontSize: 12, color: '#64748b', marginLeft: 10 }}>{reason}</span>}
              {verdict === 'FAIL' && selectedTc && (
                <span style={{ background: '#dc2626', border: 'none', color: '#fff', borderRadius: 4, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600, marginLeft: 10 }}
                  onClick={() => onBugReady({ tcId: selectedTc.tcId, tcTitle: selectedTc.tcTitle, verdict: 'FAIL', reason, observations: '' })}>
                  Send to Raise Bugs
                </span>
              )}
            </div>
          )}

          <div style={{ height: 480, overflowY: 'auto' as const }} ref={feedRef}>
            {events.length === 0 && !running && (
              <div style={{ color: '#64748b', fontSize: 13, padding: 20 }}>Select a test case and click Run</div>
            )}
            {running && events.length === 0 && (
              <div style={{ color: '#64748b', fontSize: 13, padding: 20 }}>Launching browser...</div>
            )}
            {events.map((e, i) => (
              <div key={i} style={{ borderLeft: `2px solid ${EVENT_COLOR[e.type] || '#64748b'}`, paddingLeft: 10, paddingTop: 6, paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: EVENT_COLOR[e.type] || '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' as const, marginRight: 6 }}>{EVENT_ICON[e.type]} {e.type}</span>
                <span style={{ color: '#1e293b', fontFamily: 'ui-monospace, monospace', fontSize: 12, whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const }}>{e.content}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
