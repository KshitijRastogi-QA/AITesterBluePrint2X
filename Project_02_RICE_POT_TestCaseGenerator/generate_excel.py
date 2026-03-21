import pandas as pd

columns = [
    'Scenario TID', 'TestCase Description', 'Test Data', 'PreCondition', 
    'Steps to Execute', 'Expected Result', 'Actual Result', 'Status', 
    'Executed QA Name', 'Misc (Comments)', 'Priority', 'Is Automated'
]

data = [
    # Auth - Create Token
    ["TC_AUTH_01", "CreateAuthToken_ValidCreds", "username: admin, password: password123", 
     "API is running", "1. Send POST request to /auth with valid username and password.", 
     "Status: 200 OK. Res Time: <2s. Body contains 'token'.", "", "Pending", "Kshitij Rastogi", "Auth_Positive", "P0", "Yes"],
    ["TC_AUTH_02", "CreateAuthToken_InvalidCreds", "username: admin, password: wrongpassword", 
     "API is running", "1. Send POST request to /auth with invalid password.", 
     "Status: 200 OK (with Bad credentials message). Res Time: <2s. Body contains Reason 'Bad credentials'.", "", "Pending", "Kshitij Rastogi", "Auth_Negative", "P1", "Yes"],
    
    # Booking - GetBookingIds
    ["TC_BKG_01", "GetBookingIds_All", "None", 
     "API is running", "1. Send GET request to /booking.", 
     "Status: 200 OK. Res Time: <2s. Body contains array of objects with 'bookingid'.", "", "Pending", "Kshitij Rastogi", "GetBookings_Positive", "P0", "Yes"],
    ["TC_BKG_02", "GetBookingIds_ByNames", "firstname: sally, lastname: brown", 
     "API is running", "1. Send GET request to /booking?firstname=sally&lastname=brown.", 
     "Status: 200 OK. Res Time: <2s. Body contains array of booking ids matching the names.", "", "Pending", "Kshitij Rastogi", "GetBookings_Positive", "P1", "Yes"],
    ["TC_BKG_03", "GetBookingIds_ByDates", "checkin: 2014-03-13, checkout: 2014-05-21", 
     "API is running", "1. Send GET request to /booking?checkin=2014-03-13&checkout=2014-05-21.", 
     "Status: 200 OK. Res Time: <2s. Body contains matching booking ids.", "", "Pending", "Kshitij Rastogi", "GetBookings_Positive", "P1", "Yes"],

    # Booking - GetBooking
    ["TC_BKG_04", "GetBooking_ValidId", "id: 1", 
     "Booking ID 1 exists", "1. Send GET request to /booking/1. Verify Headers (Accept: application/json).", 
     "Status: 200 OK. Res Time: <2s. Body contains firstname, lastname, totalprice, depositpaid, bookingdates.", "", "Pending", "Kshitij Rastogi", "GetBooking_Positive", "P0", "Yes"],
    ["TC_BKG_05", "GetBooking_InvalidId", "id: 999999", 
     "Booking ID doesn't exist", "1. Send GET request to /booking/999999. Verify Headers.", 
     "Status: 404 Not Found. Res Time: <2s.", "", "Pending", "Kshitij Rastogi", "GetBooking_Negative", "P1", "Yes"],

    # Booking - CreateBooking
    ["TC_BKG_06", "CreateBooking_ValidPayload", "firstname: Jim, lastname: Brown, totalprice: 111, depositpaid: true, checkin: 2018-01-01, checkout: 2019-01-01, additionalneeds: Breakfast", 
     "API is running", "1. Send POST request to /booking with JSON payload.", 
     "Status: 200 OK. Res Time: <2s. Body contains generated bookingid and the booking details object.", "", "Pending", "Kshitij Rastogi", "CreateBooking_Positive", "P0", "Yes"],
    ["TC_BKG_07", "CreateBooking_MissingMandatoryFields", "firstname: Jim (Missing other fields)", 
     "API is running", "1. Send POST to /booking with partial JSON payload.", 
     "Status: 500 Internal Server Error. Res Time: <2s. Body indicates error.", "", "Pending", "Kshitij Rastogi", "CreateBooking_Negative", "P1", "Yes"],

    # Booking - UpdateBooking
    ["TC_BKG_08", "UpdateBooking_ValidPayloadAndAuth", "id: 1, Cookie: token=abc1234. Payload: firstname: James, lastname: Brown, totalprice: 111, depositpaid: true", 
     "Auth token is generated", "1. Send PUT request to /booking/1 with valid Cookie token/Authorization. Provide full JSON payload.", 
     "Status: 200 OK. Res Time: <2s. Body returns the updated complete booking object.", "", "Pending", "Kshitij Rastogi", "UpdateBooking_Positive", "P0", "Yes"],
    ["TC_BKG_09", "UpdateBooking_NoAuth", "id: 1. Payload: full body.", 
     "Booking ID exists", "1. Send PUT request to /booking/1 WITHOUT Cookie/Authorization headers.", 
     "Status: 403 Forbidden. Res Time: <2s. Update fails.", "", "Pending", "Kshitij Rastogi", "UpdateBooking_Negative", "P1", "Yes"],

    # Booking - PartialUpdateBooking
    ["TC_BKG_10", "PartialUpdateBooking_ValidAuth", "id: 1, Cookie: token=abc1234, firstname: James, lastname: Brown", 
     "Auth token generated", "1. Send PATCH to /booking/1 with valid token. JSON payload only contains firstname and lastname.", 
     "Status: 200 OK. Res Time: <2s. Body returns full entity with the selectively updated fields.", "", "Pending", "Kshitij Rastogi", "PartialUpdate_Positive", "P0", "Yes"],
    ["TC_BKG_11", "PartialUpdateBooking_InvalidAuth", "id: 1, Cookie: token=invalid", 
     "Booking ID exists", "1. Send PATCH to /booking/1 with invalid auth token.", 
     "Status: 403 Forbidden. Res Time: <2s.", "", "Pending", "Kshitij Rastogi", "PartialUpdate_Negative", "P1", "Yes"],

    # Booking - DeleteBooking
    ["TC_BKG_12", "DeleteBooking_ValidAuth", "id: 1, Cookie: token=123abc4", 
     "Booking ID exists, Auth token generated", "1. Send DELETE to /booking/1 with valid token.", 
     "Status: 201 Created. Res Time: <2s.", "", "Pending", "Kshitij Rastogi", "DeleteBooking_Positive", "P0", "Yes"],
    ["TC_BKG_13", "DeleteBooking_NoAuth", "id: 1", 
     "Booking ID exists", "1. Send DELETE to /booking/1 without Auth token.", 
     "Status: 403 Forbidden. Res Time: <2s.", "", "Pending", "Kshitij Rastogi", "DeleteBooking_Negative", "P1", "Yes"],

    # Ping - HealthCheck
    ["TC_PING_01", "HealthCheck_SuccessfulPing", "None", 
     "Server is UP", "1. Send GET request to /ping", 
     "Status: 201 Created. Res Time: <2s.", "", "Pending", "Kshitij Rastogi", "Ping_Positive", "P2", "Yes"],
    ["TC_PING_02", "HealthCheck_InvalidMethod", "None", 
     "Server is UP", "1. Send POST request to /ping (Invalid Method)", 
     "Status: 405 Method Not Allowed or 404 (depending on routing config). Res Time: <2s.", "", "Pending", "Kshitij Rastogi", "Ping_Negative", "P2", "Yes"]
]

df_cases = pd.DataFrame(data, columns=columns)
# Get exact template columns, let's format it properly to match "SOAP Request" sheet
template_cols = ['Scenario TID', 'Test Data', 'TestCase Description', 'PreCondition', 'TestSteps', 'Expected Result', 'Actual Result', 'Steps to Execute', 'Expected Result.1', 'Actual Result.1', 'Status', 'Executed QA Name ', 'Misc (Comments)', 'Priority', 'Is Automated']
# Reindex and add dummy columns to mimic the exact template's redundant columns if needed, but the user expects the same columns.
df_final = pd.DataFrame(columns=template_cols)
# Mapping our data nicely:
for c in template_cols:
    if c in df_cases.columns:
        df_final[c] = df_cases[c]
    # Handle misnomers in template
    if c == 'Executed QA Name ':
        df_final[c] = df_cases['Executed QA Name']
    if c == 'TestSteps':
         df_final[c] = df_cases['Steps to Execute']

df_final.to_excel('Restful_Booker_Enterprise_Test_Cases.xlsx', index=False)
print("Excel test cases successfully generated.")
