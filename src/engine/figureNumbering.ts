/**
 * 🔢 图表自动编号引擎 (Auto-numbering for Figures & Tables)
 * 扫描 mammoth HTML 文本内容，用正则匹配并替换旧编号。
 * 支持格式：图 X、图X、图X-Y；表 X、表X、表X-Y
 */

/** 浏览器内置 HTML 解析器 */
function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

export interface RenumberResult {
  html: string;
  figCount: number;
  tableCount: number;
  /** 记录每处替换位置供 UI 高亮 */
  replacements: {
    kind: 'figure' | 'table';
    oldText: string;
    newText: string;
    index: number;
  }[];
}

/**
 * 全局扫描 HTML 文本，对所有图表占位符重新顺序编号。
 * 只会匹配「图」和「表」后紧跟数字的占位符，保留其他文字内容不变。
 */
export function renumberFiguresAndTables(html: string): RenumberResult {
  let figCount = 0;
  let tableCount = 0;
  const replacements: RenumberResult['replacements'] = [];

  const doc = parseHtml(html);

  // ── 处理 figure ──
  const figurePattern = /^(图\s*)(\d+(?:[-\.]\d+)*)(.*)$/;
  doc.querySelectorAll('p, li, span, td, th').forEach((el: Element) => {
    const text = el.textContent ?? '';
    const match = text.match(figurePattern);
    if (match && match[2]) {
      figCount++;
      const oldText = match[0];
      const newText = `图 ${figCount}${match[3] ?? ''}`;
      if (oldText !== newText) {
        el.textContent = newText;
        replacements.push({ kind: 'figure', oldText, newText, index: figCount });
      }
    }
  });

  // ── 处理 table ──
  const tablePattern = /^(表\s*)(\d+(?:[-\.]\d+)*)(.*)$/;
  doc.querySelectorAll('p, li, span, td, th').forEach((el: Element) => {
    const text = el.textContent ?? '';
    const match = text.match(tablePattern);
    if (match && match[2]) {
      tableCount++;
      const oldText = match[0];
      const newText = `表 ${tableCount}${match[3] ?? ''}`;
      if (oldText !== newText) {
        el.textContent = newText;
        replacements.push({ kind: 'table', oldText, newText, index: tableCount });
      }
    }
  });

  return {
    html: doc.documentElement.outerHTML,
    figCount,
    tableCount,
    replacements,
  };
}

/**
 * 统计图表总数（不修改内容）
 */
export function countFiguresAndTables(html: string): { figCount: number; tableCount: number } {
  const figurePattern = /图\s*\d+([-\.]\d+)?/g;
  const tablePattern = /表\s*\d+([-\.]\d+)?/g;
  const doc = parseHtml(html);
  const text = doc.body.textContent ?? '';
  const figMatches = text.match(figurePattern) ?? [];
  const tableMatches = text.match(tablePattern) ?? [];
  return { figCount: figMatches.length, tableCount: tableMatches.length };
}
