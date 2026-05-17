import csv
import random
import os

# Define testing components and their specific scenarios
COMPONENTS = {
    "Primary Authentication": {
        "scenarios": [
            "Verify standard login with valid email and password",
            "Verify login failure with valid email but incorrect password",
            "Verify login failure with unregistered email",
            "Verify login fails when account is locked after consecutive failures",
            "Verify successful Enterprise SSO login via SAML",
            "Verify failure in Enterprise SSO login due to token expiration",
            "Verify successful Social Login via Google",
            "Verify successful Social Login via Microsoft",
            "Verify Multi-Factor Authentication prompt after correct credentials",
            "Verify login success after entering valid MFA code",
            "Verify login failure with invalid MFA code",
            "Verify 'Remember Me' functionality persists session after browser restart",
            "Verify session timeout behaves correctly after configured period of inactivity",
            "Verify concurrent login handling from multiple devices"
        ],
        "priority_range": ["Highest", "High"]
    },
    "Input Validation": {
        "scenarios": [
            "Verify email field auto-focuses on page load",
            "Verify real-time validation error for blank email on blur",
            "Verify real-time validation error for blank password on blur",
            "Verify proper formatting validation for email addressing (e.g., missing @)",
            "Verify proper formatting validation for email addressing (e.g., missing domain)",
            "Verify password field masks input characters correctly",
            "Verify trailing/leading spaces in email are handled/trimmed correctly",
            "Verify SQL injection payloads in email and password fields are sanitized",
            "Verify maximum character limits for email field",
            "Verify maximum character limits for password field",
            "Verify XSS payloads in input fields do not execute"
        ],
        "priority_range": ["High", "Medium"]
    },
    "Password Management": {
        "scenarios": [
            "Verify 'Forgot Password' link navigates to correct recovery page",
            "Verify password recovery email is sent for registered accounts",
            "Verify password recovery fails gracefully for unregistered accounts (no data leak)",
            "Verify password reset token expires after the designated time frame",
            "Verify user can successfully set a new password with the reset link",
            "Verify password reset fails if old password is used as new password",
            "Verify password strength indicator updates based on complexity rules",
            "Verify password policy enforcement (minimum length, special chars, numbers)"
        ],
        "priority_range": ["Highest", "High"]
    },
    "Security & Compliance": {
        "scenarios": [
            "Verify HTTPS is strictly enforced on the login dashboard",
            "Verify HTTP requests are redirected to HTTPS",
            "Verify rate limiting triggers after X failed login attempts",
            "Verify proper caching headers are set to prevent sensitive data caching",
            "Verify secure cookies flag is enabled for authentication tokens",
            "Verify HttpOnly flag is enabled for authentication tokens",
            "Verify GDPR/consent banners are displayed for EU regions",
            "Verify CORS policies are correctly configured",
            "Verify no sensitive information is leaked in API responses",
            "Verify API responses for auth requests are consistently formatted"
        ],
        "priority_range": ["Highest", "High"]
    },
    "Performance & Scalability": {
        "scenarios": [
            "Verify the login page loads completely in under 2 seconds",
            "Verify CDN is correctly delivering static assets (JS, CSS, Images)",
            "Verify images are properly compressed and optimized",
            "Verify the login endpoint responds within acceptable latency during standard load",
            "Verify the authentication infrastructure scales under 1000 concurrent user requests",
            "Verify Time-To-First-Byte (TTFB) is under 200ms",
            "Verify assets are correctly minified and bundled"
        ],
        "priority_range": ["High", "Medium"]
    },
    "User Interface & Branding": {
        "scenarios": [
            "Verify Light Mode theming renders correctly according to design specs",
            "Verify Dark Mode theming renders correctly according to design specs",
            "Verify UI responsiveness on mobile viewport (320px width)",
            "Verify UI responsiveness on tablet viewport (768px width)",
            "Verify UI responsiveness on desktop viewport (1080p and 4k)",
            "Verify button loading states accurately reflect background processing",
            "Verify company logos and branding elements are pristine and scalable (SVG/high-res)",
            "Verify product announcement banners render correctly",
            "Verify registration/Free trial link correctly redirects to onboarding"
        ],
        "priority_range": ["Medium", "Low"]
    },
    "Accessibility & UX": {
        "scenarios": [
            "Verify logical Tab navigation across all interactive elements",
            "Verify all form elements have appropriate ARIA labels",
            "Verify High Contrast mode provides sufficient legibility (WCAG 2.1 AA)",
            "Verify screen readers successfully announce error messages dynamically",
            "Verify form labels are clickable and shift focus to respective inputs",
            "Verify visual focus indicators are clear when navigating via keyboard"
        ],
        "priority_range": ["High", "Medium"]
    },
    "Integrations": {
        "scenarios": [
            "Verify successful redirection to VWO Core Platform post-login",
            "Verify returning users with valid active sessions bypass the login form",
            "Verify analytics tracking events dispatch on login success",
            "Verify analytics tracking events dispatch on login failure",
            "Verify customer support links open in correct targeted frames/tabs",
            "Verify SSO endpoints communicate correctly with the Identity Provider (IdP)"
        ],
        "priority_range": ["High", "Medium"]
    }
}

BROWSERS = ["Chrome", "Firefox", "Safari", "Edge"]
MOBILE_BROWSERS = ["Mobile Chrome", "Safari iOS"]
DESKTOP_OS = ["Windows 10", "Windows 11", "macOS"]
MOBILE_OS = ["iOS 16", "iOS 17", "Android 13", "Android 14"]
ENVIRONMENTS = ["QA", "Staging", "Production"]
NETWORK_CONDITIONS = ["3G", "4G", "5G", "Wi-Fi"]
DATA_TYPES = ["Valid", "Invalid Boundary", "Null Structure", "Special Characters", "SQL Inject"]

def generate_description(component, scenario, browser, os_env, network):
    return f"Execute test for module: {component}\n\n" \
           f"Scenario Context: {scenario}\n" \
           f"Expected Behavior: The system should handle the scenario smoothly as per the PRD requirements.\n\n" \
           f"Environment Context:\n" \
           f"- Browser: {browser}\n" \
           f"- OS: {os_env}\n" \
           f"- Network: {network}\n\n" \
           f"Pre-requisites: Test user accounts and network conditions setup."

def generate_test_cases(total_count=5000):
    test_cases = []
    
    components_keys = list(COMPONENTS.keys())
    
    for i in range(1, total_count + 1):
        component = random.choice(components_keys)
        scenario_base = random.choice(COMPONENTS[component]["scenarios"])
        priority = random.choice(COMPONENTS[component]["priority_range"])
        environment = random.choice(ENVIRONMENTS)
        
        # Decide if mobile or desktop testing
        is_mobile = random.choice([True, False])
        if is_mobile:
            browser = random.choice(MOBILE_BROWSERS)
            os_env = random.choice(MOBILE_OS)
        else:
            browser = random.choice(BROWSERS)
            os_env = random.choice(DESKTOP_OS)
            
        network = random.choice(NETWORK_CONDITIONS)
        data_mutation = random.choice(DATA_TYPES)
        
        # Creating a unique summary
        summary = f"[{component}] {scenario_base} - {browser} on {os_env} ({data_mutation})"
        
        # Prevent huge summaries
        if len(summary) > 250:
            summary = summary[:247] + "..."
            
        description = generate_description(component, scenario_base, browser, os_env, network)
        
        test_case = {
            "Summary": summary,
            "Issue Type": "Test",
            "Priority": priority,
            "Component/s": component,
            "Labels": f"VWO_Login, Automated, {environment}, {component.replace(' ', '_')}",
            "Environment": f"{os_env}, {browser}, {network}, {environment}",
            "Description": description
        }
        test_cases.append(test_case)
        
    return test_cases

def write_to_csv(filename, test_cases):
    if not test_cases:
        print("No test cases generated.")
        return
        
    headers = ["Summary", "Issue Type", "Priority", "Component/s", "Labels", "Environment", "Description"]
    
    try:
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(test_cases)
        print(f"Successfully generated {len(test_cases)} test cases in {filename}")
    except Exception as e:
        print(f"Error writing to CSV: {e}")

if __name__ == "__main__":
    output_filename = "app_vwo_jira_test_cases_5000.csv"
    print("Generating test cases...")
    tc_data = generate_test_cases(5000)
    write_to_csv(output_filename, tc_data)
    print("Done!")
