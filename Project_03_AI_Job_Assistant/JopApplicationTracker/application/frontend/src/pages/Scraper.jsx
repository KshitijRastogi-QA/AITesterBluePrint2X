import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

export default function Scraper() {
    const navigate = useNavigate();
    const [isScraping, setIsScraping] = useState(false);
    const [result, setResult] = useState('');

    const handleScrape = async () => {
        setIsScraping(true);
        setResult('');
        try {
            const res = await fetch(`${API_BASE}/scrape`, { method: 'POST' });
            const data = await res.json();
            setResult(data.message || 'Scraping Completed! Jobs captured in Extracted_CSV.');
        } catch (e) {
            setResult('Error triggering scrape. Ensure backend is running.');
        } finally {
            setIsScraping(false);
        }
    };

    return (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <header className="header" style={{ flexShrink: 0 }}>
                <button onClick={() => navigate('/')} className="btn btn-secondary">
                    <ArrowLeft size={16} /> Home
                </button>
                <div>
                    <h1 className="title" style={{ fontSize: '1.5rem' }}>Step 1: Scrape Jobs</h1>
                    <p className="subtitle">Execute the AI Job Scraper</p>
                </div>
            </header>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ background: 'var(--bg-card)', padding: '3rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', textAlign: 'center', width: '400px', flexShrink: 0 }}>
                    <Briefcase size={48} color="var(--accent)" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ margin: '0 0 1rem', fontSize: '1.5rem' }}>LinkedIn Scraper</h2>
                    <p style={{ margin: '0 0 2rem', color: 'var(--text-muted)' }}>Using Playwright, this script will securely login and extract the latest recommended jobs.</p>

                    <button onClick={handleScrape} disabled={isScraping} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                        {isScraping ? <Loader2 size={24} className="spin" /> : <Briefcase size={20} />}
                        <span>{isScraping ? 'Scraping Jobs...' : 'Run Scraper'}</span>
                    </button>

                    {result && (
                        <div style={{ padding: '1rem', background: result.includes('Error') ? '#fee2e2' : '#d1fae5', color: result.includes('Error') ? '#ef4444' : '#059669', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 600 }}>
                            {result}
                        </div>
                    )}

                    <div
                        onClick={() => navigate('/generate')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }}
                        className="next-link">
                        Next Step: Generate Resumes <ArrowRight size={18} />
                    </div>
                </div>
            </div>
        </div>
    );
}
