import os
import subprocess

base_dir = "/Users/kshitijrastogi/Documents/AITesterBluePrint2X/Project_03_AI_Job_Assistant/ResumeCreator/Updated_Resumes"

jobs = [
    {
        "company": "Real",
        "title": "QA Lead",
        "cover_letter": """<p>Dear Hiring Manager at Real,</p>
<p>I am excited to apply for the QA Lead position, bringing 7+ years of experience delivering software quality across web, mobile (Android & iOS), and API layers. I have a proven track record of leading QA teams, building automation frameworks with Cypress and Playwright, and integrating with CI/CD pipelines. I am highly proficient in managing test cycles using Jira/YouTrack, performing API testing via Postman/Swagger, and tracking application errors via Bugsnag. I look forward to bringing my expertise to help Real revolutionize the real estate industry.</p>
<p>Sincerely,<br>Kshitij Rastogi</p>""",
        "resume_summary": "Results-driven QA Lead with 7+ years of experience delivering quality across web, mobile (Android & iOS), and API layers. Proven track record of leading and mentoring QA engineers, building automation frameworks from scratch using Cypress and Playwright, and driving CI/CD-integrated continuous testing processes. Adept at using Jira/YouTrack, TestRail, and Bugsnag, analyzing PRDs, and ensuring seamless product releases in Agile environments.",
        "core_skills": "Automation: Cypress, Playwright, Selenium, Appium<br>API: Postman, Swagger, REST<br>Tools: Bugsnag, Jira, YouTrack, TestRail<br>Testing: Android & iOS, UI/UX, Exploratory, Regression"
    },
    {
        "company": "Uplers",
        "title": "Senior QA Automation",
        "cover_letter": """<p>Dear Hiring Manager at Uplers,</p>
<p>I am thrilled to apply for the Senior QA Automation role. With 7+ years of QA Automation experience, I bring deep expertise in test automation frameworks, CI/CD integration, and REST API validation. While my core background utilizes TypeScript and Playwright, I have robust scripting fundamentals and an extensive automation track record that translates seamlessly into Python-driven test suites. I am eager to contribute to your global data integrity client by building robust scalable test frameworks and driving continuous improvement in agile environments.</p>
<p>Sincerely,<br>Kshitij Rastogi</p>""",
        "resume_summary": "Results-driven QA Automation Engineer with 7+ years of experience delivering quality across web, mobile, and API layers. Proven track record of building complex, data-driven automation frameworks from scratch and driving CI/CD-integrated continuous testing pipelines. Exceptional background in Data validation, REST API testing, Git, and integrating massive regression suites effectively to deliver high-quality, scalable automation.",
        "core_skills": "Automation Frameworks: Playwright, Cypress, Selenium<br>Concepts: CI/CD Pipeline Integration, Data Engineering Validation<br>Tools: Git, Jenkins, GitHub Actions<br>Testing: Regression, Integration, API"
    },
    {
        "company": "NTT_DATA_North_America",
        "title": "Pod2 - Testing",
        "cover_letter": """<p>Dear Hiring Manager at NTT DATA North America,</p>
<p>I am eager to apply for the Testing Role (Pod2). With over 7 years of deep QA engineering and automation experience, I have successfully executed test strategies encompassing CI/CD pipelines, API testing, and complex data validations across diverse databases such as PostgreSQL and MongoDB. I possess strong skills in building automated testing frameworks, integrating tests into Jenkins/GitHub Actions, and analyzing extensive technical requirements for data mapping. I look forward to leveraging my robust technical and agile testing background to validate transformative data logic for your clients.</p>
<p>Sincerely,<br>Kshitij Rastogi</p>""",
        "resume_summary": "Results-driven QA Automation Engineer with 7+ years of experience in verifying complex data systems and API integrations. Proven track record of maintaining massive databases validation checks, orchestrating tests with CI/CD platforms (Azure DevOps, Jenkins), and developing advanced UI and data automation frameworks. A strong collaborator with database, IT, and agile teams to implement comprehensive quality and security coverage.",
        "core_skills": "Databases: PostgreSQL, MS-SQL, MySQL, Oracle, MongoDB<br>CI/CD & DevOps: Jenkins, GitHub Actions, Azure DevOps<br>Automation: Playwright, Cypress, Selenium<br>Data Testing: Quality dimensions, Integration, Accuracy Verification"
    },
    {
        "company": "Cognizant",
        "title": "Sample Manager LIMS (ISG)",
        "cover_letter": """<p>Dear Hiring Manager at Cognizant,</p>
<p>I am excited to submit my application for the Sample Manager LIMS role. I bring over 7 years of senior-level QA troubleshooting, defect resolution, and incident management experience, including analyzing complex technical issues and managing team resources. My background highlights extensive collaboration with globally distributed teams, coaching junior engineers, and driving process improvements to reduce resolution times. I am highly motivated to implement my structured test management and operational excellence background to deliver high-quality support for your LIMS applications.</p>
<p>Sincerely,<br>Kshitij Rastogi</p>""",
        "resume_summary": "Results-driven QA Lead & Incident troubleshooting expert with 7+ years of experience in enterprise systems analysis and quality support. Proven track record of leading and mentoring engineers, managing defect/incident lifecycles, and reducing resolution times. Experienced with root cause analysis, cross-functional onshore/offshore team collaboration, and proactive system oversight.",
        "core_skills": "Management: Incident Management, Defect Tracking, Root Cause Analysis<br>Tools: Jira, YouTrack, TestRail<br>Collaboration: Mentoring, Process Setup, Cross-functional alignment<br>Quality: Regression, Operational Excellence, Manual Testing"
    },
    {
        "company": "PwC_India",
        "title": "IN- Senior Associate_Salesforce QA_Enterprise apps SFDC _Advisory_Pan India",
        "cover_letter": """<p>Dear Hiring Manager at PwC India,</p>
<p>I am writing to apply for the Salesforce QA Senior Associate role. With 7+ years in Quality Engineering, I excel at developing comprehensive test plans, manual and automated execution, and maintaining robust defect management lifecycles. I have solid experience in integrating systems, managing requirement traceability matrices, and testing enterprise business applications to verify diverse integrations. I am excited about the opportunity to bring my analytical background to PwC's advisory division, optimizing clients' operational efficiency through high-quality test strategies and deployment validation.</p>
<p>Sincerely,<br>Kshitij Rastogi</p>""",
        "resume_summary": "Results-driven Senior QA Associate with 7+ years of experience in enterprise application testing and integrations tracking. Master of comprehensive test lifecycle modeling matching agile user stories to requirement traceability matrices. Experienced with end-to-end data validation, GUI verification, API interfaces, user acceptance, and defect lifecycle management.",
        "core_skills": "Types: Functional, GUI, Regression, Data Migration, Integration<br>Management: Requirement Traceability, Sprint Planning, Agile/Scrum<br>Tools: Jira, YouTrack, Jenkins<br>Focus: Enterprise Business Applications"
    }
]

resume_body = """
<h2>PROFESSIONAL EXPERIENCE</h2>
<p><strong>Lead SDET QA | TIU Consulting | 06/2025 – Present</strong><br>
&bull; Lead end-to-end QA practices for global enterprise clients, owning test planning, test case management, execution, and release sign-off.<br>
&bull; Design and maintain automation frameworks integrated into CI/CD pipelines for continuous testing, achieving 85%+ regression coverage.<br>
&bull; Author comprehensive functional, regression, and explorative scenarios aligned with requirements.<br>
&bull; Conduct API testing using Postman and Swagger to validate service contracts and integration schemas.<br>
&bull; Lead and mentor teams of QA engineers, establishing robust technical testing standards.</p>

<p><strong>Senior Quality Engineer | Everest Engineering | 10/2022 – 06/2025</strong><br>
&bull; Actively contributed from Planning to UAT, adhering to Agile/Scrum test methodologies including defect monitoring and regression testing in Jira.<br>
&bull; Set up UI automation frameworks from scratch; established GitHub repositories and Jenkins pipelines for continuous testing.<br>
&bull; Performed External Database Validation Testing ensuring data consistency across complex platforms and legacy databases.<br>
&bull; Implemented contract testing confirming API integration reliability across vast microservices ecosystems.</p>

<p><strong>Senior Quality Engineer | Intelliswift Software | 05/2021 – 10/2022</strong><br>
&bull; Validated GraphQL and REST microservices using automated suites; monitored server logs and operational tools.<br>
&bull; Performed complex data verification on disparate data pipelines.</p>

<p><strong>Quality Engineer & App Automation QA | 04/2018 – 04/2021</strong><br>
&bull; Orchestrated REST microservice validation; enabled GDPR compliance security sweeps.<br>
&bull; Mastered hybrid testing structures spanning Mainframe to modern cloud integration systems.</p>

<h2>EDUCATION</h2>
<p><strong>B.Tech — Electronics & Telecommunication</strong><br>
Kalinga Institute of Industrial Technology (KIIT), Odisha | Graduated 2018</p>
"""

os.makedirs(base_dir, exist_ok=True)

for job in jobs:
    comp_dir = os.path.join(base_dir, job['company'])
    os.makedirs(comp_dir, exist_ok=True)

    # CREATE RESUME
    html_resume_content = f"""
    <html><body>
    <h1>KSHITIJ RASTOGI</h1>
    <p>India | +91 82608 22489 | kshitijrastogi1996@gmail.com<br>
    Open to: Remote — India | Shift: 2 PM – 11 PM IST</p>
    <h2>PROFESSIONAL SUMMARY</h2>
    <p>{job['resume_summary']}</p>
    <h2>CORE SKILLS</h2>
    <p>{job['core_skills']}</p>
    {resume_body}
    </body></html>
    """
    html_resume_path = f"/tmp/{job['company']}_Resume.html"
    with open(html_resume_path, "w") as f:
        f.write(html_resume_content)
    
    docx_resume_filename = f"Kshitij_Rastogi_{job['company']}_Resume.docx"
    docx_resume_path = os.path.join(comp_dir, docx_resume_filename)
    subprocess.check_call(["textutil", "-convert", "docx", html_resume_path, "-output", docx_resume_path])
    
    # CREATE COVER LETTER
    html_cl_content = f"""
    <html><body>
    <h1>Cover Letter</h1>
    <br>
    {job['cover_letter']}
    </body></html>
    """
    html_cl_path = f"/tmp/{job['company']}_Cover_Letter.html"
    with open(html_cl_path, "w") as f:
        f.write(html_cl_content)
        
    docx_cl_filename = f"Kshitij_Rastogi_{job['company']}_Cover_Letter.docx"
    docx_cl_path = os.path.join(comp_dir, docx_cl_filename)
    subprocess.check_call(["textutil", "-convert", "docx", html_cl_path, "-output", docx_cl_path])

    print(f"Created Resume and Cover Letter for {job['company']}")
