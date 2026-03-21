import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Building, MapPin, CheckCircle, RefreshCcw, Send, Settings, ArrowLeft, X, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import localforage from 'localforage';

const COLUMNS = {
    wishlist: { id: 'wishlist', title: 'Wishlist', color: '#ff6b6b' },
    applied: { id: 'applied', title: 'Applied', color: '#339af0' },
    followUp: { id: 'followUp', title: 'Follow-up', color: '#fcc419' },
    interview: { id: 'interview', title: 'Interview', color: '#8b5cf6' },
    offer: { id: 'offer', title: 'Offer', color: '#10b981' },
    rejected: { id: 'rejected', title: 'Rejected', color: '#94a3b8' }
};

const API_BASE = 'http://localhost:3001/api';

// Format raw job description text into readable HTML sections
const formatJobDescription = (text) => {
    if (!text) return '';

    // Common section header patterns in job descriptions
    const sectionHeaders = [
        'About the role', 'About the job', 'About Us', 'About the company',
        'About NTT DATA', 'About Uplers', 'About PwC', 'About Real',
        'Key Responsibilities', 'Responsibilities', 'Duties/Responsibilities',
        'Required Skills/Abilities', 'Required Skills', 'Mandatory skill sets',
        'Preferred skill sets', 'Preferred Skills', 'Preferred Qualifications',
        'Must Have', 'Nice to Have',
        'Qualifications', 'Requirements', 'Education and Experience',
        'Education', 'Experience', 'Years of experience required',
        'What do you need for this opportunity', 'What you will do',
        'Why Join Us', 'Why PWC', 'Why Join',
        'How to apply', 'How to apply for this opportunity',
        'Job Summary', 'Job Description & Summary', 'Job Description',
        'Test Coverage & Strategy', 'Validation & Quality Assurance',
        'Automation & Frameworks', 'Performance & Security',
        'Collaboration', 'Agile Practices', 'User Training',
        'Salesforce Administration Support', 'Dashboard Development',
        'Test Development and Execution', 'Diverse Testing Capabilities',
        'Defect Management', 'Root Cause Analysis', 'Requirements Gathering',
        'Team Collaboration',
    ];

    let formatted = text;

    // Escape HTML entities
    formatted = formatted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Insert line breaks before section headers
    sectionHeaders.forEach(header => {
        const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`([^\n])(?=${escapedHeader}[:\s])`, 'g');
        formatted = formatted.replace(regex, '$1\n\n');
    });

    // Bold section headers (with or without colon)
    sectionHeaders.forEach(header => {
        const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedHeader}):?`, 'g');
        formatted = formatted.replace(regex, `<strong>$1</strong>`);
    });

    // Convert patterns like "1. text" or "• text" into list-like line breaks
    formatted = formatted.replace(/(?<=[.!?])\s*(?=\d+\.\s)/g, '\n');

    // Add breaks before common list-style starters that are jammed together
    formatted = formatted.replace(/([a-z.])([A-Z][a-z]+ [A-Z])/g, '$1\n$2');

    // Convert newlines to <br> for HTML
    formatted = formatted.replace(/\n{2,}/g, '</p><p>');
    formatted = formatted.replace(/\n/g, '<br>');

    return `<p>${formatted}</p>`;
};

export default function Tracker() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState({});
    const [selectedTask, setSelectedTask] = useState(null);
    const [columns, setColumns] = useState({
        wishlist: { id: 'wishlist', taskIds: [] },
        applied: { id: 'applied', taskIds: [] },
        followUp: { id: 'followUp', taskIds: [] },
        interview: { id: 'interview', taskIds: [] },
        offer: { id: 'offer', taskIds: [] },
        rejected: { id: 'rejected', taskIds: [] }
    });

    useEffect(() => {
        const loadState = async () => {
            const savedTasks = await localforage.getItem('kanban-tasks');
            const savedColumns = await localforage.getItem('kanban-columns');

            if (savedTasks && savedColumns) {
                setTasks(savedTasks);
                setColumns(savedColumns);

                // Also fetch any new jobs invisibly
                fetchJobsBackground(savedTasks, savedColumns);
            } else {
                fetchJobsBackground({}, columns);
            }
        };
        loadState();
    }, []);

    const saveState = async (newTasks, newColumns) => {
        setTasks(newTasks);
        setColumns(newColumns);
        await localforage.setItem('kanban-tasks', newTasks);
        await localforage.setItem('kanban-columns', newColumns);
    };

    const fetchJobsBackground = async (currentTasks, currentColumns) => {
        try {
            const res = await fetch(`${API_BASE}/jobs`);
            const jobs = await res.json();

            const newTasks = { ...currentTasks };
            const wishlistIds = new Set(currentColumns.wishlist.taskIds);

            let added = false;
            jobs.forEach(job => {
                if (!newTasks[job.id]) {
                    newTasks[job.id] = job;
                    wishlistIds.add(job.id);
                    added = true;
                } else {
                    if (job.hasResume || job.hasCoverLetter || job.fullDesc !== newTasks[job.id].fullDesc || job.resumeDownloadUrl !== newTasks[job.id].resumeDownloadUrl || job.coverLetterDownloadUrl !== newTasks[job.id].coverLetterDownloadUrl) {
                        newTasks[job.id] = { ...newTasks[job.id], hasResume: job.hasResume, hasCoverLetter: job.hasCoverLetter, resumeDownloadUrl: job.resumeDownloadUrl, coverLetterDownloadUrl: job.coverLetterDownloadUrl, fullDesc: job.fullDesc, easyApply: job.easyApply, title: job.title };
                        added = true;
                    }
                }
            });

            if (added) {
                const newCols = {
                    ...currentColumns,
                    wishlist: { ...currentColumns.wishlist, taskIds: Array.from(wishlistIds) }
                };
                saveState(newTasks, newCols);
            }
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        }
    };

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const start = columns[source.droppableId];
        const finish = columns[destination.droppableId];

        if (start === finish) {
            const newTaskIds = Array.from(start.taskIds);
            newTaskIds.splice(source.index, 1);
            newTaskIds.splice(destination.index, 0, draggableId);

            const newColumn = { ...start, taskIds: newTaskIds };
            saveState(tasks, { ...columns, [newColumn.id]: newColumn });
            return;
        }

        const startTaskIds = Array.from(start.taskIds);
        startTaskIds.splice(source.index, 1);
        const newStart = { ...start, taskIds: startTaskIds };

        const finishTaskIds = Array.from(finish.taskIds);
        finishTaskIds.splice(destination.index, 0, draggableId);
        const newFinish = { ...finish, taskIds: finishTaskIds };

        saveState(tasks, {
            ...columns,
            [newStart.id]: newStart,
            [newFinish.id]: newFinish
        });
    };

    const clearData = async () => {
        await localforage.clear();
        window.location.reload();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

            <header className="header" style={{ padding: '1rem 3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <button onClick={() => navigate('/generate')} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                        <ArrowLeft size={16} /> Steps
                    </button>
                    <div>
                        <h1 className="title" style={{ fontSize: '1.6rem' }}>Step 3: Kanban Tracker</h1>
                        <p className="subtitle" style={{ fontSize: '0.85rem' }}>Drag and drop to manage your lifecycle. Click card for details.</p>
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={clearData} title="Reset tracking board">
                    <Settings size={18} />
                </button>
            </header>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="board">
                    {Object.values(COLUMNS).map(col => {
                        const column = columns[col.id];
                        const colTasks = column ? column.taskIds.map(taskId => tasks[taskId]).filter(Boolean) : [];

                        return (
                            <div key={col.id} className="column">
                                <div className="column-header">
                                    <h2 style={{ color: col.color, fontSize: '1rem' }}>{col.title}</h2>
                                    <span className="badge" style={{ backgroundColor: `${col.color}15`, color: col.color }}>
                                        {colTasks.length}
                                    </span>
                                </div>

                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            {colTasks.map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => setSelectedTask(task)}
                                                        >
                                                            <div className="card-top">
                                                                <h3 className="job-title">{task.title}</h3>
                                                                <div className="company">
                                                                    <Building size={14} /> <span>{task.company}</span>
                                                                </div>
                                                            </div>

                                                            <div className="card-mid">
                                                                <div className="location">
                                                                    <MapPin size={12} /> <span>{task.location}</span>
                                                                </div>
                                                                {task.salary && <div className="salary">{task.salary}</div>}
                                                            </div>

                                                            <p className="description">{task.desc}</p>

                                                            <div className="card-bottom">
                                                                <div className="badges">
                                                                    {task.hasResume && task.resumeDownloadUrl ? (
                                                                        <a href={task.resumeDownloadUrl} target="_blank" rel="noreferrer" className="doc-badge success doc-link" title="Download Resume" onClick={(e) => e.stopPropagation()}>
                                                                            <Download size={10} /> Resume
                                                                        </a>
                                                                    ) : task.hasResume ? (
                                                                        <span className="doc-badge success" title="Resume Generated">
                                                                            <CheckCircle size={10} /> Resume
                                                                        </span>
                                                                    ) : null}
                                                                    {task.hasCoverLetter && task.coverLetterDownloadUrl ? (
                                                                        <a href={task.coverLetterDownloadUrl} target="_blank" rel="noreferrer" className="doc-badge success doc-link" title="Download Cover Letter" onClick={(e) => e.stopPropagation()}>
                                                                            <Download size={10} /> Cover
                                                                        </a>
                                                                    ) : task.hasCoverLetter ? (
                                                                        <span className="doc-badge success" title="Cover Generated">
                                                                            <CheckCircle size={10} /> Cover
                                                                        </span>
                                                                    ) : null}
                                                                    {(!task.hasResume && !task.hasCoverLetter) && (
                                                                        <span className="doc-badge pending" title="Pending generation">
                                                                            <RefreshCcw size={10} /> Pending
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <a href={task.url} target="_blank" rel="noreferrer" className="apply-link" onClick={(e) => e.stopPropagation()}>
                                                                    <Send size={12} /><span>LinkedIn</span>
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>

            {selectedTask && (
                <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedTask(null)}><X size={20} /></button>
                        <h2 style={{ marginTop: 0, fontSize: '1.6rem', paddingRight: '2rem' }}>{selectedTask.title}</h2>
                        <div className="company" style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                            <Building size={18} /> <span>{selectedTask.company}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            <span className="doc-badge pending" style={{ fontSize: '0.85rem' }}><MapPin size={14} /> {selectedTask.location}</span>
                            {selectedTask.salary && <span className="doc-badge success" style={{ fontSize: '0.85rem' }}>{selectedTask.salary}</span>}
                            <span className="doc-badge pending" style={{ fontSize: '0.85rem' }}>Easy Apply: {selectedTask.easyApply}</span>
                            <span className="doc-badge pending" style={{ fontSize: '0.85rem' }}>Posted: {selectedTask.datePosted}</span>
                        </div>

                        <div className="job-desc-content" style={{
                            padding: '1.5rem',
                            background: 'var(--bg-main)',
                            borderRadius: '8px',
                            maxHeight: '40vh',
                            overflowY: 'auto',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem',
                            lineHeight: '1.7',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-color)',
                        }} dangerouslySetInnerHTML={{ __html: formatJobDescription(selectedTask.fullDesc) }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <div className="badges">
                                {selectedTask.hasResume && selectedTask.resumeDownloadUrl ? (
                                    <a href={selectedTask.resumeDownloadUrl} target="_blank" rel="noreferrer" className="doc-badge success doc-link" title="Download Resume" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                        <Download size={14} /> Download Resume
                                    </a>
                                ) : selectedTask.hasResume ? (
                                    <span className="doc-badge success">
                                        <CheckCircle size={14} /> Resume File Generated
                                    </span>
                                ) : null}
                                {selectedTask.hasCoverLetter && selectedTask.coverLetterDownloadUrl ? (
                                    <a href={selectedTask.coverLetterDownloadUrl} target="_blank" rel="noreferrer" className="doc-badge success doc-link" title="Download Cover Letter" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                        <Download size={14} /> Download Cover Letter
                                    </a>
                                ) : selectedTask.hasCoverLetter ? (
                                    <span className="doc-badge success">
                                        <CheckCircle size={14} /> Cover Letter File Generated
                                    </span>
                                ) : null}
                            </div>
                            <a href={selectedTask.url} target="_blank" rel="noreferrer" className="apply-link" style={{ padding: '0.6rem 1.2rem', fontSize: '0.95rem' }}>
                                <Send size={16} /> <span>View on LinkedIn</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
