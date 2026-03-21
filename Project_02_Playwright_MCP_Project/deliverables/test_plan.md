# Test Plan: app.vwo.com Login Feature

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Author** | QA Team |
| **Date** | 2026-03-20 |
| **Environment** | Production |
| **Browser** | Chromium, Firefox, WebKit |

---

## 1. Introduction

This test plan describes the testing approach for **app.vwo.com Login Feature**. It outlines the scope, test strategy, resources, schedule, and deliverables for the testing effort.

## 2. Objectives

- Verify core functionality works as expected
- Identify defects before production release
- Ensure user flows are complete and error-free
- Validate UI elements and navigation

## 3. Scope

### In Scope
- Verification of Email ID and Password login form.
- Input validation for Email ID and Password fields.
- "Remember me" checkbox functionality.
- "Sign in with Google" OAuth integration.
- "Sign in using SSO" feature.
- "Sign in with Passkey" feature.
- Redirection of "Forgot Password?" link.
- Redirection of "Start a FREE TRIAL" link.

### Out of Scope
- Complete end-to-end testing of features post-login (inside the VWO dashboard).
- Third-party SSO provider's internal authentication failures (beyond VWO's control).
- Testing of VWO + ABTasty joined forces promotional banner links or content (unless it interferes with login).

## 4. Test Strategy

### Test Approach
- **Automation Tool:** Playwright with @playwright/test
- **Test Type:** End-to-end functional testing
- **Browser:** Chromium, Firefox, WebKit
- **Environment:** Production

### Test Levels
- Smoke Testing (critical paths)
- Functional Testing (all features)
- Negative Testing (invalid inputs, error handling)

## 5. Test Environment

| Component | Details |
|-----------|---------|
| Application URL | https://app.vwo.com |
| Browser | Chromium, Firefox, WebKit |
| OS | Cross-platform (Node.js) |
| Framework | Playwright v1.58+ |
| Reporter | HTML + JSON |

## 6. Entry Criteria

- Application is deployed and accessible
- Test environment is configured
- Test data is available
- Test cases are reviewed and approved

## 7. Exit Criteria

- All planned test cases executed
- All critical/high priority defects resolved
- Test report generated and reviewed
- No open blockers

## 8. Test Cases Summary

1. **TC-LOGIN-001 (Positive):** Verify successful login with valid Email ID and Password.
2. **TC-LOGIN-002 (Negative):** Verify login fails with valid Email ID but incorrect Password.
3. **TC-LOGIN-003 (Negative):** Verify login fails with an unregistered Email ID.
4. **TC-LOGIN-004 (Negative):** Verify validation messages when trying to sign in with empty Email ID or Password fields.
5. **TC-LOGIN-005 (Positive):** Verify the "Remember me" checkbox correctly keeps the user session active (or stores appropriate cookies).
6. **TC-LOGIN-006 (Positive):** Verify "Forgot Password?" link redirects the user to the password recovery page.
7. **TC-LOGIN-007 (Positive):** Verify "Sign in with Google" button redirects to Google's OAuth consent screen.
8. **TC-LOGIN-008 (Positive):** Verify "Sign in using SSO" button redirects to the intended SSO login flow.
9. **TC-LOGIN-009 (Positive):** Verify "Sign in with Passkey" button initiates the WebAuthn/Passkey flow.
10. **TC-LOGIN-010 (Positive):** Verify "Start a FREE TRIAL" button redirects to the registration form.

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Application downtime | High | Use stable test environment |
| Flaky tests | Medium | Implement proper waits, no retries |
| Environment differences | Medium | Use consistent browser version |

## 10. Schedule

| Phase | Duration |
|-------|----------|
| Test Planning | 1 day |
| Test Case Design | 1 day |
| Test Execution | 1 day |
| Defect Reporting | Ongoing |
| Test Closure | 1 day |

## 11. Deliverables

- [x] Test Plan (this document)
- [ ] Test Cases Document
- [ ] Test Execution Report (HTML)
- [ ] Defect Reports (Jira tickets)
- [ ] Test Summary Report
