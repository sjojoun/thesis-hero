/**
 * 📄 封面生成引擎 v4 (Smart Cover Generator)
 *
 * v4 新特性：
 *   - 双语开关：关闭时仅输出中文字段
 *   - 动态联合导师：coAdvisors[] 逐行插入指导教师下方
 *   - 校外导师：offCampusAdvisor 置底
 *   - 空字段自动跳过（不输出空白行）
 *   - 多行题目下划线对齐（CSS 侧处理，此处仅文本）
 */
import {
  Paragraph, TextRun, AlignmentType, PageBreak,
  LineRuleType,
} from 'docx';
import type { CoverMeta } from '@/types';

// ═══════════════════════════════════════════════════════════════════════
// 字体预设
// ═══════════════════════════════════════════════════════════════════════

const CN_BOLD = { eastAsia: '黑体', ascii: 'Times New Roman', hAnsi: 'Times New Roman' };
const CN_BODY = { eastAsia: '宋体', ascii: 'Times New Roman', hAnsi: 'Times New Roman' };
const EN_FONT = { eastAsia: '宋体', ascii: 'Times New Roman', hAnsi: 'Times New Roman' };

// ═══════════════════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════════════════

const center = (runs: TextRun[], before = 0, after = 0) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before, after, line: 480, lineRule: LineRuleType.AUTO },
    children: runs,
  });

const blank = (pt = 12) =>
  new Paragraph({
    children: [],
    spacing: { before: pt * 20, after: 0 },
  });

/** 双语居中段：labelCN / labelEN：value
 *  若 bilingual=false 则仅 labelCN：value */
const labelRow = (
  labelCN: string, labelEN: string,
  value: string, bilingual: boolean,
  opts?: { bold?: boolean; sz?: number }
) => {
  const s = opts?.sz ?? 28;
  const label = bilingual
    ? `${labelCN} / ${labelEN}：`
    : `${labelCN}：`;
  return center([
    new TextRun({ text: label, bold: true, size: s, font: CN_BOLD }),
    new TextRun({ text: value, size: s, font: CN_BODY }),
  ], 40, 40);
};

/** 非空检查 */
const ok = (s?: string) => s && s.trim().length > 0;

// ═══════════════════════════════════════════════════════════════════════
// 封面段落构建
// ═══════════════════════════════════════════════════════════════════════

export function buildCoverParagraphs(meta: CoverMeta): Paragraph[] {
  const bi = meta.bilingual;
  const ps: Paragraph[] = [];

  ps.push(blank(60)); // 顶部留白

  // ── 1. 学校名称（一号 26pt）──
  if (ok(meta.school)) {
    ps.push(center([
      new TextRun({ text: meta.school, bold: true, size: 52, font: CN_BOLD }),
    ], 0, 120));
  }

  // ── 2. 论文类型（中/英）──
  if (ok(meta.thesisType)) {
    ps.push(center([
      new TextRun({ text: meta.thesisType, bold: true, size: 40, font: CN_BOLD }),
    ]));
  }
  if (bi && ok(meta.thesisTypeEn)) {
    ps.push(center([
      new TextRun({ text: meta.thesisTypeEn, size: 28, italics: true, font: EN_FONT }),
    ], 40, 80));
  } else {
    ps[ps.length - 1] = center([
      new TextRun({ text: meta.thesisType, bold: true, size: 40, font: CN_BOLD }),
    ], 0, 80);
  }

  // ── 3. 学院/系（中/英）──
  if (ok(meta.college)) {
    ps.push(center([
      new TextRun({ text: meta.college, bold: true, size: 32, font: CN_BOLD }),
    ], 0, 40));
    if (bi) {
      ps.push(center([
        new TextRun({ text: 'College of Continuing Education', size: 24, font: EN_FONT }),
      ], 0, 80));
    } else {
      ps[ps.length - 1] = center([
        new TextRun({ text: meta.college, bold: true, size: 32, font: CN_BOLD }),
      ], 0, 80);
    }
  }

  // ── 4. 分隔留白 ──
  ps.push(blank(40));

  // ── 5. 论文题目（中/英）──
  if (ok(meta.title)) {
    ps.push(center([
      new TextRun({ text: meta.title, bold: true, size: 36, font: CN_BOLD }),
    ], 0, 60));
  }
  if (bi && ok(meta.titleEn)) {
    ps.push(center([
      new TextRun({ text: meta.titleEn, size: 28, font: EN_FONT }),
    ], 0, 120));
  } else {
    ps.push(blank(60));
  }

  // ── 6. 作者信息区域（双语标签 + 动态字段）──
  if (ok(meta.author))
    ps.push(labelRow('学生姓名', 'Name', meta.author, bi));
  if (ok(meta.studentId))
    ps.push(labelRow('学　　号', 'Student ID', meta.studentId, bi));
  if (ok(meta.major))
    ps.push(labelRow('班级/专业', 'Class/Major', meta.major, bi));

  // 指导教师
  if (ok(meta.advisor))
    ps.push(labelRow('指导教师', 'Advisor', meta.advisor, bi));

  // 联合导师（逐行）
  for (const ca of meta.coAdvisors) {
    if (ok(ca)) {
      if (bi) {
        ps.push(center([
          new TextRun({ text: `联合指导教师 / Co-Advisor：${ca}`, bold: true, size: 28, font: CN_BOLD }),
        ], 40, 40));
      } else {
        ps.push(center([
          new TextRun({ text: `联合指导教师：${ca}`, size: 28, font: CN_BODY }),
        ], 40, 40));
      }
    }
  }

  // 校外导师
  if (ok(meta.offCampusAdvisor)) {
    if (bi) {
      ps.push(center([
        new TextRun({ text: `校外指导教师 / Off-Campus Advisor：${meta.offCampusAdvisor}`, size: 28, font: CN_BODY }),
      ], 40, 40));
    } else {
      ps.push(center([
        new TextRun({ text: `校外指导教师：${meta.offCampusAdvisor}`, size: 28, font: CN_BODY }),
      ], 40, 40));
    }
  }

  // ── 7. 日期 ──
  ps.push(blank(40));
  if (ok(meta.submitDate)) {
    ps.push(center([
      new TextRun({ text: meta.submitDate, size: 28, font: EN_FONT }),
    ], 40, 40));
  }

  return ps;
}

/** 构建带分页的封面 Section */
export function buildCoverSection(meta: CoverMeta): {
  children: Paragraph[];
  properties?: Record<string, unknown>;
} {
  const ps = buildCoverParagraphs(meta);
  ps.push(new Paragraph({ children: [new PageBreak()] }));
  return { children: ps };
}

/** 默认封面元数据 */
export const DEFAULT_COVER_META: CoverMeta = {
  bilingual: true,
  school: '南京理工大学',
  college: '继续教育学院',
  thesisType: '毕业设计说明书（论文）',
  thesisTypeEn: 'Graduation Project Report (Thesis)',
  title: '',
  titleEn: '',
  author: '',
  studentId: '',
  major: '',
  advisor: '',
  coAdvisors: [],
  offCampusAdvisor: '',
  submitDate: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`,
};
