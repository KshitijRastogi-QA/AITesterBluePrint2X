import React, { useEffect, useState } from 'react';

interface TCFile { file: string; storyId: string; total: number; testCases: any[]; }
interface Execution { tcId: string; tcTitle: string; verdict: string; duration: number; runTs: string; }

export default function DashboardPanel({ activeStoryId }: { activeStoryId: string | null }) {
  const [tcFile, setTcFile] = useState<TCFile | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/test-cases').then(r => r.json()),
      fetch('/api/executions').then(r => r.json()),
    ]).then(([tcs, execs]: [TCFile[], Execution[]]) => {
      const filtered = activeStoryId ? tcs.filter(f => f.storyId.toUpperCase() === activeStoryId.toUpperCase()) : tcs;
      if (filtered.length > 0) setTcFile(filtered[0]);
      else if (tcs.length > 0) setTcFile(tcs[0]);
      setExecutions(execs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const th: React.CSSProperties = { textAlign: 'left' as const, fontSize: 11, color: '#64748b', padding: '7px 8px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 };
  const td: React.CSSProperties = { fontSize: 12, color: '#1e293b', padding: '8px 8px', borderBottom: '1px solid #f1f5f9' };
  const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' as const };

  if (loading) return <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40, fontSize: 13 }}>Loading dashboard...</div>;

  const tcs = tcFile?.testCases || [];
  const total = tcFile?.total || 0;

  const byPriority: Record<string, number> = {};
  const byModule: Record<string, number> = {};
  const byAuto: Record<string, number> = { Yes: 0, No: 0, Partial: 0 };
  tcs.forEach(tc => {
    if (tc.priority) byPriority[tc.priority] = (byPriority[tc.priority] || 0) + 1;
    if (tc.module) byModule[tc.module] = (byModule[tc.module] || 0) + 1;
    if (tc.automation) byAuto[tc.automation] = (byAuto[tc.automation] || 0) + 1;
  });

  const execTotal = executions.length;
  const passed = executions.filter(e => e.verdict === 'PASS').length;
  const failed = executions.filter(e => e.verdict === 'FAIL').length;
  const passRate = execTotal > 0 ? Math.round((passed / execTotal) * 100) : null;
  const avgDuration = execTotal > 0 ? Math.round(executions.reduce((s, e) => s + (e.duration || 0), 0) / execTotal / 1000) : null;

  const PRIORITY_COLOR: Record<string, string> = { Critical: '#dc2626', High: '#d97706', Medium: '#ca8a04', Low: '#16a34a' };

  const badge = (v: string): React.CSSProperties => ({
    background: v === 'PASS' ? '#f0fdf4' : v === 'FAIL' ? '#fef2f2' : '#f8fafc',
    color: v === 'PASS' ? '#16a34a' : v === 'FAIL' ? '#dc2626' : '#64748b',
    border: `1px solid ${v === 'PASS' ? '#bbf7d0' : v === 'FAIL' ? '#fecaca' : '#e2e8f0'}`,
    borderRadius: 3, padding: '1px 6px', fontWeight: 700, fontSize: 11,
  });

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 }}>QA Dashboard</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>
        {tcFile?.storyId} — {total} test cases planned{execTotal > 0 ? `, ${execTotal} executed` : ''}
      </div>

      {/* Execution results summary */}
      {execTotal > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Execution Results</div>
          <div style={{ fontSize: 13, color: '#1e293b', marginBottom: 16 }}>
            <span>Pass Rate: <strong style={{ color: passRate !== null && passRate >= 80 ? '#16a34a' : passRate !== null && passRate >= 50 ? '#d97706' : '#dc2626' }}>{passRate}%</strong></span>
            <span style={{ color: '#d1d5db', margin: '0 10px' }}>|</span>
            <span>Passed: <strong style={{ color: '#16a34a' }}>{passed}</strong></span>
            <span style={{ color: '#d1d5db', margin: '0 10px' }}>|</span>
            <span>Failed: <strong style={{ color: '#dc2626' }}>{failed}</strong></span>
            <span style={{ color: '#d1d5db', margin: '0 10px' }}>|</span>
            <span>Avg Duration: <strong>{avgDuration}s</strong></span>
            <span style={{ color: '#d1d5db', margin: '0 10px' }}>|</span>
            <span>Total Executed: <strong>{execTotal}</strong> of {total}</span>
          </div>

          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>TC-ID</th>
                <th style={th}>Title</th>
                <th style={th}>Verdict</th>
                <th style={{ ...th, textAlign: 'right' as const }}>Duration</th>
                <th style={{ ...th, textAlign: 'right' as const }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((e, i) => (
                <tr key={i}>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{e.tcId}</td>
                  <td style={{ ...td, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{e.tcTitle}</td>
                  <td style={td}><span style={badge(e.verdict)}>{e.verdict}</span></td>
                  <td style={{ ...td, textAlign: 'right' as const }}>{e.duration ? `${(e.duration / 1000).toFixed(1)}s` : '—'}</td>
                  <td style={{ ...td, textAlign: 'right' as const, fontSize: 11, color: '#94a3b8' }}>{e.runTs?.replace('T', ' ').substring(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Test Coverage Planning */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Test Coverage Planning</div>
        <div style={{ fontSize: 13, color: '#1e293b', marginBottom: 16 }}>
          <span>Total TCs: <strong style={{ color: '#4f46e5' }}>{total}</strong></span>
          <span style={{ color: '#d1d5db', margin: '0 10px' }}>|</span>
          <span>Modules: <strong>{Object.keys(byModule).length}</strong></span>
          <span style={{ color: '#d1d5db', margin: '0 10px' }}>|</span>
          <span>Auto Candidates: <strong style={{ color: '#16a34a' }}>{byAuto.Yes}</strong> ({Math.round((byAuto.Yes / (total || 1)) * 100)}%)</span>
        </div>

        {/* Priority breakdown — inline */}
        <div style={{ fontSize: 13, color: '#1e293b', marginBottom: 16 }}>
          Priority: {' '}
          {Object.entries(byPriority).map(([p, count], i) => (
            <span key={p}>
              {i > 0 && <span style={{ color: '#d1d5db', margin: '0 8px' }}>|</span>}
              <span style={{ color: PRIORITY_COLOR[p] || '#64748b', fontWeight: 600 }}>{p}: {count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Module coverage table */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Module Coverage</div>
        <table style={tbl}>
          <thead>
            <tr>
              <th style={th}>Module</th>
              <th style={{ ...th, textAlign: 'right' as const }}>TCs</th>
              <th style={{ ...th, textAlign: 'right' as const }}>%</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(byModule).sort((a, b) => b[1] - a[1]).map(([mod, count]) => (
              <tr key={mod}>
                <td style={td}>{mod}</td>
                <td style={{ ...td, textAlign: 'right' as const }}>{count}</td>
                <td style={{ ...td, textAlign: 'right' as const }}>{Math.round((count / (total || 1)) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
