import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        envVars[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
}

const username = envVars['LINKEDIN_USERNAME'];
const password = envVars['LINKEDIN_PASSWORD'];

const CSV_DIR = path.join(process.cwd(), 'Extracted_CSV');
if (!fs.existsSync(CSV_DIR)) {
    fs.mkdirSync(CSV_DIR, { recursive: true });
}

const pad = (n) => n.toString().padStart(2, '0');
const now = new Date();
const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
const csvFilename = path.join(CSV_DIR, `job_postings_${dateStr}.csv`);

const escapeCsv = (str) => {
    if (!str) return '""';
    const clean = str.replace(/"/g, '""').replace(/\n/g, ' ').trim();
    return `"${clean}"`;
};

(async () => {
    console.log("Launching browser...");
    const browser = await chromium.launch({ headless: false }); // Open on screen to allow manual captcha solving if needed
    const context = await browser.newContext();
    const page = await context.newPage();

    let jobCount = 0;

    try {
        console.log("Navigating to LinkedIn...");
        await page.goto("https://www.linkedin.com/login", { waitUntil: 'networkidle' });

        await page.waitForTimeout(1000);
        await page.fill('#username', username);
        await page.waitForTimeout(500);
        await page.fill('#password', password);
        await page.waitForTimeout(500);
        await page.click('[type="submit"]');

        console.log("Waiting for login to complete (or for you to solve captcha)...");
        // Wait until we reach the feed or jobs page, or timeout after 60 seconds
        await page.waitForURL(/feed|jobs/, { timeout: 60000 }).catch(() => console.log("Did not reach feed, moving on to try jobs URL anyway..."));
        await page.waitForTimeout(3000);

        console.log("Navigating to recommended jobs...");
        await page.goto("https://www.linkedin.com/jobs/collections/recommended/", { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);

        // Write CSV header
        fs.writeFileSync(csvFilename, '\uFEFF' + 'Job Title,Company Name,Location,Complete Job Description,Salary,Date Posted,Easy Apply,URL,HR Email,HR LinkedIn Profile URL\n');

        const extractField = async (locator, regex = null) => {
            try {
                const text = await locator.textContent({ timeout: 1000 });
                if (text) {
                    return text.trim();
                }
            } catch (e) { }
            return '';
        };

        const scrapeJobsOnPage = async () => {
            // Get all job cards on left pane
            // Scroll pane to load all jobs
            for (let i = 0; i < 5; i++) {
                await page.evaluate(() => {
                    const pane = document.querySelector('.jobs-search-results-list');
                    if (pane) pane.scrollTop = pane.scrollHeight;
                });
                await page.waitForTimeout(1000);
            }

            const jobs = await page.locator('.job-card-container').all();
            console.log(`Found ${jobs.length} jobs on the current page.`);
            let count = 0;

            for (const job of jobs) {
                try {
                    // Click on job card
                    await job.click();
                    await page.waitForTimeout(2000);

                    // Scrape right pane
                    // Title
                    const title = await extractField(page.locator('.job-details-jobs-unified-top-card__job-title h1, h2.job-details-jobs-unified-top-card__job-title').first());

                    // Company
                    const company = await extractField(page.locator('.job-details-jobs-unified-top-card__company-name a').first());

                    // Location and Date Posted
                    const primaryDesc = await extractField(page.locator('.job-details-jobs-unified-top-card__primary-description-container').first());
                    const location = primaryDesc ? primaryDesc.split('·')[0].trim() : '';
                    const dateMatch = primaryDesc ? primaryDesc.match(/(\d+\s+\w+\s+ago)/) : null;
                    const datePosted = dateMatch ? dateMatch[1] : '';

                    // See more
                    const seeMore = page.locator('button.jobs-description__footer-button');
                    if (await seeMore.isVisible()) {
                        await seeMore.click().catch(() => { });
                    }
                    await page.waitForTimeout(500);

                    // Description
                    let description = await extractField(page.locator('#job-details, article.jobs-description__container').first());
                    if (!description) {
                        description = await extractField(page.locator('.jobs-description-content__text').first());
                    }

                    // Salary
                    const salary = await extractField(page.locator('.job-details-jobs-unified-top-card__job-insight:has-text("yr"), .job-details-jobs-unified-top-card__job-insight:has-text("mo"), .job-details-jobs-unified-top-card__job-insight:has-text("$")').first());

                    // Easy Apply
                    const easyApplyBtn = await page.locator('.jobs-apply-button--top-card button').first().textContent({ timeout: 1000 }).catch(() => '');
                    const easyApply = easyApplyBtn.includes('Easy Apply') ? 'Yes' : 'No';

                    // URL
                    const url = await page.evaluate(() => window.location.href);

                    // HR Email & Link
                    const emailMatch = description.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
                    const email = emailMatch ? emailMatch[1] : '';

                    const hrLinkLocator = await page.locator('.hirer-card__hirer-information a').first().getAttribute('href').catch(() => '');
                    const hrLink = hrLinkLocator || '';

                    // writing row
                    const row = [
                        escapeCsv(title),
                        escapeCsv(company),
                        escapeCsv(location),
                        escapeCsv(description),
                        escapeCsv(salary),
                        escapeCsv(datePosted),
                        escapeCsv(easyApply),
                        escapeCsv(url),
                        escapeCsv(email),
                        escapeCsv(hrLink)
                    ].join(',');
                    fs.appendFileSync(csvFilename, row + '\n');
                    count++;
                } catch (e) {
                    console.error("Error on one job:", e.message);
                }
            }
            return count;
        };

        // Try scraping 2 pages
        for (let i = 0; i < 2; i++) {
            console.log(`Scraping page ${i + 1}...`);
            const pcount = await scrapeJobsOnPage();
            jobCount += pcount;

            const nextBtn = page.locator(`button[aria-label="Page ${i + 2}"]`);
            if (await nextBtn.isVisible()) {
                await nextBtn.click();
                await page.waitForTimeout(4000);
            } else {
                break;
            }
        }

    } catch (e) {
        console.error("Fatal error:", e);
    } finally {
        console.log(`Finished extracting ${jobCount} jobs to ${csvFilename}`);
        await browser.close();
    }
})();
