const fs = require('fs');
const iconv = require('iconv-lite');

const buf = fs.readFileSync('C:/Users/21018/Desktop/2-1南京理工大学继续教育学院毕业设计说明书（论文）撰写格式（2023版）.doc');
const raw = new Uint8Array(buf);

// Find WordDocument stream in OLE2
// The WordDocument stream typically starts with the FIB (File Information Block)
// Scan for GBK text blocks
let text = '';
let segment = [];
let inChinese = false;

for (let i = 0; i < raw.length; i++) {
  const b = raw[i];
  // GBK: first byte 0x81-0xFE
  if (b >= 0x81 && b <= 0xFE && i + 1 < raw.length) {
    const b2 = raw[i + 1];
    if (b2 >= 0x40 && b2 <= 0xFE && b2 !== 0x7F) {
      // Valid GBK double-byte
      segment.push(b, b2);
      i++;
      inChinese = true;
      continue;
    }
  }
  
  // ASCII printable or common whitespace
  if ((b >= 0x20 && b <= 0x7E) || b === 0x0D || b === 0x0A || b === 0x09) {
    segment.push(b);
    continue;
  }
  
  // End of segment
  if (segment.length > 0) {
    try {
      const decoded = iconv.decode(Buffer.from(segment), 'gbk');
      const cleaned = decoded.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '').trim();
      if (cleaned.length > 10) {
        text += cleaned + '\n';
      }
    } catch(e) {}
    segment = [];
  }
}

// Print the result
console.log('=== 格式参考文档 完整内容 ===');
const lines = text.split('\n').filter(l => l.trim().length > 0 && /[\u4e00-\u9fff]/.test(l));
console.log(lines.join('\n\n'));
