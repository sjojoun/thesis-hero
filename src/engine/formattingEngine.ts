/**
 * formattingEngine.ts — 论文排版核心转换引擎 v3
 *
 * v3 新增：
 *   - 封面集成（buildCoverSection 前置插入 + PageBreak）
 *   - 章节间自动分页（摘要→目录→正文→参考文献→致谢 各占新页）
 *   - 南理工 NJUST 格式支持
 *
 * 流水线：
 *   CoverMeta + .docx File → mammoth 解析 → ParsedNode[] + SectionBreaks
 *   → docx Document (cover + body) → Blob
 */

import mammoth from 'mammoth';
import {
  Document,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  LineRuleType,
  HeadingLevel,
  Packer,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  type IRunOptions,
  type IParagraphOptions,
} from 'docx';

import type { TemplateConfig, ParagraphStyleConfig, ImageInfo, ProcessProgress, CoverMeta } from '@/types';
import { buildCoverParagraphs } from '@/engine/coverGenerator';

// ═══════════════════════════════════════════════════════════════════════
// 内部类型
// ═══════════════════════════════════════════════════════════════════════

export interface ParsedNode {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'reference' | 'abstract' | 'toc' | 'acknowledgment';
  text: string;
}

// ═══════════════════════════════════════════════════════════════════════
// 标题检测正则（增强版 v3 — 含章节关键词分页）
// ═══════════════════════════════════════════════════════════════════════

const HEADING_PATTERNS = {
  /** 一级标题（章） */
  h1: /^(第[零一二三四五六七八九十百千]+[章节篇]|摘\s*要|ABSTRACT|参\s*考\s*文\s*献|致\s*谢|目\s*录|绪\s*论|结\s*论|附\s*录|前\s*言|后\s*记|声明|鸣\s*谢)/i,

  /** 三级标题（条） */
  h3: /^\d+\.\d+\.\d+(?:\.\d+)*[\s\u4e00-\u9fa5A-Za-z]/,

  /** 二级标题（节） */
  h2: /^\d+\.\d+(?!\.\d)[\s\u4e00-\u9fa5A-Za-z]/,
} as const;

// ═══════════════════════════════════════════════════════════════════════
// 需要在其前插入分页的章节关键词
// ═══════════════════════════════════════════════════════════════════════

const SECTION_BREAK_KEYWORDS: ReadonlyArray<string> = [
  '摘要', 'ABSTRACT', 'Abstract',
  '目录', '目  录',
  '参考文献', '参  考  文  献',
  '致谢', '致  谢',
  '附录',
  '绪论',
];

/** 判断某段文字是否应在前面插入分页 */
const shouldBreakBefore = (text: string): boolean => {
  return SECTION_BREAK_KEYWORDS.some(kw => text.startsWith(kw));
};

// ═══════════════════════════════════════════════════════════════════════
// 对齐映射
// ═══════════════════════════════════════════════════════════════════════

const ALIGNMENT_MAP: Record<ParagraphStyleConfig['alignment'], (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  both: AlignmentType.BOTH,
};

// ═══════════════════════════════════════════════════════════════════════
// 辅助
// ═══════════════════════════════════════════════════════════════════════

const getStyleForType = (type: ParsedNode['type'], config: TemplateConfig): ParagraphStyleConfig => {
  if (type === 'reference' || type === 'abstract' || type === 'toc' || type === 'acknowledgment') return config.body;
  const map: Record<string, ParagraphStyleConfig> = {
    h1: config.h1, h2: config.h2, h3: config.h3, p: config.body,
  };
  return map[type] ?? config.body;
};

const getHeadingLevel = (type: ParsedNode['type']): (typeof HeadingLevel)[keyof typeof HeadingLevel] | undefined => {
  const map: Partial<Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]>> = {
    h1: HeadingLevel.HEADING_1,
    h2: HeadingLevel.HEADING_2,
    h3: HeadingLevel.HEADING_3,
  };
  return map[type];
};

const isReferenceLine = (text: string): boolean => {
  return /^\[\d+\]/.test(text) || /^\[\d+-\d+\]/.test(text);
};

// ═══════════════════════════════════════════════════════════════════════
// 步骤 1：HTML → ParsedNode[]
// ═══════════════════════════════════════════════════════════════════════

const detectTypeByRegex = (text: string): ParsedNode['type'] => {
  if (isReferenceLine(text)) return 'reference';
  if (HEADING_PATTERNS.h3.test(text)) return 'h3';
  if (HEADING_PATTERNS.h2.test(text)) return 'h2';
  if (HEADING_PATTERNS.h1.test(text)) return 'h1';
  return 'p';
};

const parseHtmlToNodes = (html: string): ParsedNode[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const nodes: ParsedNode[] = [];

  for (const element of Array.from(doc.body.children)) {
    const tagName = element.tagName.toLowerCase();
    const text = element.textContent?.trim() ?? '';
    if (!text) continue;

    let type: ParsedNode['type'];

    switch (tagName) {
      case 'h1': type = 'h1'; break;
      case 'h2': type = 'h2'; break;
      case 'h3': type = 'h3'; break;
      case 'p':
        type = detectTypeByRegex(text);
        break;
      default:
        type = 'p';
        break;
    }

    nodes.push({ type, text });
  }

  return nodes;
};

// ═══════════════════════════════════════════════════════════════════════
// 步骤 2：图片提取
// ═══════════════════════════════════════════════════════════════════════

const extractImages = (html: string): ImageInfo[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images: ImageInfo[] = [];

  const allElements = Array.from(doc.body.children);
  let paragraphIndex = 0;

  for (const element of allElements) {
    const imgs = element.querySelectorAll('img');
    for (const img of imgs) {
      const src = img.getAttribute('src') ?? '';
      const match = src.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        images.push({
          contentType: match[1],
          base64: match[2],
          paragraphIndex,
          altText: img.getAttribute('alt') ?? undefined,
        });
      }
    }
    paragraphIndex++;
  }

  return images;
};

// ═══════════════════════════════════════════════════════════════════════
// 步骤 3：ParsedNode → docx Paragraph
// ═══════════════════════════════════════════════════════════════════════

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
};

const buildDocxParagraph = (
  node: ParsedNode,
  config: TemplateConfig,
  imageForThisParagraph?: ImageInfo
): Paragraph => {
  const style = getStyleForType(node.type, config);
  const headingLevel = getHeadingLevel(node.type);

  const children: (TextRun | ImageRun)[] = [];

  if (imageForThisParagraph) {
    try {
      const imageBytes = base64ToUint8Array(imageForThisParagraph.base64);
      children.push(
        new ImageRun({
          data: imageBytes,
          transformation: { width: 400, height: 300 },
        })
      );
    } catch {
      console.warn(`[formattingEngine] 图片解析失败，段落 ${imageForThisParagraph.paragraphIndex} 的图片已跳过`);
    }
  }

  if (node.text) {
    const runOptions: IRunOptions = {
      text: node.text,
      bold: style.bold,
      size: style.fontSize,
      font: {
        eastAsia: style.fontFamilyCN,
        ascii: style.fontFamilyEN,
        hAnsi: style.fontFamilyEN,
      },
    };
    children.push(new TextRun(runOptions));
  } else if (children.length === 0) {
    return new Paragraph({ children: [] });
  }

  const paragraphOptions: IParagraphOptions = {
    children,
    alignment: ALIGNMENT_MAP[style.alignment],
    spacing: {
      before: style.spacingBefore,
      after: style.spacingAfter,
      line: style.lineSpacing,
      lineRule: LineRuleType.AUTO,
    },
    ...(headingLevel !== undefined && { heading: headingLevel }),
    ...(style.firstLineIndent && style.firstLineIndent > 0 && {
      indent: { firstLine: style.firstLineIndent },
    }),
  };

  return new Paragraph(paragraphOptions);
};

// ═══════════════════════════════════════════════════════════════════════
// 步骤 4：Document 构建（含页眉页脚）
// ═══════════════════════════════════════════════════════════════════════

const buildDocument = (
  paragraphs: Paragraph[],
  config: TemplateConfig
): Document => {
  const hf = config.headerFooter;

  return new Document({
    styles: {
      default: {
        heading1: {
          run: {
            font: config.h1.fontFamilyCN,
            size: config.h1.fontSize,
            bold: config.h1.bold,
          },
          paragraph: {
            alignment: ALIGNMENT_MAP[config.h1.alignment],
            spacing: {
              before: config.h1.spacingBefore,
              after: config.h1.spacingAfter,
              line: config.h1.lineSpacing,
              lineRule: LineRuleType.AUTO,
            },
          },
        },
        heading2: {
          run: {
            font: config.h2.fontFamilyCN,
            size: config.h2.fontSize,
            bold: config.h2.bold,
          },
          paragraph: {
            alignment: ALIGNMENT_MAP[config.h2.alignment],
            spacing: {
              before: config.h2.spacingBefore,
              after: config.h2.spacingAfter,
              line: config.h2.lineSpacing,
              lineRule: LineRuleType.AUTO,
            },
          },
        },
        heading3: {
          run: {
            font: config.h3.fontFamilyCN,
            size: config.h3.fontSize,
            bold: config.h3.bold,
          },
          paragraph: {
            alignment: ALIGNMENT_MAP[config.h3.alignment],
            spacing: {
              before: config.h3.spacingBefore,
              after: config.h3.spacingAfter,
              line: config.h3.lineSpacing,
              lineRule: LineRuleType.AUTO,
            },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: config.h1.fontFamilyCN, size: config.h1.fontSize, bold: config.h1.bold },
          paragraph: {
            alignment: ALIGNMENT_MAP[config.h1.alignment],
            spacing: {
              before: config.h1.spacingBefore,
              after: config.h1.spacingAfter,
              line: config.h1.lineSpacing,
              lineRule: LineRuleType.AUTO,
            },
            outlineLevel: 0,
          },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: config.h2.fontFamilyCN, size: config.h2.fontSize, bold: config.h2.bold },
          paragraph: {
            alignment: ALIGNMENT_MAP[config.h2.alignment],
            spacing: {
              before: config.h2.spacingBefore,
              after: config.h2.spacingAfter,
              line: config.h2.lineSpacing,
              lineRule: LineRuleType.AUTO,
            },
            outlineLevel: 1,
          },
        },
        {
          id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: config.h3.fontFamilyCN, size: config.h3.fontSize, bold: config.h3.bold },
          paragraph: {
            alignment: ALIGNMENT_MAP[config.h3.alignment],
            spacing: {
              before: config.h3.spacingBefore,
              after: config.h3.spacingAfter,
              line: config.h3.lineSpacing,
              lineRule: LineRuleType.AUTO,
            },
            outlineLevel: 2,
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: config.page.width, height: config.page.height },
            margin: {
              top: config.page.marginTop,
              bottom: config.page.marginBottom,
              left: config.page.marginLeft,
              right: config.page.marginRight,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: hf.headerText,
                    font: { eastAsia: '宋体', ascii: 'Times New Roman' },
                    size: ptToHalfPt(9),
                    italics: true,
                    color: '888888',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: hf.showPageNumber
            ? new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        children: [PageNumber.CURRENT],
                        font: { eastAsia: '宋体', ascii: 'Times New Roman' },
                        size: ptToHalfPt(9),
                      }),
                    ],
                  }),
                ],
              })
            : undefined,
        },
        children: paragraphs,
      },
    ],
  });
};

// ═══════════════════════════════════════════════════════════════════════
// 工具
// ═══════════════════════════════════════════════════════════════════════

const mmToDxa = (mm: number): number => Math.round(mm * (1440 / 25.4));
const ptToHalfPt = (pt: number): number => pt * 2;

// ═══════════════════════════════════════════════════════════════════════
// 主处理函数（导出）
// ═══════════════════════════════════════════════════════════════════════

/**
 * processPaper — 论文格式化主函数（v3 封面集成版）
 *
 * @param file     用户上传的 .docx
 * @param config   目标排版模板
 * @param onProgress  进度回调
 * @param onHtml   HTML 回调（供工具箱预览用）
 * @param coverMeta   封面元数据（可选，传入则生成封面页）
 * @returns 格式化后的 .docx Blob
 */
export const processPaper = async (
  file: File,
  config: TemplateConfig,
  onProgress?: (p: ProcessProgress) => void,
  onHtml?: (html: string) => void,
  coverMeta?: CoverMeta
): Promise<Blob> => {
  // ── 格式校验 ──
  const isDoc = file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx');
  if (isDoc) {
    throw new Error('暂不支持 .doc 格式，请在 Word / WPS 中另存为 .docx 后重新上传（后续版本将支持 .doc）。');
  }

  // ── 阶段一：读取 ──
  const arrayBuffer = await file.arrayBuffer();

  // ── 阶段二：解析 ──
  onProgress?.({ status: 'parsing', message: '正在解析文档结构...' });

  const { value: parsedHtml, messages } = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='标题 1'] => h1:fresh",
        "p[style-name='标题 2'] => h2:fresh",
        "p[style-name='标题 3'] => h3:fresh",
        "p[style-name='一级标题'] => h1:fresh",
        "p[style-name='二级标题'] => h2:fresh",
        "p[style-name='三级标题'] => h3:fresh",
        "p[style-name='章标题'] => h1:fresh",
        "p[style-name='节标题'] => h2:fresh",
        "p[style-name='1 标题 1'] => h1:fresh",
        "p[style-name='2 标题 2'] => h2:fresh",
        "p[style-name='3 标题 3'] => h3:fresh",
      ],
    }
  );

  const html = parsedHtml;

  const warnings = messages.filter(m => m.type === 'warning');
  if (warnings.length > 0) {
    console.warn(`[formattingEngine] mammoth 警告 (${warnings.length} 条):`);
    warnings.slice(0, 5).forEach(m => console.warn(' ·', m.message));
  }

  onHtml?.(html);

  // ── 阶段三：解析 → 节点 ──
  const nodes = parseHtmlToNodes(html);

  if (nodes.length === 0) {
    throw new Error('文档内容为空或解析失败，请检查上传文件是否为有效的 .docx 格式。');
  }

  const images = extractImages(html);

  const imageMap = new Map<number, ImageInfo>();
  for (const img of images) {
    imageMap.set(img.paragraphIndex, img);
  }

  const stats = {
    totalParagraphs: nodes.length,
    h1Count: nodes.filter(n => n.type === 'h1').length,
    h2Count: nodes.filter(n => n.type === 'h2').length,
    h3Count: nodes.filter(n => n.type === 'h3').length,
    bodyCount: nodes.filter(n => n.type === 'p').length,
    imageCount: images.length,
    referenceCount: nodes.filter(n => n.type === 'reference').length,
  };

  onProgress?.({
    status: 'parsing',
    message: `解析完成：${stats.h1Count} 章、${stats.h2Count} 节、${stats.h3Count} 条、${stats.imageCount} 张图片`,
    stats,
  });

  console.info(`[formattingEngine] 解析完成`, stats);

  // ── 阶段四：构建段落（含封面 + 分页） ──
  onProgress?.({ status: 'generating', message: '正在应用排版格式...' });

  const paragraphs: Paragraph[] = [];

  // 4a. 封面（前置）
  if (coverMeta) {
    onProgress?.({ status: 'generating', message: '正在生成封面...' });
    const coverParagraphs = buildCoverParagraphs(coverMeta);
    paragraphs.push(...coverParagraphs);

    // 封面后分页
    paragraphs.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  // 4b. 正文段落（含章节分页）
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (!node.text && !imageMap.has(i)) continue;

    // 在需要分页的章节前插入分页符（摘要、目录、参考文献、致谢等）
    if (node.text && shouldBreakBefore(node.text)) {
      // 如果不是文档的第一个正文段落，插入分页
      // （封面后已经是新页，但每个章节仍需独立分页）
      paragraphs.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }

    const img = imageMap.get(i);
    paragraphs.push(buildDocxParagraph(node, config, img));
  }

  if (paragraphs.length === 0) {
    throw new Error('文档解析后无可排版段落，请检查上传文件内容。');
  }

  // ── 阶段五：构建 Document ──
  const document = buildDocument(paragraphs, config);

  // ── 阶段六：输出 Blob ──
  const blob = await Packer.toBlob(document);

  onProgress?.({ status: 'done', message: '排版完成！' });

  return blob;
};
