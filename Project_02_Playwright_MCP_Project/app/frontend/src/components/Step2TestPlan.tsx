import React, { useState, useEffect } from 'react';
import { FileText, Wand2, Save } from 'lucide-react';
import axios from 'axios';
import { LLMConfig } from '../types';

interface Props {
  url: string;
  screenshot: string;
  domText: string;
  context: string;
  config: LLMConfig;
  onDone: (testPlan: string) => void;
}

export default function Step2TestPlan({ url, screenshot, domText, context, config, onDone }: Props) {
  const [testPlan, setTestPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { generatePlan(); }, []);

  const generatePlan = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.post('/api/generate/test-plan', { url, domText, context, config });
      setTestPlan(data.testPlan);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 12 }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>Page Screenshot</p>
          {screenshot && <img src={`data:image/png;base64,${screenshot}`} alt="screenshot" className="screenshot-preview" />}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>{url}</p>
          {context && (
            <>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 12, marginBottom: 4 }}>Context provided</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxHeight: 80, overflow: 'hidden' }}>
                {context.substring(0, 200)}...
              </p>
            </>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <p className="card-title" style={{ marginBottom: 0 }}>
              <FileText size={15} style={{ display: 'inline', marginRight: 6 }} />Test Plan
            </p>
            <button className="btn btn-secondary btn-sm" onClick={generatePlan} disabled={loading}>
              <Wand2 size={13} />Regenerate
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-8" style={{ color: 'var(--text-muted)', padding: '20px 0' }}>
              <span className="spinner" />Generating test plan...
            </div>
          ) : (
            <textarea className="md-editor" value={testPlan} onChange={e => setTestPlan(e.target.value)}
              placeholder="Test plan will appear here..." style={{ height: 360 }} />
          )}
          {error && <div className="error-box">{error}</div>}
        </div>
      </div>

      <div className="flex gap-8">
        <button className="btn btn-primary" onClick={() => onDone(testPlan)} disabled={!testPlan || loading}>
          <Wand2 size={15} />Generate Test Cases
        </button>
        <button className="btn btn-secondary" onClick={async () => {
          await axios.post('/api/save', { testPlan });
          alert('Saved to deliverables/test_plan.md');
        }} disabled={!testPlan}>
          <Save size={15} />Save to Deliverables
        </button>
      </div>
    </div>
  );
}
