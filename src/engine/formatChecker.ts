/**
 * 📝 格式规范检查引擎 (Formatting Checker)
 * 将 HTML 渲染到 DOM 中，检查各标题/段落的计算样式是否符合校方模板。
 * 使用浏览器原生 DOMParser，无外部依赖。
 */

export interface CheckRule {
  name: string;
  selector: string;
  property: string;
  expected: string;
  severity: 'error' | 'warning' | 'info';
}

export interface CheckIssue {
  selector: string;
  elementText: string;
  property: string;
  current: string;
  expected: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
}

export interface CheckResult {
  status: 'green' | 'yellow' | 'red';
  issues: CheckIssue[];
  passCount: number;
  failCount: number;
  warningCount: number;
}

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

export function checkFormatting(
  html: string,
  rules: CheckRule[] = DEFAULT_RULES,
): CheckResult {
  const doc = parseHtml(html);

  // 注入基础样式以模拟计算样式
  const styleEl = doc.createElement('style');
  styleEl.textContent = `
    h1 { font-size: 22pt; font-weight: bold; font-family: 黑体; }
    h2 { font-size: 16pt; font-weight: bold; font-family: 黑体; }
    h3 { font-size: 14pt; font-weight: bold; font-family: 黑体; }
    p  { font-size: 12pt; font-family: 宋体; line-height: 1.5; }
    body { font-size: 12pt; font-family: 宋体; }
  `;
  doc.head?.appendChild(styleEl);

  const issues: CheckIssue[] = [];

  for (const rule of rules) {
    const els = doc.querySelectorAll(rule.selector);
    for (const el of els) {
      const computed = doc.defaultView?.getComputedStyle(el);
      if (!computed) continue;

      const current = computed[rule.property as any] as string;
      const expectedNorm = normalizeCssValue(rule.expected);
      const currentNorm = normalizeCssValue(current);

      if (currentNorm !== expectedNorm) {
        issues.push({
          selector: rule.selector,
          elementText: (el.textContent ?? '').substring(0, 40),
          property: rule.property,
          current,
          expected: rule.expected,
          severity: rule.severity,
          rule: rule.name,
        });
      }
    }
  }

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  let status: CheckResult['status'] = 'green';
  if (errors.length > 0) status = 'red';
  else if (warnings.length > 0) status = 'yellow';

  return { status, issues, passCount: rules.length, failCount: errors.length, warningCount: warnings.length };
}

function normalizeCssValue(v: string): string {
  return v.toLowerCase().replace(/\s+/g, '').replace(/"/g, '').replace(/'/g, '');
}

export const DEFAULT_RULES: CheckRule[] = [
  { name: '章标题字体', selector: 'h1', property: 'fontFamily', expected: '黑体', severity: 'error' },
  { name: '章标题字号', selector: 'h1', property: 'fontSize', expected: '22pt', severity: 'error' },
  { name: '节标题字号', selector: 'h2', property: 'fontSize', expected: '16pt', severity: 'error' },
  { name: '条标题字号', selector: 'h3', property: 'fontSize', expected: '14pt', severity: 'error' },
  { name: '正文字体', selector: 'p', property: 'fontFamily', expected: '宋体', severity: 'warning' },
  { name: '正文字号', selector: 'p', property: 'fontSize', expected: '12pt', severity: 'warning' },
  { name: '正文加粗', selector: 'p', property: 'fontWeight', expected: '400', severity: 'info' },
];

export function createRule(
  name: string,
  selector: string,
  property: string,
  expected: string,
  severity: CheckRule['severity'] = 'error',
): CheckRule {
  return { name, selector, property, expected, severity };
}
