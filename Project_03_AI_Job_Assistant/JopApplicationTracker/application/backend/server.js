const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const stripBom = require('strip-bom-stream').default;

const app = express();
app.use(cors());
app.use(express.json());

// Serve resume/cover letter files for download
app.get('/api/download', (req, res) => {
    const filePath = req.query.path;
    if (!filePath) {
        return res.status(400).json({ error: 'Missing path parameter' });
    }
    // Security: ensure the file is within the Updated_Resumes directory
    const resolvedPath = path.resolve(filePath);
    const allowedDir = path.resolve(path.join(__dirname, '../../../ResumeCreator/Updated_Resumes'));
    if (!resolvedPath.startsWith(allowedDir)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    if (!fs.existsSync(resolvedPath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    res.download(resolvedPath);
});

const PORT = 3001;

const SCRAPER_DIR = path.resolve(__dirname, '../../../JobScraper');
const RESUME_CREATOR_DIR = path.resolve(__dirname, '../../../ResumeCreator');
const CSV_DIR = path.join(SCRAPER_DIR, 'Extracted_CSV');

// 1. Scraping endpoint
app.post('/api/scrape', (req, res) => {
    // Run the scraper using the local node interpreter since scraper.mjs is an ES module
    exec('node scraper.mjs', { cwd: SCRAPER_DIR }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Scraper error: ${error.message}`);
            return res.status(500).json({ error: 'Scraping failed', details: stderr });
        }
        res.json({ message: 'Scraping completed', output: stdout });
    });
});

// 2. Resume generating endpoint
app.post('/api/generate-resume', (req, res) => {
    exec('python3 generate.py', { cwd: RESUME_CREATOR_DIR }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Generation error: ${error.message}`);
            return res.status(500).json({ error: 'Resume generation failed', details: stderr });
        }
        res.json({ message: 'Resumes generated', output: stdout });
    });
});

// 3. Fetch all jobs from ALL CSVs, deduplicated by URL
app.get('/api/jobs', (req, res) => {
    if (!fs.existsSync(CSV_DIR)) {
        return res.json([]);
    }

    const files = fs.readdirSync(CSV_DIR).filter(f => f.endsWith('.csv'));
    if (files.length === 0) return res.json([]);

    // Sort by oldest first so newer CSVs overwrite duplicates
    files.sort((a, b) => {
        return fs.statSync(path.join(CSV_DIR, a)).mtime.getTime() -
            fs.statSync(path.join(CSV_DIR, b)).mtime.getTime();
    });

    // Helper to parse a single CSV file
    const parseCsv = (filePath) => {
        return new Promise((resolve, reject) => {
            const rows = [];
            fs.createReadStream(filePath)
                .pipe(stripBom())
                .pipe(csv())
                .on('data', (data) => rows.push(data))
                .on('end', () => resolve(rows))
                .on('error', reject);
        });
    };

    // Helper to find keys regardless of BOM prefix
    const getField = (data, fieldName) => {
        if (data[fieldName] !== undefined) return data[fieldName];
        const key = Object.keys(data).find(k => k.endsWith(fieldName) || k.replace(/^\uFEFF/, '') === fieldName);
        return key ? data[key] : undefined;
    };

    // Parse ALL CSV files and merge results
    Promise.all(files.map(f => parseCsv(path.join(CSV_DIR, f))))
        .then(allResults => {
            const jobMap = new Map(); // URL -> job object, for deduplication

            allResults.forEach(rows => {
                rows.forEach(data => {
                    const companyName = (getField(data, 'Company Name') || 'Unknown').trim();
                    const url = getField(data, 'URL') || '';

                    let id = companyName.replace(/[^a-zA-Z0-9]/g, '_');

                    // Hardcode map for the 5 jobs we generated resumes for
                    if (companyName.includes('Real')) id = 'Real';
                    if (companyName.includes('Uplers')) id = 'Uplers';
                    if (companyName.includes('NTT DATA')) id = 'NTT_DATA_North_America';
                    if (companyName.includes('Cognizant')) id = 'Cognizant';
                    if (companyName.includes('PwC')) id = 'PwC_India';

                    const resumePath = path.resolve(RESUME_CREATOR_DIR, `Updated_Resumes/${id}/Kshitij_Rastogi_${id}_Resume.docx`);
                    const coverLetterPath = path.resolve(RESUME_CREATOR_DIR, `Updated_Resumes/${id}/Kshitij_Rastogi_${id}_Cover_Letter.docx`);

                    const job = {
                        id: url || (Math.random().toString()),
                        title: getField(data, 'Job Title') || '',
                        company: companyName,
                        location: getField(data, 'Location') || '',
                        desc: getField(data, 'Complete Job Description') ? getField(data, 'Complete Job Description').substring(0, 150) + '...' : '',
                        fullDesc: getField(data, 'Complete Job Description') || '',
                        easyApply: getField(data, 'Easy Apply') || 'No',
                        salary: getField(data, 'Salary') || '',
                        datePosted: getField(data, 'Date Posted') || '',
                        url: url,
                        hasResume: fs.existsSync(resumePath),
                        hasCoverLetter: fs.existsSync(coverLetterPath),
                        resumeDownloadUrl: fs.existsSync(resumePath) ? `http://localhost:${PORT}/api/download?path=${encodeURIComponent(resumePath)}` : null,
                        coverLetterDownloadUrl: fs.existsSync(coverLetterPath) ? `http://localhost:${PORT}/api/download?path=${encodeURIComponent(coverLetterPath)}` : null
                    };

                    // Use URL as dedup key — newer CSV entries overwrite older ones
                    const dedupKey = url || `${companyName}_${job.title}`;
                    jobMap.set(dedupKey, job);
                });
            });

            res.json(Array.from(jobMap.values()));
        })
        .catch(err => {
            console.error('Error parsing CSVs:', err);
            res.status(500).json({ error: 'Failed to parse job data' });
        });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
