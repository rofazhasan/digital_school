import puppeteer from 'puppeteer';

interface StudentScriptPDFData {
    examId: string;
    studentId: string;
    baseUrl: string;
}

export async function generateStudentScriptPDF({ examId, studentId, baseUrl }: StudentScriptPDFData): Promise<Buffer> {
    const internalUrl = `${baseUrl}/internal/print-script/${examId}/${studentId}?secret=${process.env.JWT_SECRET}`;

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Navigate to the secure internal route
        await page.goto(internalUrl, { waitUntil: 'networkidle0', timeout: 60000 });

        // Wait for either the MathJax ready signal or error status
        await page.waitForFunction(() => {
            const statusEl = document.getElementById('puppeteer-status');
            if (statusEl) {
                const status = statusEl.getAttribute('data-status');
                if (status === 'error') return true; // Fail fast if there's an error
                if (status === 'ready') {
                    // Also wait for MathJax to signal it's done
                    return (window as any).__IS_MATHJAX_READY === true;
                }
            }
            return false;
        }, { timeout: 30000 });

        // Check if there was an error rendering
        const finalStatus = await page.evaluate(() => {
            return document.getElementById('puppeteer-status')?.getAttribute('data-status');
        });

        if (finalStatus === 'error') {
            const errorMsg = await page.evaluate(() => document.getElementById('puppeteer-status')?.textContent);
            throw new Error(`Failed to render student script: ${errorMsg}`);
        }

        // Generate the PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            }
        });

        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
}
