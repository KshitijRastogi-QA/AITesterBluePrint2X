import React from 'react';
import { Check } from 'lucide-react';
import { Step } from '../types';

const STEPS = [
  { n: 1, label: 'Setup' },
  { n: 2, label: 'Test Plan' },
  { n: 3, label: 'Test Cases' },
  { n: 4, label: 'Execute' },
];

export default function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="step-indicator">
      {STEPS.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <React.Fragment key={s.n}>
            <div className="step-item">
              <div className={`step-circle ${done ? 'done' : active ? 'active' : ''}`}>
                {done ? <Check size={14} /> : s.n}
              </div>
              <span className={`step-label ${done ? 'done' : active ? 'active' : ''}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`step-line ${done ? 'done' : ''}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
