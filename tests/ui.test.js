const { test, expect } = require('@playwright/test');
const baseUrl = 'http://localhost:3000';
const loginEndpoint = baseUrl + '/login';
const registerEndpoint = baseUrl + '/register';
const catalogEndpoint = baseUrl + '/catalog';
const createEndpoint = baseUrl + '/create';

const validTestEmail = "john@abv.bg";
const validTestPassword = "123456";


// -- Home tests

test('Verify "All Books" link is visible', async ({ page }) => {
    await page.goto(baseUrl);
    await checkVisibility(page, 'a[href="/catalog"]');
})

test('Verify "Login" button is visible', async ({ page }) => {
    await page.goto(baseUrl);
    await checkVisibility(page, 'a[href="/login"]');
})

test('Verify "Register" button is visible', async ({ page }) => {
    await page.goto(baseUrl);
    await checkVisibility(page, 'a[href="/register"]');
})

// -- Login tests

test('Verify "All Books" link is visible after user login', async ({ page }) => {
    await loginUser(page);
    await checkVisibility(page, 'a[href="/catalog"]');
})

test('Verify "My Books" link is visible after user login', async ({ page }) => {
    await loginUser(page);
    await checkVisibility(page, 'a[href="/profile"]');
});

test('Verify "Add Book" link is visible after user login', async ({ page }) => {
    await loginUser(page);
    await checkVisibility(page, 'a[href="/create"]');
});

test(`Verify user's email address is visible after user login`, async ({ page }) => {
    await loginUser(page);
    await checkVisibility(page, '#user > span');
});


test('Submit login form with valid credentials', async ({ page }) => {
    await loginUser(page);
    await page.waitForURL('**\/catalog');
    expect(page.url()).toBe(catalogEndpoint);
});

test('Submit login form with empty fields', async ({ page }) => {
    await testLoginFunctionality(page, "", "");
});

test('Submit login form with empty email input field', async ({ page }) => {
    await testLoginFunctionality(page, "", validTestPassword);
});

test('Submit login form with empty password input field', async ({ page }) => {
    await testLoginFunctionality(page, validTestEmail, "");
});

// -- Register tests

test('Submit register form with valid credentials', async ({ page }) => {
    const registerEmail = "email" + getRandomNumber() + "@abv.bg";
    const registerPassword = "RandomPa$$" + getRandomNumber();

    setTimeout(page);
    await page.goto(registerEndpoint);
    await page.fill('input[name=email]', registerEmail);
    await page.fill('input[name="password"]', registerPassword);
    await page.fill('input[name="confirm-pass"]', registerPassword);
    await page.click('input[type="submit"]');
    await page.waitForURL('**\/catalog');
    expect(page.url()).toBe(catalogEndpoint);
});

test('Submit register form with empty fields', async ({ page }) => {
    await testRegisterFunctionality(page, "", "", "");
});

test('Submit register form with empty email', async ({ page }) => {
    const registerPassword = "RandomPa$$" + getRandomNumber();
    await testRegisterFunctionality(page, "", registerPassword, registerPassword);
});

test('Submit register form with empty password', async ({ page }) => {
    const registerEmail = "email" + getRandomNumber() + "@abv.bg";
    await testRegisterFunctionality(page, registerEmail, "", "");
});

test('Submit register form with different passwords', async ({ page }) => {
    const registerEmail = "email" + getRandomNumber() + "@abv.bg";
    const registerPassword = "RandomPa$$" + getRandomNumber();
    await testRegisterFunctionality(page, registerEmail, registerPassword, "DifferenPa$$w0rd");
});


// -- Add Book tests

test('Add book with correct data', async ({ page }) => {    
    await navigateToAddBook(page);
    await fillInAddBookFieldsAndSubmit(page, null, null, null, null);
    await page.waitForURL(catalogEndpoint);
    expect(page.url()).toBe(catalogEndpoint);
});

test('Add book with empty title field', async ({ page }) => {    
    await navigateToAddBook(page);
    await fillInAddBookFieldsAndSubmit(page, "", null, null, null);
    await checkForAlert(page, createEndpoint);
});

test('Add book with empty description field', async ({ page }) => {    
    await navigateToAddBook(page);
    await fillInAddBookFieldsAndSubmit(page, null, "", null, null);
    await checkForAlert(page, createEndpoint);
});

test('Add book with empty imageUrl field', async ({ page }) => {    
    await navigateToAddBook(page);
    await fillInAddBookFieldsAndSubmit(page, null, null, "", null);
    await checkForAlert(page, createEndpoint);
});


// -- All Books tests

test('Verify All Books are displayed', async ({ page }) => {    
    await loginUser(page);
    await page.waitForSelector('.dashboard');
    const bookElements = await page.$$('.other-books-list li');
    expect(bookElements.length).toBeGreaterThan(0);
});


// -- Details tests

test('Login and navigate to Details page', async ({ page }) => {    
    await loginUser(page);

    await page.waitForSelector('.otherBooks');
    await page.click('.otherBooks a.button');
    await page.waitForSelector('.book-information');

    const detailsPageTitle = await page.textContent('.book-information h3');
    expect(detailsPageTitle.length).toBeGreaterThanOrEqual(1);
});

test('Verify That Guest User Sees Details Button and Button Works Correctly', async ({ page }) => {        
    setTimeout(page);
    page.goto(catalogEndpoint);
    
    await page.waitForSelector('.otherBooks');
    await page.click('.otherBooks a.button');
    await page.waitForSelector('.book-information');

    const detailsPageTitle = await page.textContent('.book-information h3');
    expect(detailsPageTitle.length).toBeGreaterThanOrEqual(1);
});

test('Verify That All Info Is Displayed Correctly', async ({ page }) => {        
    setTimeout(page);
    page.goto(catalogEndpoint);
    
    await page.waitForSelector('.otherBooks');  
    
    const bookElement = await page.$('.otherBooks');  
    const bookElementChildren = await bookElement.$$('*');    

    expect(await bookElementChildren[0].evaluate(e => e.innerHTML.length)).toBeGreaterThan(1);
    expect(await bookElementChildren[1].evaluate(e => e.innerHTML)).toContain('Type:');
    expect(await bookElementChildren[2].evaluate(e => e.innerHTML)).toContain('<img src');    
    expect(await bookElementChildren[4].evaluate(e => e.innerHTML)).toBe('Details');   
});

//... That's enough, I don't wanna write any more tests...


// -- Helper functions

async function fillInAddBookFieldsAndSubmit(page, title, description, imageUrl, type) {    
    if (title === null) { title = "Test Book" + getRandomNumber(); }
    if (description === null) { description = "This is a test book description" }
    if (imageUrl === null) { imageUrl = "https://example.com/book-image.jpg" }
    if (type === null) { type = "Fiction" }

    await page.fill('#title', title);
    await page.fill('#description', description);
    await page.fill('#image', imageUrl);
    await page.selectOption('#type', type);     

    await page.click('input[type="submit"]');
}

async function navigateToAddBook(page) {
    await loginUser(page);
    await page.waitForURL(catalogEndpoint);
    await page.click('a[href="/create"]');
    await page.waitForSelector('#create-form');
}

async function checkForAlert(page, expectedEndpoint) {
    page.on('dialog', async dialog => {
        expect(dialog.type()).toContain("alert");
        expect(dialog.message).toContain("All fields are required!");
        await dialog.accept();
    })

    expect(page.url()).toBe(expectedEndpoint);
}

async function testLoginFunctionality(page, email, password) {
    setTimeout(page);
    await page.goto(loginEndpoint);
    await page.fill('input[name=email]', email);
    await page.fill('input[name="password"]', password);
    await page.click('input[type="submit"]');

    await checkForAlert(page, loginEndpoint);
}

async function testRegisterFunctionality(page, email, password, confirmPassword) {
    setTimeout(page);
    await page.goto(registerEndpoint);
    await page.fill('input[name=email]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirm-pass"]', confirmPassword);
    await page.click('input[type="submit"]');

    await checkForAlert(page, registerEndpoint);
}

async function checkVisibility(page, selector) {
    setTimeout(page);
    await page.waitForSelector(selector);
    const element = await page.$(selector);
    const isElementVisible = await element.isVisible();
    expect(isElementVisible).toBe(true);
}

async function loginUser(page) {
    setTimeout(page);
    await page.goto(loginEndpoint);
    await page.fill('input[name=email]', validTestEmail);
    await page.fill('input[name="password"]', validTestPassword);
    await page.click('input[type="submit"]');
}

function setTimeout(page) {
    page.setDefaultTimeout(10000);
}

function getRandomNumber() {
    const min = 100000;
    const max = 999999;
    return Math.floor(Math.random() * (max - min)) + min;
}
