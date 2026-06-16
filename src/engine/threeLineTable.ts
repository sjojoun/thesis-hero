/**
 * 📊 智能三线表与跨页"续表"生成引擎
 *
 * 功能：
 *   1. 将普通 HTML 表格转为三线表样式（顶线粗、底线粗、表头下线细）
 *   2. 表内容/表名使用五号宋体（10.5pt）
 *   3. 跨页时自动截断，下一页顶部生成带"（续）"字样的表头
 */

export interface ThreeLineTableResult {
  html: string;
  tableCount: number;
  css: string;
}

/** A4 页面可用高度估算（297mm - 上下页边距 ≈ 920px） */
const DEFAULT_PAGE_HEIGHT = 920;

/**
 * 将 HTML 中所有表格转为三线表
 */
export function convertToThreeLineTables(html: string): ThreeLineTableResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const tables = doc.querySelectorAll('table');
  let tableCount = 0;

  tables.forEach((table) => {
    table.classList.add('three-line-table');
    table.setAttribute('data-table-num', String(++tableCount));

    // 确保表格有 thead
    if (!table.querySelector('thead')) {
      const firstRow = table.querySelector('tr');
      if (firstRow) {
        const thead = doc.createElement('thead');
        firstRow.parentNode?.insertBefore(thead, firstRow);
        thead.appendChild(firstRow);

        // 剩余 row 放入 tbody
        const remaining = table.querySelectorAll('tr:not(thead tr)');
        if (remaining.length > 0) {
          const tbody = doc.createElement('tbody');
          remaining.forEach(tr => tbody.appendChild(tr));
          table.appendChild(tbody);
        }
      }
    }
  });

  return { html: doc.body.innerHTML, tableCount, css: THREE_LINE_TABLE_CSS };
}

/**
 * 按页面高度拆分超长表格，后续表格自动带"（续）"表头
 */
export function splitLongTables(html: string, pageHeight: number = DEFAULT_PAGE_HEIGHT): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables = doc.querySelectorAll('table.three-line-table');

  tables.forEach((table) => {
    const tbody = table.querySelector('tbody');
    const thead = table.querySelector('thead');
    if (!tbody || !thead) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length <= 12) return; // 少于12行不分页

    const estHeaderHeight = 30;
    const estRowHeight = 35;
    const rowsPerPage = Math.floor((pageHeight - estHeaderHeight) / estRowHeight);
    if (rowsPerPage >= rows.length) return;

    // 从第二页开始拆分
    let insertAfter = table;
    for (let start = rowsPerPage; start < rows.length; start += rowsPerPage) {
      const newTable = document.createElement('table');
      newTable.className = 'three-line-table';
      newTable.setAttribute('data-table-num', table.getAttribute('data-table-num') || '');

      // 复制"（续）"表头
      const caption = document.createElement('caption');
      caption.textContent = `表 ${table.getAttribute('data-table-num') || ''}（续）`;
      caption.className = 'continued-caption';
      newTable.appendChild(caption);

      // 复制thead
      newTable.appendChild(thead.cloneNode(true));

      // 复制 tbody
      const newTbody = document.createElement('tbody');
      const end = Math.min(start + rowsPerPage, rows.length);
      for (let i = start; i < end; i++) {
        newTbody.appendChild(rows[i].cloneNode(true));
      }
      newTable.appendChild(newTbody);

      insertAfter.parentNode?.insertBefore(newTable, insertAfter.nextSibling);
      insertAfter = newTable;
    }

    // 删除原始 tbody 中的后续行
    for (let i = rowsPerPage; i < rows.length; i++) {
      rows[i].remove();
    }
  });

  return doc.body.innerHTML;
}

export const THREE_LINE_TABLE_CSS = /* css */ `
  .three-line-table {
    border-collapse: collapse; width: 100%; margin: 16px 0;
    border-top: 1.5pt solid black; border-bottom: 1.5pt solid black;
  }
  .three-line-table th, .three-line-table td {
    border: none; padding: 5px 8px; font-family: SimSun,serif;
    font-size: 10.5pt; text-align: center; vertical-align: middle;
  }
  .three-line-table thead { border-bottom: 1pt solid black; }
  .three-line-table caption {
    font-family: SimSun,serif; font-size: 10.5pt; font-weight: bold;
    text-align: center; margin-bottom: 6px;
  }
  .three-line-table .continued-caption { margin-top: 24px; font-weight: bold; }
`;
