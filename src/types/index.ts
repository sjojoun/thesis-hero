/**
 * types/index.ts — 论文排版模板类型定义 & 国标/南理工配置（v3 增强版）
 *
 * v3 新增：NJUST 南理工继续教育学院模板、CoverMeta 双语字段
 *
 * DXA / twip 说明：
 *   1 inch = 1440 DXA
 *   1 cm   ≈ 567 DXA
 *   1 mm   ≈ 56.69 DXA
 *   1 磅   = 20 DXA
 *   字号用半磅：size(half-pt) = 字号(pt) × 2
 *   例：小四 12pt → 24 | 三号 16pt → 32
 */

import { mmToDxa, ptToHalfPt, ptToDxa } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════
// 接口定义
// ═══════════════════════════════════════════════════════════════════════

export interface PageConfig {
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

export interface ParagraphStyleConfig {
  fontFamilyCN: string;
  fontFamilyEN: string;
  fontSize: number;       // 半磅
  bold: boolean;
  alignment: 'left' | 'center' | 'right' | 'both';
  spacingBefore: number;  // DXA
  spacingAfter: number;   // DXA
  lineSpacing: number;    // DXA, AUTO 模式含义见注释
  firstLineIndent?: number;
}

/** 页眉/页脚配置 */
export interface HeaderFooterConfig {
  headerText: string;
  showPageNumber: boolean;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description?: string;
  degree: '本科' | '硕士' | '博士';
  page: PageConfig;
  body: ParagraphStyleConfig;
  h1: ParagraphStyleConfig;
  h2: ParagraphStyleConfig;
  h3: ParagraphStyleConfig;
  headerFooter: HeaderFooterConfig;
}

/** 排版任务处理状态 */
export type ProcessStatus = 'idle' | 'parsing' | 'generating' | 'done' | 'error';

/** 排版进度事件 */
export interface ProcessProgress {
  status: ProcessStatus;
  message: string;
  stats?: {
    totalParagraphs: number;
    h1Count: number;
    h2Count: number;
    h3Count: number;
    bodyCount: number;
    imageCount: number;
    referenceCount: number;
  };
}

export interface ImageInfo {
  contentType: string;
  base64: string;
  paragraphIndex: number;
  altText?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// 封面元数据（双语 v3）
// ═══════════════════════════════════════════════════════════════════════

export interface CoverMeta {
  /** 是否启用双语模式 */
  bilingual: boolean;
  /** 学校 / University */
  school: string;
  /** 学院/系 / College/Department */
  college: string;
  /** 论文类型（如"毕业设计说明书（论文）"） */
  thesisType: string;
  /** 论文类型英文（如"Graduation Project Report (Thesis)"） */
  thesisTypeEn: string;
  /** 中文题目 / Chinese Title */
  title: string;
  /** 英文题目 / English Title */
  titleEn: string;
  /** 姓名 / Name */
  author: string;
  /** 学号 / Student ID */
  studentId: string;
  /** 班级/专业 / Class/Major */
  major: string;
  /** 指导教师 / Advisor */
  advisor: string;
  /** 联合指导教师列表（可动态增删） / Co-Advisors */
  coAdvisors: string[];
  /** 校外指导教师（选填） / Off-Campus Advisor */
  offCampusAdvisor: string;
  /** 提交日期 / Date（如 2026年6月） */
  submitDate: string;
}

// ═══════════════════════════════════════════════════════════════════════
// NJUST 南理工继续教育学院模板（2023版）
// ═══════════════════════════════════════════════════════════════════════

export const NJUST_CONFIG: TemplateConfig = {
  id: 'njust',
  name: '南京理工大学（继续教育学院）',
  description: '符合南京理工大学继续教育学院毕业设计说明书（论文）撰写格式（2023版）',
  degree: '本科',
  page: {
    width: 11906,
    height: 16838,
    marginTop: mmToDxa(25),
    marginBottom: mmToDxa(25),
    marginLeft: mmToDxa(30),
    marginRight: mmToDxa(20),
  },
  body: {
    fontFamilyCN: '宋体',
    fontFamilyEN: 'Times New Roman',
    fontSize: ptToHalfPt(12),
    bold: false,
    alignment: 'both',
    spacingBefore: 0,
    spacingAfter: 0,
    lineSpacing: 360, // 1.5倍行距
    firstLineIndent: ptToDxa(24),
  },
  h1: {
    fontFamilyCN: '黑体',
    fontFamilyEN: 'Times New Roman',
    fontSize: ptToHalfPt(16), // 三号
    bold: true,
    alignment: 'center',
    spacingBefore: ptToDxa(12),
    spacingAfter: ptToDxa(12),
    lineSpacing: 360,
    firstLineIndent: 0,
  },
  h2: {
    fontFamilyCN: '黑体',
    fontFamilyEN: 'Times New Roman',
    fontSize: ptToHalfPt(14), // 四号
    bold: true,
    alignment: 'left',
    spacingBefore: ptToDxa(6),
    spacingAfter: ptToDxa(6),
    lineSpacing: 360,
    firstLineIndent: 0,
  },
  h3: {
    fontFamilyCN: '黑体',
    fontFamilyEN: 'Times New Roman',
    fontSize: ptToHalfPt(12), // 小四
    bold: true,
    alignment: 'left',
    spacingBefore: ptToDxa(3),
    spacingAfter: 0,
    lineSpacing: 360,
    firstLineIndent: 0,
  },
  headerFooter: {
    headerText: '南京理工大学毕业设计说明书（论文）',
    showPageNumber: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// GB/T 7713 国标学位论文配置
// ═══════════════════════════════════════════════════════════════════════

export const GB_7713_CONFIG: TemplateConfig = {
  id: 'gb7713',
  name: 'GB/T 7713 国标学位论文',
  description: '符合《GB/T 7713.1-2006 学位论文编写规则》，适用于大多数高校毕业论文',
  degree: '本科',
  page: {
    width: 11906,
    height: 16838,
    marginTop: mmToDxa(30),
    marginBottom: mmToDxa(25),
    marginLeft: mmToDxa(30),
    marginRight: mmToDxa(20),
  },
  body: {
    fontFamilyCN: '宋体',
    fontFamilyEN: 'Times New Roman',
    fontSize: ptToHalfPt(12),
    bold: false,
    alignment: 'both',
    spacingBefore: 0,
    spacingAfter: 0,
    lineSpacing: 360,
    firstLineIndent: ptToDxa(24),
  },
  h1: {
    fontFamilyCN: '黑体',
    fontFamilyEN: 'Arial',
    fontSize: ptToHalfPt(16),
    bold: true,
    alignment: 'center',
    spacingBefore: ptToDxa(12),
    spacingAfter: ptToDxa(12),
    lineSpacing: 360,
    firstLineIndent: 0,
  },
  h2: {
    fontFamilyCN: '黑体',
    fontFamilyEN: 'Arial',
    fontSize: ptToHalfPt(14),
    bold: true,
    alignment: 'left',
    spacingBefore: ptToDxa(10),
    spacingAfter: ptToDxa(6),
    lineSpacing: 360,
    firstLineIndent: 0,
  },
  h3: {
    fontFamilyCN: '黑体',
    fontFamilyEN: 'Arial',
    fontSize: ptToHalfPt(12),
    bold: true,
    alignment: 'left',
    spacingBefore: ptToDxa(6),
    spacingAfter: 0,
    lineSpacing: 360,
    firstLineIndent: 0,
  },
  headerFooter: {
    headerText: '学士学位论文',
    showPageNumber: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// 北大硕士模板
// ═══════════════════════════════════════════════════════════════════════

export const PKU_MASTER_CONFIG: TemplateConfig = {
  id: 'pku-master',
  name: '北京大学（硕士）',
  description: '参照北京大学研究生学位论文格式要求',
  degree: '硕士',
  page: {
    width: 11906,
    height: 16838,
    marginTop: mmToDxa(35),
    marginBottom: mmToDxa(30),
    marginLeft: mmToDxa(35),
    marginRight: mmToDxa(25),
  },
  body: {
    fontFamilyCN: '宋体',
    fontFamilyEN: 'Times New Roman',
    fontSize: ptToHalfPt(12),
    bold: false,
    alignment: 'both',
    spacingBefore: 0,
    spacingAfter: 0,
    lineSpacing: 480,
    firstLineIndent: ptToDxa(24),
  },
  h1: {
    fontFamilyCN: '黑体',
    fontFamilyEN: 'Arial',
    fontSize: ptToHalfPt(16),
    bold: true,
    alignment: 'center',
    spacingBefore: ptToDxa(24),
    spacingAfter: ptToDxa(18),
    lineSpacing: 480,
    firstLineIndent: 0,
  },
  h2: {
    fontFamilyCN: '黑体',
    fontFamilyEN: 'Arial',
    fontSize: ptToHalfPt(14),
    bold: true,
    alignment: 'left',
    spacingBefore: ptToDxa(18),
    spacingAfter: ptToDxa(12),
    lineSpacing: 480,
    firstLineIndent: 0,
  },
  h3: {
    fontFamilyCN: '黑体',
    fontFamilyEN: 'Arial',
    fontSize: ptToHalfPt(12),
    bold: true,
    alignment: 'left',
    spacingBefore: ptToDxa(12),
    spacingAfter: ptToDxa(6),
    lineSpacing: 480,
    firstLineIndent: 0,
  },
  headerFooter: {
    headerText: '北京大学硕士学位论文',
    showPageNumber: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// 精简通用模板
// ═══════════════════════════════════════════════════════════════════════

export const BASIC_CONFIG: TemplateConfig = {
  id: 'basic',
  name: '精简通用模板',
  description: '最简配置，适合初稿快速排版，可在此基础上手动微调',
  degree: '本科',
  page: {
    width: 11906,
    height: 16838,
    marginTop: mmToDxa(25),
    marginBottom: mmToDxa(25),
    marginLeft: mmToDxa(30),
    marginRight: mmToDxa(25),
  },
  body: {
    fontFamilyCN: '宋体',
    fontFamilyEN: 'Times New Roman',
    fontSize: ptToHalfPt(12),
    bold: false,
    alignment: 'both',
    spacingBefore: 0,
    spacingAfter: 0,
    lineSpacing: 360,
    firstLineIndent: ptToDxa(24),
  },
  h1: {
    fontFamilyCN: '黑体',
    fontFamilyEN: 'Arial',
    fontSize: ptToHalfPt(16),
    bold: true,
    alignment: 'center',
    spacingBefore: ptToDxa(12),
    spacingAfter: ptToDxa(12),
    lineSpacing: 360,
    firstLineIndent: 0,
  },
  h2: {
    fontFamilyCN: '黑体',
    fontFamilyEN: 'Arial',
    fontSize: ptToHalfPt(14),
    bold: true,
    alignment: 'left',
    spacingBefore: ptToDxa(6),
    spacingAfter: ptToDxa(6),
    lineSpacing: 360,
    firstLineIndent: 0,
  },
  h3: {
    fontFamilyCN: '黑体',
    fontFamilyEN: 'Arial',
    fontSize: ptToHalfPt(12),
    bold: true,
    alignment: 'left',
    spacingBefore: ptToDxa(3),
    spacingAfter: 0,
    lineSpacing: 360,
    firstLineIndent: 0,
  },
  headerFooter: {
    headerText: '学位论文',
    showPageNumber: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// 可用模板列表
// ═══════════════════════════════════════════════════════════════════════

export const AVAILABLE_CONFIGS: TemplateConfig[] = [
  NJUST_CONFIG,
  GB_7713_CONFIG,
  PKU_MASTER_CONFIG,
  BASIC_CONFIG,
];
