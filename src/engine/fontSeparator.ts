/**
 * 🔠 中英文字体自动分离引擎
 *
 * 功能：遍历 DOM 文本节点，将英文/数字/半角标点用 <span class="font-tnr"> 包裹，
 *       中文保持原样，实现中英文字体自动分离。
 *
 * CSS 预设：
 *   .font-simsun { font-family: SimSun, serif; }
 *   .font-tnr { font-family: "Times New Roman", serif; }
 */

/** 匹配英文字母、数字、半角标点 */
const TNR_REGEX = /([a-zA-Z0-9\x20-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]+)/g;

/** 已处理标记，避免重复处理 */
const PROCESSED_CLASS = 'font-tnr-processed';

export interface FontSeparationResult {
  html: string;
  affectedNodes: number;
  wrappedSpans: number;
}

/**
 * 对 HTML 字符串执行中英文字体分离
 * @param html 原始 mammoth HTML
 * @returns 处理后的 HTML + 统计信息
 */
export function separateFonts(html: string): FontSeparationResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let affectedNodes = 0;
  let wrappedSpans = 0;

  const walker = doc.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_TEXT,
    null,
  );

  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const node of textNodes) {
    const parent = node.parentNode;
    if (!parent) continue;

    // 跳过脚本/样式/已处理节点
    const el = parent as HTMLElement;
    if (el.nodeName === 'SCRIPT' || el.nodeName === 'STYLE') continue;
    if (el.classList?.contains(PROCESSED_CLASS)) continue;
    if (el.classList?.contains('font-tnr')) continue;

    const text = node.nodeValue;
    if (!text || !TNR_REGEX.test(text)) continue;

    affectedNodes++;
    const fragment = doc.createDocumentFragment();
    let lastIndex = 0;
    const matches = text.matchAll(TNR_REGEX);

    for (const m of matches) {
      const offset = m.index!;
      const match = m[0];

      // 插入中文部分（保持原样）
      if (offset > lastIndex) {
        fragment.appendChild(doc.createTextNode(text.substring(lastIndex, offset)));
      }

      // 插入英文/数字部分（包裹 span）
      const span = doc.createElement('span');
      span.className = 'font-tnr';
      span.textContent = match;
      fragment.appendChild(span);
      wrappedSpans++;

      lastIndex = offset + match.length;
    }

    // 插入剩余的中文部分
    if (lastIndex < text.length) {
      fragment.appendChild(doc.createTextNode(text.substring(lastIndex)));
    }

    parent.replaceChild(fragment, node);
  }

  // 标记 body（避免全局样式覆盖时的冲突）
  doc.body.classList.add('font-simsun');

  return {
    html: doc.body.innerHTML,
    affectedNodes,
    wrappedSpans,
  };
}

/**
 * 注入字体分离所需的 CSS 样式
 */
export const FONT_SEPARATION_CSS = `
.font-simsun { font-family: SimSun, serif, "宋体"; }
.font-tnr { font-family: "Times New Roman", serif; }
`;
