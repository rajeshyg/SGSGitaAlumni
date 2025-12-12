import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, '../logs/errors.log');

console.log('--- Testing File Logger ---');

// 1. Trigger a server error
console.log('1. Triggering server-side error...');
logger.error('Test Server Error', new Error('Simulated backend failure'));

// 2. Wait a moment for file write
setTimeout(() => {
    // 3. Check file content
    console.log('\n2. Reading log file...');
    if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        console.log('--- Log File Content ---');
        console.log(content);
        console.log('------------------------');
        
        if (content.includes('Test Server Error') && content.includes('Simulated backend failure')) {
            console.log('✅ Success: Log entry found.');
        } else {
            console.error('❌ Failure: Log entry missing.');
        }
    } else {
        console.error('❌ Failure: Log file does not exist.');
    }
}, 500);

