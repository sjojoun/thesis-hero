/**
 * 🕶️ 盲审版本脱敏引擎 (Blind Review Desensitization)
 * 将敏感信息从 mammoth HTML 中替换为星号，输出脱敏版 HTML。
 * 支持：作者、导师、学校名、致谢全文、声明全文。
 */

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

export interface BlindReviewOptions {
  /** 要替换的敏感词列表（自动补充全角/半角空格变体） */
  sensitiveWords: string[];
  /** 是否删除致谢章节（默认 true） */
  removeAcknowledgement?: boolean;
  /** 是否删除声明章节（默认 true） */
  removeDeclaration?: boolean;
  /** 替换字符（默认 *） */
  maskChar?: string;
  /** 是否保留致谢/声明章节标题但清空内容（默认 false，直接删除） */
  keepEmptySection?: boolean;
}

export interface BlindReviewResult {
  html: string;
  /** 替换记录 */
  masked: { word: string; positions: number }[];
  /** 删除的章节名 */
  removedSections: string[];
}

const DEFAULT_OPTIONS: Required<BlindReviewOptions> = {
  sensitiveWords: [],
  removeAcknowledgement: true,
  removeDeclaration: true,
  maskChar: '*',
  keepEmptySection: false,
};

/**
 * 生成敏感词的所有常见变体（半角/全角/空格填充）
 */
function buildVariants(word: string): string[] {
  const variants = new Set<string>();
  variants.add(word);
  // 全角空格变体
  variants.add(word.replace(/\s+/g, '　'));
  // 半角空格变体
  variants.add(word.replace(/\s+/g, ' '));
  return [...variants];
}

/**
 * 主函数：对 HTML 执行盲审脱敏
 */
export function createBlindReviewVersion(
  html: string,
  opts: BlindReviewOptions
): BlindReviewResult {
  const o: Required<BlindReviewOptions> = { ...DEFAULT_OPTIONS, ...opts };
  const doc = parseHtml(html);
  const masked: BlindReviewResult['masked'] = [];
  const removedSections: string[] = [];

  // ── 1. 替换敏感词 ──
  const allVariants = o.sensitiveWords.flatMap(buildVariants);

  doc.body.querySelectorAll('*').forEach((el: Element) => {
    // 只处理叶子文本节点
    for (const node of [...el.childNodes]) {
      if (node.nodeType !== 3) continue; // TEXT_NODE
      let text = node.textContent ?? '';
      let changed = false;

      for (const word of allVariants) {
        if (!word) continue;
        const regex = new RegExp(escapeRegex(word), 'g');
        if (regex.test(text)) {
          const replacement = o.maskChar.repeat(word.length);
          text = text.replace(regex, replacement);
          changed = true;
          const existing = masked.find((m: { word: string; positions: number }) => m.word === word);
          if (existing) existing.positions++;
          else masked.push({ word, positions: 1 });
        }
      }

      if (changed) {
        node.textContent = text;
      }
    }
  });

  // ── 2. 删除致谢章节 ──
  if (o.removeAcknowledgement) {
    const ackHeaders = doc.body.querySelectorAll('h1, h2, h3');
    for (const h of ackHeaders) {
      const txt = h.textContent?.trim() ?? '';
      if (/致\s*谢|鸣\s*谢|ACKNOWLEDGMENT/i.test(txt)) {
        removedSections.push(txt);
        // 删除标题 + 后续兄弟节点直到下一个标题
        let cur: Element | null = h;
        while (cur) {
          const next: Element | null = cur.nextElementSibling;
          cur.remove();
          if (next && /^h[123]$/i.test(next.tagName)) break;
          cur = next;
        }
      }
    }
  }

  // ── 3. 删除声明章节 ──
  if (o.removeDeclaration) {
    const declHeaders = doc.body.querySelectorAll('h1, h2, h3');
    for (const h of declHeaders) {
      const txt = h.textContent?.trim() ?? '';
      if (/声\s*明|原创性声明|学位论文.*声明/i.test(txt)) {
        removedSections.push(txt);
        let cur: Element | null = h;
        while (cur) {
          const next: Element | null = cur.nextElementSibling;
          cur.remove();
          if (next && /^h[123]$/i.test(next.tagName)) break;
          cur = next;
        }
      }
    }
  }

  return { html: doc.documentElement.outerHTML, masked, removedSections };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
