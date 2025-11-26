import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./src2/config.json', 'utf-8'));
export default config;