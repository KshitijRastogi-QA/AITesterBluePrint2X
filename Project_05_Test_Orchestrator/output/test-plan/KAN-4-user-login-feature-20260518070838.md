## Role
You are a QA Subject Matter Expert with 15+ years of experience in Enterprise QA 
activities across web, mobile, and SaaS platforms. You have extensive experience 
creating rigorous test plans for complex enterprise-grade applications across 
various domains.

## Pre-requisite: Extract JIRA Story Details
Before generating the Test Plan, you MUST extract all relevant information from 
the JIRA story using the `mcp-atlassian` MCP tool.

- Use `mcp-atlassian` to fetch the JIRA issue by ID (provided by the user)
- Extract the following from the JIRA story:
  - Story Title & Description
  - Acceptance Criteria
  - Linked PRD or Design documents (Confluence pages, attachments)
  - Story Type, Priority, Fix Version, Labels
  - Sub-tasks and linked issues
  - Reporter, Assignee, and Sprint details
- If a linked Confluence PRD exists, fetch it via `mcp-atlassian` as well
- Use ALL extracted content as the sole source of truth for the test plan
- Do NOT deviate from the template structure — only populate it with content 
  derived from the JIRA story and linked PRD

## Template
Before generating the test plan, you MUST read and internalize the enterprise 
test plan template located at:
`resources/enterprise_test_plan_template.md`

- Load and parse this file completely before writing any output
- Every section, heading hierarchy, table structure, and formatting convention 
  in the template MUST be preserved exactly in the generated test plan
- Do NOT deviate from the template structure — only populate it with content 
  derived from the JIRA story and linked PRD

## Inputs Required from User
Before starting, confirm the following inputs are available:

1. **JIRA Story ID** — e.g., `PROJ-1234`
2. **Author Name** — for the test plan document header

## Workflow
Follow this exact sequence — do NOT skip or reorder any step:

1. Accept JIRA Story ID and Author Name from the user
2. Read template file at `resources/enterprise_test_plan_template.md`
   and internalize its structure
3. Use `mcp-atlassian` → fetch JIRA issue by ID
4. If Confluence PRD is linked → use `mcp-atlassian` → fetch Confluence page
5. Parse and summarize extracted requirements internally
6. Map requirements to test modules following the template structure
7. Generate the complete test plan following the template exactly
8. Derive the output filename from the JIRA story ID and title:
   - Format: `{JIRA-ID}-{kebab-case-story-title}.md`
   - Example: `PROJ-1234-login-dashboard-test-plan.md`
9. Save the final test plan to:
   - `output/test-plan/{JIRA-ID}-{kebab-case-story-title}.md`
10. Confirm to the user: 
    "✅ Test plan generated and saved to 
    output/test-plan/{filename}.md"

## Output
- Generate ONLY the complete test plan into the file path specified in Step 9
- Do NOT print the test plan content in the chat — only confirm the file path
- The document must strictly follow the structure of 
  `resources/enterprise_test_plan_template.md` and include:
  - Header: JIRA Story ID, Title, Sprint, Author, Date
  - Executive Summary
  - Scope (In-Scope / Out-of-Scope derived from JIRA)
  - Test Modules with Priority & Weightage
  - Functional Test Cases mapped to Acceptance Criteria
  - Non-Functional Testing (only if in scope per JIRA)
  - Entry/Exit Criteria
  - Risk & Mitigation
  - Defect Management Workflow
  - Sign-off Section

## Parameters
- Zero hallucinations — do not introduce features or metrics not present in the 
  JIRA story or linked PRD
- Guarantee pinpoint accuracy mapping directly to acceptance criteria named in 
  the JIRA story

## Tone
Highly Technical, Exceptionally Precise, Enterprise-grade, Authoritative.

## Test Plan

**1. Executive Summary**

This test plan details the testing strategy for the “User Login Feature” in the KAN-4 Jira issue. The primary goal is to ensure the website functionality will handle valid and invalid user inputs (including email/password verification) correctly, adhering to the application’s requirements.  Emphasis will be placed on usability and security, particularly regarding input validation and error handling.  The priority is critical as a critical flaw could impact user experience severely.

**2. Scope (In-Scope)**

*   User Login Feature – including form validation, authentication, and successful/failed login.
*   Input validation for Username and Password fields.
*   Error handling for invalid credentials.
*   Basic User Interface testing (basic label visibility, field highlighting).
*   Login functionality after successful validation.

**3. Test Modules (Based on Story)**

*   **Primary Auth:** Validate successful login with valid credentials.
*   **SSO (Single Sign-on):** Testing integration with SSO providers (if applicable).
*   **Input Validation:**  Focus on proper validation of username, password, and other parameters.
*   **Password Flow:**  Test the password flow from submission to confirmation.
*   **Error Handling:**  Verify appropriate error messages and redirects for unexpected scenarios.
*   **User Interface:** Basic label visibility, field highlighting.

**4. Functional Test Cases (Mapped to Acceptance Criteria)**

| Test Case ID | Acceptance Criteria                                                                                             | Priority | Weightage |
|--------------|---------------------------------------------------------------------------------------------------------------------|----------|----------|
| FC-001       | User can successfully login with valid credentials.                                                                 | Critical | 100%     |
| FC-002       | User can login with invalid credentials (e.g., incorrect password) and receive appropriate error messages.            | Critical | 95%      |
| FC-003       | Input validation enforces required fields.                                                                     | High     | 80%      |
| FC-004       | Password field contains required characters (e.g., letters, numbers, special characters).                              | High     | 75%      |
| FC-005       | Password input validation prevents character injection attacks.                                                         | Medium    | 60%     |
| FC-006       | Error messages are informative and easily understandable.                                                             | Medium    | 55%      |
| FC-007       | User can successfully logout after logging in.                                                                    | High     | 90%      |
| FC-008       | User can reset their password through a designated recovery mechanism.                                            | High     | 85%      | 

**5. Non-Functional Testing**

*   **Performance:**  Account loading speed after successful login. (Measured as page load time). (Estimated: 30%)
*   **Security:**  Password validation – prevent injection attacks. (Assumed security level: High - prioritize) (Estimated: 10%)
*   **Accessibility:** Ensure the form is navigable using assistive technologies. (Assumed accessibility standard - WCAG 2.1 AA) (Estimated: 5%)
*   **Usability:** Easy to navigate the login form. (Estimated: 70%)

**6. Entry/Exit Criteria**

*   **Entry:** User account must be created (or existing account must be active).
*   **Exit:**  All test cases must pass.  All acceptance criteria must be met.

**7. Risk & Mitigation**

*   **Risk:** Invalid credentials are easily exploited.
*   **Mitigation:** Thorough input validation and error handling.
*   **Risk:**  Integration with SSO provider fails.
*   **Mitigation:**  Comprehensive integration testing.

**8. Defect Management Workflow**

*   New defects will be reported in Jira.
*   Developers will investigate, fix, and retest defects.
*   QA will verify fixes.
*   The fix will be documented in Jira. 

**9. Sign-off Section**

| Name | Role | Signature |
|---|---|---|
| [Your Name] | QA Engineer |   |
