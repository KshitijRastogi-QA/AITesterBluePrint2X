# Test Plan: VWO Login Dashboard

---

## Document Header

| Field | Value |
|-------|-------|
| **JIRA Story ID** | VWO-0001 |
| **Story Title** | VWO Login Dashboard |
| **Sprint** | Sprint 14 |
| **Author** | TestGen Orchestrator |
| **Date** | 2026-05-17 |
| **Version** | 1.0 |
| **Status** | Draft |
| **Source PRD** | Product Requirements Document: VWO Login Dashboard |

---

## 1. Executive Summary

This test plan defines the QA strategy for VWO-0001 — the VWO Login Dashboard at app.vwo.com. The login dashboard is the critical entry point for 4,000+ brands across 90 countries accessing VWO's experimentation and optimization platform.

Testing scope spans all 26 acceptance criteria defined in VWO-0001, covering six primary test domains: Authentication, Input Validation, Password Management, User Experience & Accessibility, Security & Compliance, and Non-Functional Performance. The plan mandates 95%+ login success rate and sub-2-second page load (P95) as KPI exit criteria, matching the business targets defined in the story.

Estimated test cases: 70–90 across all modules.

---

## 2. Scope

### 2.1 In-Scope

All items traceable to VWO-0001 acceptance criteria:

| # | Feature | AC Reference |
|---|---------|-------------|
| 1 | Email/password authentication | AC-1 |
| 2 | Session management and timeout | AC-2 |
| 3 | Multi-Factor Authentication (2FA) | AC-3 |
| 4 | Enterprise SSO (SAML, OAuth) | AC-4 |
| 5 | Real-time input validation (blur) | AC-5 |
| 6 | Email format validation | AC-6 |
| 7 | Password strength indicators | AC-7 |
| 8 | Error messages — auth failures | AC-8 |
| 9 | Forgot password / reset flow | AC-9 |
| 10 | Password complexity enforcement | AC-10 |
| 11 | Responsive design — mobile | AC-11 |
| 12 | Auto-focus on email field | AC-12 |
| 13 | Loading states during auth | AC-13 |
| 14 | Screen reader / ARIA / keyboard nav | AC-14, AC-15, AC-16 |
| 15 | Light and Dark mode | AC-17 |
| 16 | Remember Me functionality | AC-18 |
| 17 | Free trial CTA for new users | AC-19 |
| 18 | HTTPS enforcement | AC-20 |
| 19 | Rate limiting / brute force protection | AC-21 |
| 20 | GDPR compliance | AC-22 |
| 21 | Page load time ≤2s (P95) | AC-23 |
| 22 | 99.9% uptime SLA | AC-24 |

### 2.2 Out-of-Scope

- Biometric authentication (future enhancement — not in VWO-0001)
- A/B testing of login variants via VWO platform (future enhancement)
- Progressive Web App features (future phase)
- Internal VWO dashboard functionality post-login
- Backend infrastructure provisioning and CDN configuration (ops scope)
- Social login via Google/Microsoft (not in VWO-0001 acceptance criteria — listed as optional integration only)

---

## 3. Test Strategy

### 3.1 Testing Approach

| Type | Justification |
|------|--------------|
| Functional | Core authentication flows are business-critical (95% success rate KPI) |
| Negative / Error Path | All 26 ACs include failure scenarios (invalid credentials, empty fields, expired tokens) |
| Edge Case | Boundary values for rate limiting, session timeout, password complexity |
| End-to-End | Full login → dashboard transition; full forgot password flow |
| Security | HTTPS, rate limiting, GDPR — mandated by AC-20, AC-21, AC-22 |
| Accessibility | WCAG 2.1 AA compliance mandated by AC-14, AC-15, AC-16 |
| Performance | Sub-2s page load (P95) and 99.9% uptime mandated by AC-23, AC-24 |
| Responsive | Mobile-optimized interface mandated by AC-11 |

### 3.2 Test Environments

| Environment | Purpose |
|-------------|---------|
| Staging | Primary test environment — mirrors production configuration |
| Production | Smoke tests only — post-deployment verification |
| Mobile (iOS/Android) | Responsive design validation (AC-11) |

### 3.3 Test Data Strategy

- Valid credentials: pre-provisioned test accounts in staging
- Invalid credentials: synthetic data (non-existent emails, wrong passwords)
- Rate limiting: automated scripts to trigger N+1 failed attempts
- SSO: SAML test IdP configured in staging
- 2FA: test TOTP codes via authenticator app

---

## 4. Test Modules

Modules are ordered by business risk and weighted by acceptance criteria coverage.

### Module 1 — Primary Authentication
**Priority:** Critical | **Weightage:** 25% | **AC:** AC-1, AC-2, AC-8, AC-12, AC-13, AC-18

Tests core email/password login flow: valid login success, invalid credentials failure, empty field handling, session creation, Remember Me persistence, auto-focus on load, and loading state visibility during auth processing.

KPI: 95%+ login success rate for valid credential attempts.

### Module 2 — Input Validation
**Priority:** High | **Weightage:** 15% | **AC:** AC-5, AC-6, AC-7, AC-8

Tests real-time field validation: email format errors on blur, password strength indicator states (weak/medium/strong), error messages on empty submit, and actionable error copy for each failure mode.

### Module 3 — Password Management
**Priority:** High | **Weightage:** 15% | **AC:** AC-9, AC-10

Tests full forgot password flow: link visibility, email submission, token delivery, reset form validation, password complexity enforcement (min length, character classes), and post-reset login success.

### Module 4 — Multi-Factor Authentication (2FA)
**Priority:** High | **Weightage:** 10% | **AC:** AC-3

Tests optional 2FA: enable/disable flow, TOTP code entry, invalid code rejection, expired code handling, and fallback/recovery options.

### Module 5 — Enterprise SSO
**Priority:** High | **Weightage:** 10% | **AC:** AC-4

Tests SAML/OAuth SSO: IdP redirect, successful assertion, failed/expired assertion, SSO-only account direct login prevention, and domain-based SSO routing.

### Module 6 — Accessibility
**Priority:** High | **Weightage:** 10% | **AC:** AC-14, AC-15, AC-16

Tests WCAG 2.1 AA compliance: ARIA labels on all form controls, keyboard-only navigation (Tab order, Enter submit, Space checkbox), screen reader announcements for errors, high contrast mode toggle, and focus visibility.

### Module 7 — UI / UX
**Priority:** Medium | **Weightage:** 5% | **AC:** AC-11, AC-12, AC-17, AC-18, AC-19

Tests interface elements: responsive layout at 320px, 768px, 1280px breakpoints; Dark/Light mode toggle and persistence; Free Trial CTA visibility and link target; Remember Me checkbox state persistence; auto-focus on page load.

### Module 8 — Security & Compliance
**Priority:** Critical | **Weightage:** 5% | **AC:** AC-20, AC-21, AC-22

Tests security controls: HTTPS enforcement (HTTP → HTTPS redirect), rate limiting trigger after N consecutive failures, lockout duration, GDPR — no PII in network logs or error messages, session token security attributes (HttpOnly, Secure, SameSite).

### Module 9 — Performance
**Priority:** High | **Weightage:** 5% | **AC:** AC-23, AC-24

Tests performance targets: page load ≤2s on standard connection (P95), Time to Interactive measurement, concurrent user simulation, uptime check baseline.

---

## 5. Entry and Exit Criteria

### Entry Criteria
- Staging environment deployed and accessible at base URL
- Test accounts provisioned (valid, invalid, SSO, 2FA-enabled)
- SAML test IdP configured in staging
- Rate limiting middleware enabled in staging
- All AC items in VWO-0001 are implementation-complete per development team

### Exit Criteria
- All Critical and High priority test cases executed
- Zero open Critical defects
- Login success rate ≥95% (P95) verified in staging
- Page load time ≤2s (P95) verified
- WCAG 2.1 AA — zero Critical accessibility violations
- HTTPS enforcement and rate limiting verified
- Test case pass rate ≥90% overall

---

## 6. Risk and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| SSO IdP not configured in staging | Medium | High | Configure SAML test IdP as part of sprint setup; add to Definition of Ready |
| 2FA test accounts not provisioned | Medium | Medium | Pre-provision 2FA test accounts in staging setup runbook |
| Rate limiting threshold varies per environment | High | Medium | Confirm N (lockout threshold) with engineering before executing Module 8 |
| Page load >2s in staging due to shared infra | Medium | Medium | Run performance tests at off-peak hours; note environment delta |
| GDPR log scrubbing incomplete | Low | Critical | Verify with security team; run log analysis after failed login attempts |
| Mobile layout not responsive at 320px | Low | High | Test on real device and BrowserStack before sign-off |

---

## 7. Defect Management Workflow

1. **Discovery:** Test case marked FAIL in execution report
2. **Classification:** Severity assigned (Critical / High / Medium / Low) per business impact
3. **Logging:** JIRA bug created via Stage 6 (mcp-atlassian), linked to VWO-0001
4. **Triage:** Engineering lead reviews Critical/High within 1 business day
5. **Retest:** Failed TC re-executed after fix deployed to staging
6. **Closure:** Bug closed when TC passes; test case marked PASS in execution report

**Severity Definitions:**
- Critical: Login completely broken, security vulnerability, data exposure
- High: Core flow broken for a user segment (SSO, 2FA, mobile)
- Medium: Non-blocking UX issue, incorrect error message, minor validation gap
- Low: Cosmetic, accessibility minor, copy inconsistency

---

## 8. Non-Functional Testing

### 8.1 Performance (AC-23)
- Tool: k6 or Playwright performance assertions
- Metric: Page load ≤2s at P95 under standard connection (simulated via network throttle)
- Threshold: Test fails if median or P95 load time exceeds 2000ms

### 8.2 Security (AC-20, AC-21, AC-22)
- HTTPS: Verify HTTP → HTTPS redirect; check no mixed content
- Rate limiting: Automate N+1 failed logins; verify 429 response and lockout UX
- Session security: Inspect cookie attributes (HttpOnly, Secure, SameSite=Strict)
- GDPR: Verify no email or password fragments appear in response bodies, headers, or server logs

### 8.3 Accessibility (AC-14, AC-15, AC-16)
- Tool: axe-core or Playwright + axe integration
- Standard: WCAG 2.1 Level AA
- Critical checks: form labels, error announcements, focus order, keyboard operability, contrast ratio ≥4.5:1

---

## 9. Sign-off

| Role | Name | Sign-off Date |
|------|------|--------------|
| QA Lead | *(pending)* | — |
| Engineering Lead | *(pending)* | — |
| Product Manager | *(pending)* | — |
| Security | *(pending)* | — |

---

*Generated by TestGen Orchestrator — Stage 2*
*Source: VWO-0001 | Template: resources/enterprise_test_plan_template.md*
