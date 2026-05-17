import React, { useState } from 'react';
import { Play, FileText } from 'lucide-react';

export interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'gemini' | 'groq';
  apiKey: string;
  model: string;
  baseUrl?: string;
}

interface Props {
  onRun: (spec: string, url: string, config: LLMConfig) => void;
  running: boolean;
}

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic Claude', defaultModel: 'claude-sonnet-4-6', needsKey: true },
  { value: 'openai',    label: 'OpenAI',           defaultModel: 'gpt-4o',              needsKey: true },
  { value: 'gemini',    label: 'Google Gemini',    defaultModel: 'gemini-1.5-flash',    needsKey: true },
  { value: 'groq',      label: 'Groq',             defaultModel: 'llama-3.3-70b-versatile', needsKey: true },
];

const EXAMPLE_SPEC = `# Feature: Login Page Validation

## Goal
Verify the login page at the target URL handles user authentication correctly.

## Scenarios to test
1. Page loads and all expected UI elements are visible
2. Submitting empty fields shows an appropriate error
3. Entering an invalid email format is handled gracefully
4. Entering wrong credentials shows an error message
5. "Forgot password" link is clickable and navigates somewhere

## Acceptance criteria
- The form must be visible and interactive
- Error messages must appear for invalid inputs
- No JavaScript errors should be visible on the page`;

export default function GoalPanel({ onRun, running }: Props) {
  const [spec, setSpec] = useState(EXAMPLE_SPEC);
  const [url, setUrl] = useState('https://app.vwo.com');
  const [provider, setProvider] = useState<LLMConfig['provider']>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [error, setError] = useState('');

  const currentProvider = PROVIDERS.find(p => p.value === provider)!;

  const handleProviderChange = (p: LLMConfig['provider']) => {
    setProvider(p);
    setModel(PROVIDERS.find(pr => pr.value === p)?.defaultModel || '');
    setError('');
  };

  const handleRun = () => {
    if (!spec.trim()) return setError('Please enter a feature spec');
    if (!url.trim()) return setError('Please enter a target URL');
    if (currentProvider.needsKey && !apiKey.trim()) return setError('API key is required');
    setError('');
    onRun(spec, url, { provider, apiKey, model });
  };

  return (
    <div className="goal-panel">
      <div className="panel-section">
        <div className="panel-label">Goal</div>
        <div className="form-group">
          <label>Target URL</label>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://app.vwo.com"
            disabled={running}
          />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-label">AI Provider</div>
        <div className="form-group">
          <label>Provider</label>
          <select value={provider} onChange={e => handleProviderChange(e.target.value as LLMConfig['provider'])} disabled={running}>
            {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        {currentProvider.needsKey && (
          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
              disabled={running}
            />
          </div>
        )}
        <div className="form-group">
          <label>Model</label>
          <input
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            disabled={running}
          />
        </div>
      </div>

      <div className="panel-section" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div className="panel-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={11} />Feature Spec
        </div>
        <textarea
          className="spec-textarea"
          value={spec}
          onChange={e => setSpec(e.target.value)}
          placeholder="Paste your feature spec here..."
          disabled={running}
          style={{ flex: 1, marginBottom: 12 }}
        />
        {error && (
          <p style={{ fontSize: '0.76rem', color: 'var(--danger)', marginBottom: 8 }}>{error}</p>
        )}
        <button className={`btn btn-run ${running ? 'running' : ''}`} onClick={handleRun} disabled={running}>
          {running ? <><span className="spinner" />Agent running...</> : <><Play size={14} />Run Agent</>}
        </button>
      </div>
    </div>
  );
}
