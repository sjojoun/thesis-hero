/**
 * 📑 目录自动生成引擎 (TOC Generator)
 * 扫描 mammoth 输出的 HTML 标题，生成目录数据，
 * 最终在 docx 里插入 TOC 字段（纯目录段落，兼容 Word 自动目录）。
 */
import { Paragraph, TextRun, HeadingLevel, AlignmentType, TableOfContents } from 'docx';

/** 浏览器内置 HTML 解析器（无需 jsdom） */
function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

export interface TocEntry {
  level: number;    // 1 | 2 | 3
  text: string;
  id: string;
  page?: number;   // 仅占位，真实页码由 Word 打开后更新域
}

/**
 * 从 mammoth HTML 中提取标题结构
 */
export function extractTocEntries(html: string): TocEntry[] {
  const doc = parseHtml(html);
  const headings = doc.querySelectorAll('h1, h2, h3');
  const toc: TocEntry[] = [];

  headings.forEach((el: Element, idx: number) => {
    const level = parseInt(el.tagName.charAt(1), 10);
    const text = el.textContent?.trim() ?? '';
    const id = `toc-heading-${idx}`;
    el.setAttribute('id', id);
    toc.push({ level, text, id });
  });

  return toc;
}

/**
 * 生成目录页段落（含「目录」标题 + 各条目带前导点的行）
 * 注：纯段落方案兼容所有 Word 版本；如需可更新域请用 TableOfContents。
 */
export function buildTocParagraphs(entries: TocEntry[], opts?: {
  tocTitle?: string;
  fontFamilyCN?: string;
  fontFamilyEN?: string;
}): Paragraph[] {
  const {
    tocTitle = '目录',
    fontFamilyCN = '黑体',
    fontFamilyEN = 'Times New Roman',
  } = opts ?? {};

  const paragraphs: Paragraph[] = [
    // 目录标题
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 200 },
      children: [
        new TextRun({
          text: tocTitle,
          bold: true,
          size: 32,
          font: { eastAsia: fontFamilyCN, ascii: fontFamilyEN, hAnsi: fontFamilyEN },
        }),
      ],
    }),
  ];

  // 各层级条目
  for (const entry of entries) {
    const indent = (entry.level - 1) * 360; // 每级缩进 0.25 字符
    paragraphs.push(
      new Paragraph({
        indent: { left: indent },
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: entry.text,
            size: entry.level === 1 ? 24 : 22,
            bold: entry.level === 1,
            font: { eastAsia: '宋体', ascii: fontFamilyEN, hAnsi: fontFamilyEN },
          }),
          new TextRun({
            text: ' ........................................',
            size: 20,
            color: '999999',
            font: { eastAsia: '宋体', ascii: 'Times New Roman', hAnsi: 'Times New Roman' },
          }),
        ],
        // 超链接定位（docx 需用 HyperlinkRef，这里仅占位）
      })
    );
  }

  // 分隔空行
  paragraphs.push(new Paragraph({ text: '' }));
  return paragraphs;
}

/**
 * 使用 docx 原生 TableOfContents（需要 Word 打开后右键「更新域」）
 * 适合对 Word 操作熟悉的学校模板
 */
export function buildTocField(): TableOfContents {
  return new TableOfContents('目录', {
    headingStyleRange: '1-3',
  });
}
