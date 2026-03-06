const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function captureScreenshots() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });

    try {
        const page = await browser.newPage();

        // Set dark mode preference
        await page.emulateMediaFeatures([
            { name: 'prefers-color-scheme', value: 'dark' },
        ]);

        // Wait for the server to be fully ready
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 60000 });

        // Remove any potential cookie banners or popups if they obscure the view (optional)

        // Desktop Screenshot
        console.log('Capturing Desktop screenshot...');
        await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
        // Let animations finish
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: path.join(__dirname, '../public/desktop-screenshot.png'), fullPage: true });

        // Mobile Screenshot
        console.log('Capturing Mobile screenshot...');
        await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: path.join(__dirname, '../public/mobile-screenshot.png'), fullPage: false });

        console.log('Screenshots captured successfully!');
    } catch (error) {
        console.error('Error capturing screenshots:', error);
    } finally {
        await browser.close();
    }
}

captureScreenshots();
