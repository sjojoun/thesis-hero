/**
 * 生成测试 .doc 文件（中文 GBK 编码），使用 cfb 低级 API
 */
const cfb = require('cfb');
const fs = require('fs');
const iconv = require('iconv-lite');

// ── 中文文本 ──
const lines = [
  '第一章 引言',
  '本文研究基于深度学习的中文自然语言处理方法。',
  '近年来，随着Transformer架构的提出，自然语言处理领域取得了突破性进展。',
  '第二节 相关工作',
  'BERT模型通过预训练+微调的范式，在多项NLP任务上取得了最优结果。',
  '第三节 实验方法',
  '我们使用了包含100万条中文语料的训练集，在8卡GPU集群上进行训练。',
  '实验结果表明，改进后的模型在准确率上提升了3.2个百分点。',
  '参考文献',
  '[1] Vaswani A, et al. Attention Is All You Need. NeurIPS 2017.',
  '[2] Devlin J, et al. BERT: Pre-training of Deep Bidirectional Transformers. NAACL 2019.',
];
const text = lines.join('\r');

// .doc ANSI: GBK 编码（中文 Word 97-2003 默认）
const textBuf = iconv.encode(text, 'gbk');
console.log('textBuf length (GBK):', textBuf.length, 'bytes');

// FIB 512 bytes
const fib = Buffer.alloc(512, 0);
fib.writeUInt16LE(0xA5EC, 0);         // magic (Word)
fib.writeUInt16LE(0x00C1, 2);         // nFib (Word 97)
fib.writeUInt16LE(0x0000, 0x0A);      // flags (not encrypted)
fib.writeUInt16LE(0x0804, 0x40);      // lidFE = 简体中文
fib.writeUInt32LE(textBuf.length, 0x4C); // ccpText (ANSI = byte count)

const clxBuf = makeCLX(textBuf.length);
fib.writeUInt32LE(0, 0x01A2);         // fcClx
fib.writeUInt32LE(clxBuf.length, 0x01A6); // lcbClx

const wdStream = Buffer.concat([fib, textBuf]);

// ── 构造 CFB ──
const doc = cfb.utils.cfb_new({ type: 'buffer' });
cfb.utils.cfb_add(doc, 'WordDocument', wdStream);
cfb.utils.cfb_add(doc, '1Table', clxBuf);

const out = cfb.write(doc, { type: 'buffer', fileType: 'doc' });

// 验证
const verify = cfb.read(out, { type: 'buffer' });
console.log('FullPaths:', JSON.stringify(verify.FullPaths));
const wdVer = cfb.find(verify, 'WordDocument');
if (wdVer) {
  const content = wdVer.content;
  console.log('WordDocument:', content.length, 'bytes');
  // 检查 FIB magic
  const magic = readU16(content, 0);
  const nFib = readU16(content, 2);
  const ccpText = readU32(content, 0x4C);
  const lidFE = readU16(content, 0x40);
  console.log('  magic=0x' + magic.toString(16), 'nFib=0x' + nFib.toString(16), 'ccpText=' + ccpText, 'lidFE=0x' + lidFE.toString(16));
}

fs.writeFileSync('C:/Users/21018/Desktop/test-chinese.doc', out);
console.log('✅ test-chinese.doc');

// ── 伪 .doc ──
const docxPath = 'C:/Users/21018/Desktop/论文转换项目/test/test-paper.docx';
if (fs.existsSync(docxPath)) {
  fs.copyFileSync(docxPath, 'C:/Users/21018/Desktop/test-fake-doc.doc');
  console.log('✅ test-fake-doc.doc');
}

function makeCLX(textLen) {
  const buf = Buffer.alloc(256, 0);
  let off = 0;
  buf[off++] = 0x00; // GrPrc empty
  buf[off++] = 0x01; // Prc marker
  buf[off++] = 0x00; // cbGrpprl = 0
  buf[off++] = 0x02; // Pcdt marker
  buf.writeUInt32LE(13, off); off += 4; // lcb
  buf.writeUInt32LE(0, off); off += 4;      // CP[0]=0
  buf.writeUInt32LE(textLen, off); off += 4; // CP[1]=textLen
  buf.writeUInt32LE(512, off); off += 4;     // FC[0]=512
  buf[off++] = 0x01; // flag: ANSI
  return buf.slice(0, off);
}

function readU16(d, o) { return (d[o] | (d[o+1] << 8)) >>> 0; }
function readU32(d, o) { return (d[o] | (d[o+1] << 8) | (d[o+2] << 16) | (d[o+3] << 24)) >>> 0; }
