import React, { useEffect, useRef } from 'react';

export interface AgentEvent {
  type: 'thought' | 'plan' | 'action' | 'observation' | 'adapt' | 'error' | 'complete' | 'status';
  content: string;
  tool?: string;
  input?: Record<string, any>;
  data?: any;
  timestamp: number;
}

export interface AgentFinding {
  scenario: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'BLOCKED';
  observation: string;
}

interface Props {
  events: AgentEvent[];
  running: boolean;
  result: any | null;
  iteration: number;
  maxIterations: number;
}

const EVENT_ICONS: Record<string, string> = {
  thought: '🧠',
  plan: '📋',
  action: '⚡',
  observation: '👁',
  adapt: '🔄',
  error: '❌',
  complete: '🏁',
  status: '·',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

function truncate(text: string, max = 400): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

export default function AgentFeed({ events, running, result, iteration, maxIterations }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const verdict = result?.verdict?.toLowerCase();
  const findings: AgentFinding[] = result?.findings || [];
  const passCount = findings.filter(f => f.status === 'PASS').length;
  const failCount = findings.filter(f => f.status === 'FAIL').length;

  return (
    <div className="feed-panel">
      <div className="feed-header">
        <span className="feed-header-title">Agent Feed</span>
        {running && (
          <span className="iteration-badge">iteration {iteration}/{maxIterations}</span>
        )}
        {result && (
          <span className="iteration-badge">{passCount} pass · {failCount} fail · {result.duration ? `${(result.duration/1000).toFixed(1)}s` : ''}</span>
        )}
      </div>

      <div className="feed-scroll" ref={scrollRef}>
        {events.length === 0 && !running && (
          <div className="feed-empty">
            <div className="feed-empty-icon">🤖</div>
            <p>Give it a spec.<br />Go make coffee.<br />Come back to results.</p>
          </div>
        )}

        {events
          .filter(e => e.type !== 'status' || events.filter(x => x.type !== 'status').length === 0)
          .map((event, i) => (
          <div key={i} className={`event-item event-${event.type}`}>
            <span className="event-icon">{EVENT_ICONS[event.type] || '·'}</span>
            <div className="event-body">
              {event.type === 'thought' && (
                <span>{event.content}</span>
              )}
              {event.type === 'action' && (
                <span>{event.content}</span>
              )}
              {(event.type === 'observation' || event.type === 'adapt' || event.type === 'error') && (
                <span>{truncate(event.content)}</span>
              )}
              {event.type === 'status' && (
                <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{event.content}</span>
              )}
              {event.type === 'complete' && (
                <span style={{ fontWeight: 600 }}>Testing complete — {event.content?.slice(0, 120)}</span>
              )}
            </div>
            <span className="event-time">{formatTime(event.timestamp)}</span>
          </div>
        ))}

        {running && events.length > 0 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 8px', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            <span className="spinner" style={{ borderTopColor: 'var(--primary)', borderColor: 'rgba(124,106,247,0.2)' }} />
            Agent is thinking...
          </div>
        )}
      </div>

      {result && (
        <div className="verdict-bar">
          <div className={`verdict-card ${verdict}`}>
            <div className="verdict-header">
              <span className={`verdict-badge ${verdict}`}>{result.verdict}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {findings.length} scenarios tested
              </span>
            </div>
            <p className="verdict-summary">{result.summary}</p>

            {findings.length > 0 && (
              <div className="findings-list">
                {findings.map((f, i) => (
                  <div className="finding-item" key={i}>
                    <span className={`finding-status ${f.status}`}>{f.status}</span>
                    <div>
                      <div className="finding-scenario">{f.scenario}</div>
                      <div className="finding-obs">{f.observation}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="meta-row">
              {result.duration && <span className="meta-item">⏱ {(result.duration/1000).toFixed(1)}s</span>}
              {result.iterations && <span className="meta-item">🔄 {result.iterations} iterations</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
