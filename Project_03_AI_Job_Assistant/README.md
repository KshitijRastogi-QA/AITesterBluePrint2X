# AI Job Assistant - Documentation

The **AI Job Assistant** is a full-stack web application designed to automate and manage your end-to-end job application lifecycle. It streamlines job discovery, document personalization, and pipeline tracking in a single modern interface.

---

## 🚀 The Three-Step Workflow

The application is structured into three primary modules that form a complete automation pipeline:

### 🔬 Step 1: Intelligent Job Scraper
*   **LinkedIn Integration**: Uses an automated scraping script (`scraper.mjs`) to fetch high-quality job postings based on your target keywords.
*   **Data Extraction**: Captures critical fields including:
    *   Job Title
    *   Company Name
    *   Location & Salary (if listed)
    *   Complete Job Description
    *   LinkedIn URL
    *   Easy Apply availability
*   **Batch Storage**: Results are saved as timestamped CSV files in the `Extracted_CSV` directory.

### 📄 Step 2: Personalized Resume & Cover Letter Creator
*   **Document Generation**: Powered by internal Python scripts (`generate.py`) that take your base resume and tailor it to specific job descriptions.
*   **AI-Driven Tailoring**: Generates two distinct files per job (where mapped):
    *   **Custom Resume**: Updated keywords and project highlights.
    *   **Cover Letter**: A compelling, job-specific narrative.
*   **Secure Storage**: Documents are organized in folders named after the company/job ID within the `Updated_Resumes` directory.

### 📊 Step 3: Interactive Kanban Application Tracker
The command center for your job search. Features include:
*   **Unified Pipeline Display**: Merges data from ALL your scraped CSV files, automatically deduplicating identical job listings by URL.
*   **Drag-and-Drop Workflow**: Manage the status of your applications across six stages:
    *   `Wishlist` → `Applied` → `Follow-up` → `Interview` → `Offer` → `Rejected`
*   **Smart Document Integration**:
    *   **Dynamic Badges**: Automatically detects if a Resume/Cover Letter has been generated.
    *   **One-Click Download**: Green badges link directly to the local files for instant access.
*   **Enhanced Visibility**: 
    *   **Formatted Descriptions**: Raw "wall-of-text" job descriptions are parsed using a regex-based engine into a clean, readable document with bold headers.
    *   **LinkedIn Context**: Direct link buttons to the original LinkedIn posting.
*   **Responsive UI**: Optimized column-based layout that automatically fits your screen resolution for maximum visibility.

---

## 🛠 Tech Stack

### Frontend (React/Vite)
*   **Lucide-React**: Premium iconography.
*   **@hello-pangea/dnd**: Native drag-and-drop experience.
*   **LocalForage**: Persistent browser storage (IndexedDB) keeps your pipeline status saved even after reloads.
*   **Vanilla CSS**: Premium dark-themed design with glassmorphism and smooth transitions.

### Backend (Express/Node.js)
*   **Direct API Implementation**: Custom REST endpoints for scraping, resume generation, and document serving.
*   **Secure File Server**: A dedicated `/api/download` endpoint with path-validation to securely expose local documents to the browser.
*   **Robust CSV Engine**: Handles multi-file ingestion and UTF-8 BOM character stripping to ensure data integrity.

---

## 🔐 Security & Storage
*   **`.gitignore` Configuration**: Automatically excludes:
    *   `.env` files (API keys and credentials)
    *   `node_modules/` (Dependencies)
    *   `Extracted_CSV/` & `Updated_Resumes/` (Internal data storage)
*   **SSH Integration**: Configured for your GitHub profile (`KshitijRastogi-QA`).

---

## 📂 Project Structure
```text
AITesterBluePrint2X/
├── Project_03_AI_Job_Assistant/
│   ├── JobScraper/             # Scraping logic and CSV outputs
│   ├── ResumeCreator/          # Python generation logic and document storage
│   └── JopApplicationTracker/  # Full-stack web application
│       └── application/
│           ├── backend/        # Express server (server.js)
│           └── frontend/       # React application (Vite-powered)
```
