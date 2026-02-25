const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('pageerror', err => {
        console.log('Page error: ' + err.message);
    });

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Console error: ' + msg.text());
        }
    });

    try {
        await page.goto('http://localhost:8080', { waitUntil: 'load', timeout: 5000 });
        await page.waitForTimeout(2000);
    } catch (e) {
        console.log('Navigation or Timeout: ' + e.message);
    }

    await browser.close();
})();
