import React, { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import StepIndicator from './components/StepIndicator';
import Step1Setup from './components/Step1Setup';
import Step2TestPlan from './components/Step2TestPlan';
import Step3TestCases from './components/Step3TestCases';
import Step4Results from './components/Step4Results';
import { Step, TestCase, LLMConfig } from './types';

export default function App() {
  const [step, setStep] = useState<Step>(1);
  const [url, setUrl] = useState('');
  const [config, setConfig] = useState<LLMConfig>({ provider: 'anthropic', model: 'claude-sonnet-4-6' });
  const [screenshot, setScreenshot] = useState('');
  const [domText, setDomText] = useState('');
  const [context, setContext] = useState('');
  const [testPlan, setTestPlan] = useState('');
  const [testCasesMarkdown, setTestCasesMarkdown] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const restart = () => {
    setStep(1);
    setUrl(''); setConfig({ provider: 'anthropic', model: 'claude-sonnet-4-6' });
    setScreenshot(''); setDomText(''); setContext('');
    setTestPlan(''); setTestCasesMarkdown(''); setTestCases([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <FlaskConical size={20} color="var(--primary)" />
        <h1>QA Platform — <span>Playwright MCP</span></h1>
      </header>

      <div className="app-body">
        <StepIndicator current={step} />

        {step === 1 && (
          <Step1Setup
            onDone={({ url: u, screenshot: s, domText: d, context: c, config: cfg }) => {
              setUrl(u); setScreenshot(s); setDomText(d); setContext(c); setConfig(cfg);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <Step2TestPlan
            url={url} screenshot={screenshot} domText={domText} context={context} config={config}
            onDone={plan => { setTestPlan(plan); setStep(3); }}
          />
        )}

        {step === 3 && (
          <Step3TestCases
            url={url} domText={domText} testPlan={testPlan} config={config}
            onDone={(md, cases) => { setTestCasesMarkdown(md); setTestCases(cases); setStep(4); }}
          />
        )}

        {step === 4 && (
          <Step4Results
            url={url} testCasesMarkdown={testCasesMarkdown}
            initialCases={testCases} config={config} onRestart={restart}
          />
        )}
      </div>
    </div>
  );
}
