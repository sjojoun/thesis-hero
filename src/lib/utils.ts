/**
 * utils.ts — 通用工具函数
 */

/** 毫米 → DXA（Word 内部单位） */
export const mmToDxa = (mm: number): number => Math.round(mm * (1440 / 25.4));

/** DXA → 毫米 */
export const dxaToMm = (dxa: number): number => Math.round(dxa / (1440 / 25.4) * 10) / 10;

/** 磅 → 半磅（docx TextRun.size 使用半磅） */
export const ptToHalfPt = (pt: number): number => pt * 2;

/** 半磅 → 磅 */
export const halfPtToPt = (halfPt: number): number => Math.round(halfPt / 2 * 10) / 10;

/** 磅 → DXA（段落间距） */
export const ptToDxa = (pt: number): number => pt * 20;

/** DXA → 磅 */
export const dxaToPt = (dxa: number): number => Math.round(dxa / 20 * 10) / 10;

/** 格式化文件大小 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** 格式化行距描述 */
export const formatLineSpacing = (dxa: number): string => {
  const ratio = dxa / 240;
  if (ratio === 1) return '单倍';
  if (ratio === 1.5) return '1.5 倍';
  if (ratio === 2) return '双倍';
  return `${ratio.toFixed(1)} 倍`;
};

/** 对齐方式中文 */
export const alignmentLabel = (align: 'left' | 'center' | 'right' | 'both'): string => {
  const map = { left: '左对齐', center: '居中', right: '右对齐', both: '两端对齐' };
  return map[align];
};
