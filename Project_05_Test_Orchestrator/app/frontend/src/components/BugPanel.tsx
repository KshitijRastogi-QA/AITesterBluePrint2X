import React, { useState, useEffect } from 'react';
import type { JiraConfig } from './SetupPanel';

interface FailedTC {
  tcId: string;
  tcTitle: string;
  verdict: string;
  reason: string;
  observations?: string;
}

interface Props {
  failedTcs: FailedTC[];
  activeStoryId: string | null;
  jiraConfig?: JiraConfig;
}

interface BugResult {
  tcId: string;
  bugId?: string;
  bugUrl?: string;
  error?: string;
}

export default function BugPanel({ failedTcs, activeStoryId, jiraConfig }: Props) {
  const [domain, setDomain] = useState(jiraConfig?.domain || '');
  const [email, setEmail] = useState(jiraConfig?.email || '');
  const [token, setToken] = useState(jiraConfig?.token || '');

  useEffect(() => {
    if (jiraConfig?.domain) setDomain(jiraConfig.domain);
    if (jiraConfig?.email) setEmail(jiraConfig.email);
    if (jiraConfig?.token) setToken(jiraConfig.token);
  }, [jiraConfig?.domain, jiraConfig?.email, jiraConfig?.token]);
  const [projectKey, setProjectKey] = useState('');
  const [storyId, setStoryId] = useState(activeStoryId || '');
  const [results, setResults] = useState<BugResult[]>([]);
  const [raising, setRaising] = useState<Record<string, boolean>>({});

  const handleRaise = async (tc: FailedTC) => {
    if (!domain || !email || !token || !projectKey) {
      alert('Fill in all JIRA credentials first');
      return;
    }

    setRaising(r => ({ ...r, [tc.tcId]: true }));

    try {
      const resp = await fetch('/api/bugs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain, email, token, projectKey,
          storyId: storyId || null,
          tcId: tc.tcId,
          tcTitle: tc.tcTitle,
          verdict: tc.verdict,
          reason: tc.reason,
          observations: tc.observations || '',
        }),
      });

      const data = await resp.json();
      if (resp.ok) {
        setResults(r => [...r.filter(x => x.tcId !== tc.tcId), { tcId: tc.tcId, bugId: data.bugId, bugUrl: data.bugUrl }]);
      } else {
        setResults(r => [...r.filter(x => x.tcId !== tc.tcId), { tcId: tc.tcId, error: data.error }]);
      }
    } catch (err: any) {
      setResults(r => [...r.filter(x => x.tcId !== tc.tcId), { tcId: tc.tcId, error: err.message }]);
    } finally {
      setRaising(r => ({ ...r, [tc.tcId]: false }));
    }
  };

  const handleRaiseAll = async () => {
    for (const tc of failedTcs) {
      const alreadyRaised = results.find(r => r.tcId === tc.tcId && r.bugId);
      if (!alreadyRaised) await handleRaise(tc);
    }
  };

  const inp: React.CSSProperties = { border: '1px solid #d1d5db', borderRadius: 4, padding: '6px 10px', fontSize: 13, background: '#fff', width: '100%', boxSizing: 'border-box' as const, marginBottom: 10, color: '#1e293b', outline: 'none' };
  const lbl: React.CSSProperties = { fontSize: 12, color: '#374151', marginBottom: 4, display: 'block' };

  const credsFilled = domain && email && token && projectKey;

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Raise JIRA Bugs</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Create structured JIRA bug tickets for every failed test case</div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left — JIRA credentials form */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 10 }}>JIRA Connection</div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, lineHeight: 1.6 }}>Credentials used only for this request. Never stored or logged.</div>

          <label style={lbl}>JIRA Domain</label>
          <input style={inp} placeholder="yourcompany.atlassian.net" value={domain} onChange={e => setDomain(e.target.value)} />

          <label style={lbl}>Email</label>
          <input style={inp} placeholder="user@company.com" value={email} onChange={e => setEmail(e.target.value)} />

          <label style={lbl}>API Token</label>
          <input style={inp} type="password" placeholder="ATATT3x..." value={token} onChange={e => setToken(e.target.value)} />

          <label style={lbl}>Project Key</label>
          <input style={inp} placeholder="PROJ" value={projectKey} onChange={e => setProjectKey(e.target.value)} />

          <label style={lbl}>Linked Story ID (optional)</label>
          <input style={inp} placeholder="PROJ-1234" value={storyId} onChange={e => setStoryId(e.target.value)} />

          {failedTcs.length > 0 && (
            <button
              style={{ background: credsFilled ? '#dc2626' : '#f1f5f9', border: 'none', color: credsFilled ? '#fff' : '#94a3b8', borderRadius: 4, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: credsFilled ? 'pointer' : 'not-allowed', width: '100%' }}
              onClick={handleRaiseAll} disabled={!credsFilled}>
              Raise All {failedTcs.length} Bug{failedTcs.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Right — failed TCs list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 10 }}>Failed Test Cases ({failedTcs.length})</div>

          {failedTcs.length === 0 && (
            <div style={{ color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>
              No failed test cases yet.<br />
              Run test cases in the Execute tab — failures will appear here automatically.
            </div>
          )}

          {failedTcs.map(tc => {
            const result = results.find(r => r.tcId === tc.tcId);
            const isRaising = raising[tc.tcId];
            const isDone = !!result?.bugId;
            return (
              <div key={tc.tcId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', width: 120, flexShrink: 0 }}>{tc.tcId}</span>
                <span style={{ fontSize: 12, color: '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{tc.tcTitle}</span>
                {isDone && result?.bugId && (
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, flexShrink: 0 }}>
                    {result.bugId} {result.bugUrl && <a href={result.bugUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', textDecoration: 'none' }}>↗</a>}
                  </span>
                )}
                {result?.error && <span style={{ fontSize: 12, color: '#dc2626', flexShrink: 0 }}>Error: {result.error}</span>}
                <button
                  style={{ background: isDone ? '#f0fdf4' : isRaising ? '#f8fafc' : '#dc2626', border: `1px solid ${isDone ? '#bbf7d0' : isRaising ? '#e2e8f0' : 'transparent'}`, color: isDone ? '#16a34a' : isRaising ? '#94a3b8' : '#fff', borderRadius: 4, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: isDone || isRaising ? 'default' : 'pointer', flexShrink: 0 }}
                  onClick={() => !isDone && !isRaising && handleRaise(tc)}
                  disabled={isDone || isRaising}
                >
                  {isDone ? 'Bug Raised' : isRaising ? 'Creating...' : 'Raise Bug'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
