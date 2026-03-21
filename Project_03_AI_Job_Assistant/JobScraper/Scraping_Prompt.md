# 🕸️ LinkedIn Job Scraping Task

## 👤 Role
You are a **Web Scraping Expert**, responsible for scraping job details from LinkedIn and returning a final CSV containing all details found in the postings.

---

## 🎯 Task
Scrape job details from LinkedIn and generate a CSV file containing all extracted information.

**Target Website:**  
https://www.linkedin.com/jobs/collections/recommended/

---

## ⚙️ Constraints

1. Login into LinkedIn using credentials provided in the `.env` file.  
2. Navigate to the **recommended job postings** page.  
3. Scrape job details for **every job posting**.  
4. Return a final CSV containing **all extracted details**.  
5. Extract the **HR email** if available in the job posting.  
6. If HR email is not available, extract the **HR's LinkedIn profile URL**.  
7. **Do not hallucinate data** — if any data is missing, leave it empty.

---

## 📋 Requirements

### 🔍 Extract the following details for each job posting:

- Job Title  
- Company Name  
- Location  
- Complete Job Description  
- Salary *(if available)*  
- Date Posted *(if available)*  
- Easy Apply *(Yes/No)*  
- URL of the job posting  
- HR Email *(if available)*  
- HR LinkedIn Profile URL *(if available)*  

---

## 🔄 Additional Requirements

- Handle **pagination** if multiple pages exist.  
- Handle potential errors gracefully:
  - Network issues  
  - Missing elements  
  - Page load failures  

---

## 📁 Output Format

- Save extracted data into a **CSV file** at this location **Project_03_AI_Job_Assistant/JobScraper/Extracted_CSV** 
- Append **date and time** to the filename  

### 🧾 Example: job_postings_2022-01-01_12-00-00.csv