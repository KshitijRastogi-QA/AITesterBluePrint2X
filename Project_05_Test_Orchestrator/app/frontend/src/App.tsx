import React, { useEffect, useState } from 'react';
import PipelineBar from './components/PipelineBar';
import SetupPanel from './components/SetupPanel';
import type { JiraConfig } from './components/SetupPanel';
import StoriesPanel from './components/StoriesPanel';
import TestPlanPanel from './components/TestPlanPanel';
import TestCasesPanel from './components/TestCasesPanel';
import ExecutionPanel from './components/ExecutionPanel';
import DashboardPanel from './components/DashboardPanel';
import BugPanel from './components/BugPanel';

export interface LLMConfig { provider: string; apiKey: string; model: string; baseUrl?: string; }

const TOTAL_STEPS = 7;

export default function App() {
  const [step, setStep] = useState(0);
  const [jiraConfig, setJiraConfig] = useState<JiraConfig>({ domain: '', email: '', token: '' });
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({ provider: 'anthropic', apiKey: '', model: 'claude-sonnet-4-6' });
  const [testBaseUrl, setTestBaseUrl] = useState('');
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [selectedTc, setSelectedTc] = useState<{ tcId: string; tcTitle: string; steps: string } | null>(null);
  const [failedTcs, setFailedTcs] = useState<any[]>([]);
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  useEffect(() => {
    if (!activeStoryId) { setCompletedStages([]); return; }
    fetch('/api/pipeline-status')
      .then(r => r.json())
      .then((status: Record<string, number[]>) => {
        const key = Object.keys(status).find(k => k.toUpperCase() === activeStoryId.toUpperCase());
        setCompletedStages(key ? status[key] : [1]);
      })
      .catch(() => {});
  }, [activeStoryId, step]);

  const handleStorySelected = (storyId: string) => {
    setActiveStoryId(storyId);
    setCompletedStages([1]);
  };

  const handlePlanGenerated = () => {
    setCompletedStages(s => Array.from(new Set([...s, 2])));
    setStep(2);
  };

  const handleCasesGenerated = () => {
    setCompletedStages(s => Array.from(new Set([...s, 3])));
    setStep(3);
  };

  const handleExecute = (tcId: string, tcTitle: string, steps: string) => {
    setSelectedTc({ tcId, tcTitle, steps });
    setStep(4);
  };

  const handleBugReady = (tc: any) => {
    setFailedTcs(prev => prev.find(t => t.tcId === tc.tcId) ? prev : [...prev, tc]);
    setCompletedStages(s => Array.from(new Set([...s, 4, 5])));
  };

  const btnBase: React.CSSProperties = {
    borderRadius: 4, padding: '8px 20px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: '1px solid #e2e8f0',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#4f46e5' }}>TestGen Orchestrator</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {activeStoryId && (
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Active: <strong style={{ color: '#1e293b' }}>{activeStoryId}</strong>
            </span>
          )}
          {failedTcs.length > 0 && (
            <button onClick={() => setStep(6)}
              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {failedTcs.length} Failed — Raise Bugs
            </button>
          )}
        </div>
      </header>

      {/* Step progress bar */}
      <PipelineBar
        completedStages={completedStages}
        storyId={activeStoryId}
        currentStep={step}
        onStepClick={setStep}
      />

      {/* Centered card */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px' }}>
        <div style={{
          width: '100%', maxWidth: 920, background: '#fff',
          border: '1px solid #e2e8f0', borderRadius: 8,
          padding: '28px 32px', minHeight: 460,
        }}>
          {step === 0 && (
            <SetupPanel
              jiraConfig={jiraConfig}
              onJiraChange={setJiraConfig}
              llmConfig={llmConfig}
              onLlmChange={setLlmConfig}
              testBaseUrl={testBaseUrl}
              onTestBaseUrlChange={setTestBaseUrl}
              onContinue={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <StoriesPanel
              jiraConfig={jiraConfig}
              activeStoryId={activeStoryId}
              llmConfig={llmConfig}
              onStorySelected={handleStorySelected}
              onPlanGenerated={handlePlanGenerated}
            />
          )}
          {step === 2 && (
            <TestPlanPanel
              activeStoryId={activeStoryId}
              llmConfig={llmConfig}
              onCasesGenerated={handleCasesGenerated}
            />
          )}
          {step === 3 && (
            <TestCasesPanel activeStoryId={activeStoryId} onExecute={handleExecute} />
          )}
          {step === 4 && (
            <ExecutionPanel selectedTc={selectedTc} onBugReady={handleBugReady} llmConfig={llmConfig} testBaseUrl={testBaseUrl} />
          )}
          {step === 5 && <DashboardPanel activeStoryId={activeStoryId} />}
          {step === 6 && <BugPanel failedTcs={failedTcs} activeStoryId={activeStoryId} jiraConfig={jiraConfig} />}
        </div>

        {/* Previous / Next navigation */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', maxWidth: 920, marginTop: 14,
        }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{ ...btnBase, background: step === 0 ? '#f1f5f9' : '#fff', color: step === 0 ? '#9ca3af' : '#374151', cursor: step === 0 ? 'not-allowed' : 'pointer' }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Step {step + 1} of {TOTAL_STEPS}</span>
          <button
            onClick={() => setStep(s => Math.min(TOTAL_STEPS - 1, s + 1))}
            disabled={step === TOTAL_STEPS - 1}
            style={{ ...btnBase, background: step === TOTAL_STEPS - 1 ? '#f1f5f9' : '#4f46e5', color: step === TOTAL_STEPS - 1 ? '#9ca3af' : '#fff', border: 'none', cursor: step === TOTAL_STEPS - 1 ? 'not-allowed' : 'pointer' }}
          >
            Next →
          </button>
        </div>
      </main>
    </div>
  );
}
