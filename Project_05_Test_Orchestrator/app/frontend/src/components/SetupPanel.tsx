import React from 'react';
import { LLMConfig } from '../App';

export interface JiraConfig { domain: string; email: string; token: string; }

interface Props {
  jiraConfig: JiraConfig;
  onJiraChange: (cfg: JiraConfig) => void;
  llmConfig: LLMConfig;
  onLlmChange: (cfg: LLMConfig) => void;
  testBaseUrl: string;
  onTestBaseUrlChange: (url: string) => void;
  onContinue: () => void;
}

const PROVIDER_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-6', openai: 'gpt-4o', groq: 'llama-3.3-70b-versatile',
  gemini: 'gemini-2.0-flash', ollama: 'gemma3:1b', lmstudio: 'local-model',
};

export default function SetupPanel({ jiraConfig, onJiraChange, llmConfig, onLlmChange, testBaseUrl, onTestBaseUrlChange, onContinue }: Props) {
  const isLocal = llmConfig.provider === 'ollama' || llmConfig.provider === 'lmstudio';

  const inp: React.CSSProperties = {
    border: '1px solid #d1d5db', borderRadius: 4, padding: '7px 10px', fontSize: 13,
    width: '100%', marginBottom: 14, background: '#fff', color: '#1e293b',
    outline: 'none', boxSizing: 'border-box' as const,
  };
  const lbl: React.CSSProperties = { fontSize: 12, color: '#374151', marginBottom: 4, display: 'block', fontWeight: 500 };
  const h3: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14,
    paddingBottom: 8, borderBottom: '1px solid #e2e8f0',
  };

  const canContinue = !!(jiraConfig.domain && jiraConfig.email && jiraConfig.token &&
    (isLocal || llmConfig.apiKey) && llmConfig.model);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Setup</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          Enter your JIRA and LLM credentials once. They are used only for API calls and never stored on disk.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
        {/* JIRA */}
        <div>
          <div style={h3}>JIRA Connection</div>
          <label style={lbl}>Domain</label>
          <input style={inp} placeholder="yourcompany.atlassian.net"
            value={jiraConfig.domain} onChange={e => onJiraChange({ ...jiraConfig, domain: e.target.value })} />
          <label style={lbl}>Email</label>
          <input style={inp} placeholder="you@company.com"
            value={jiraConfig.email} onChange={e => onJiraChange({ ...jiraConfig, email: e.target.value })} />
          <label style={lbl}>API Token</label>
          <input style={inp} type="password" placeholder="ATATT3x..."
            value={jiraConfig.token} onChange={e => onJiraChange({ ...jiraConfig, token: e.target.value })} />
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: -8, marginBottom: 14 }}>
            Generate at atlassian.com → Account Settings → Security → API tokens
          </div>
          <label style={lbl}>App Base URL <span style={{ color: '#9ca3af', fontWeight: 400 }}>(for test execution)</span></label>
          <input style={inp} placeholder="https://staging.yourapp.com"
            value={testBaseUrl} onChange={e => onTestBaseUrlChange(e.target.value)} />
        </div>

        {/* LLM */}
        <div>
          <div style={h3}>LLM Provider</div>
          <label style={lbl}>Provider</label>
          <select style={{ ...inp, cursor: 'pointer' }} value={llmConfig.provider}
            onChange={e => {
              const p = e.target.value;
              onLlmChange({ ...llmConfig, provider: p, model: PROVIDER_MODELS[p] || '', apiKey: '', baseUrl: '' });
            }}>
            <option value="anthropic">Anthropic Claude</option>
            <option value="openai">OpenAI</option>
            <option value="groq">Groq</option>
            <option value="gemini">Google Gemini</option>
            <option value="ollama">Ollama (Local)</option>
            <option value="lmstudio">LM Studio (Local)</option>
          </select>

          <label style={lbl}>{isLocal ? 'Base URL' : 'API Key'}</label>
          {isLocal
            ? <input style={inp}
                placeholder={llmConfig.provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234/v1'}
                value={llmConfig.baseUrl || ''}
                onChange={e => onLlmChange({ ...llmConfig, baseUrl: e.target.value })} />
            : <input style={inp} type="password"
                placeholder={llmConfig.provider === 'anthropic' ? 'sk-ant-...' : llmConfig.provider === 'gemini' ? 'AIza...' : 'sk-...'}
                value={llmConfig.apiKey}
                onChange={e => onLlmChange({ ...llmConfig, apiKey: e.target.value })} />
          }

          <label style={lbl}>Model</label>
          <input style={inp} placeholder="model name"
            value={llmConfig.model}
            onChange={e => onLlmChange({ ...llmConfig, model: e.target.value })} />
        </div>
      </div>

      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          style={{
            background: canContinue ? '#4f46e5' : '#f1f5f9',
            color: canContinue ? '#fff' : '#9ca3af',
            border: 'none', borderRadius: 4, padding: '9px 22px',
            fontSize: 13, fontWeight: 600, cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >
          Save &amp; Continue →
        </button>
        {!canContinue && (
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            Fill in JIRA domain, email, token{isLocal ? '' : ' and LLM API key'} to continue
          </span>
        )}
      </div>
    </div>
  );
}
