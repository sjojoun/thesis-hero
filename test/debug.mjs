import mammoth from 'mammoth';
import { readFileSync } from 'fs';
const buf = readFileSync('test/test-paper.docx');
const { value: html } = await mammoth.convertToHtml({ buffer: buf });
console.log('LENGTH:', html.length);
console.log('FIRST 500:');
console.log(html.substring(0, 500));
console.log('---LAST 200:');
console.log(html.substring(Math.max(0, html.length - 200)));
