import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, Blocks, ArrowRight } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '5rem', height: '100%', overflowY: 'auto', width: '100%' }}>
            <header style={{ textAlign: 'center', marginBottom: '4rem', flexShrink: 0 }}>
                <h1 className="title" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>AI Job Assistant</h1>
                <p className="subtitle" style={{ fontSize: '1.2rem' }}>Your intelligent career co-pilot.</p>
            </header>

            <div className="steps-wrapper" style={{ display: 'flex', gap: '2rem', maxWidth: '1000px', width: '90%', flexWrap: 'wrap', justifyContent: 'center', paddingBottom: '3rem' }}>

                <div className="step-card" onClick={() => navigate('/scrape')}>
                    <div className="step-icon"><Briefcase size={32} color="#3b82f6" /></div>
                    <div className="step-content">
                        <span className="step-number">Step 1</span>
                        <h3>Scrape Jobs</h3>
                        <p>Automatically extract recommended job postings matching your criteria directly from LinkedIn.</p>
                    </div>
                    <ArrowRight className="step-arrow" color="#cbd5e1" />
                </div>

                <div className="step-card" onClick={() => navigate('/generate')}>
                    <div className="step-icon"><FileText size={32} color="#8b5cf6" /></div>
                    <div className="step-content">
                        <span className="step-number">Step 2</span>
                        <h3>Generate Resumes</h3>
                        <p>Use AI to tailor your resume and draft ATS-friendly cover letters for each specific job.</p>
                    </div>
                    <ArrowRight className="step-arrow" color="#cbd5e1" />
                </div>

                <div className="step-card" onClick={() => navigate('/tracker')}>
                    <div className="step-icon"><Blocks size={32} color="#10b981" /></div>
                    <div className="step-content">
                        <span className="step-number">Step 3</span>
                        <h3>Kanban Tracker</h3>
                        <p>Manage your applications in a beautiful Kanban board configured exactly for your pipeline.</p>
                    </div>
                    <ArrowRight className="step-arrow" color="#cbd5e1" />
                </div>

            </div>
        </div>
    );
}
