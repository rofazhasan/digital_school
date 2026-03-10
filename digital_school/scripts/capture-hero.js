const puppeteer = require('puppeteer');
const path = require('path');

async function captureHero() {
    console.log('Launching browser to capture hero...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage();
        const filePath = `file://${path.resolve(__dirname, 'generate-hero-mockup.html')}`;

        await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
        console.log(`Navigating to ${filePath}`);
        await page.goto(filePath, { waitUntil: 'networkidle0' });

        // Wait for images to load
        await new Promise(r => setTimeout(r, 1000));

        await page.screenshot({ path: path.join(__dirname, '../public/hero-mockup.png') });
        console.log('Hero image successfully saved to public/hero-mockup.png');
    } catch (error) {
        console.error('Failed to generate hero image:', error);
    } finally {
        await browser.close();
    }
}

captureHero();
