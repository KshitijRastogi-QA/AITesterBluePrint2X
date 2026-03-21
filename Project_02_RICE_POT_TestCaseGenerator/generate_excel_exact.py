import pandas as pd
import openpyxl

# Load the columns from the template's 'Create Booking Testcase ' sheet
template_file = 'Test cases - Ultimate _ TheTestingAcademy.xlsx'
df_template = pd.read_excel(template_file, sheet_name='Create Booking Testcase ')
template_cols = df_template.columns.tolist()

data = [
    # AUTH SCENARIOS
    {
        "Scenario TID": "TC_AUTH_01",
        "TestCase Description": "Verify successful token generation with valid credentials.",
        "PreCondition": "API server is up. Test Data: Username: admin, Password: password123",
        "TestSteps": "1. POST https://restful-booker.herokuapp.com/auth\n2. Headers: Content-Type='application/json'\n3. Body:\n{\n  \"username\": \"admin\",\n  \"password\": \"password123\"\n}",
        "Expected Result": "Status: 200 OK\nTime: < 2s\nBody: {\"token\": \"[alphanumeric]\"}",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Auth - Positive", "Priority": "P0", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_AUTH_02",
        "TestCase Description": "Verify token generation failure with invalid password.",
        "PreCondition": "API server is up. Test Data: Username: admin, Password: wrongpassword!",
        "TestSteps": "1. POST https://restful-booker.herokuapp.com/auth\n2. Headers: Content-Type='application/json'\n3. Body:\n{\n  \"username\": \"admin\",\n  \"password\": \"wrongpassword!\"\n}",
        "Expected Result": "Status: 200 OK\nBody: {\"reason\": \"Bad credentials\"}",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Auth - Negative", "Priority": "P1", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_AUTH_03",
        "TestCase Description": "Verify token generation failure with missing payload fields.",
        "PreCondition": "API server is up. Test Data: Empty body.",
        "TestSteps": "1. POST https://restful-booker.herokuapp.com/auth\n2. Headers: Content-Type='application/json'\n3. Body: {}",
        "Expected Result": "Status: 200 OK\nBody: {\"reason\": \"Bad credentials\"}",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Auth - Negative", "Priority": "P2", "Is Automated": "Yes"
    },

    # GET ALL BOOKINGS SCENARIOS
    {
        "Scenario TID": "TC_BKG_GETALL_01",
        "TestCase Description": "Retrieve all booking IDs without any query parameters.",
        "PreCondition": "API server is up. At least one booking exists.",
        "TestSteps": "1. GET https://restful-booker.herokuapp.com/booking",
        "Expected Result": "Status: 200 OK\nBody: Array of objects with 'bookingid'",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Get All", "Priority": "P0", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_BKG_GETALL_02",
        "TestCase Description": "Retrieve booking IDs filtered by firstname and lastname.",
        "PreCondition": "API server is up.",
        "TestSteps": "1. GET https://restful-booker.herokuapp.com/booking?firstname=sally&lastname=brown",
        "Expected Result": "Status: 200 OK\nBody: Array of objects with 'bookingid' matching the criteria",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Filter", "Priority": "P1", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_BKG_GETALL_03",
        "TestCase Description": "Retrieve booking IDs filtered by checkin/checkout dates.",
        "PreCondition": "API server is up.",
        "TestSteps": "1. GET https://restful-booker.herokuapp.com/booking?checkin=2014-03-13&checkout=2014-05-21",
        "Expected Result": "Status: 200 OK\nBody: Array of objects with 'bookingid'",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Filter", "Priority": "P1", "Is Automated": "Yes"
    },

    # GET SINGLE BOOKING SCENARIOS
    {
        "Scenario TID": "TC_BKG_GETSINGLE_01",
        "TestCase Description": "Retrieve a specific booking by its valid Booking ID.",
        "PreCondition": "Booking ID 1 exists in the system. Path Parameter id = 1",
        "TestSteps": "1. GET https://restful-booker.herokuapp.com/booking/1\n2. Headers: Accept='application/json'",
        "Expected Result": "Status: 200 OK\nBody: JSON object containing firstname, lastname, totalprice, depositpaid, bookingdates.",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Get Single", "Priority": "P0", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_BKG_GETSINGLE_02",
        "TestCase Description": "Attempt to retrieve booking details for a non-existent ID.",
        "PreCondition": "Booking ID 9999999 does not exist.",
        "TestSteps": "1. GET https://restful-booker.herokuapp.com/booking/9999999\n2. Headers: Accept='application/json'",
        "Expected Result": "Status: 404 Not Found\nBody: 'Not Found'",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Get Single (Negative)", "Priority": "P1", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_BKG_GETSINGLE_03",
        "TestCase Description": "Retrieve specific booking requesting XML format via Accept header.",
        "PreCondition": "Booking ID 1 exists.",
        "TestSteps": "1. GET https://restful-booker.herokuapp.com/booking/1\n2. Headers: Accept='application/xml'",
        "Expected Result": "Status: 200 OK\nBody: XML formatted response with booking details.",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Get Single (XML)", "Priority": "P2", "Is Automated": "Yes"
    },

    # CREATE BOOKING SCENARIOS
    {
        "Scenario TID": "TC_BKG_CREATE_01",
        "TestCase Description": "Create a new booking with a fully valid JSON payload.",
        "PreCondition": "API is accessible.",
        "TestSteps": "1. POST https://restful-booker.herokuapp.com/booking\n2. Headers: Content-Type='application/json', Accept='application/json'\n3. Body:\n{\n    \"firstname\" : \"Jim\",\n    \"lastname\" : \"Brown\",\n    \"totalprice\" : 111,\n    \"depositpaid\" : true,\n    \"bookingdates\" : {\n        \"checkin\" : \"2018-01-01\",\n        \"checkout\" : \"2019-01-01\"\n    },\n    \"additionalneeds\" : \"Breakfast\"\n}",
        "Expected Result": "Status: 200 OK\nBody: Includes 'bookingid' and nested 'booking' object matching request.",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Create", "Priority": "P0", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_BKG_CREATE_02",
        "TestCase Description": "Attempt to create a booking with missing mandatory fields.",
        "PreCondition": "API is accessible.",
        "TestSteps": "1. POST https://restful-booker.herokuapp.com/booking\n2. Box: {\"firstname\": \"Jim\"}",
        "Expected Result": "Status: 500 Internal Server Error",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Create (Negative)", "Priority": "P1", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_BKG_CREATE_03",
        "TestCase Description": "Attempt to create a booking with invalid data types (e.g. String for totalprice).",
        "PreCondition": "API is accessible.",
        "TestSteps": "1. POST https://restful-booker.herokuapp.com/booking\n2. Body contains 'totalprice': 'One Hundred'",
        "Expected Result": "Status: 500 Internal Server Error or 400 Bad Request",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Create (Negative)", "Priority": "P2", "Is Automated": "Yes"
    },

    # UPDATE BOOKING SCENARIOS
    {
        "Scenario TID": "TC_BKG_UPDATE_01",
        "TestCase Description": "Perform a Full Update on an existing booking using valid Auth Cookie.",
        "PreCondition": "Booking ID 1 exists. Auth Cookie: token=abcd1234",
        "TestSteps": "1. PUT https://restful-booker.herokuapp.com/booking/1\n2. Headers: Content-Type='application/json', Accept='application/json', Cookie='token=abcd1234'\n3. Body:\n{\n    \"firstname\" : \"James\",\n    \"lastname\" : \"Brown\",\n    \"totalprice\" : 111,\n    \"depositpaid\" : true,\n    \"bookingdates\" : {\n        \"checkin\" : \"2018-01-01\",\n        \"checkout\" : \"2019-01-01\"\n    },\n    \"additionalneeds\" : \"Breakfast\"\n}",
        "Expected Result": "Status: 200 OK\nBody: Fully updated 'booking' JSON object.",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Update", "Priority": "P0", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_BKG_UPDATE_02",
        "TestCase Description": "Perform a Full Update without Authentication Header/Cookie.",
        "PreCondition": "Booking ID 1 exists.",
        "TestSteps": "1. PUT https://restful-booker.herokuapp.com/booking/1\n2. Headers: NO Auth or Cookie\n3. Body: Valid full payload",
        "Expected Result": "Status: 403 Forbidden\nBody: 'Forbidden'",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Update (Negative)", "Priority": "P1", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_BKG_UPDATE_03",
        "TestCase Description": "Perform a Full Update using Basic Auth instead of Cookie.",
        "PreCondition": "Booking ID 1 exists. Header: Authorization='Basic YWRtaW46cGFzc3dvcmQxMjM='",
        "TestSteps": "1. PUT https://restful-booker.herokuapp.com/booking/1\n2. Headers: Authorization='Basic YWRtaW46cGFzc3dvcmQxMjM='\n3. Body: Valid full payload",
        "Expected Result": "Status: 200 OK\nBody: Updated 'booking' object.",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Update", "Priority": "P1", "Is Automated": "Yes"
    },

    # PARTIAL UPDATE SCENARIOS
    {
        "Scenario TID": "TC_BKG_PARTIAL_01",
        "TestCase Description": "Perform a Partial Update (PATCH) with valid Basic Auth.",
        "PreCondition": "Booking ID 1 exists. Header: Authorization='Basic YWRtaW46cGFzc3dvcmQxMjM='",
        "TestSteps": "1. PATCH https://restful-booker.herokuapp.com/booking/1\n2. Headers: Content-Type='application/json', Accept='application/json', Authorization='Basic YWRtaW46cGFzc3dvcmQxMjM='\n3. Body:\n{\n    \"firstname\" : \"James\",\n    \"lastname\" : \"Brown\"\n}",
        "Expected Result": "Status: 200 OK\nBody: Full updated booking object with altered firstname and lastname.",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Partial Update", "Priority": "P0", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_BKG_PARTIAL_02",
        "TestCase Description": "Perform Partial Update without Authentication Headers.",
        "PreCondition": "Booking ID 1 exists.",
        "TestSteps": "1. PATCH https://restful-booker.herokuapp.com/booking/1\n2. Headers: No Auth applied\n3. Body: {\"firstname\" : \"James\"}",
        "Expected Result": "Status: 403 Forbidden",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Partial Update (Negative)", "Priority": "P1", "Is Automated": "Yes"
    },

    # DELETE SCENARIOS
    {
        "Scenario TID": "TC_BKG_DELETE_01",
        "TestCase Description": "Delete an existing booking with a valid authentication cookie.",
        "PreCondition": "Booking ID 1 exists. Auth Cookie: token=xyz987",
        "TestSteps": "1. DELETE https://restful-booker.herokuapp.com/booking/1\n2. Headers: Cookie='token=xyz987'",
        "Expected Result": "Status: 201 Created",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Delete", "Priority": "P0", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_BKG_DELETE_02",
        "TestCase Description": "Delete an existing booking using Basic Auth headers.",
        "PreCondition": "Booking ID 1 exists. Header: Authorization='Basic YWRtaW46cGFzc3dvcmQxMjM='",
        "TestSteps": "1. DELETE https://restful-booker.herokuapp.com/booking/1\n2. Headers: Authorization='Basic YWRtaW46cGFzc3dvcmQxMjM='",
        "Expected Result": "Status: 201 Created",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Delete", "Priority": "P1", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_BKG_DELETE_03",
        "TestCase Description": "Attempt to delete a booking without an Auth token or Cookie.",
        "PreCondition": "Booking ID 1 exists.",
        "TestSteps": "1. DELETE https://restful-booker.herokuapp.com/booking/1\n2. Headers: None",
        "Expected Result": "Status: 403 Forbidden",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Booking - Delete (Negative)", "Priority": "P1", "Is Automated": "Yes"
    },

    # PING SCENARIOS
    {
        "Scenario TID": "TC_PING_01",
        "TestCase Description": "Verify the HealthCheck Ping endpoint validates server uptime.",
        "PreCondition": "None",
        "TestSteps": "1. GET https://restful-booker.herokuapp.com/ping",
        "Expected Result": "Status: 201 Created",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Ping - HealthCheck", "Priority": "P2", "Is Automated": "Yes"
    },
    {
        "Scenario TID": "TC_PING_02",
        "TestCase Description": "Attempt Ping endpoint with POST method.",
        "PreCondition": "None",
        "TestSteps": "1. POST https://restful-booker.herokuapp.com/ping",
        "Expected Result": "Status: 404 Not Found (or 405 Method Not Allowed)",
        "Status": "Not Executed", "Executed QA Name ": "Kshitij Rastogi", "Misc (Comments)": "Ping - HealthCheck (Negative)", "Priority": "P2", "Is Automated": "Yes"
    }
]

# Provide missing/blank string values matching exact template headers
for d in data:
    for col in template_cols:
        if col not in d:
            d[col] = ""

df_cases = pd.DataFrame(data, columns=template_cols)

filename = 'Restful_Booker_TestCases.xlsx'
with pd.ExcelWriter(filename, engine='openpyxl') as writer:
    df_cases.to_excel(writer, index=False, sheet_name='Test Cases')
    
    # Simple formatting keeping exact columns
    worksheet = writer.sheets['Test Cases']
    from openpyxl.styles import Alignment
    
    for row in worksheet.iter_rows():
        for cell in row:
            cell.alignment = Alignment(wrap_text=True, vertical='top')
            
    worksheet.column_dimensions['D'].width = 50
    worksheet.column_dimensions['E'].width = 40
    worksheet.column_dimensions['C'].width = 30
    worksheet.column_dimensions['B'].width = 30

print(f"Excel test cases smoothly generated matching exact template: {filename}")
