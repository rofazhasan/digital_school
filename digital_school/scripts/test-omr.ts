
import { processOMR } from '../lib/omr-processing';
import * as fs from 'fs/promises';
import path from 'path';

// Fix for Jimp requirement in test script if needed, but processOMR handles it internally now.


async function main() {
    // const filePath = '/Users/md.rofazhasanrafiu/coding/HSTU-Physics(Extra).jpg';
    const filePath = path.join(process.cwd(), 'mockup-omr.jpg');

    try {
        console.log(`Reading file: ${filePath}`);
        const buffer = await fs.readFile(filePath);

        console.log('Processing OMR...');
        const result = await processOMR(buffer, 'image/jpeg');

        if (result.error) {
            console.error('OMR Failed:', result.error);
        } else {
            console.log('OMR Success!');
            console.log('Roll:', result.roll);
            console.log('Set:', result.set);
            console.log('Answers detected:', Object.keys(result.answers).length);
            console.log('Sample Answers:', JSON.stringify(result.answers, null, 2));
            if (result.debugImage) {
                const base64Data = result.debugImage.replace(/^data:image\/\w+;base64,/, "");
                await fs.writeFile('debug-omr.jpg', base64Data, 'base64');
                console.log('Saved debug-omr.jpg');
            }
        }
    } catch (error) {
        console.error('Test Script Error:', error);
    }
}

main();
