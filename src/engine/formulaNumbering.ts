/**
 * ➗ 公式自动编号与排版对齐引擎
 *
 * 功能：
 *   1. 识别独立公式块，根据所在 H1 章节自动生成编号 (chapter.index)
 *   2. 布局：公式主体居中 + 编号右对齐（CSS relative/absolute 定位）
 *   3. 编号格式：(2.3) 表示第2章第3个公式
 *
 * 工作原理：
 *   扫描包含 $$...$$ 或已包装为 .formula 的元素
 *   按 H1 章节分组，每个章节内递增编号
 */

export interface FormulaEntry {
  id: string;
  chapter: number;
  index: number;
  label: string; // "(2.3)"
  html: string;  // 公式 HTML
}

export interface FormulaNumberingResult {
  html: string;
  formulas: FormulaEntry[];
}

/**
 * 对 HTML 中的公式进行自动编号
 * 支持 $$...$$ 块和 <div class="formula"> 元素
 */
export function numberFormulas(html: string): FormulaNumberingResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  // ── 第一步：将 $$...$$ 替换为标准公式容器 ──
  const bodyHtml = body.innerHTML;
  const withContainers = bodyHtml.replace(
    /\$\$(.+?)\$\$/gs,
    (_, formula: string) => `<div class="formula-container" data-math="${escapeHtml(formula.trim())}">\n  <div class="formula-content">$$${formula.trim()}$$</div>\n  <div class="formula-number"></div>\n</div>`
  );
  body.innerHTML = withContainers;

  // ── 第二步：遍历章节，给公式编号 ──
  const formulas: FormulaEntry[] = [];
  let chapter = 0;
  let chapterFormulaIndex = 0;

  // 按 DOM 顺序扫描所有 H1 和公式容器
  const children = Array.from(body.querySelectorAll('h1, h2, .formula-container'));

  for (const el of children) {
    if (el.tagName === 'H1') {
      chapter++;
      chapterFormulaIndex = 0;
    } else if (el.tagName === 'H2') {
      // H2 不重置章节数（属于当前 H1 下）
    } else if (el.classList.contains('formula-container')) {
      chapterFormulaIndex++;
      const numEl = el.querySelector('.formula-number');
      if (!numEl) continue;

      const label = `(${chapter}.${chapterFormulaIndex})`;
      numEl.textContent = label;

      const id = `formula-${chapter}-${chapterFormulaIndex}`;
      el.id = id;
      el.setAttribute('data-ref-label', label);

      // 注入居中对齐 + 右编号的 style
      const htmlEl = el as HTMLElement;
      htmlEl.style.cssText = `
        position: relative; display: flex; justify-content: center;
        align-items: center; width: 100%; margin: 18px 0;
      `;
      const numHtmlEl = numEl as HTMLElement;
      numHtmlEl.style.cssText = `
        position: absolute; right: 0; font-family: "Times New Roman", serif;
        font-size: 10.5pt; min-width: 50px; text-align: right;
      `;

      formulas.push({
        id,
        chapter,
        index: chapterFormulaIndex,
        label,
        html: el.querySelector('.formula-content')?.innerHTML || '',
      });
    }
  }

  return { html: body.innerHTML, formulas };
}

/**
 * 为公式段落注入 CSS 样式
 */
export const FORMULA_CSS = /* css */ `
  .formula-container {
    position: relative; display: flex; justify-content: center;
    align-items: center; width: 100%; margin: 18px 0;
  }
  .formula-content { text-align: center; }
  .formula-number {
    position: absolute; right: 0;
    font-family: "Times New Roman", serif;
    font-size: 10.5pt; min-width: 50px; text-align: right;
  }
`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
