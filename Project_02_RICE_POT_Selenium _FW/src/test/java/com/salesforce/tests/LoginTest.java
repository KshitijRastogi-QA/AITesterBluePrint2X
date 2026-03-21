package com.salesforce.tests;

import com.salesforce.base.BaseTest;
import com.salesforce.pages.LoginPage;
import org.testng.Assert;
import org.testng.annotations.Test;

public class LoginTest extends BaseTest {

    @Test
    public void verifyValidLogin() {
        try {
            LoginPage loginPage = new LoginPage(driver);
            loginPage.doLogin("validuser@salesforce.com", "validPassword123!");
            Assert.assertNotEquals(driver.getCurrentUrl(), "https://login.salesforce.com/?locale=in");
        } catch (Exception e) {
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void verifyInvalidLogin() {
        try {
            LoginPage loginPage = new LoginPage(driver);
            loginPage.doLogin("invaliduser@salesforce.com", "invalidPassword!");
            String actualError = loginPage.getErrorMessage();
            Assert.assertTrue(actualError.contains("check your username and password"));
        } catch (Exception e) {
            Assert.fail(e.getMessage());
        }
    }
}
