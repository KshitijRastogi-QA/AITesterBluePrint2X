# VWO Login Page Test Plan

## Application Overview

VWO (Visual Website Optimizer) is a digital experience optimization platform. This test plan covers comprehensive testing of the login page functionality, including email/password authentication, alternative sign-in methods (Google, SSO, Passkey), form validation, and error handling. The login page is the primary entry point for existing users and is critical for successful user onboarding.

## Test Scenarios

### 1. Email and Password Field Validation

**Seed:** `tests/seed.spec.ts`

#### 1.1. Login with empty email and password fields

**File:** `tests/login/empty-fields.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
    - expect: Email and password input fields are visible and empty
  2. Click the Sign in button without entering any credentials
    - expect: An error message displays: 'Your email, password, IP address or location did not match'
    - expect: The form remains on the login page

#### 1.2. Login with invalid email format and valid password

**File:** `tests/login/invalid-email.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
  2. Enter 'invalidemail' (without @ symbol) in the email field
    - expect: Email field accepts the input
  3. Enter 'testpassword123' in the password field
    - expect: Password field accepts the input
    - expect: Password text is masked by default
  4. Click the Sign in button
    - expect: Error message displays: 'Your email, password, IP address or location did not match'
    - expect: User remains on login page

#### 1.3. Login with valid email format but incorrect password

**File:** `tests/login/invalid-password.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
  2. Enter 'test@example.com' in the email field
    - expect: Email field accepts valid email format
  3. Enter 'wrongpassword123' in the password field
    - expect: Password field accepts the input
    - expect: Password is hidden by default
  4. Click the Sign in button
    - expect: Error message displays indicating authentication failed
    - expect: User remains on login page
    - expect: Password field is cleared or focus is moved to email field

#### 1.4. Login with valid email format only

**File:** `tests/login/email-only.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
  2. Enter 'test@example.com' in the email field
    - expect: Email field displays the valid email format
  3. Leave password field empty
    - expect: Password field remains empty
  4. Click the Sign in button
    - expect: Error message displays: 'Your email, password, IP address or location did not match'
    - expect: User remains on login page

### 2. Password Visibility and Remember Me Feature

**Seed:** `tests/seed.spec.ts`

#### 2.1. Toggle password visibility

**File:** `tests/login/password-visibility.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
  2. Click on the password field and enter 'secretpassword123'
    - expect: Password field accepts input
    - expect: Password is masked (appears as dots or asterisks)
  3. Click the 'Toggle password visibility' button (eye icon)
    - expect: Password becomes visible and displays as plain text 'secretpassword123'
    - expect: Eye icon changes to indicate visibility is enabled
  4. Click the 'Toggle password visibility' button again
    - expect: Password becomes hidden again
    - expect: Password characters are masked
    - expect: Eye icon reverts to indicate visibility is disabled

#### 2.2. Remember me checkbox functionality

**File:** `tests/login/remember-me.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
    - expect: Remember me checkbox is visible and unchecked
  2. Click on the Remember me checkbox
    - expect: Checkbox becomes checked
    - expect: Visual indicator shows checked state
  3. Enter 'test@example.com' in email field and 'testpassword123' in password field
    - expect: Fields accept input
    - expect: Remember me checkbox remains checked
  4. Click Sign in button
    - expect: Form submission attempt is made with remember me flag
    - expect: If credentials are valid, user is logged in and may remain logged in on next visit

#### 2.3. Uncheck and recheck remember me

**File:** `tests/login/remember-me-toggle.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
    - expect: Remember me checkbox is unchecked
  2. Click Remember me checkbox to check it
    - expect: Checkbox becomes checked
  3. Click Remember me checkbox again to uncheck it
    - expect: Checkbox becomes unchecked
    - expect: Checkbox can be toggled without errors
  4. Click Remember me checkbox again to check it
    - expect: Checkbox becomes checked again successfully

### 3. Forgot Password and Navigation Links

**Seed:** `tests/seed.spec.ts`

#### 3.1. Click Forgot Password button

**File:** `tests/login/forgot-password.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
    - expect: Forgot Password button is visible
  2. Click the 'Forgot Password?' button
    - expect: Navigation occurs to forgot password page
    - expect: URL changes to include forgot-password route
    - expect: Forgot password form loads successfully
  3. Click back button or navigate back to login
    - expect: User returns to login page
    - expect: Login form is restored
    - expect: Email and password fields are empty

#### 3.2. Click Start a FREE TRIAL link

**File:** `tests/login/free-trial-link.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
    - expect: Free Trial link is visible at bottom
  2. Click on 'Start a FREE TRIAL' link
    - expect: New tab or page opens to VWO free trial signup
    - expect: Link URL contains utm parameters for tracking
    - expect: User can proceed with trial signup flow

#### 3.3. Click Privacy Policy link

**File:** `tests/login/privacy-policy-link.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
    - expect: Privacy Policy link is visible in footer
  2. Click on 'Privacy policy' link
    - expect: New tab or page opens to VWO privacy policy page
    - expect: Page loads successfully with privacy policy content
    - expect: URL points to VWO domain

#### 3.4. Click Terms link

**File:** `tests/login/terms-link.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
    - expect: Terms link is visible in footer
  2. Click on 'Terms' link
    - expect: New tab or page opens to VWO terms page
    - expect: Page loads successfully with terms and conditions content
    - expect: URL points to VWO domain

### 4. Alternative Sign-In Methods

**Seed:** `tests/seed.spec.ts`

#### 4.1. Sign in with Google button presence and clickability

**File:** `tests/login/signin-google.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
    - expect: Sign in with Google button is visible and enabled
  2. Click on 'Sign in with Google' button
    - expect: Google OAuth flow initiates
    - expect: Browser opens Google login page or consent screen
    - expect: Button remains clickable and functional

#### 4.2. Sign in using SSO button presence and clickability

**File:** `tests/login/signin-sso.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
    - expect: Sign in using SSO button is visible and enabled
    - expect: SSO button has appropriate icon/label
  2. Click on 'Sign in using SSO' button
    - expect: SSO authentication flow is triggered
    - expect: User is directed to SSO provider login or appropriate error message
    - expect: Button remains in functional state

#### 4.3. Sign in with Passkey button presence and clickability

**File:** `tests/login/signin-passkey.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
    - expect: Sign in with Passkey button is visible and enabled
  2. Click on 'Sign in with Passkey' button
    - expect: Passkey authentication flow initiates
    - expect: Device/browser passkey verification is triggered
    - expect: User can proceed with passkey authentication

### 5. Page Layout and UI Elements

**Seed:** `tests/seed.spec.ts`

#### 5.1. Login page loads with all elements visible

**File:** `tests/login/page-load.spec.ts`

**Steps:**
  1. Navigate to https://app.vwo.com
    - expect: Page loads successfully
    - expect: URL redirects to https://app.vwo.com/#/login
    - expect: Page title is 'Login - VWO'
  2. Verify all main UI elements are present
    - expect: VWO logo is displayed
    - expect: Email input field with placeholder 'Enter email ID' is visible
    - expect: Password input field with placeholder 'Enter password' is visible
    - expect: Password visibility toggle button is present
    - expect: Sign in button is visible and enabled
    - expect: Forgot Password link is present
    - expect: Remember me checkbox is visible
    - expect: Alternative sign-in options (Google, SSO, Passkey) are displayed
    - expect: Free trial and signup links are visible
    - expect: Privacy policy and Terms links are present

#### 5.2. Form input fields accept text input

**File:** `tests/login/input-field-text.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
  2. Click on email field and type 'user@example.com'
    - expect: Email field accepts text input
    - expect: Text 'user@example.com' is displayed in the field
  3. Click on password field and type 'mypassword'
    - expect: Password field accepts text input
    - expect: Password characters are masked
    - expect: Text appears as dots or asterisks
  4. Clear both fields and verify they can be edited
    - expect: Fields can be cleared completely
    - expect: Fields accept new input after clearing

#### 5.3. Responsive design on different screen sizes

**File:** `tests/login/responsive-design.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com on desktop (1920x1080)
    - expect: Login page displays correctly on desktop
    - expect: All elements are properly aligned
    - expect: Form is centered on the page
  2. Navigate to app.vwo.com on tablet (768x1024)
    - expect: Login page is responsive and adapts to tablet size
    - expect: Elements remain visible and usable
    - expect: Form is appropriately sized for tablet
  3. Navigate to app.vwo.com on mobile (375x667)
    - expect: Login page is fully responsive on mobile
    - expect: All form fields and buttons are accessible
    - expect: Text is readable without horizontal scrolling
    - expect: Touch targets are appropriately sized

### 6. Error Handling and Edge Cases

**Seed:** `tests/seed.spec.ts`

#### 6.1. SQL injection attempt in email field

**File:** `tests/login/sql-injection-email.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
  2. Enter "admin' --" in email field
    - expect: Email field accepts the input safely
    - expect: No SQL injection occurs
  3. Enter 'anypassword' in password field and click Sign in
    - expect: Request is processed safely
    - expect: Standard authentication error is displayed
    - expect: Application handles injection attempt gracefully

#### 6.2. Cross-site scripting (XSS) attempt in email field

**File:** `tests/login/xss-email.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
  2. Enter '<script>alert("XSS")</script>' in email field
    - expect: Email field accepts the input
    - expect: Script does not execute
    - expect: No alert box appears
  3. Enter 'anypassword' in password field and click Sign in
    - expect: Request is processed safely
    - expect: Standard authentication error is displayed
    - expect: Page remains secure

#### 6.3. Very long text input in email field

**File:** `tests/login/long-email-input.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
  2. Enter a very long string (500+ characters) in email field
    - expect: Email field handles long input appropriately
    - expect: Either truncates input or shows appropriate error
    - expect: Form remains functional
  3. Click Sign in button
    - expect: Form submission handles gracefully
    - expect: Appropriate error message is displayed

#### 6.4. Special characters in password field

**File:** `tests/login/special-chars-password.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
  2. Enter 'test@example.com' in email field
    - expect: Email field displays valid input
  3. Enter a password with special characters: 'P@ss!w0rd#123$%^&' in password field
    - expect: Password field accepts all special characters
    - expect: Password is masked for security
    - expect: All characters are captured
  4. Click Sign in button
    - expect: Form processes password with special characters
    - expect: Authentication attempt is made with full password

#### 6.5. Rapid repeated form submissions

**File:** `tests/login/rapid-submissions.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
  2. Enter 'test@example.com' and 'password' in respective fields
    - expect: Fields display input
  3. Rapidly click the Sign in button multiple times (5+ times quickly)
    - expect: Application handles rapid submissions gracefully
    - expect: Duplicate requests are prevented or handled
    - expect: Only one authentication attempt is processed
    - expect: Form remains responsive

### 7. Browser and Session Behavior

**Seed:** `tests/seed.spec.ts`

#### 7.1. Page refresh maintains form state

**File:** `tests/login/refresh-form-state.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
  2. Enter 'test@example.com' in email field and 'mypassword' in password field
    - expect: Fields display input
  3. Refresh the page (F5 or Cmd+R)
    - expect: Page reloads successfully
    - expect: Form fields are cleared (security best practice)
    - expect: Login page is displayed fresh

#### 7.2. Browser back button behavior

**File:** `tests/login/browser-back.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
  2. Click Forgot Password link
    - expect: Forgot password page loads
  3. Click browser back button
    - expect: Browser navigates back to login page
    - expect: Login form is displayed
    - expect: Previous form entries are cleared

#### 7.3. Tab key navigation through form elements

**File:** `tests/login/tab-navigation.spec.ts`

**Steps:**
  1. Navigate to app.vwo.com
    - expect: Login page loads successfully
  2. Press Tab key to navigate through form elements
    - expect: Focus moves to email field first
    - expect: Second Tab moves focus to password field
    - expect: Third Tab moves focus to forgot password link or other interactive element
    - expect: Tab order is logical and accessible
  3. Continue tabbing through remaining interactive elements
    - expect: All buttons and links are reachable via Tab
    - expect: Sign in button receives focus
    - expect: Alternative sign-in methods are in tab order
