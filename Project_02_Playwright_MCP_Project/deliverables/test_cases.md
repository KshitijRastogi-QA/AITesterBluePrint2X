# Test Cases: app.vwo.com Login Feature

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Author** | QA Team |
| **Date** | 2026-03-20 |
| **Total Test Cases** | 5 |

---

## Test Case Format

Each test case follows this structure:

| Field | Description |
|-------|-------------|
| **TC ID** | Unique identifier (TC-001, TC-002, ...) |
| **Title** | Brief description of what is tested |
| **Preconditions** | What must be true before the test |
| **Steps** | Step-by-step instructions |
| **Expected Result** | What should happen |
| **Priority** | High / Medium / Low |
| **Category** | Smoke / Functional / Negative |
| **Spec File** | Corresponding Playwright spec file |

---

## Test Cases

### TC-LOGIN-NEG-01
| Field | Description |
|-------|-------------|
| **TC ID** | TC-LOGIN-NEG-01 |
| **Title** | Verify Login fails with Arabic characters in credentials |
| **Preconditions** | User is on the login page (https://app.vwo.com/#/login) |
| **Steps** | 1. Enter Arabic characters in Email address field (e.g., `موقع@test.com`)<br>2. Enter Arabic characters in Password field (e.g., `كلمةالمرور`)<br>3. Click on the "Sign in" button |
| **Expected Result** | Login should fail, and the error message "**Your email, password, IP address or location did not match**" should be displayed. |
| **Priority** | Medium |
| **Category** | Negative |
| **Spec File** | `login.spec.ts` |

### TC-LOGIN-NEG-02
| Field | Description |
|-------|-------------|
| **TC ID** | TC-LOGIN-NEG-02 |
| **Title** | Verify Login fails with Chinese characters in credentials |
| **Preconditions** | User is on the login page (https://app.vwo.com/#/login) |
| **Steps** | 1. Enter Chinese characters in Email address field (e.g., `测试@test.com`)<br>2. Enter Chinese characters in Password field (e.g., `密码`)<br>3. Click on the "Sign in" button |
| **Expected Result** | Login should fail, and the error message "**Your email, password, IP address or location did not match**" should be displayed. |
| **Priority** | Medium |
| **Category** | Negative |
| **Spec File** | `login.spec.ts` |

### TC-LOGIN-NEG-03
| Field | Description |
|-------|-------------|
| **TC ID** | TC-LOGIN-NEG-03 |
| **Title** | Verify Login fails with invalid registered credentials |
| **Preconditions** | User is on the login page (https://app.vwo.com/#/login) |
| **Steps** | 1. Enter a valid but unregistered Email address (e.g., `unregistered@domain.com`)<br>2. Enter any Password (e.g., `InvalidPass123!`)<br>3. Click on the "Sign in" button |
| **Expected Result** | Login should fail, and the error message "**Your email, password, IP address or location did not match**" should be displayed. |
| **Priority** | High |
| **Category** | Negative |
| **Spec File** | `login.spec.ts` |

### TC-LOGIN-NEG-04
| Field | Description |
|-------|-------------|
| **TC ID** | TC-LOGIN-NEG-04 |
| **Title** | Verify Login fails with Dummy / Non-existent domain login |
| **Preconditions** | User is on the login page (https://app.vwo.com/#/login) |
| **Steps** | 1. Enter a dummy email address (e.g., `dummy12345@dummy-test.com`)<br>2. Enter a dummy password (e.g., `dummy12345`)<br>3. Click on the "Sign in" button |
| **Expected Result** | Login should fail, and the error message "**Your email, password, IP address or location did not match**" should be displayed. |
| **Priority** | Medium |
| **Category** | Negative |
| **Spec File** | `login.spec.ts` |

### TC-LOGIN-NEG-05
| Field | Description |
|-------|-------------|
| **TC ID** | TC-LOGIN-NEG-05 |
| **Title** | Verify Login fails with empty Email and Password fields |
| **Preconditions** | User is on the login page (https://app.vwo.com/#/login) |
| **Steps** | 1. Leave the Email address field empty<br>2. Leave the Password field empty<br>3. Click on the "Sign in" button |
| **Expected Result** | Login should fail, and the error message "**Your email, password, IP address or location did not match**" should be displayed. |
| **Priority** | High |
| **Category** | Negative |
| **Spec File** | `login.spec.ts` |

---

## Summary

| Priority | Count |
|----------|-------|
| High | 2 |
| Medium | 3 |
| Low | 0 |
| **Total** | **5** |

| Category | Count |
|----------|-------|
| Smoke | 0 |
| Functional | 0 |
| Negative | 5 |
