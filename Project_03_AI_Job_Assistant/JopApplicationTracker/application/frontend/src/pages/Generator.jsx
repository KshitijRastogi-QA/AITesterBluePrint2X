import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

export default function Generator() {
    const navigate = useNavigate();
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState('');

    const handleGenerate = async () => {
        setIsGenerating(true);
        setResult('');
        try {
            const res = await fetch(`${API_BASE}/generate-resume`, { method: 'POST' });
            const data = await res.json();
            setResult(data.message || 'Resumes and Cover Letters tailored successfully.');
        } catch (e) {
            setResult('Error executing resume generator.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <header className="header" style={{ padding: '1.5rem 3rem', flexShrink: 0 }}>
                <button onClick={() => navigate('/scrape')} className="btn btn-secondary">
                    <ArrowLeft size={16} /> Previous
                </button>
                <div>
                    <h1 className="title" style={{ fontSize: '1.5rem' }}>Step 2: Generate Docs</h1>
                    <p className="subtitle">Customizing Resumes and Cover Letters</p>
                </div>
            </header>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ background: 'var(--bg-card)', padding: '3rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', textAlign: 'center', width: '450px', flexShrink: 0 }}>
                    <FileText size={48} color="#8b5cf6" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ margin: '0 0 1rem', fontSize: '1.5rem' }}>AI Generator</h2>
                    <p style={{ margin: '0 0 2rem', color: 'var(--text-muted)' }}>This step identifies exactly what the HR is looking for. It executes the AI builder on all job postings parsed from the CSV.</p>

                    <button onClick={handleGenerate} disabled={isGenerating} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', marginBottom: '1.5rem', fontSize: '1.1rem', background: '#8b5cf6' }}>
                        {isGenerating ? <Loader2 size={24} className="spin" /> : <FileText size={20} />}
                        <span>{isGenerating ? 'Drafting Documents...' : 'Start AI Generation'}</span>
                    </button>

                    {result && (
                        <div style={{ padding: '1rem', background: result.includes('Error') ? '#fee2e2' : '#ede9fe', color: result.includes('Error') ? '#ef4444' : '#6d28d9', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 600 }}>
                            {result}
                        </div>
                    )}

                    <div
                        onClick={() => navigate('/tracker')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }}
                        className="next-link">
                        Next Step: Go to Kanban Tracker <ArrowRight size={18} />
                    </div>
                </div>
            </div>
        </div>
    );
}
