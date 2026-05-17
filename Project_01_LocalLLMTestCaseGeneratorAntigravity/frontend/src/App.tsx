import React, { useState } from 'react';
import axios from 'axios';
import { Settings, MessageSquare, Save, Play, RefreshCcw } from 'lucide-react';
import './index.css';

interface LLMConfig {
  provider: 'ollama' | 'lmstudio' | 'groq' | 'openai' | 'claude' | 'gemini';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [config, setConfig] = useState<LLMConfig>({ provider: 'ollama', model: 'gemma3:1b' });
  const [requirement, setRequirement] = useState('');
  const [testCases, setTestCases] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ req: string, res: string }[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const testConnection = async () => {
    try {
      setConnectionStatus('Testing...');
      const res = await axios.post('http://localhost:3000/api/test-connection', config);
      setConnectionStatus(res.data.success ? 'Connected successfully!' : 'Connection failed.');
    } catch (err: any) {
      setConnectionStatus(err.response?.data?.message || 'Connection failed.');
    }
  };

  const saveSettings = async () => {
    try {
      await axios.post('http://localhost:3000/api/settings', config);
      alert('Settings saved globally for the session.');
    } catch (err) {
      console.error(err);
    }
  };

  const generateTests = async () => {
    if (!requirement.trim()) return;
    setLoading(true);
    setTestCases(null);
    try {
      const res = await axios.post('http://localhost:3000/api/generate', { requirement, config });
      setTestCases(res.data.testCases);
      setHistory([...history, { req: requirement, res: res.data.testCases }]);
      setRequirement(''); // Clear input after sending
    } catch (err: any) {
      setTestCases('Error generating test cases: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="brand">
          <MessageSquare size={24} color="#60a5fa" />
          Local AI Test Generator
        </h1>
        <nav className="nav-buttons">
          <button 
             onClick={() => setActiveTab('chat')} 
             className={`nav-btn chat ${activeTab === 'chat' ? 'active' : ''}`}>
            <MessageSquare size={18} /> Chat
          </button>
          <button 
             onClick={() => setActiveTab('settings')} 
             className={`nav-btn settings ${activeTab === 'settings' ? 'active' : ''}`}>
            <Settings size={18} /> Settings
          </button>
        </nav>
      </header>

      <main className="main-content">
        {activeTab === 'chat' ? (
          <div className="chat-layout">
            <aside className="sidebar glass-panel">
               <h2><RefreshCcw size={16} /> History</h2>
               <div className="history-list custom-scrollbar">
                  {history.length === 0 ? <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>No history yet.</p> : history.map((item, idx) => (
                    <div key={idx} className="history-item">
                       {item.req}
                    </div>
                  ))}
               </div>
            </aside>

            <div className="chat-main">
               <div className="output-area glass-panel custom-scrollbar">
                  {!testCases && !loading && (
                    <div className="empty-state">
                      <MessageSquare size={48} style={{opacity: 0.2}} />
                      <p>Generate functional and non-functional Jira test cases.</p>
                    </div>
                  )}
                  {loading && (
                     <div className="loading-state">
                       <div className="spinner"></div>
                       <p style={{color: 'var(--secondary)'}}>Generating intelligent test cases...</p>
                     </div>
                  )}
                  {testCases && (
                      <div className="test-cases-content">
                        <pre>{testCases}</pre>
                      </div>
                  )}
               </div>

               <div className="input-area glass-panel">
                  <textarea 
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    placeholder="Paste your Jira requirements here..."
                    className="custom-scrollbar"
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "50px";
                      target.style.height = target.scrollHeight + "px";
                    }}
                  />
                  <button 
                    onClick={generateTests}
                    disabled={loading || !requirement.trim()}
                    className="btn-generate">
                    <Play size={18} fill="currentColor" /> Generate
                  </button>
               </div>
            </div>
          </div>
        ) : (
          <div className="settings-layout custom-scrollbar">
             <div className="settings-panel glass-panel">
                <div className="settings-glow-1"></div>
                <div className="settings-glow-2"></div>
                
                <div className="settings-content">
                   <h2><Settings color="#c084fc"/> Provider Settings</h2>
                   
                   <div className="form-group">
                     <label>LLM Provider</label>
                     <select 
                       value={config.provider}
                       onChange={(e) => setConfig({...config, provider: e.target.value as any})}
                       className="form-control">
                        <option value="ollama">Ollama (Local API)</option>
                        <option value="lmstudio">LM Studio (Local API)</option>
                        <option value="groq">Groq API</option>
                        <option value="openai">OpenAI API</option>
                        <option value="claude">Anthropic Claude API</option>
                        <option value="gemini">Google Gemini API</option>
                     </select>
                   </div>

                   {(config.provider === 'openai' || config.provider === 'claude' || config.provider === 'gemini' || config.provider === 'groq') && (
                     <div className="form-group">
                       <label>API Key</label>
                       <input 
                         type="password"
                         value={config.apiKey || ''}
                         onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                         className="form-control"
                         placeholder="sk-..."
                       />
                     </div>
                   )}

                   {(config.provider === 'ollama' || config.provider === 'lmstudio') && (
                     <div className="form-group">
                       <label>Base URL</label>
                       <input 
                         type="text"
                         value={config.baseUrl || (config.provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234/v1')}
                         onChange={(e) => setConfig({...config, baseUrl: e.target.value})}
                         className="form-control"
                       />
                     </div>
                   )}

                   <div className="form-group">
                     <label>Model Name</label>
                     <input 
                       type="text"
                       value={config.model || ''}
                       onChange={(e) => setConfig({...config, model: e.target.value})}
                       className="form-control"
                       placeholder="e.g., llama3, gpt-4o, claude-3-5-sonnet"
                     />
                   </div>

                   <div className="settings-actions">
                      <button onClick={saveSettings} className="btn-secondary">
                         <Save size={18} /> Save Settings
                      </button>
                      <button onClick={testConnection} className="btn-primary">
                         Test Connection
                      </button>
                   </div>
                   
                   {connectionStatus && (
                     <div className={`status-box ${connectionStatus.includes('success') ? 'status-success' : connectionStatus === 'Testing...' ? 'status-testing' : 'status-error'}`}>
                       {connectionStatus}
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
