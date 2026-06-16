/**
 * 📊 字数统计仪表盘引擎 (Word Count Analyzer)
 * 分离中文字符、英文单词、标点符号统计，输出章节分布。
 * 使用浏览器原生 DOMParser，无外部依赖。
 */

export interface SectionWordCount {
  section: string;
  zhChars: number;
  enWords: number;
  total: number;
  zhRatioPct: string;
}

export interface WordCountResult {
  total: number;
  zhCount: number;
  enWordCount: number;
  zhRatio: string;
  enRatio: string;
  charCount: number;
  charCountNoSpace: number;
  paragraphCount: number;
  sections: SectionWordCount[];
}

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

function countZhChars(text: string): number {
  const matches = text.match(/[\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff]/g);
  return matches ? matches.length : 0;
}

function countEnWords(text: string): number {
  const matches = text.match(/\b[a-zA-Z0-9]+(?:[''-][a-zA-Z0-9]+)*\b/g);
  return matches ? matches.length : 0;
}

export function analyzeWordCount(html: string): WordCountResult {
  const doc = parseHtml(html);
  const bodyText = doc.body.textContent ?? '';

  const zhCount = countZhChars(bodyText);
  const enWordCount = countEnWords(bodyText);
  const total = zhCount + enWordCount;
  const zhRatio = total > 0 ? (zhCount / total * 100).toFixed(1) + '%' : '0%';
  const enRatio = total > 0 ? (enWordCount / total * 100).toFixed(1) + '%' : '0%';

  const charCount = bodyText.length;
  const charCountNoSpace = bodyText.replace(/\s/g, '').length;

  const paragraphs = doc.querySelectorAll('p');
  const paragraphCount = paragraphs.length;

  const sections: SectionWordCount[] = [];
  let currentSection = '前言';
  let sectionZh = 0;
  let sectionEn = 0;

  for (const el of doc.body.children) {
    const tag = el.tagName.toLowerCase();
    const text = el.textContent ?? '';

    if (/^h[123]$/.test(tag)) {
      if (sectionZh > 0 || sectionEn > 0) {
        const secTotal = sectionZh + sectionEn;
        sections.push({
          section: currentSection,
          zhChars: sectionZh,
          enWords: sectionEn,
          total: secTotal,
          zhRatioPct: secTotal > 0 ? (sectionZh / secTotal * 100).toFixed(1) + '%' : '-',
        });
      }
      currentSection = text.trim().substring(0, 30);
      sectionZh = 0;
      sectionEn = 0;
    } else {
      sectionZh += countZhChars(text);
      sectionEn += countEnWords(text);
    }
  }

  if (sectionZh > 0 || sectionEn > 0) {
    const secTotal = sectionZh + sectionEn;
    sections.push({
      section: currentSection,
      zhChars: sectionZh,
      enWords: sectionEn,
      total: secTotal,
      zhRatioPct: secTotal > 0 ? (sectionZh / secTotal * 100).toFixed(1) + '%' : '-',
    });
  }

  return { total, zhCount, enWordCount, zhRatio, enRatio, charCount, charCountNoSpace, paragraphCount, sections };
}

export function quickWordCount(text: string) {
  const zh = countZhChars(text);
  const en = countEnWords(text);
  return { zh, en, total: zh + en };
}
