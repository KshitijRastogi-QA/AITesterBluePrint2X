import React, { useEffect, useState, useRef } from 'react';
import { LLMConfig } from '../App';

interface Plan { file: string; content: string; storyId: string; mtime: string; }

interface Props {
  activeStoryId: string | null;
  llmConfig: LLMConfig;
  onCasesGenerated: () => void;
}

const SECTIONS = ['Executive Summary', 'Scope', 'Test Strategy', 'Test Modules', 'Entry and Exit Criteria', 'Risk', 'Non-Functional', 'Sign-off'];

export default function TestPlanPanel({ activeStoryId, llmConfig, onCasesGenerated }: Props) {
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genLog, setGenLog] = useState('');
  const [genDone, setGenDone] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const genLogRef = useRef<HTMLDivElement>(null);
  const [planGenerating, setPlanGenerating] = useState(false);
  const [planGenLog, setPlanGenLog] = useState('');
  const [planGenDone, setPlanGenDone] = useState(false);
  const [planAuthorName, setPlanAuthorName] = useState('');
  const planGenLogRef = useRef<HTMLDivElement>(null);

  const loadPlans = () => {
    fetch('/api/test-plans').then(r => r.json()).then((plans: Plan[]) => {
      setAllPlans(plans);
      if (activeStoryId) {
        const match = plans.find(p => p.storyId.toUpperCase() === activeStoryId.toUpperCase());
        if (match) setSelected(match);
      }
    }).catch(() => {});
  };

  useEffect(() => { loadPlans(); }, [activeStoryId]);

  useEffect(() => {
    if (genLogRef.current) genLogRef.current.scrollTop = genLogRef.current.scrollHeight;
  }, [genLog]);

  useEffect(() => {
    if (planGenLogRef.current) planGenLogRef.current.scrollTop = planGenLogRef.current.scrollHeight;
  }, [planGenLog]);

  const handleGeneratePlan = async () => {
    if (!activeStoryId || !hasKey) return;
    setPlanGenerating(true); setPlanGenLog(''); setPlanGenDone(false);

    const resp = await fetch('/api/generate/test-plan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId: activeStoryId, authorName: planAuthorName || 'QA Engineer', config: llmConfig }),
    });
    const { runId, error } = await resp.json();
    if (error) { setPlanGenLog(`Error: ${error}`); setPlanGenerating(false); return; }

    const es = new EventSource(`/api/generate/${runId}/stream`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.text) setPlanGenLog(prev => prev + data.text);
      if (data.done) {
        setPlanGenerating(false); es.close();
        if (data.result?.error) {
          setPlanGenLog(prev => prev + `\n\nFailed: ${data.result.error}`);
        } else {
          setPlanGenDone(true);
          loadPlans();
        }
      }
    };
    es.onerror = () => { setPlanGenerating(false); es.close(); };
  };

  const handleGenerateCases = async () => {
    if (!activeStoryId || !hasKey) return;
    setGenerating(true); setGenLog(''); setGenDone(false);

    const resp = await fetch('/api/generate/test-cases', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId: activeStoryId, authorName: authorName || 'QA Engineer', config: llmConfig }),
    });
    const { runId, error } = await resp.json();
    if (error) { setGenLog(`Error: ${error}`); setGenerating(false); return; }

    const es = new EventSource(`/api/generate/${runId}/stream`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.text) setGenLog(prev => prev + data.text);
      if (data.done) {
        setGenerating(false); setGenDone(true); es.close();
        if (!data.result?.error) { loadPlans(); onCasesGenerated(); }
      }
    };
    es.onerror = () => { setGenerating(false); es.close(); };
  };

  const extractSection = (content: string, sec: string) => {
    const lines = content.split('\n');
    const start = lines.findIndex(l => l.includes(sec));
    if (start < 0) return content;
    const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
    return lines.slice(start, end < 0 ? undefined : end).join('\n');
  };

  const inp: React.CSSProperties = {
    border: '1px solid #d1d5db', borderRadius: 4, padding: '6px 10px', fontSize: 13,
    background: '#fff', width: '100%', boxSizing: 'border-box' as const,
    marginBottom: 10, color: '#1e293b', outline: 'none',
  };
  const lbl: React.CSSProperties = { fontSize: 12, color: '#374151', marginBottom: 4, display: 'block' };
  const btn = (ok: boolean): React.CSSProperties => ({
    background: ok ? '#4f46e5' : '#f1f5f9', border: 'none',
    color: ok ? '#fff' : '#94a3b8', borderRadius: 4,
    padding: '8px 16px', fontSize: 13, fontWeight: 600,
    cursor: ok ? 'pointer' : 'not-allowed', width: '100%',
  });
  const logBox: React.CSSProperties = {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4,
    padding: 10, height: 140, overflowY: 'auto' as const,
    fontFamily: 'ui-monospace, monospace', fontSize: 11,
    color: '#16a34a', whiteSpace: 'pre-wrap' as const, marginTop: 8,
  };

  const storyPlans = activeStoryId
    ? allPlans.filter(p => p.storyId.toUpperCase() === activeStoryId.toUpperCase())
    : allPlans;
  const hasPlan = storyPlans.length > 0;
  const isLocalProvider = ['ollama', 'lmstudio'].includes(llmConfig.provider);
  const hasKey = isLocalProvider || !!(llmConfig.apiKey || llmConfig.baseUrl);

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Test Plan</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
        {activeStoryId ? `Story: ${activeStoryId}  ·  Using ${llmConfig.provider} / ${llmConfig.model}` : 'Select a story first'}
      </div>

      {/* No plan yet — generate form */}
      {activeStoryId && !hasPlan && (
        <div style={{ marginBottom: 20, padding: 16, background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
            No test plan yet for {activeStoryId}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
            Generate a test plan to proceed to test cases and execution.
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Author Name</label>
              <input style={{ ...inp, marginBottom: 0 }} placeholder="QA Engineer"
                value={planAuthorName} onChange={e => setPlanAuthorName(e.target.value)} />
            </div>
            <button
              style={{ ...btn(hasKey && !planGenerating), width: 'auto', padding: '8px 20px', whiteSpace: 'nowrap' as const }}
              disabled={!hasKey || planGenerating}
              onClick={handleGeneratePlan}
            >
              {planGenerating ? '⏳ Generating...' : '📋 Generate Test Plan'}
            </button>
          </div>
          {!hasKey && (
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>
              Go back to Setup (Step 1) and enter your LLM API key first.
            </div>
          )}
          {planGenDone && <div style={{ color: '#16a34a', fontSize: 12, marginTop: 8 }}>✓ Test plan generated</div>}
          {planGenLog && <div style={logBox} ref={planGenLogRef}>{planGenLog}</div>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left sidebar */}
        <div style={{ width: 210, flexShrink: 0 }}>
          {/* Plan list */}
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 }}>
            Plans ({storyPlans.length})
          </div>
          {storyPlans.length === 0 && activeStoryId && (
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>None yet — generate above</div>
          )}
          {storyPlans.map(p => (
            <div key={p.file}
              onClick={() => { setSelected(p); setSection(null); }}
              style={{
                padding: '7px 10px', cursor: 'pointer', fontSize: 12,
                borderBottom: '1px solid #f1f5f9',
                background: selected?.file === p.file ? '#eef2ff' : '#fff',
                borderLeft: selected?.file === p.file ? '3px solid #4f46e5' : '3px solid transparent',
              }}>
              <div style={{ fontWeight: 700, color: '#4f46e5' }}>{p.storyId}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.file}</div>
            </div>
          ))}

          {/* Regenerate (when plan exists) */}
          {hasPlan && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
              <button
                style={{ ...btn(hasKey && !planGenerating), fontSize: 12, padding: '6px 10px' }}
                disabled={!hasKey || planGenerating}
                onClick={handleGeneratePlan}
              >
                {planGenerating ? '⏳ Regenerating...' : '↻ Regenerate Plan'}
              </button>
              {planGenDone && <div style={{ color: '#16a34a', fontSize: 11, marginTop: 4 }}>✓ Done</div>}
            </div>
          )}

          {/* Section navigation */}
          {selected && (
            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 10, paddingTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 }}>Sections</div>
              {[null, ...SECTIONS].map((sec) => (
                <button key={sec ?? 'full'}
                  onClick={() => setSection(sec)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left' as const,
                    background: section === sec ? '#eef2ff' : 'transparent',
                    border: 'none', borderRadius: 4, padding: '5px 8px',
                    fontSize: 11, color: section === sec ? '#4f46e5' : '#64748b',
                    fontWeight: section === sec ? 600 : 400, cursor: 'pointer',
                  }}>
                  {sec ?? 'Full Document'}
                </button>
              ))}
            </div>
          )}

          {/* Generate test cases */}
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 16, paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 10 }}>
              Generate Test Cases
            </div>
            <label style={lbl}>Author Name</label>
            <input style={inp} placeholder="QA Engineer" value={authorName} onChange={e => setAuthorName(e.target.value)} />
            <button
              style={btn(!!activeStoryId && hasKey && hasPlan && !generating)}
              disabled={!activeStoryId || !hasKey || !hasPlan || generating}
              onClick={handleGenerateCases}
            >
              {generating ? '⏳ Generating...' : !hasPlan ? 'Generate Test Plan First' : '🧪 Generate Test Cases'}
            </button>
            {genDone && <div style={{ color: '#16a34a', fontSize: 12, marginTop: 6 }}>✓ Test cases generated — click Next</div>}
            {genLog && <div style={logBox} ref={genLogRef}>{genLog}</div>}
          </div>
        </div>

        {/* Right — plan viewer */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <pre style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4,
            padding: 16, maxHeight: 580, overflowY: 'auto' as const,
            whiteSpace: 'pre-wrap' as const, fontFamily: 'ui-monospace, monospace',
            fontSize: 12, color: '#1e293b', lineHeight: 1.8, margin: 0,
          }}>
            {selected
              ? (section ? extractSection(selected.content, section) : selected.content)
              : <span style={{ color: '#94a3b8' }}>
                  {activeStoryId ? 'Generate a test plan to view it here.' : 'No story selected.'}
                </span>
            }
          </pre>
        </div>
      </div>
    </div>
  );
}
