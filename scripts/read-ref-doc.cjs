const fs = require('fs');
const path = require('path');

// Read as GBK encoded text from the .doc file
const buf = fs.readFileSync('C:/Users/21018/Desktop/2-1南京理工大学继续教育学院毕业设计说明书（论文）撰写格式（2023版）.doc');

// The .doc file uses GBK encoding. Let's try to extract readable text
// Skip OLE2 header and try to find text streams
const raw = new Uint8Array(buf);

// Strategy: scan for GBK-encoded text blocks (Chinese characters in 0xB0-0xF7 + 0xA1-0xFE range)
let gbkText = '';
let inText = false;
let textStart = 0;

for (let i = 0; i < raw.length - 1; i++) {
  const b1 = raw[i];
  const b2 = raw[i + 1];
  // Check for GBK Chinese character range
  if (b1 >= 0xB0 && b1 <= 0xF7 && b2 >= 0xA1 && b2 <= 0xFE) {
    if (!inText) {
      inText = true;
      textStart = i;
    }
    // Decode all pending bytes as GBK
    i++; // skip next byte since it's part of this char
  } else if (inText && !((b1 >= 0xB0 && b1 <= 0xF7) || (b1 >= 0xA1 && b1 <= 0xFE))) {
    // End of text segment
    const segment = raw.slice(textStart, i);
    try {
      const decoder = new TextDecoder('gbk');
      const decoded = decoder.decode(segment);
      // Only keep if it has significant Chinese content
      const chineseCount = (decoded.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g) || []).length;
      if (chineseCount > 20) {
        gbkText += '\n\n' + decoded;
      }
    } catch (e) {
      // skip
    }
    inText = false;
  }
}

// Also try the CFB parser approach
const extractDocText = require('C:/Users/21018/Desktop/论文转换项目/src/engine/docParser.ts').extractDocText;

try {
  const result = extractDocText(buf.buffer);
  console.log('=== PARSER RESULT ===');
  console.log('Chars:', result.charCount);
  console.log('Paras:', result.paragraphCount);
  console.log('---');
  console.log(result.text.substring(0, 8000));
} catch (e) {
  console.error('Parser failed:', e.message);
  
  // Fallback: print the GBK text we found
  console.log('=== GBK SCAN RESULT ===');
  console.log(gbkText.substring(0, 8000));
}
