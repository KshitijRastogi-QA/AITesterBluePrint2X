import React, { useEffect, useState, useRef } from 'react';
import { LLMConfig } from '../App';
import type { JiraConfig } from './SetupPanel';

interface Story { id: string; content: string; file: string; }
interface Batch { batch: string; stories: Story[]; }
interface StoryListItem { storyId: string; title: string; batch: string; }

interface Props {
  activeStoryId: string | null;
  llmConfig: LLMConfig;
  onStorySelected: (id: string) => void;
  onPlanGenerated: () => void;
  jiraConfig?: JiraConfig;
}

export default function StoriesPanel({ activeStoryId, llmConfig, onStorySelected, onPlanGenerated, jiraConfig }: Props) {
  const [mode, setMode] = useState<'single' | 'project'>('single');
  const [domain, setDomain] = useState(jiraConfig?.domain || '');
  const [email, setEmail] = useState(jiraConfig?.email || '');
  const [token, setToken] = useState(jiraConfig?.token || '');

  useEffect(() => {
    if (jiraConfig?.domain) setDomain(jiraConfig.domain);
    if (jiraConfig?.email) setEmail(jiraConfig.email);
    if (jiraConfig?.token) setToken(jiraConfig.token);
  }, [jiraConfig?.domain, jiraConfig?.email, jiraConfig?.token]);
  const [storyId, setStoryId] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [maxResults, setMaxResults] = useState('20');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

  const [allStories, setAllStories] = useState<StoryListItem[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [generating, setGenerating] = useState(false);
  const [genLog, setGenLog] = useState('');
  const [genDone, setGenDone] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const genLogRef = useRef<HTMLDivElement>(null);

  const isLocalProvider = ['ollama', 'lmstudio'].includes(llmConfig.provider);
  const hasKey = isLocalProvider || !!(llmConfig.apiKey || llmConfig.baseUrl);

  const loadStories = () => {
    Promise.all([
      fetch('/api/stories-list').then(r => r.json()),
      fetch('/api/stories').then(r => r.json()),
    ]).then(([list, batchData]) => {
      setAllStories(list);
      setBatches(batchData);
    }).catch(() => {});
  };

  useEffect(() => { loadStories(); }, []);

  useEffect(() => {
    if (genLogRef.current) genLogRef.current.scrollTop = genLogRef.current.scrollHeight;
  }, [genLog]);

  // When active story changes externally, find and show it
  useEffect(() => {
    if (!activeStoryId || !batches.length) return;
    for (const b of batches) {
      const s = b.stories.find(x => x.id.toUpperCase().startsWith(activeStoryId.toUpperCase()));
      if (s) { setSelectedStory(s); return; }
    }
  }, [activeStoryId, batches]);

  const handleExtractStory = async () => {
    if (!domain || !email || !token || !storyId) { setExtractError('All fields required'); return; }
    setExtracting(true); setExtractError('');
    try {
      const resp = await fetch('/api/jira/extract-story', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, email, token, storyId }),
      });
      const data = await resp.json();
      if (!resp.ok) { setExtractError(data.error); }
      else {
        loadStories();
        onStorySelected(data.storyId);
        // Auto-select the story in the viewer
        setTimeout(() => loadStories(), 300);
      }
    } catch (e: any) { setExtractError(e.message); }
    finally { setExtracting(false); }
  };

  const handleExtractProject = async () => {
    if (!domain || !email || !token || !projectKey) { setExtractError('All fields required'); return; }
    setExtracting(true); setExtractError('');
    try {
      const resp = await fetch('/api/jira/extract-project', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, email, token, projectKey, maxResults: parseInt(maxResults) }),
      });
      const data = await resp.json();
      if (!resp.ok) { setExtractError(data.error); }
      else { loadStories(); }
    } catch (e: any) { setExtractError(e.message); }
    finally { setExtracting(false); }
  };

  const handleSelectStory = (story: Story) => {
    setSelectedStory(story);
    const m = story.id.match(/([A-Z]+-\d+)/i);
    if (m) onStorySelected(m[1].toUpperCase());
    setGenLog('');
    setGenDone(false);
  };

  const handleGeneratePlan = async () => {
    if (!activeStoryId || !hasKey) return;
    setGenerating(true);
    setGenLog('');
    setGenDone(false);

    const resp = await fetch('/api/generate/test-plan', {
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
        setGenerating(false);
        es.close();
        if (data.result?.error) {
          setGenLog(prev => prev + `\n\nFailed: ${data.result.error}`);
        } else {
          setGenDone(true);
          onPlanGenerated();
        }
      }
    };
    es.onerror = () => { setGenerating(false); es.close(); };
  };

  const inp: React.CSSProperties = { border: '1px solid #d1d5db', borderRadius: 4, padding: '6px 10px', fontSize: 13, background: '#fff', width: '100%', boxSizing: 'border-box' as const, marginBottom: 10, color: '#1e293b', outline: 'none' };
  const lbl: React.CSSProperties = { fontSize: 12, color: '#374151', marginBottom: 4, display: 'block' };
  const btn = (ok: boolean, color = '#4f46e5'): React.CSSProperties => ({ background: ok ? color : '#f1f5f9', border: 'none', color: ok ? '#fff' : '#94a3b8', borderRadius: 4, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: ok ? 'pointer' : 'not-allowed', width: '100%' });

  const canExtract = !extracting && !!domain && !!email && !!token && (mode === 'single' ? !!storyId : !!projectKey);
  const canGenerate = !!activeStoryId && hasKey && !generating;

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Extract JIRA Story</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Pull a story from JIRA, select it, then generate the test plan</div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left column — forms */}
        <div style={{ width: 360, flexShrink: 0 }}>
          {/* JIRA extraction form */}
          <label style={lbl}>Domain</label>
          <input style={inp} placeholder="company.atlassian.net" value={domain} onChange={e => setDomain(e.target.value)} />
          <label style={lbl}>Email</label>
          <input style={inp} placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          <label style={lbl}>API Token</label>
          <input style={inp} type="password" placeholder="ATATT3x..." value={token} onChange={e => setToken(e.target.value)} />

          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            <button style={{ flex: 1, padding: '6px 0', fontSize: 12, fontWeight: mode === 'single' ? 600 : 400, color: mode === 'single' ? '#4f46e5' : '#64748b', background: mode === 'single' ? '#eef2ff' : '#f8fafc', border: `1px solid ${mode === 'single' ? '#c7d2fe' : '#e2e8f0'}`, borderRadius: 4, cursor: 'pointer' }} onClick={() => setMode('single')}>Single Story</button>
            <button style={{ flex: 1, padding: '6px 0', fontSize: 12, fontWeight: mode === 'project' ? 600 : 400, color: mode === 'project' ? '#4f46e5' : '#64748b', background: mode === 'project' ? '#eef2ff' : '#f8fafc', border: `1px solid ${mode === 'project' ? '#c7d2fe' : '#e2e8f0'}`, borderRadius: 4, cursor: 'pointer' }} onClick={() => setMode('project')}>Project</button>
          </div>

          {mode === 'single' ? (
            <>
              <label style={lbl}>Story ID</label>
              <input style={inp} placeholder="PROJ-1234" value={storyId} onChange={e => setStoryId(e.target.value)} onKeyDown={e => e.key === 'Enter' && canExtract && handleExtractStory()} />
            </>
          ) : (
            <>
              <label style={lbl}>Project Key</label>
              <input style={inp} placeholder="PROJ" value={projectKey} onChange={e => setProjectKey(e.target.value)} />
              <label style={lbl}>Max Results</label>
              <input style={inp} type="number" value={maxResults} onChange={e => setMaxResults(e.target.value)} />
            </>
          )}

          <button style={btn(canExtract)} disabled={!canExtract} onClick={mode === 'single' ? handleExtractStory : handleExtractProject}>
            {extracting ? 'Extracting...' : 'Extract from JIRA'}
          </button>
          {extractError && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 6, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '6px 10px' }}>{extractError}</div>}

          {/* Generate Test Plan — separated by border */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Stage 2 — Generate Test Plan</div>
            {activeStoryId
              ? <div style={{ fontSize: 12, color: '#4338ca', marginBottom: 8 }}>Active: <strong>{activeStoryId}</strong></div>
              : <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Select a story from the list first</div>
            }
            {!hasKey && (
              <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '6px 10px' }}>
                Go to Step 1 (Setup) and enter your LLM API key first.
              </div>
            )}
            {hasKey && (
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 8 }}>
                Using: <strong>{llmConfig.provider}</strong> / {llmConfig.model}
              </div>
            )}
            <label style={lbl}>Author Name</label>
            <input style={inp} placeholder="QA Engineer" value={authorName} onChange={e => setAuthorName(e.target.value)} />
            <button style={btn(canGenerate, '#059669')} disabled={!canGenerate} onClick={handleGeneratePlan}>
              {generating ? 'Generating Test Plan...' : !hasKey ? 'Enter API Key in Setup' : 'Generate Test Plan'}
            </button>
            {genDone && <div style={{ color: '#16a34a', fontSize: 12, marginTop: 6 }}>Test plan generated — go to Test Plan tab</div>}
            {genLog && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Generation Output</div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: 8, height: 160, overflowY: 'auto' as const, fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#16a34a', whiteSpace: 'pre-wrap' as const, lineHeight: 1.6 }} ref={genLogRef}>{genLog}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right column — story list + viewer */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>Extracted Stories ({allStories.length})</div>
          {allStories.length === 0
            ? <div style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>No stories extracted yet — use the form to pull from JIRA</div>
            : allStories.map(s => (
              <div key={s.storyId + s.batch}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: activeStoryId === s.storyId ? '#eef2ff' : '#fff', borderLeft: activeStoryId === s.storyId ? '3px solid #4f46e5' : '3px solid transparent' }}
                onClick={() => {
                  const batch = batches.find(b => b.batch === s.batch);
                  const story = batch?.stories.find(x => x.id.toUpperCase().startsWith(s.storyId));
                  if (story) handleSelectStory(story);
                }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', minWidth: 80 }}>{s.storyId}</span>
                <span style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flex: 1 }}>{s.title}</span>
                {activeStoryId === s.storyId && <span style={{ fontSize: 10, color: '#4f46e5', fontWeight: 700 }}>ACTIVE</span>}
              </div>
            ))
          }

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>Story Content</div>
            <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: 16, height: 340, overflowY: 'auto' as const, whiteSpace: 'pre-wrap' as const, fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#1e293b', lineHeight: 1.7, margin: 0 }}>
              {selectedStory
                ? selectedStory.content
                : <span style={{ color: '#94a3b8' }}>Select a story to view its content</span>
              }
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
