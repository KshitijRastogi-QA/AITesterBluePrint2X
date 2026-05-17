import React, { useState, useEffect } from 'react';
import { Wand2, Save, Play, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { TestCase, LLMConfig } from '../types';

interface Props {
  url: string;
  domText: string;
  testPlan: string;
  config: LLMConfig;
  onDone: (markdown: string, cases: TestCase[]) => void;
}

function extractField(lines: string[], field: string): string {
  for (const line of lines) {
    const m = line.match(new RegExp(`\\|\\s*\\*\\*${field}\\*\\*\\s*\\|\\s*(.+?)\\s*\\|`));
    if (m) return m[1].trim();
  }
  return '';
}

function parseTestCasesClient(markdown: string): TestCase[] {
  const cases: TestCase[] = [];

  // Strip any preamble before the first ### TC heading
  const firstTc = markdown.search(/^###\s+TC/m);
  const body = firstTc >= 0 ? markdown.slice(firstTc) : markdown;

  // Split on ### headings
  const sections = body.split(/\n(?=###\s)/);

  for (const section of sections) {
    if (!section.includes('TC ID') && !section.includes('**TC')) continue;

    const lines = section.split('\n');
    const id = extractField(lines, 'TC ID');
    if (!id) continue;

    const stepsRaw = extractField(lines, 'Steps');
    const steps = stepsRaw
      .split(/<br\s*\/?>/gi)
      .map(s => s.replace(/^\s*\d+\.\s*/, '').trim())
      .filter(Boolean);

    cases.push({
      id,
      title: extractField(lines, 'Title'),
      preconditions: extractField(lines, 'Preconditions'),
      steps: steps.length ? steps : [stepsRaw],
      expectedResult: extractField(lines, 'Expected Result'),
      priority: extractField(lines, 'Priority') || 'Medium',
      category: extractField(lines, 'Category') || 'Functional',
      status: 'idle',
      observedMessage: '',
      stepLogs: []
    });
  }
  return cases;
}

export default function Step3TestCases({ url, domText, testPlan, config, onDone }: Props) {
  const [markdown, setMarkdown] = useState('');
  const [parsed, setParsed] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'table' | 'markdown'>('markdown'); // default markdown so raw output is always visible

  useEffect(() => { generate(); }, []);

  const generate = async () => {
    setLoading(true); setError(''); setMarkdown(''); setParsed([]);
    try {
      const { data } = await axios.post(
        '/api/generate/test-cases',
        { url, domText, testPlan, config },
        { timeout: 180000 } // 3 min — local models can be slow
      );
      const md = data.testCases || '';
      setMarkdown(md);
      const p = parseTestCasesClient(md);
      setParsed(p);
      if (p.length > 0) setView('table');
    } catch (e: any) {
      if (e.code === 'ECONNABORTED') {
        setError('Request timed out — the model took too long. Try a faster model or reduce the test plan size.');
      } else {
        setError(e.response?.data?.error || e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkdownChange = (val: string) => {
    setMarkdown(val);
    setParsed(parseTestCasesClient(val));
  };

  return (
    <div>
      <div className="card">
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <p className="card-title" style={{ marginBottom: 0 }}>
            Test Cases {parsed.length > 0 && `(${parsed.length})`}
          </p>
          <div className="flex gap-8">
            <button
              className={`btn btn-secondary btn-sm`}
              onClick={() => setView('markdown')}
              style={{ opacity: view === 'markdown' ? 1 : 0.5 }}
            >Markdown</button>
            <button
              className={`btn btn-secondary btn-sm`}
              onClick={() => setView('table')}
              style={{ opacity: view === 'table' ? 1 : 0.5 }}
            >Table</button>
            <button className="btn btn-secondary btn-sm" onClick={generate} disabled={loading}>
              <Wand2 size={13} />Regenerate
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-8" style={{ color: 'var(--text-muted)', padding: '20px 0' }}>
            <span className="spinner" />Generating test cases — this may take a minute...
          </div>
        )}

        {!loading && error && (
          <div className="error-box" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && view === 'markdown' && (
          <>
            {!markdown && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px 0' }}>
                No test cases generated yet. Click Regenerate or wait for auto-generation.
              </p>
            )}
            <textarea
              className="md-editor"
              value={markdown}
              onChange={e => handleMarkdownChange(e.target.value)}
              placeholder="Generated test cases will appear here in markdown..."
              style={{ height: 400 }}
            />
            {markdown && parsed.length === 0 && (
              <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--warning)' }}>
                ⚠ Could not auto-parse test cases from the markdown — check format or switch to Table view after editing.
              </div>
            )}
          </>
        )}

        {!loading && !error && view === 'table' && (
          parsed.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px 0' }}>
              No test cases parsed. Switch to Markdown view to see raw output and verify the format.
            </p>
          ) : (
            <table className="tc-table">
              <thead>
                <tr><th>TC ID</th><th>Title</th><th>Priority</th><th>Category</th><th>Steps</th></tr>
              </thead>
              <tbody>
                {parsed.map(tc => (
                  <tr key={tc.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{tc.id}</td>
                    <td>{tc.title}</td>
                    <td><span className={`badge badge-${(tc.priority || '').toLowerCase()}`}>{tc.priority}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{tc.category}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{tc.steps.length} steps</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      <div className="flex gap-8">
        <button
          className="btn btn-primary"
          onClick={() => onDone(markdown, parsed)}
          disabled={!markdown || loading}
        >
          <Play size={15} />Proceed to Execute
        </button>
        <button
          className="btn btn-secondary"
          onClick={async () => {
            await axios.post('/api/save', { testCases: markdown });
            alert('Saved to deliverables/test_cases.md');
          }}
          disabled={!markdown}
        >
          <Save size={15} />Save to Deliverables
        </button>
      </div>
    </div>
  );
}
