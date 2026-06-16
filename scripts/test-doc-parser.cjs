/**
 * 测试 docParser 对真实和伪 .doc 文件的解析
 */
const fs = require('fs');
const path = require('path');

// 使用 tsx 在 Node 中加载 TS 模块
require('tsx/cjs');
const { extractDocText, isActuallyDocx } = require('../src/engine/docParser');

async function test() {
  const base = 'C:/Users/21018/Desktop';

  // ── 测试 1：真实 .doc（中文 ANSI） ──
  const realDocPath = path.join(base, 'test-chinese.doc');
  if (fs.existsSync(realDocPath)) {
    const buf = fs.readFileSync(realDocPath);
    const data = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    console.log('── 测试 1: 真实 .doc (中文) ──');
    console.log('  文件大小:', buf.length, 'bytes');
    console.log('  ZIP魔数:', isActuallyDocx(data));

    const result = extractDocText(buf.buffer);
    console.log('  字符数:', result.charCount);
    console.log('  段落数:', result.paragraphCount);
    console.log('  isActuallyDocx:', result.isActuallyDocx);
    console.log('  前200字:', result.text.slice(0, 200));
    console.log('');
  }

  // ── 测试 2：伪 .doc (.docx 改后缀) ──
  const fakeDocPath = path.join(base, 'test-fake-doc.doc');
  if (fs.existsSync(fakeDocPath)) {
    const buf = fs.readFileSync(fakeDocPath);
    const data = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    console.log('── 测试 2: 伪 .doc (实际 .docx) ──');
    console.log('  文件大小:', buf.length, 'bytes');
    console.log('  ZIP魔数:', isActuallyDocx(data));

    try {
      const result = extractDocText(buf.buffer);
      console.log('  isActuallyDocx:', result.isActuallyDocx);
      console.log('  字符数:', result.charCount);
    } catch (err) {
      console.log('  解析异常（预期）:', err.message.slice(0, 80));
    }
    console.log('');
  }

  console.log('✅ 测试完成');
}

test().catch(e => console.error('测试失败:', e));
