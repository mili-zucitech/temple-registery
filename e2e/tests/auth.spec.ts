import { test, expect } from '../fixtures/base.fixture';
import { LoginPage } from '../pages/LoginPage';

test.describe('Authentication', () => {
  test('should_login_successfully_when_valid_credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('ta_chamundi', 'password123');
    
    // Verify redirected to dashboard
    await expect(page).toHaveURL(/\/ta\/dashboard/);
  });

  test('should_show_error_when_invalid_credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await loginPage.emailInput.fill('invalid_user');
    await loginPage.passwordInput.fill('WrongPassword');
    await loginPage.loginButton.click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('should_logout_successfully_when_user_clicks_logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('ta_chamundi', 'password123');

    // Logout from sidebar action
    await page.getByRole('button', { name: /sign out|logout/i }).click();
    
    // Verify redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});
