import React, { useRef, useState } from 'react';
import { Globe, FileText, Play, Settings, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { LLMConfig } from '../types';

interface Props {
  onDone: (data: { url: string; screenshot: string; domText: string; context: string; config: LLMConfig }) => void;
}

const PROVIDERS: { value: LLMConfig['provider']; label: string; local: boolean }[] = [
  { value: 'anthropic', label: 'Anthropic Claude', local: false },
  { value: 'openai',    label: 'OpenAI',           local: false },
  { value: 'gemini',    label: 'Google Gemini',    local: false },
  { value: 'groq',      label: 'Groq API',         local: false },
  { value: 'ollama',    label: 'Ollama (Local)',    local: true  },
  { value: 'lmstudio',  label: 'LM Studio (Local)', local: true },
];

const DEFAULT_MODELS: Record<LLMConfig['provider'], string> = {
  anthropic: 'claude-sonnet-4-6',
  openai:    'gpt-4o',
  gemini:    'gemini-1.5-flash',
  groq:      'llama-3.2-11b-vision-preview',
  ollama:    'llava',
  lmstudio:  'local-model',
};

const DEFAULT_URLS: Partial<Record<LLMConfig['provider'], string>> = {
  ollama:   'http://localhost:11434/v1',
  lmstudio: 'http://localhost:1234/v1',
  gemini:   'https://generativelanguage.googleapis.com/v1beta/openai/',
  groq:     'https://api.groq.com/openai/v1',
};

export default function Step1Setup({ onDone }: Props) {
  const [url, setUrl] = useState('');
  const [featureText, setFeatureText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<LLMConfig>({ provider: 'anthropic', model: 'claude-sonnet-4-6' });
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [connectionMsg, setConnectionMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const isLocal = (p: LLMConfig['provider']) => p === 'ollama' || p === 'lmstudio';

  const setProvider = (provider: LLMConfig['provider']) => {
    setConfig({
      provider,
      model: DEFAULT_MODELS[provider],
      baseUrl: DEFAULT_URLS[provider] || '',
      apiKey: '',
    });
    setConnectionStatus('idle');
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    setConnectionMsg('');
    try {
      const { data } = await axios.post('/api/test-connection', config);
      setConnectionStatus(data.success ? 'ok' : 'fail');
      setConnectionMsg(data.message);
    } catch (e: any) {
      setConnectionStatus('fail');
      setConnectionMsg(e.response?.data?.error || e.message);
    }
  };

  const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleAnalyse = async () => {
    if (!url.trim()) return setError('Please enter a URL');
    if (!config.provider) return setError('Please select an LLM provider');
    setError('');
    setLoading(true);
    const finalUrl = normalizeUrl(url);
    try {
      const fd = new FormData();
      fd.append('url', finalUrl);
      if (file) fd.append('prd', file);
      const { data } = await axios.post('/api/analyse', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const combinedContext = [
        featureText.trim(),
        data.prdContent?.trim()
      ].filter(Boolean).join('\n\n---\n\n');

      onDone({ url: finalUrl, screenshot: data.screenshot, domText: data.domText, context: combinedContext, config });
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* LLM Provider Config */}
      <div className="card">
        <p className="card-title"><Settings size={15} style={{ display: 'inline', marginRight: 6 }} />LLM Provider</p>

        <div className="form-group">
          <label>Provider</label>
          <select value={config.provider} onChange={e => setProvider(e.target.value as LLMConfig['provider'])}>
            {PROVIDERS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {!isLocal(config.provider) && (
          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              value={config.apiKey || ''}
              onChange={e => setConfig({ ...config, apiKey: e.target.value })}
              placeholder={config.provider === 'anthropic' ? 'sk-ant-...' : config.provider === 'openai' ? 'sk-...' : 'API key...'}
            />
          </div>
        )}

        {(isLocal(config.provider) || config.provider === 'groq' || config.provider === 'gemini') && (
          <div className="form-group">
            <label>Base URL</label>
            <input
              type="text"
              value={config.baseUrl || ''}
              onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
              placeholder={DEFAULT_URLS[config.provider] || 'https://...'}
            />
          </div>
        )}

        <div className="form-group">
          <label>Model</label>
          <input
            type="text"
            value={config.model || ''}
            onChange={e => setConfig({ ...config, model: e.target.value })}
            placeholder={DEFAULT_MODELS[config.provider]}
          />
        </div>

        <div className="flex items-center gap-8">
          <button className="btn btn-secondary btn-sm" onClick={testConnection} disabled={connectionStatus === 'testing'}>
            {connectionStatus === 'testing' ? <><span className="spinner" style={{ width: 14, height: 14 }} />Testing...</> : 'Test Connection'}
          </button>
          {connectionStatus === 'ok' && <span style={{ color: 'var(--success)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} />{connectionMsg}</span>}
          {connectionStatus === 'fail' && <span style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{connectionMsg}</span>}
        </div>
      </div>

      {/* Target & Context */}
      <div className="card">
        <p className="card-title"><Globe size={15} style={{ display: 'inline', marginRight: 6 }} />Target & Feature Context</p>

        <div className="form-group">
          <label>Target URL</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://app.vwo.com/#/login"
          />
        </div>

        <div className="form-group">
          <label>Feature Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
          <textarea
            value={featureText}
            onChange={e => setFeatureText(e.target.value)}
            placeholder="Describe the feature you want to test — user flows, edge cases, acceptance criteria, anything helpful for the AI to generate better test cases..."
            style={{ minHeight: 100 }}
          />
        </div>

        <div className="form-group">
          <label>
            <FileText size={13} style={{ display: 'inline', marginRight: 4 }} />
            PRD / Feature Document <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
          </label>
          <div
            className={`file-upload ${file ? 'has-file' : ''}`}
            onClick={() => fileRef.current?.click()}
          >
            <FileText size={22} color={file ? 'var(--success)' : 'var(--text-muted)'} />
            <p>{file ? `✓ ${file.name}` : 'Click to upload PDF, TXT, or MD file'}</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md"
            style={{ display: 'none' }}
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="mt-16">
          <button className="btn btn-primary" onClick={handleAnalyse} disabled={loading}>
            {loading
              ? <><span className="spinner" />Capturing screenshot...</>
              : <><Play size={15} />Analyse Page</>}
          </button>
        </div>
      </div>

      <div className="card" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <p style={{ marginBottom: 8, fontWeight: 600, color: 'var(--text)' }}>What happens next</p>
        <p>1. Playwright opens the URL in a real browser and takes a screenshot</p>
        <p style={{ marginTop: 4 }}>2. Your chosen AI analyses the screenshot + context to generate a test plan</p>
        <p style={{ marginTop: 4 }}>3. AI writes structured test cases from the plan</p>
        <p style={{ marginTop: 4 }}>4. AI + Playwright execute each test case live and stream results</p>
      </div>
    </div>
  );
}
