import React from 'react';

const STEPS = [
  { n: 0, label: 'Setup',         icon: '⚙️' },
  { n: 1, label: 'Extract Story', icon: '📥' },
  { n: 2, label: 'Test Plan',     icon: '📋' },
  { n: 3, label: 'Test Cases',    icon: '🧪' },
  { n: 4, label: 'Execute',       icon: '▶️' },
  { n: 5, label: 'Dashboard',     icon: '📊' },
  { n: 6, label: 'Raise Bugs',    icon: '🐛' },
];

interface Props {
  completedStages: number[];
  storyId: string | null;
  currentStep: number;
  onStepClick: (n: number) => void;
}

export default function PipelineBar({ completedStages, storyId, currentStep, onStepClick }: Props) {
  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 24px',
    }}>
      {/* Story badge row */}
      {storyId && (
        <div style={{ padding: '8px 0 0 0' }}>
          <span style={{
            fontSize: 11, color: '#4f46e5', background: '#eef2ff',
            borderRadius: 4, padding: '3px 10px', fontWeight: 600,
          }}>
            Story: {storyId}
          </span>
        </div>
      )}

      {/* Steps row */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        overflowX: 'auto' as const,
      }}>
        {STEPS.map((s, i) => {
          const done = s.n === 0 ? currentStep > 0 : completedStages.includes(s.n);
          const current = s.n === currentStep;

          const bg = current ? '#4f46e5' : done ? '#f0fdf4' : '#f8fafc';
          const color = current ? '#fff' : done ? '#15803d' : '#9ca3af';
          const borderBottom = current ? '3px solid #4f46e5' : done ? '3px solid #16a34a' : '3px solid transparent';

          return (
            <React.Fragment key={s.n}>
              <button
                onClick={() => onStepClick(s.n)}
                title={`Go to step ${s.n + 1}: ${s.label}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 4, padding: '12px 18px',
                  background: bg, color,
                  border: 'none', borderBottom,
                  cursor: 'pointer', whiteSpace: 'nowrap' as const,
                  minWidth: 90, flex: 1,
                  transition: 'background 0.15s',
                }}
              >
                {/* Circle with icon or checkmark */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                  background: current ? 'rgba(255,255,255,0.2)' : done ? '#dcfce7' : '#e2e8f0',
                  border: current ? '2px solid rgba(255,255,255,0.5)' : done ? '2px solid #16a34a' : '2px solid #d1d5db',
                  color: current ? '#fff' : done ? '#16a34a' : '#9ca3af',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {done && !current ? '✓' : s.icon}
                </div>

                {/* Step number + label */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 500 }}>
                    Step {s.n + 1}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: current ? 700 : done ? 600 : 400 }}>
                    {s.label}
                  </span>
                </div>
              </button>

              {/* Connector line between steps */}
              {i < STEPS.length - 1 && (
                <div style={{
                  alignSelf: 'center',
                  width: 24, height: 2, flexShrink: 0,
                  background: done && completedStages.includes(STEPS[i + 1].n) || (s.n === 0 && currentStep > 0 && STEPS[i + 1].n <= currentStep)
                    ? '#16a34a' : '#e2e8f0',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
