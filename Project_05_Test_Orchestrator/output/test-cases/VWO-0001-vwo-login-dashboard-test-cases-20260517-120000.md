# Enterprise Test Cases: VWO Login Dashboard

---

## Document Header

| Field | Value |
|-------|-------|
| **JIRA Story ID** | VWO-0001 |
| **Story Title** | VWO Login Dashboard |
| **Test Plan Reference** | `output/test-plan/VWO-0001-vwo-login-dashboard-20260517120000.md` |
| **Author** | TestGen Orchestrator |
| **Generated** | 2026-05-17 12:00:00 UTC |
| **Total Test Cases** | 36 |
| **Modules Covered** | 9 |

---

## Test Case Summary Table

| Module | Positive | Negative | Edge | E2E | A11y | Perf | Security | Total | Automation |
|--------|----------|----------|------|-----|------|------|----------|-------|------------|
| 1 — Primary Authentication | 3 | 3 | 1 | 1 | — | — | — | 8 | 7 |
| 2 — Input Validation | 2 | 3 | 1 | — | — | — | — | 6 | 5 |
| 3 — Password Management | 2 | 2 | 1 | 1 | — | — | — | 6 | 5 |
| 4 — Multi-Factor Auth (2FA) | 1 | 2 | 1 | — | — | — | — | 4 | 3 |
| 5 — Enterprise SSO | 1 | 2 | 1 | — | — | — | — | 4 | 3 |
| 6 — Accessibility | — | — | — | — | 3 | — | — | 3 | 2 |
| 7 — UI / UX | 2 | 1 | — | — | — | — | — | 3 | 2 |
| 8 — Security & Compliance | — | — | — | — | — | — | 4 | 4 | 3 |
| 9 — Performance | — | — | — | — | — | 2 | — | 2 | 2 |
| **TOTAL** | **11** | **13** | **5** | **2** | **3** | **2** | **4** | **36** | **32** |

### Priority Breakdown

| Priority | Count | % of Total |
|----------|-------|------------|
| Critical | 10 | 28% |
| High | 16 | 44% |
| Medium | 8 | 22% |
| Low | 2 | 6% |

---

## Module 1 — Primary Authentication
*Priority: Critical | Weightage: 25% | Test Plan §4 Module 1*
*Traceability: AC-1, AC-2, AC-8, AC-12, AC-13, AC-18*

---

### TC-VWO-0001-AUTH-001 — Valid credentials redirect to dashboard

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-AUTH-001 |
| **Title** | Valid credentials redirect to dashboard |
| **Module / Feature** | Primary Authentication |
| **Test Type** | Functional — Positive |
| **Priority** | Critical |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 1 — AC-1: Primary Authentication |

**Pre-conditions**
- Staging environment accessible at base URL
- Test account provisioned with known valid email and password
- User is logged out (no active session)

**Test Data**
| Variable | Value |
|----------|-------|
| Email | `testuser@vwotest.com` |
| Password | `ValidPass@123` |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page base URL | Login page loads within 2 seconds; email field has auto-focus |
| 2 | Observe initial page state | Email input is focused; no error messages visible; page title is "VWO Login" |
| 3 | Enter `testuser@vwotest.com` in email field | Email field displays the entered value |
| 4 | Enter `ValidPass@123` in password field | Password field shows masked characters |
| 5 | Click "Log In" button | Loading indicator appears immediately |
| 6 | Wait for authentication response | User is redirected to VWO dashboard; URL no longer contains `/login` |

**Overall Expected Result**
User is authenticated and redirected to the VWO dashboard. Login success is recorded in analytics.

**Actual Result** *(filled during execution)*
`—`

**Pass / Fail** *(filled during execution)*
`—`

**Notes / Remarks**
This is the golden path test — must pass before any other auth tests are executed. Verify redirect URL matches expected dashboard path.

---

### TC-VWO-0001-AUTH-002 — Invalid password shows error message

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-AUTH-002 |
| **Title** | Invalid password shows error message |
| **Module / Feature** | Primary Authentication |
| **Test Type** | Functional — Negative |
| **Priority** | Critical |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 1 — AC-8: Error Handling |

**Pre-conditions**
- User is logged out
- Test account `testuser@vwotest.com` exists in staging

**Test Data**
| Variable | Value |
|----------|-------|
| Email | `testuser@vwotest.com` |
| Password | `WrongPassword99` |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads; email field focused |
| 2 | Enter `testuser@vwotest.com` in email field | Field displays entered value |
| 3 | Enter `WrongPassword99` in password field | Field shows masked characters |
| 4 | Click "Log In" button | Loading indicator appears |
| 5 | Wait for authentication response | Error message is displayed on the page |
| 6 | Read error message text | Error reads: "Invalid email or password" (or equivalent non-verbose message) |
| 7 | Verify user remains on login page | URL still contains `/login`; user is not redirected |

**Overall Expected Result**
Error message is visible, specific, and actionable. User is not redirected. Email field is cleared or retains value (password field is cleared for security).

**Actual Result** `—`
**Pass / Fail** `—`

**Notes / Remarks**
Error message must NOT reveal whether the email exists (security — prevents email enumeration). Check that the error copy is identical for wrong-email and wrong-password scenarios.

---

### TC-VWO-0001-AUTH-003 — Non-existent email shows error message

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-AUTH-003 |
| **Title** | Non-existent email shows error message |
| **Module / Feature** | Primary Authentication |
| **Test Type** | Functional — Negative |
| **Priority** | Critical |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 1 — AC-1, AC-8 |

**Pre-conditions**
- Email `nonexistent-99999@vwotest.com` does not exist in the system

**Test Data**
| Variable | Value |
|----------|-------|
| Email | `nonexistent-99999@vwotest.com` |
| Password | `AnyPass@123` |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Enter non-existent email | Field accepts input |
| 3 | Enter any password | Field accepts input |
| 4 | Click "Log In" | Authentication attempted |
| 5 | Observe error message | Error message appears; identical copy to TC-AUTH-002 ("Invalid email or password") |
| 6 | Confirm user is not redirected | URL remains on login page |

**Overall Expected Result**
Error message is shown and identical to wrong-password message — no email enumeration possible.

**Actual Result** `—`
**Pass / Fail** `—`
**Notes** Error copy must be identical to TC-AUTH-002 per security requirement.

---

### TC-VWO-0001-AUTH-004 — Empty form submission shows field errors

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-AUTH-004 |
| **Title** | Empty form submission shows field errors |
| **Module / Feature** | Primary Authentication |
| **Test Type** | Functional — Negative |
| **Priority** | High |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 1 — AC-8: Error Handling |

**Pre-conditions**
- User is on login page; both fields are empty

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Both fields are empty |
| 2 | Click "Log In" without entering any data | Form does not submit |
| 3 | Observe email field | Error indicator visible: "Email is required" or equivalent |
| 4 | Observe password field | Error indicator visible: "Password is required" or equivalent |
| 5 | Verify no network request is made | No auth API call; validation is client-side |

**Overall Expected Result**
Both required fields show inline error states. Form submission is blocked. No API call is made.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-AUTH-005 — Loading state visible during authentication

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-AUTH-005 |
| **Title** | Loading state visible during authentication |
| **Module / Feature** | Primary Authentication |
| **Test Type** | Functional — Positive |
| **Priority** | Medium |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 1 — AC-13: Loading States |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Enter valid credentials | Both fields filled |
| 3 | Click "Log In" | Loading indicator (spinner or progress bar) appears immediately — before redirect |
| 4 | Observe button state | "Log In" button is disabled during processing to prevent double-submission |
| 5 | Wait for redirect | Loading indicator disappears upon redirect |

**Overall Expected Result**
Loading indicator is visible between button click and redirect. Button is disabled during processing.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-AUTH-006 — Auto-focus on email field on page load

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-AUTH-006 |
| **Title** | Auto-focus on email field on page load |
| **Module / Feature** | Primary Authentication |
| **Test Type** | Functional — Positive |
| **Priority** | Medium |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 1 — AC-12: Auto-focus |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page finishes loading |
| 2 | Observe focus state without clicking | Email input field has focus (cursor visible inside field) |
| 3 | Begin typing immediately without clicking | Characters appear in email field |

**Overall Expected Result**
Email field is focused on page load — user can start typing without clicking.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-AUTH-007 — Remember Me persists session across browser restart

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-AUTH-007 |
| **Title** | Remember Me persists session across browser restart |
| **Module / Feature** | Primary Authentication |
| **Test Type** | Functional — Positive |
| **Priority** | High |
| **Automation Candidate** | Partial |
| **Traceability** | Test Plan §4 Module 1 — AC-18: Remember Me |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Check the "Remember Me" checkbox | Checkbox shows checked state |
| 3 | Enter valid credentials and log in | User redirected to dashboard |
| 4 | Close and reopen the browser (same profile) | Browser reopens |
| 5 | Navigate to login page URL | User is automatically redirected to dashboard (session persisted) |

**Overall Expected Result**
With "Remember Me" checked, session persists across browser restart.

**Actual Result** `—`
**Pass / Fail** `—`
**Notes** Partial automation — browser restart requires OS-level tooling. Verify session cookie has `Max-Age` or `Expires` set (not session-only) when Remember Me is checked.

---

### TC-VWO-0001-AUTH-008 — Full login E2E: land on dashboard with correct user context

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-AUTH-008 |
| **Title** | Full login E2E: land on dashboard with correct user context |
| **Module / Feature** | Primary Authentication |
| **Test Type** | End-to-End |
| **Priority** | Critical |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 1 — AC-1: Primary Authentication; AC-2: Session Management |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Enter valid credentials | Fields filled |
| 3 | Click "Log In" | Authentication starts |
| 4 | Wait for dashboard | Redirected to VWO main dashboard |
| 5 | Verify user identity on dashboard | User's name or email visible in dashboard header/profile |
| 6 | Verify session is active | Navigating away and back retains logged-in state |
| 7 | Inspect session cookie | Cookie has HttpOnly=true, Secure=true, SameSite=Strict |

**Overall Expected Result**
User reaches dashboard, identity is correct, session cookie has all required security attributes.

**Actual Result** `—`
**Pass / Fail** `—`

---

## Module 2 — Input Validation
*Priority: High | Weightage: 15% | Test Plan §4 Module 2*
*Traceability: AC-5, AC-6, AC-7, AC-8*

---

### TC-VWO-0001-VAL-001 — Invalid email format shows blur error

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-VAL-001 |
| **Title** | Invalid email format shows blur error |
| **Module / Feature** | Input Validation |
| **Test Type** | Functional — Negative |
| **Priority** | High |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 2 — AC-6: Email Format Verification |

**Test Data**
| Variable | Value |
|----------|-------|
| Invalid emails | `notanemail`, `user@`, `@domain.com`, `user@domain`, `user space@domain.com` |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Click into email field | Field is focused |
| 3 | Type `notanemail` | Characters appear in field |
| 4 | Press Tab (blur the email field) | Inline error appears: "Enter a valid email address" or equivalent |
| 5 | Clear field; enter `user@`; Tab out | Error appears |
| 6 | Clear field; enter `@domain.com`; Tab out | Error appears |

**Overall Expected Result**
Each invalid email format triggers an inline error immediately on blur — before form submission.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-VAL-002 — Valid email format clears validation error

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-VAL-002 |
| **Title** | Valid email format clears validation error |
| **Module / Feature** | Input Validation |
| **Test Type** | Functional — Positive |
| **Priority** | Medium |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 2 — AC-5: Real-time Validation |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Enter `notanemail`; Tab out | Error message appears |
| 3 | Click back into email field | Field is focused |
| 4 | Clear and type `valid@example.com`; Tab out | Error message disappears immediately |

**Overall Expected Result**
Error clears as soon as valid format is entered and field loses focus — real-time feedback.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-VAL-003 — Password strength indicator updates in real-time

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-VAL-003 |
| **Title** | Password strength indicator updates in real-time |
| **Module / Feature** | Input Validation |
| **Test Type** | Functional — Positive |
| **Priority** | Medium |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 2 — AC-7: Password Strength Indicators |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Click into password field | Field is focused |
| 3 | Type `abc` | Strength indicator shows "Weak" state |
| 4 | Continue typing to `abc12345` | Indicator updates to "Medium" state |
| 5 | Continue to `Abc@12345!` | Indicator updates to "Strong" state |

**Overall Expected Result**
Password strength indicator is visible and updates dynamically as user types.

**Actual Result** `—`
**Pass / Fail** `—`
**Notes** Strength levels (Weak/Medium/Strong) and thresholds must match PRD specs. If strength indicator is not in the login page design (only on registration), mark N/A and note it.

---

### TC-VWO-0001-VAL-004 — Password field with only spaces rejected

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-VAL-004 |
| **Title** | Password field with only spaces rejected |
| **Module / Feature** | Input Validation |
| **Test Type** | Edge Case |
| **Priority** | High |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 2 — AC-8: Error Handling |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Enter valid email | Field filled |
| 3 | Enter 5 spaces in password field | Spaces entered (field may show blank) |
| 4 | Click "Log In" | Form is either rejected client-side (validation error) or returns auth error |
| 5 | Verify error is shown | Error message visible; user not authenticated |

**Overall Expected Result**
Whitespace-only password does not result in authentication; appropriate error is shown.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-VAL-005 — XSS payload in email field is sanitized

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-VAL-005 |
| **Title** | XSS payload in email field is sanitized |
| **Module / Feature** | Input Validation |
| **Test Type** | Functional — Negative / Security |
| **Priority** | Critical |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 2 — AC-8; Test Plan §8 Security |

**Test Data**
| Variable | Value |
|----------|-------|
| Email | `"><script>alert(1)</script>` |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Paste XSS payload into email field | Field accepts input as text |
| 3 | Click "Log In" | Form submission attempted |
| 4 | Observe page | No alert dialog appears; script is not executed |
| 5 | Check error message rendering | Error message (if any) renders payload as escaped text, not HTML |

**Overall Expected Result**
XSS payload is not executed. Input is treated as plain text throughout.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-VAL-006 — SQL injection payload in password field is rejected safely

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-VAL-006 |
| **Title** | SQL injection payload in password field is rejected safely |
| **Module / Feature** | Input Validation |
| **Test Type** | Functional — Negative / Security |
| **Priority** | Critical |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 2 — AC-8; Test Plan §8 Security |

**Test Data**
| Variable | Value |
|----------|-------|
| Password | `' OR '1'='1` |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Enter valid email | Field filled |
| 3 | Enter SQL injection payload in password field | Field accepts input |
| 4 | Click "Log In" | Authentication attempted |
| 5 | Verify response | Authentication fails with standard error; no 500 error; no data returned |

**Overall Expected Result**
SQL injection payload does not bypass authentication. Server returns standard auth error.

**Actual Result** `—`
**Pass / Fail** `—`

---

## Module 3 — Password Management
*Priority: High | Weightage: 15% | Test Plan §4 Module 3*
*Traceability: AC-9, AC-10*

---

### TC-VWO-0001-PWD-001 — Forgot password link is visible and functional

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-PWD-001 |
| **Title** | Forgot password link is visible and functional |
| **Module / Feature** | Password Management |
| **Test Type** | Functional — Positive |
| **Priority** | High |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 3 — AC-9: Forgot Password Flow |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Locate "Forgot password?" link | Link is visible on the page |
| 3 | Click "Forgot password?" link | User is navigated to password reset page or a modal appears |
| 4 | Verify reset page/modal has email input | Email input field is present |

**Overall Expected Result**
"Forgot password" link is visible and navigates to reset flow.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-PWD-002 — Password reset email sent for valid account

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-PWD-002 |
| **Title** | Password reset email sent for valid account |
| **Module / Feature** | Password Management |
| **Test Type** | Functional — Positive |
| **Priority** | High |
| **Automation Candidate** | Partial |
| **Traceability** | Test Plan §4 Module 3 — AC-9: Forgot Password Flow |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to forgot password page | Reset form is visible |
| 2 | Enter `testuser@vwotest.com` | Email field filled |
| 3 | Click "Send Reset Link" | Confirmation message shown: "If this email is registered, you'll receive a reset link" |
| 4 | Check test email inbox | Reset email received within 2 minutes |
| 5 | Click reset link in email | Reset form opens with valid token |
| 6 | Enter new password and confirm | Password updated successfully |
| 7 | Log in with new password | Authentication succeeds |

**Overall Expected Result**
Full reset flow completes end-to-end. User can log in with new password.

**Actual Result** `—`
**Pass / Fail** `—`
**Notes** Email delivery testing requires a test inbox (Mailosaur, Mailtrap, etc.).

---

### TC-VWO-0001-PWD-003 — Password reset with non-existent email shows safe message

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-PWD-003 |
| **Title** | Password reset with non-existent email shows safe message |
| **Module / Feature** | Password Management |
| **Test Type** | Functional — Negative |
| **Priority** | High |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 3 — AC-9 — security: no email enumeration |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to forgot password page | Reset form visible |
| 2 | Enter `nonexistent-99999@vwotest.com` | Field filled |
| 3 | Click "Send Reset Link" | Same confirmation message as TC-PWD-002 |
| 4 | Verify message is identical | Message: "If this email is registered, you'll receive a reset link" |

**Overall Expected Result**
System does not reveal whether the email is registered. Same message for both valid and invalid emails.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-PWD-004 — Expired reset token is rejected

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-PWD-004 |
| **Title** | Expired reset token is rejected |
| **Module / Feature** | Password Management |
| **Test Type** | Functional — Negative |
| **Priority** | High |
| **Automation Candidate** | Partial |
| **Traceability** | Test Plan §4 Module 3 — AC-9: Secure token generation |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Request a reset link for `testuser@vwotest.com` | Reset email received |
| 2 | Wait for token to expire (per system token TTL) | Expiry window passes |
| 3 | Click the expired reset link | Reset form attempts to load |
| 4 | Observe system response | Error message: "This link has expired" or equivalent; new reset is offered |

**Overall Expected Result**
Expired token is rejected with clear message. System does not allow password change via expired token.

**Actual Result** `—`
**Pass / Fail** `—`
**Notes** Coordinate with engineering for token TTL value (e.g., 1 hour, 24 hours).

---

### TC-VWO-0001-PWD-005 — Weak password rejected during reset

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-PWD-005 |
| **Title** | Weak password rejected during reset |
| **Module / Feature** | Password Management |
| **Test Type** | Edge Case |
| **Priority** | Medium |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 3 — AC-10: Password Requirements |

**Test Data**
| Variable | Value |
|----------|-------|
| Weak passwords | `abc`, `123456`, `password`, `aaaaaaaa` |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Access password reset form with valid token | Reset form visible |
| 2 | Enter `abc` as new password | Field accepts input |
| 3 | Click "Reset Password" | Error: password too short / does not meet requirements |
| 4 | Enter `123456` | Same error |
| 5 | Enter `password` | Same error |

**Overall Expected Result**
Each weak password is rejected with specific feedback on requirements not met.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-PWD-006 — Full forgot-password E2E: reset and login

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-PWD-006 |
| **Title** | Full forgot-password E2E: reset and login with new password |
| **Module / Feature** | Password Management |
| **Test Type** | End-to-End |
| **Priority** | Critical |
| **Automation Candidate** | Partial |
| **Traceability** | Test Plan §4 Module 3 — AC-9, AC-10 |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Click "Forgot password?" | Reset form opens |
| 3 | Submit email for test account | Confirmation message shown |
| 4 | Open reset email; click link | Reset form with token opens |
| 5 | Enter strong new password meeting all requirements | Accepted |
| 6 | Submit reset form | Success: "Password updated successfully" message |
| 7 | Navigate to login page | Login page loads |
| 8 | Log in with old password | Login fails with standard error |
| 9 | Log in with new password | Login succeeds; user reaches dashboard |

**Overall Expected Result**
Old password no longer works after reset. New password enables successful login.

**Actual Result** `—`
**Pass / Fail** `—`

---

## Module 4 — Multi-Factor Authentication (2FA)
*Priority: High | Weightage: 10% | Test Plan §4 Module 4*
*Traceability: AC-3*

---

### TC-VWO-0001-2FA-001 — Valid TOTP code completes 2FA login

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-2FA-001 |
| **Title** | Valid TOTP code completes 2FA login |
| **Module / Feature** | Multi-Factor Authentication |
| **Test Type** | Functional — Positive |
| **Priority** | High |
| **Automation Candidate** | Partial |
| **Traceability** | Test Plan §4 Module 4 — AC-3: 2FA |

**Test Data**
| Variable | Value |
|----------|-------|
| Account | 2FA-enabled test account |
| TOTP code | Valid current code from authenticator app |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login with valid credentials for 2FA-enabled account | 2FA prompt appears |
| 2 | Open authenticator app | Current TOTP code visible |
| 3 | Enter current TOTP code | Code field filled |
| 4 | Click "Verify" | Authentication completes |
| 5 | Verify redirect | User reaches VWO dashboard |

**Overall Expected Result**
Valid TOTP code completes authentication flow.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-2FA-002 — Invalid TOTP code is rejected with error

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-2FA-002 |
| **Title** | Invalid TOTP code is rejected with error |
| **Module / Feature** | Multi-Factor Authentication |
| **Test Type** | Functional — Negative |
| **Priority** | High |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 4 — AC-3: 2FA |

**Test Data**
| Variable | Value |
|----------|-------|
| TOTP code | `000000` (invalid) |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login with valid credentials for 2FA-enabled account | 2FA prompt appears |
| 2 | Enter `000000` as TOTP code | Field filled |
| 3 | Click "Verify" | Error message: "Invalid verification code" or equivalent |
| 4 | Verify user is not authenticated | 2FA prompt remains; user not redirected |

**Overall Expected Result**
Invalid TOTP code is rejected. User remains on 2FA verification screen.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-2FA-003 — 2FA code expires and new code required

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-2FA-003 |
| **Title** | 2FA code expires and new code is required |
| **Module / Feature** | Multi-Factor Authentication |
| **Test Type** | Functional — Negative |
| **Priority** | Medium |
| **Automation Candidate** | Partial |
| **Traceability** | Test Plan §4 Module 4 — AC-3: 2FA |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login with valid credentials for 2FA account | 2FA prompt appears |
| 2 | Note the current TOTP code | Code recorded |
| 3 | Wait for code to expire (TOTP cycle = 30s) | New code generated in authenticator |
| 4 | Enter the old (expired) code | Error: "Code expired" or "Invalid code" |
| 5 | Enter the new valid code | Authentication succeeds |

**Overall Expected Result**
Expired TOTP code is rejected. New code within current window is accepted.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-2FA-004 — Non-2FA account does not prompt for 2FA

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-2FA-004 |
| **Title** | Non-2FA account does not prompt for 2FA |
| **Module / Feature** | Multi-Factor Authentication |
| **Test Type** | Edge Case |
| **Priority** | Medium |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 4 — AC-3: 2FA optional |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login with valid credentials for non-2FA account | Authentication progresses |
| 2 | Observe after credential submission | No 2FA prompt appears |
| 3 | Verify redirect | User reaches dashboard directly |

**Overall Expected Result**
2FA prompt does not appear for accounts without 2FA enabled. Login completes in one step.

**Actual Result** `—`
**Pass / Fail** `—`

---

## Module 5 — Enterprise SSO
*Priority: High | Weightage: 10% | Test Plan §4 Module 5*
*Traceability: AC-4*

---

### TC-VWO-0001-SSO-001 — SSO login redirects to IdP and returns authenticated

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-SSO-001 |
| **Title** | SSO login redirects to IdP and returns authenticated |
| **Module / Feature** | Enterprise SSO |
| **Test Type** | Functional — Positive |
| **Priority** | High |
| **Automation Candidate** | Partial |
| **Traceability** | Test Plan §4 Module 5 — AC-4: SSO |

**Pre-conditions**
- SAML test IdP configured in staging
- Test SSO account provisioned

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Click "Log in with SSO" or enter SSO-domain email | SSO flow initiates |
| 3 | Observe redirect | User redirected to configured IdP login page |
| 4 | Complete IdP authentication | IdP authenticates user |
| 5 | Observe callback | User redirected back to VWO |
| 6 | Verify authentication | User is logged in; reaches VWO dashboard |

**Overall Expected Result**
Full SAML/OAuth SSO round-trip completes. User reaches VWO dashboard authenticated.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-SSO-002 — SSO failure at IdP shows error

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-SSO-002 |
| **Title** | SSO failure at IdP shows error in VWO |
| **Module / Feature** | Enterprise SSO |
| **Test Type** | Functional — Negative |
| **Priority** | High |
| **Automation Candidate** | Partial |
| **Traceability** | Test Plan §4 Module 5 — AC-4: SSO |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Initiate SSO login | Redirect to IdP |
| 2 | Fail authentication at IdP (wrong credentials) | IdP shows error; redirects back to VWO with error |
| 3 | Observe VWO response | Error message: "SSO authentication failed. Please try again or contact your administrator." |
| 4 | Verify user is not authenticated | Login page shown; user not on dashboard |

**Overall Expected Result**
IdP auth failure surfaces as a clear, actionable error in VWO. User is not authenticated.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-SSO-003 — SSO-only account cannot log in via email/password

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-SSO-003 |
| **Title** | SSO-only account cannot log in via email/password |
| **Module / Feature** | Enterprise SSO |
| **Test Type** | Functional — Negative |
| **Priority** | High |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 5 — AC-4: SSO |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Enter SSO-only account email and any password | Fields filled |
| 3 | Click "Log In" | Auth attempt made |
| 4 | Observe error | Error: "This account uses SSO. Please log in via your organization's identity provider." or equivalent |

**Overall Expected Result**
SSO-only accounts cannot bypass SSO via email/password. Informative error message directs to SSO flow.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-SSO-004 — Domain-based automatic SSO routing

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-SSO-004 |
| **Title** | Domain-based automatic SSO routing |
| **Module / Feature** | Enterprise SSO |
| **Test Type** | Edge Case |
| **Priority** | Medium |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 5 — AC-4: SSO |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Enter email with SSO-configured domain (e.g., `user@ssocompany.com`) | Field filled |
| 3 | Click out of field or press Tab | SSO prompt or automatic redirect initiates |
| 4 | Observe behaviour | System detects SSO domain; routes to SSO flow without requiring password entry |

**Overall Expected Result**
Email domain triggers automatic SSO routing. User is directed to IdP without needing to fill password field.

**Actual Result** `—`
**Pass / Fail** `—`

---

## Module 6 — Accessibility
*Priority: High | Weightage: 10% | Test Plan §4 Module 6*
*Traceability: AC-14, AC-15, AC-16*

---

### TC-VWO-0001-A11Y-001 — Keyboard-only login flow completes successfully

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-A11Y-001 |
| **Title** | Keyboard-only login flow completes successfully |
| **Module / Feature** | Accessibility |
| **Test Type** | Accessibility |
| **Priority** | High |
| **Automation Candidate** | Partial |
| **Traceability** | Test Plan §4 Module 6 — AC-16: Keyboard Navigation |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page using keyboard (address bar → Enter) | Page loads; email field has focus |
| 2 | Type valid email | Email entered |
| 3 | Press Tab | Focus moves to password field |
| 4 | Type valid password | Password entered |
| 5 | Press Tab | Focus moves to "Remember Me" checkbox |
| 6 | Press Tab | Focus moves to "Log In" button |
| 7 | Press Enter | Login form submitted |
| 8 | Verify navigation | User reaches dashboard |

**Overall Expected Result**
Full login flow completes using keyboard only. No mouse interaction required at any step.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-A11Y-002 — Error messages are announced by screen reader

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-A11Y-002 |
| **Title** | Error messages are announced by screen reader |
| **Module / Feature** | Accessibility |
| **Test Type** | Accessibility |
| **Priority** | High |
| **Automation Candidate** | Partial |
| **Traceability** | Test Plan §4 Module 6 — AC-14: Screen Reader Support |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Enable screen reader (VoiceOver/NVDA) | Screen reader active |
| 2 | Navigate to login page | Page title announced |
| 3 | Submit empty form | Error messages appear |
| 4 | Listen to screen reader output | Error messages are announced immediately via `aria-live` region |

**Overall Expected Result**
Screen reader announces form errors without user needing to navigate to the error element.

**Actual Result** `—`
**Pass / Fail** `—`
**Notes** Verify `role="alert"` or `aria-live="assertive"` on error container.

---

### TC-VWO-0001-A11Y-003 — axe-core reports zero critical accessibility violations

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-A11Y-003 |
| **Title** | axe-core reports zero critical accessibility violations |
| **Module / Feature** | Accessibility |
| **Test Type** | Accessibility |
| **Priority** | High |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 6 — AC-14, AC-15, AC-16 — WCAG 2.1 AA |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Run axe-core analysis on the page | axe runs against full page DOM |
| 3 | Review violations report | Zero Critical violations |
| 4 | Review Serious violations | Zero Serious violations related to form controls and labeling |

**Overall Expected Result**
Login page passes WCAG 2.1 AA automated checks with zero Critical/Serious violations.

**Actual Result** `—`
**Pass / Fail** `—`

---

## Module 7 — UI / UX
*Priority: Medium | Weightage: 5% | Test Plan §4 Module 7*
*Traceability: AC-11, AC-12, AC-17, AC-18, AC-19*

---

### TC-VWO-0001-UX-001 — Dark mode toggle applies and persists

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-UX-001 |
| **Title** | Dark mode toggle applies and persists |
| **Module / Feature** | UI / UX |
| **Test Type** | Functional — Positive |
| **Priority** | Medium |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 7 — AC-17: Light and Dark Mode |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads in default (Light) mode |
| 2 | Locate Dark mode toggle | Toggle button visible on page |
| 3 | Click Dark mode toggle | Page re-renders in Dark theme immediately |
| 4 | Reload the page | Dark mode is still active (preference persisted) |

**Overall Expected Result**
Dark mode toggle works immediately and preference is persisted across page loads.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-UX-002 — Login page is responsive at 320px mobile width

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-UX-002 |
| **Title** | Login page is responsive at 320px mobile width |
| **Module / Feature** | UI / UX |
| **Test Type** | Functional — Positive |
| **Priority** | High |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 7 — AC-11: Responsive Design |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open login page in browser | Page loads |
| 2 | Resize viewport to 320×568px | Layout reflows |
| 3 | Inspect form fields | Email and password fields are full-width; no horizontal scrollbar |
| 4 | Inspect "Log In" button | Button is full-width and touch-friendly (min 44px height) |
| 5 | Inspect all text | No text is clipped or overflows its container |

**Overall Expected Result**
Login page is fully functional and visually correct at 320px width.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-UX-003 — Free trial CTA is visible for unauthenticated users

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-UX-003 |
| **Title** | Free trial CTA is visible and links correctly for unauthenticated users |
| **Module / Feature** | UI / UX |
| **Test Type** | Functional — Negative |
| **Priority** | Low |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 7 — AC-19: Free Trial CTA |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to login page | Page loads |
| 2 | Locate free trial CTA | "Start free trial" or equivalent link/button is visible |
| 3 | Click the free trial CTA | User is navigated to VWO signup/registration page |
| 4 | Verify destination URL | URL points to VWO trial registration page |

**Overall Expected Result**
Free trial CTA is visible, clickable, and routes to the correct registration page.

**Actual Result** `—`
**Pass / Fail** `—`

---

## Module 8 — Security & Compliance
*Priority: Critical | Weightage: 5% | Test Plan §4 Module 8*
*Traceability: AC-20, AC-21, AC-22*

---

### TC-VWO-0001-SEC-001 — HTTP login URL redirects to HTTPS

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-SEC-001 |
| **Title** | HTTP login URL redirects to HTTPS |
| **Module / Feature** | Security & Compliance |
| **Test Type** | Security |
| **Priority** | Critical |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 8 — AC-20: HTTPS Enforcement |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `http://app.vwo.com/login` (HTTP) | Browser/server processes request |
| 2 | Observe redirect | Browser is redirected to `https://app.vwo.com/login` (301 or 302) |
| 3 | Verify final URL | URL scheme is `https://` |
| 4 | Verify no mixed content | No HTTP resources loaded on HTTPS page (check browser console) |

**Overall Expected Result**
All HTTP requests are redirected to HTTPS. No plaintext communication occurs.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-SEC-002 — Rate limiting triggers lockout after N failed attempts

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-SEC-002 |
| **Title** | Rate limiting triggers lockout after N failed attempts |
| **Module / Feature** | Security & Compliance |
| **Test Type** | Security |
| **Priority** | Critical |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 8 — AC-21: Rate Limiting |

**Pre-conditions**
- Confirmed N (lockout threshold) with engineering (e.g., 5 consecutive failures)

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Attempt login with wrong password N times consecutively | First N-1 attempts return standard auth error |
| 2 | Attempt login for the Nth time | Rate limit triggers; response code 429 or lockout message |
| 3 | Observe UI | Message: "Too many failed attempts. Please try again in X minutes." |
| 4 | Wait for lockout period; retry | Login permitted again after lockout expires |

**Overall Expected Result**
Rate limiter activates at the configured threshold. Lockout is temporary and clearly communicated.

**Actual Result** `—`
**Pass / Fail** `—`
**Notes** Verify threshold value (N) with engineering before running.

---

### TC-VWO-0001-SEC-003 — Session cookie has required security attributes

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-SEC-003 |
| **Title** | Session cookie has required security attributes |
| **Module / Feature** | Security & Compliance |
| **Test Type** | Security |
| **Priority** | Critical |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 8 — AC-2: Session Management; AC-20: HTTPS |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login with valid credentials | Authentication succeeds |
| 2 | Open browser DevTools → Application → Cookies | Cookie list visible |
| 3 | Locate session token cookie | Cookie present |
| 4 | Check `HttpOnly` attribute | `HttpOnly` = true |
| 5 | Check `Secure` attribute | `Secure` = true |
| 6 | Check `SameSite` attribute | `SameSite` = Strict or Lax |

**Overall Expected Result**
Session cookie has HttpOnly=true, Secure=true, SameSite=Strict/Lax.

**Actual Result** `—`
**Pass / Fail** `—`

---

### TC-VWO-0001-SEC-004 — No PII visible in error response body (GDPR)

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-SEC-004 |
| **Title** | No PII visible in auth error response body |
| **Module / Feature** | Security & Compliance |
| **Test Type** | Security |
| **Priority** | High |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 8 — AC-22: GDPR Compliance |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open browser DevTools → Network tab | Network monitoring active |
| 2 | Submit login with invalid credentials | Auth request made |
| 3 | Inspect API response body | Response does not contain email address, partial password, or user ID |
| 4 | Inspect response headers | No PII in Location, Set-Cookie, or custom headers |

**Overall Expected Result**
Failed auth response body and headers contain no PII — only a generic error code/message.

**Actual Result** `—`
**Pass / Fail** `—`

---

## Module 9 — Performance
*Priority: High | Weightage: 5% | Test Plan §4 Module 9*
*Traceability: AC-23, AC-24*

---

### TC-VWO-0001-PERF-001 — Login page loads within 2 seconds (P95)

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-PERF-001 |
| **Title** | Login page loads within 2 seconds at P95 |
| **Module / Feature** | Performance |
| **Test Type** | Performance |
| **Priority** | High |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 9 — AC-23: Page Load Time |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open browser with network throttle set to "Fast 3G" | Throttle active |
| 2 | Navigate to login page 10 times (cold cache each time) | Page loads each time |
| 3 | Record Time to Interactive (TTI) for each load | 10 measurements captured |
| 4 | Calculate P95 from measurements | P95 ≤ 2000ms |

**Overall Expected Result**
Login page P95 load time is ≤2000ms under standard connection simulation.

**Actual Result** `—`
**Pass / Fail** `—`
**Notes** Run during off-peak hours to minimize staging environment noise. Record median and P95.

---

### TC-VWO-0001-PERF-002 — Login page Time to Interactive under simulated load

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-VWO-0001-PERF-002 |
| **Title** | Login page TTI under simulated concurrent user load |
| **Module / Feature** | Performance |
| **Test Type** | Performance |
| **Priority** | Medium |
| **Automation Candidate** | Yes |
| **Traceability** | Test Plan §4 Module 9 — AC-24: 99.9% uptime / Concurrent Users |

**Test Execution Steps**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Configure k6 or Playwright for 50 concurrent users | Load scenario ready |
| 2 | Start concurrent load against login page | 50 simultaneous requests |
| 3 | Measure response times across all requests | All responses recorded |
| 4 | Calculate P95 response time under load | P95 ≤ 2000ms even under load |
| 5 | Check for 5xx errors | Zero 5xx responses |

**Overall Expected Result**
Login page remains stable and within 2s P95 under concurrent load. No server errors.

**Actual Result** `—`
**Pass / Fail** `—`

---

## Traceability Matrix

| TC-ID | Title | Module | Plan §Section | Acceptance Criterion | Priority | Auto |
|-------|-------|--------|---------------|----------------------|----------|------|
| TC-VWO-0001-AUTH-001 | Valid credentials redirect to dashboard | Auth | §4 Module 1 | AC-1 | Critical | Yes |
| TC-VWO-0001-AUTH-002 | Invalid password shows error | Auth | §4 Module 1 | AC-8 | Critical | Yes |
| TC-VWO-0001-AUTH-003 | Non-existent email shows error | Auth | §4 Module 1 | AC-1, AC-8 | Critical | Yes |
| TC-VWO-0001-AUTH-004 | Empty form submission shows field errors | Auth | §4 Module 1 | AC-8 | High | Yes |
| TC-VWO-0001-AUTH-005 | Loading state visible during auth | Auth | §4 Module 1 | AC-13 | Medium | Yes |
| TC-VWO-0001-AUTH-006 | Auto-focus on email field | Auth | §4 Module 1 | AC-12 | Medium | Yes |
| TC-VWO-0001-AUTH-007 | Remember Me persists session | Auth | §4 Module 1 | AC-18 | High | Partial |
| TC-VWO-0001-AUTH-008 | Full login E2E with session cookie check | Auth | §4 Module 1 | AC-1, AC-2 | Critical | Yes |
| TC-VWO-0001-VAL-001 | Invalid email format shows blur error | Input Validation | §4 Module 2 | AC-6 | High | Yes |
| TC-VWO-0001-VAL-002 | Valid email clears validation error | Input Validation | §4 Module 2 | AC-5 | Medium | Yes |
| TC-VWO-0001-VAL-003 | Password strength indicator updates | Input Validation | §4 Module 2 | AC-7 | Medium | Yes |
| TC-VWO-0001-VAL-004 | Whitespace-only password rejected | Input Validation | §4 Module 2 | AC-8 | High | Yes |
| TC-VWO-0001-VAL-005 | XSS payload sanitized | Input Validation | §4 Module 2 | AC-8 | Critical | Yes |
| TC-VWO-0001-VAL-006 | SQL injection payload rejected | Input Validation | §4 Module 2 | AC-8 | Critical | Yes |
| TC-VWO-0001-PWD-001 | Forgot password link visible and functional | Password Mgmt | §4 Module 3 | AC-9 | High | Yes |
| TC-VWO-0001-PWD-002 | Reset email sent for valid account | Password Mgmt | §4 Module 3 | AC-9 | High | Partial |
| TC-VWO-0001-PWD-003 | Reset with non-existent email shows safe message | Password Mgmt | §4 Module 3 | AC-9 | High | Yes |
| TC-VWO-0001-PWD-004 | Expired reset token rejected | Password Mgmt | §4 Module 3 | AC-9 | High | Partial |
| TC-VWO-0001-PWD-005 | Weak password rejected on reset | Password Mgmt | §4 Module 3 | AC-10 | Medium | Yes |
| TC-VWO-0001-PWD-006 | Full forgot-password E2E | Password Mgmt | §4 Module 3 | AC-9, AC-10 | Critical | Partial |
| TC-VWO-0001-2FA-001 | Valid TOTP code completes 2FA | 2FA | §4 Module 4 | AC-3 | High | Partial |
| TC-VWO-0001-2FA-002 | Invalid TOTP code rejected | 2FA | §4 Module 4 | AC-3 | High | Yes |
| TC-VWO-0001-2FA-003 | Expired TOTP code rejected | 2FA | §4 Module 4 | AC-3 | Medium | Partial |
| TC-VWO-0001-2FA-004 | Non-2FA account not prompted | 2FA | §4 Module 4 | AC-3 | Medium | Yes |
| TC-VWO-0001-SSO-001 | SSO login redirects to IdP and returns | SSO | §4 Module 5 | AC-4 | High | Partial |
| TC-VWO-0001-SSO-002 | SSO failure shows error | SSO | §4 Module 5 | AC-4 | High | Partial |
| TC-VWO-0001-SSO-003 | SSO-only account cannot use email/password | SSO | §4 Module 5 | AC-4 | High | Yes |
| TC-VWO-0001-SSO-004 | Domain-based SSO routing | SSO | §4 Module 5 | AC-4 | Medium | Yes |
| TC-VWO-0001-A11Y-001 | Keyboard-only login flow | Accessibility | §4 Module 6 | AC-16 | High | Partial |
| TC-VWO-0001-A11Y-002 | Screen reader announces errors | Accessibility | §4 Module 6 | AC-14 | High | Partial |
| TC-VWO-0001-A11Y-003 | axe-core zero critical violations | Accessibility | §4 Module 6 | AC-14,15,16 | High | Yes |
| TC-VWO-0001-UX-001 | Dark mode toggle applies and persists | UI/UX | §4 Module 7 | AC-17 | Medium | Yes |
| TC-VWO-0001-UX-002 | Responsive at 320px mobile | UI/UX | §4 Module 7 | AC-11 | High | Yes |
| TC-VWO-0001-UX-003 | Free trial CTA visible and functional | UI/UX | §4 Module 7 | AC-19 | Low | Yes |
| TC-VWO-0001-SEC-001 | HTTP redirects to HTTPS | Security | §4 Module 8 | AC-20 | Critical | Yes |
| TC-VWO-0001-SEC-002 | Rate limiting triggers after N failures | Security | §4 Module 8 | AC-21 | Critical | Yes |
| TC-VWO-0001-SEC-003 | Session cookie security attributes | Security | §4 Module 8 | AC-2, AC-20 | Critical | Yes |
| TC-VWO-0001-SEC-004 | No PII in error response (GDPR) | Security | §4 Module 8 | AC-22 | High | Yes |
| TC-VWO-0001-PERF-001 | Page load ≤2s at P95 | Performance | §4 Module 9 | AC-23 | High | Yes |
| TC-VWO-0001-PERF-002 | TTI under concurrent load | Performance | §4 Module 9 | AC-24 | Medium | Yes |

---

## Execution Readiness Checklist

- [x] All pre-conditions documented per test case
- [x] Test data prepared or placeholders defined
- [x] Every test case maps to a test plan section
- [x] No test case has ambiguous expected results
- [x] Automation candidates tagged (Yes / No / Partial)
- [x] Traceability matrix complete — no orphan test cases

---

*Document generated by TestGen Orchestrator — Stage 3*
*Source: VWO-0001 | Test Plan: VWO-0001-vwo-login-dashboard-20260517120000.md*
*Template: resources/enterprise_test_case_template.md*
