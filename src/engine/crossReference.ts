/**
 * 🔗 动态交叉引用同步引擎
 *
 * 功能：
 *   1. 维护全局引用映射表（图/表/公式 ID → 最新编号文本）
 *   2. 扫描正文 .cross-ref[data-target]，根据 target ID 同步文本
 *   3. 自动添加点击跳转事件（scrollIntoView）
 *   4. 目标丢失时高亮错误提示
 *
 * 用法：
 *   numberFigures() → numberTables() → numberFormulas() → updateCrossReferences()
 */

export interface ReferenceMap {
  [id: string]: string; // elementId → labelText
}

export interface CrossRef {
  id: string;       // 引用标记的 DOM id（如有）
  target: string;   // data-target 值
  current: string;  // 当前显示文本
  valid: boolean;   // 目标是否存在
}

export interface CrossReferenceResult {
  map: ReferenceMap;
  refs: CrossRef[];
  fixedCount: number;
  errorCount: number;
  html: string;
}

/**
 * 收集所有可被引用的元素（图表、公式）
 */
export function buildReferenceMap(html: string): ReferenceMap {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const map: ReferenceMap = {};

  // 图 (figure-caption)
  doc.querySelectorAll('.figure-caption, figcaption, [data-ref-label]').forEach((el) => {
    const id = el.id || (el as HTMLElement).getAttribute('data-ref-id');
    const label = (el as HTMLElement).getAttribute('data-ref-label');
    if (id && label) map[id] = label;
  });

  // 表 (table-caption, caption)
  doc.querySelectorAll('.table-caption, table caption').forEach((el) => {
    const id = el.id || (el as HTMLElement).getAttribute('data-ref-id');
    const label = (el as HTMLElement).getAttribute('data-ref-label');
    if (id && label) map[id] = label;
  });

  // 公式
  doc.querySelectorAll('.formula-container').forEach((el) => {
    const id = el.id;
    const label = (el as HTMLElement).getAttribute('data-ref-label');
    if (id && label) map[id] = label;
  });

  return map;
}

/**
 * 更新正文中所有交叉引用
 */
export function updateCrossReferences(html: string): CrossReferenceResult {
  const map = buildReferenceMap(html);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const refs: CrossRef[] = [];
  let fixedCount = 0;
  let errorCount = 0;

  const crossRefs = doc.querySelectorAll('.cross-ref');

  crossRefs.forEach((refEl) => {
    const targetId = refEl.getAttribute('data-target');
    if (!targetId) return;

    const ref: CrossRef = {
      id: refEl.id || '',
      target: targetId,
      current: refEl.textContent || '',
      valid: !!map[targetId],
    };

    if (map[targetId]) {
      refEl.textContent = map[targetId];
      (refEl as HTMLElement).style.color = '';
      (refEl as HTMLElement).style.cursor = 'pointer';
      (refEl as HTMLElement).style.textDecoration = 'underline';
      (refEl as HTMLElement).title = '点击跳转';
      refEl.addEventListener('click', () => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      fixedCount++;
    } else {
      refEl.textContent = '[引用错误]';
      (refEl as HTMLElement).style.color = 'red';
      (refEl as HTMLElement).style.cursor = 'not-allowed';
      errorCount++;
    }

    refs.push(ref);
  });

  return {
    map,
    refs,
    fixedCount,
    errorCount,
    html: doc.body.innerHTML,
  };
}

/**
 * 一键执行完整交叉引用流程：
 *   图表编号 → 公式编号 → 交叉引用同步
 */
export function fullCrossReferencePipeline(html: string): CrossReferenceResult {
  // 注意：此处假设图表编号已在外部执行
  return updateCrossReferences(html);
}

/**
 * 为图表/公式元素补充 data-ref-label 属性（供引用映射使用）
 */
export function annotateRefLabels(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 图标题
  doc.querySelectorAll('figcaption, .figure-caption, p:has(img)').forEach((el, i) => {
    if (!el.id) el.id = `fig-${i + 1}`;
    if (!el.getAttribute('data-ref-label')) {
      const existing = el.textContent?.match(/图\s*[\d.]+/);
      if (existing) {
        el.setAttribute('data-ref-label', existing[0]);
      }
    }
  });

  // 表标题
  doc.querySelectorAll('caption, .table-caption').forEach((el, i) => {
    if (!el.id) el.id = `tbl-${i + 1}`;
    if (!el.getAttribute('data-ref-label')) {
      const existing = el.textContent?.match(/表\s*[\d.]+/);
      if (existing) {
        el.setAttribute('data-ref-label', existing[0]);
      }
    }
  });

  // 公式
  doc.querySelectorAll('.formula-container').forEach((el) => {
    if (!el.getAttribute('data-ref-label')) {
      const numEl = el.querySelector('.formula-number');
      if (numEl?.textContent) {
        el.setAttribute('data-ref-label', numEl.textContent.trim());
      }
    }
  });

  return doc.body.innerHTML;
}

/**
 * 注入交叉引用 CSS
 */
export const CROSS_REF_CSS = /* css */ `
  .cross-ref {
    color: #2563eb; cursor: pointer; text-decoration: underline;
    font-weight: 500; transition: color 0.2s;
  }
  .cross-ref:hover { color: #1d4ed8; }
  .cross-ref-error { color: #dc2626 !important; cursor: not-allowed !important; text-decoration: line-through !important; }
`;
