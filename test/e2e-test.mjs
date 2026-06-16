/**
 * E2E Test — 用 mammoth + docx 在 Node 端模拟浏览器全流程
 * 验证：读取 test-paper → mammoth 解析 → 正则检测标题 → docx 重建 → 输出非空
 * （无 jsdom 依赖，纯正则解析 HTML）
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import {
  Document, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Packer, Header, Footer, PageNumber, LineRuleType,
} from 'docx';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 轻量 HTML 正文提取（无需 DOM 解析器） ──
function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 从 mammoth 输出的 HTML 片段中提取顶级元素。
 * mammoth 输出无 <html>/<body> 包装，直接是 <p>/<h1>/<h2>...
 */
function extractTopLevelElements(html) {
  const elements = [];
  const tagRe = /<(?!!)(\w+)(\s[^>]*)?>|<\/(\w+)>/gi;
  const voidTags = new Set(['br', 'hr', 'img', 'input', 'meta', 'link']);

  let pos = 0;
  const stack = [];
  let match;

  while ((match = tagRe.exec(html)) !== null) {
    const isClose = !!match[3];
    const tagName = (isClose ? match[3] : match[1]).toLowerCase();

    if (!isClose) {
      if (stack.length === 0) {
        // 记录顶级元素起始位置
        stack.push({ tag: tagName, start: match.index });
      } else if (!voidTags.has(tagName)) {
        stack.push({ tag: tagName, start: match.index });
      }
    } else {
      // 找到匹配的开标签
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tagName) {
          if (i === 0) {
            const full = html.substring(stack[i].start, match.index + match[0].length);
            elements.push(full);
          }
          stack.length = i;
          break;
        }
      }
    }
  }

  return elements;
}

function getTagName(child) {
  const m = child.match(/^<(\w+)/);
  return m ? m[1].toLowerCase() : 'unknown';
}

function getTextContent(child) {
  return stripHtml(child);
}

// ── 标题检测 ──
const HEADING_PATTERNS = {
  h1: /^(第[零一二三四五六七八九十百千]+[章节篇]|摘\s*要|ABSTRACT|参\s*考\s*文\s*献|致\s*谢|目\s*录|绪\s*论|结\s*论|附\s*录|前\s*言|后\s*记|声明|鸣\s*谢)/i,
  h3: /^\d+\.\d+\.\d+(?:\.\d+)*[\s\u4e00-\u9fa5A-Za-z]/,
  h2: /^\d+\.\d+(?!\.\d)[\s\u4e00-\u9fa5A-Za-z]/,
};

const isReferenceLine = (text) => /^\[\d+\]/.test(text) || /^\[\d+-\d+\]/.test(text);

const detectType = (text) => {
  if (isReferenceLine(text)) return 'reference';
  if (HEADING_PATTERNS.h3.test(text)) return 'h3';
  if (HEADING_PATTERNS.h2.test(text)) return 'h2';
  if (HEADING_PATTERNS.h1.test(text)) return 'h1';
  return 'p';
};

// ── 模板（GB-7713 国标） ──
const config = {
  page: { width: 11906, height: 16838, marginTop: 907, marginBottom: 907, marginLeft: 1134, marginRight: 1134 },
  title: { fontFamilyCN: '黑体', fontFamilyEN: 'Times New Roman', fontSize: 44, bold: true, alignment: 'center', spacingBefore: 0, spacingAfter: 0, lineSpacing: 360, firstLineIndent: 0 },
  h1: { fontFamilyCN: '黑体', fontFamilyEN: 'Times New Roman', fontSize: 32, bold: true, alignment: 'center', spacingBefore: 240, spacingAfter: 120, lineSpacing: 360, firstLineIndent: 0 },
  h2: { fontFamilyCN: '黑体', fontFamilyEN: 'Times New Roman', fontSize: 28, bold: true, alignment: 'left', spacingBefore: 200, spacingAfter: 100, lineSpacing: 360, firstLineIndent: 0 },
  h3: { fontFamilyCN: '黑体', fontFamilyEN: 'Times New Roman', fontSize: 24, bold: true, alignment: 'left', spacingBefore: 160, spacingAfter: 80, lineSpacing: 360, firstLineIndent: 0 },
  body: { fontFamilyCN: '宋体', fontFamilyEN: 'Times New Roman', fontSize: 24, bold: false, alignment: 'both', spacingBefore: 0, spacingAfter: 0, lineSpacing: 360, firstLineIndent: 480 },
  headerFooter: { headerText: '基于深度学习的NLP在智能问答系统中的应用研究', showPageNumber: true },
};

const ALIGNMENT_MAP = { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, both: AlignmentType.BOTH };
const HEADING_LEVEL_MAP = { h1: HeadingLevel.HEADING_1, h2: HeadingLevel.HEADING_2, h3: HeadingLevel.HEADING_3 };

// ── 主流程 ──
const buffer = readFileSync(__dirname + '/test-paper.docx');

console.log('📄 读入测试论文...');
const { value: html, messages } = await mammoth.convertToHtml(
  { buffer },
  {
    styleMap: [
      "p[style-name='Heading 1'] => h1:fresh", "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h3:fresh", "p[style-name='标题 1'] => h1:fresh",
      "p[style-name='标题 2'] => h2:fresh", "p[style-name='标题 3'] => h3:fresh",
      "p[style-name='一级标题'] => h1:fresh", "p[style-name='二级标题'] => h2:fresh",
      "p[style-name='章标题'] => h1:fresh", "p[style-name='节标题'] => h2:fresh",
      "p[style-name='1 标题 1'] => h1:fresh", "p[style-name='2 标题 2'] => h2:fresh",
    ],
  }
);

console.log(`📊 mammoth 解析完成 (HTML ${html.length} chars, ${messages.length} msgs)`);
const warnings = messages.filter(m => m.type === 'warning');
if (warnings.length) warnings.slice(0, 3).forEach(w => console.warn(' ⚠', w.message));

// 正则轻量解析 HTML 正文块
const children = extractTopLevelElements(html);
const nodes = [];

for (const child of children) {
  const tag = getTagName(child);
  const text = getTextContent(child);
  if (!text) continue;

  let type;
  switch (tag) {
    case 'h1': type = 'h1'; break;
    case 'h2': type = 'h2'; break;
    case 'h3': type = 'h3'; break;
    default: type = detectType(text);
  }
  nodes.push({ type, text });
}

console.log(`📑 节点解析: ${nodes.length} 段`);

// 统计
const stats = {
  h1: nodes.filter(n => n.type === 'h1').length,
  h2: nodes.filter(n => n.type === 'h2').length,
  h3: nodes.filter(n => n.type === 'h3').length,
  body: nodes.filter(n => n.type === 'p').length,
  ref: nodes.filter(n => n.type === 'reference').length,
};
console.log(`   章节: ${stats.h1} | 小节: ${stats.h2} | 条: ${stats.h3} | 正文: ${stats.body} | 参考文献: ${stats.ref}`);

// 打印标题结构
console.log('\n📋 文档结构:');
nodes.forEach(n => {
  const prefix = { h1: '📍', h2: ' ├─', h3: ' │  ├─', p: '    ', reference: ' 📎' }[n.type];
  console.log(`  ${prefix} [${n.type}] ${n.text.substring(0, 60)}`);
});

// 构建段落
const paragraphs = [];
for (const node of nodes) {
  const style = config[node.type === 'reference' ? 'body' : node.type] || config.body;
  const headingLevel = HEADING_LEVEL_MAP[node.type];

  const children = [new TextRun({
    text: node.text,
    bold: style.bold,
    size: style.fontSize,
    font: { eastAsia: style.fontFamilyCN, ascii: style.fontFamilyEN, hAnsi: style.fontFamilyEN },
  })];

  paragraphs.push(new Paragraph({
    children,
    alignment: ALIGNMENT_MAP[style.alignment],
    spacing: { before: style.spacingBefore, after: style.spacingAfter, line: style.lineSpacing, lineRule: LineRuleType.AUTO },
    ...(headingLevel !== undefined && { heading: headingLevel }),
    ...(style.firstLineIndent > 0 && node.type === 'p' && { indent: { firstLine: style.firstLineIndent } }),
  }));
}

// 构建 Document
const document = new Document({
  sections: [{
    properties: { page: { size: { width: config.page.width, height: config.page.height }, margin: { top: config.page.marginTop, bottom: config.page.marginBottom, left: config.page.marginLeft, right: config.page.marginRight } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: config.headerFooter.headerText, font: { eastAsia: '宋体', ascii: 'Times New Roman' }, size: 18, italics: true, color: '888888' })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: { eastAsia: '宋体', ascii: 'Times New Roman' }, size: 18 })] })] }) },
    children: paragraphs,
  }],
});

console.log('\n📦 打包中...');
const outBuffer = await Packer.toBuffer(document);
const outPath = __dirname + '/test-paper-output.docx';
writeFileSync(outPath, outBuffer);

console.log(`✅ 输出: test-paper-output.docx (${(outBuffer.length / 1024).toFixed(1)} KB)`);

if (outBuffer.length < 2000) {
  console.error('❌ FAIL: 输出文件太小 (<2KB)，可能为空！');
  process.exit(1);
} else {
  console.log('✅ PASS: 输出文件大小正常');
}

// 反向验证：用 mammoth 再读一遍输出
const { value: html2 } = await mammoth.convertToHtml({ buffer: outBuffer });
const textLen = stripHtml(html2).length;
console.log(`✅ 反向验证: 输出文件可读，文本 ${textLen} chars`);
if (textLen < 100) {
  console.error('❌ FAIL: 输出文本过短');
  process.exit(1);
}

console.log('\n🎉 全流程 E2E 测试通过！');
