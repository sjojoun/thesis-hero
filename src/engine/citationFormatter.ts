/**
 * 📚 参考文献格式化引擎 (Citation Formatter)
 * 支持 GB/T 7714-2015、APA 7th、MLA 9th 三种格式互转。
 * 解析现有参考文献条目，按目标格式输出新文本。
 */

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

export type CitationStyle = 'GB7714' | 'APA' | 'MLA';

export interface ParsedCitation {
  index: number;
  raw: string;          // 原文整行
  authors?: string[];   // 作者列表
  title?: string;
  source?: string;      // 期刊/会议/出版社
  year?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  /** 文献类型 [J]:期刊 [C]:会议 [M]:专著 [D]:学位论文 [OL]:在线 */
  type?: string;
}

export interface FormatResult {
  entries: string[];
  style: CitationStyle;
  parsed: ParsedCitation[];
  warnings: string[];
}

// ── 从 mammoth HTML 提取参考文献段落 ──
export function extractCitations(html: string): string[] {
  const doc = parseHtml(html);

  // 找到「参考文献」标题后的所有段落
  let inRef = false;
  const citations: string[] = [];

  for (const el of doc.body.children) {
    const text = el.textContent?.trim() ?? '';
    if (!text) continue;

    if (/参\s*考\s*文\s*献/i.test(text) && !inRef) {
      inRef = true;
      continue;
    }
    if (inRef) {
      if (/^\[\d+\]/.test(text) || /^\d+[\.\s]/.test(text)) {
        citations.push(text);
      } else if (citations.length > 0) {
        // 续行追加到上一条
        citations[citations.length - 1] += ' ' + text;
      }
    }
  }

  return citations;
}

// ── 简易解析器：从文本提取结构化字段 ──
function parseEntry(raw: string, index: number): ParsedCitation {
  const entry: ParsedCitation = { index, raw };

  // 提取 [N] 前缀编号
  const idxMatch = raw.match(/^\[(\d+)\]\s*(.*)/);
  const body = idxMatch ? idxMatch[2] : raw.replace(/^\d+[\.\s]+/, '');

  // 文献类型 [J] [M] [C] [D] [OL]
  const typeMatch = body.match(/\[([JMCDOL]{1,2})\]/);
  if (typeMatch) entry.type = typeMatch[1];

  // 作者-年份/卷期/页码模式
  const cnPattern = /^(.+?)[\.\s]+(.+?)[\.\s]*(?:\[([JMCDOL]+)\]\s*)?(.+?),\s*(\d{4}),\s*(\d+)\s*(?:\((\d+)\))?\s*:\s*(\S+)\.$/;
  const enPattern = /^(.+?)\s*[\.\s]+(.+?)\s*(?:\[([JMCDOL]+)\]\s*)?(.+?),\s*(?:Vol\.\s*(\d+),\s*)?(?:No\.\s*(\d+),\s*)?pp?\.\s*(\S+),\s*(\d{4})\.$/;

  let match = body.match(cnPattern) ?? body.match(enPattern);
  if (match) {
    entry.authors = match[1].split(/[,;，；]/).map(s => s.trim());
    entry.title = match[2];
    if (!entry.type && match[3]) entry.type = match[3];
    entry.source = match[4];
    entry.year = match[5];
    entry.volume = match[6];
    if (match[7]) entry.issue = match[7];
    entry.pages = match[8];
  } else {
    // 退化解析：按常见分隔符拆
    const parts = body.split(/[\.\s]+/).filter(Boolean);
    if (parts.length >= 2) {
      entry.authors = [parts[0]];
      entry.title = parts[1] || '';
    }
  }

  return entry;
}

// ── 格式化到目标样式 ──
function formatEntry(entry: ParsedCitation, style: CitationStyle, index: number): string {
  const authors = (entry.authors && entry.authors.length > 0)
    ? entry.authors.join(', ')
    : '佚名';
  const title = entry.title || entry.raw;
  const source = entry.source || '';
  const year = entry.year || 'n.d.';
  const vol = entry.volume || '';
  const issue = entry.issue || '';
  const pages = entry.pages || '';

  switch (style) {
    case 'GB7714':
      // [1] 作者. 标题[J]. 期刊, 年, 卷(期): 页码.
      return `[${index}] ${authors}. ${title}[${entry.type || 'J'}]. ${source}, ${year}, ${vol}${issue ? '(' + issue + ')' : ''}: ${pages}.`;

    case 'APA':
      // Author. (Year). Title. Source, Vol(Issue), Pages.
      return `${authors}. (${year}). ${title}. ${source}, ${vol}${issue ? '(' + issue + ')' : ''}, ${pages}.`;

    case 'MLA':
      // Author. "Title." Source, vol. Vol, no. Issue, Year, pp. Pages.
      return `${authors}. "${title}." ${source}, vol. ${vol}${issue ? ', no. ' + issue : ''}, ${year}, pp. ${pages}.`;

    default:
      return entry.raw;
  }
}

/**
 * 主入口：将 HTML 中的参考文献按目标格式重新格式化
 */
export function reformatCitations(html: string, style: CitationStyle): FormatResult {
  const raw = extractCitations(html);
  const warnings: string[] = [];
  const parsed: ParsedCitation[] = [];

  const entries = raw.map((rawText, i) => {
    const entry = parseEntry(rawText, i + 1);
    parsed.push(entry);
    if (!entry.authors && !entry.title) {
      warnings.push(`[${i + 1}] 无法充分解析，保留原文: "${rawText.substring(0, 40)}..."`);
    }
    return formatEntry(entry, style, i + 1);
  });

  return { entries, style, parsed, warnings };
}
