import React, { useEffect, useState } from 'react';

interface TC {
  id: string;
  title: string;
  priority: string;
  type: string;
  module: string;
  automation: string;
  status: 'PASS' | 'FAIL' | null;
}

interface TCFile {
  file: string;
  storyId: string;
  mtime: string;
  testCases: TC[];
  total: number;
  content: string;
}

interface Props {
  activeStoryId: string | null;
  onExecute: (tcId: string, tcTitle: string, steps: string) => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  Critical: '#dc2626', High: '#d97706', Medium: '#ca8a04', Low: '#16a34a',
};
const MODULE_COLORS = ['#4f46e5','#0891b2','#d97706','#059669','#e11d48','#7c3aed','#2563eb','#db2777','#0d9488'];

function extractTcSteps(content: string, tcId: string): string {
  const idx = content.indexOf(`### \`${tcId}\``);
  if (idx < 0) {
    const idx2 = content.indexOf(`### ${tcId}`);
    if (idx2 < 0) return '';
    const next = content.indexOf('\n### ', idx2 + 5);
    return content.slice(idx2, next < 0 ? undefined : next);
  }
  const next = content.indexOf('\n### ', idx + 5);
  return content.slice(idx, next < 0 ? undefined : next);
}

export default function TestCasesPanel({ activeStoryId, onExecute }: Props) {
  const [files, setFiles] = useState<TCFile[]>([]);
  const [filterModule, setFilterModule] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterAuto, setFilterAuto] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/test-cases').then(r => r.json()).then((d: TCFile[]) => {
      const filtered = activeStoryId ? d.filter(f => f.storyId.toUpperCase() === activeStoryId.toUpperCase()) : d;
      setFiles(filtered.length > 0 ? filtered : d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeStoryId]);

  const inpStyle: React.CSSProperties = { border: '1px solid #d1d5db', borderRadius: 4, padding: '6px 10px', fontSize: 13, background: '#fff', color: '#1e293b', outline: 'none' };

  if (loading) return <div style={{ color: '#94a3b8', textAlign: 'center', padding: 60, fontSize: 13 }}>Loading test cases...</div>;

  const latestFile = files[0];
  const tcs = latestFile?.testCases || [];
  const modules = ['All', ...Array.from(new Set(tcs.map(tc => tc.module).filter(Boolean)))];
  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const autos = ['All', 'Yes', 'No', 'Partial'];

  const filtered = tcs.filter(tc => {
    if (filterModule !== 'All' && tc.module !== filterModule) return false;
    if (filterPriority !== 'All' && tc.priority !== filterPriority) return false;
    if (filterAuto !== 'All' && tc.automation !== filterAuto) return false;
    if (search && !tc.id.toLowerCase().includes(search.toLowerCase()) && !tc.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const byModule = filtered.reduce<Record<string, TC[]>>((acc, tc) => {
    const mod = tc.module || 'Unknown';
    acc[mod] = acc[mod] || [];
    acc[mod].push(tc);
    return acc;
  }, {});

  const total = latestFile?.total || 0;
  const automationCount = tcs.filter(tc => tc.automation === 'Yes').length;
  const criticalCount = tcs.filter(tc => tc.priority === 'Critical').length;

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Test Cases</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>{latestFile?.storyId} — {latestFile?.file}</div>

      {/* Stats as inline text */}
      <div style={{ fontSize: 13, color: '#1e293b', marginBottom: 14 }}>
        <span>Total: <strong>{total}</strong></span>
        <span style={{ color: '#d1d5db', margin: '0 8px' }}>|</span>
        <span>Critical: <strong style={{ color: '#dc2626' }}>{criticalCount}</strong></span>
        <span style={{ color: '#d1d5db', margin: '0 8px' }}>|</span>
        <span>Auto: <strong style={{ color: '#16a34a' }}>{automationCount}</strong></span>
        <span style={{ color: '#d1d5db', margin: '0 8px' }}>|</span>
        <span>Modules: <strong style={{ color: '#4f46e5' }}>{Object.keys(byModule).length}</strong></span>
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <input style={{ ...inpStyle, width: 200 }} placeholder="Search TC-ID or title..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={inpStyle} value={filterModule} onChange={e => setFilterModule(e.target.value)}>{modules.map(m => <option key={m}>{m}</option>)}</select>
        <select style={inpStyle} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>{priorities.map(p => <option key={p}>{p}</option>)}</select>
        <select style={inpStyle} value={filterAuto} onChange={e => setFilterAuto(e.target.value)}>{autos.map(a => <option key={a}>Auto: {a}</option>)}</select>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{filtered.length} shown</span>
      </div>

      {files.length === 0 ? (
        <div style={{ color: '#94a3b8', textAlign: 'center' as const, padding: 60, fontSize: 13 }}>No test cases generated yet.</div>
      ) : (
        <div>
          {Object.entries(byModule).map(([mod, modTcs], mi) => {
            const color = MODULE_COLORS[mi % MODULE_COLORS.length];
            return (
              <div key={mod}>
                <div style={{ fontSize: 12, fontWeight: 700, color, padding: '6px 0', borderTop: '1px solid #e2e8f0', marginTop: 12, marginBottom: 4 }}>
                  {mod} <span style={{ fontWeight: 400, color: '#94a3b8' }}>({modTcs.length})</span>
                </div>
                {modTcs.map(tc => (
                  <div key={tc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 4px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', width: 180, flexShrink: 0 }}>{tc.id}</span>
                    <span style={{ fontSize: 12, color: '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{tc.title}</span>
                    {tc.priority && (
                      <span style={{ background: `${PRIORITY_COLOR[tc.priority] || '#64748b'}18`, border: `1px solid ${PRIORITY_COLOR[tc.priority] || '#64748b'}40`, borderRadius: 3, padding: '1px 6px', fontSize: 11, color: PRIORITY_COLOR[tc.priority] || '#64748b', fontWeight: 600, flexShrink: 0 }}>{tc.priority}</span>
                    )}
                    <button
                      style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4f46e5', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}
                      onClick={() => {
                        const steps = latestFile ? extractTcSteps(latestFile.content, tc.id) : tc.title;
                        onExecute(tc.id, tc.title, steps);
                      }}
                    >
                      Execute
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
