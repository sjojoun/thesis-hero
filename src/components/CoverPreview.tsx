import React from 'react';
import type { CoverMeta } from '@/types';

interface CoverPreviewProps {
  meta: CoverMeta;
}

/** 多行下划线：用 inline span 按字符分格，每个字符格有底部 border */
const UnderlineText: React.FC<{
  text: string;
  charsPerLine?: number;
  bold?: boolean;
  fontSize?: number;
}> = ({ text, charsPerLine = 38, bold = false, fontSize = 18 }) => {
  if (!text) return <span className="text-gray-300 italic text-sm">（待填写）</span>;

  // 将文本按 charsPerLine 拆分
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += charsPerLine) {
    lines.push(text.slice(i, i + charsPerLine));
  }

  return (
    <div className="flex flex-wrap justify-center gap-0" style={{ maxWidth: `${charsPerLine * 24}px` }}>
      {lines.map((line, li) => (
        <div key={li} className="flex flex-nowrap">
          {line.split('').map((ch, ci) => (
            <span
              key={ci}
              className="inline-flex items-center justify-center border-b border-gray-400"
              style={{
                width: '24px',
                height: `${fontSize + 10}px`,
                fontSize: `${fontSize}px`,
                fontWeight: bold ? 700 : 400,
                lineHeight: `${fontSize + 10}px`,
              }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

/** 信息行：标签 + 下划线对齐值 */
const InfoLine: React.FC<{
  labelCN: string;
  labelEN: string;
  value: string;
  bilingual: boolean;
  charsPerLine?: number;
}> = ({ labelCN, labelEN, value, bilingual, charsPerLine = 22 }) => {
  const label = bilingual ? `${labelCN} / ${labelEN}：` : `${labelCN}：`;
  const displayVal = value || '___________________';

  return (
    <div className="flex items-center justify-center py-1 text-sm">
      <span className="font-bold text-gray-700 whitespace-nowrap mr-1">{label}</span>
      <span className={value ? 'text-gray-800' : 'text-gray-300'}>
        {value ? displayVal : <UnderlineText text="" charsPerLine={charsPerLine} fontSize={14} />}
      </span>
    </div>
  );
};

export const CoverPreview: React.FC<CoverPreviewProps> = ({ meta }) => {
  const bi = meta.bilingual;
  const ok = (s?: string) => s && s.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-700">👁️ 封面实时预览 / Live Preview</span>
        <span className="text-[10px] text-gray-400">A4 仿真 · A4 Simulation</span>
      </div>

      {/* A4 纸容器 */}
      <div className="w-full overflow-x-auto">
        <div
          className="bg-white mx-auto shadow-2xl rounded-sm border border-gray-200 flex flex-col items-center justify-center
                     text-center select-none"
          style={{
            width: '210mm',
            maxWidth: '100%',
            minHeight: '297mm',
            padding: '30mm 20mm 25mm 30mm',
            fontFamily: '"SimSun", "宋体", "Noto Serif SC", serif',
          }}
        >
          {/* ── 学校名称── */}
          {ok(meta.school) && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-wider" style={{ fontFamily: '"SimHei","黑体",sans-serif' }}>
                {meta.school}
              </h1>
            </div>
          )}

          {/* ── 论文类型 ── */}
          {ok(meta.thesisType) && (
            <div className="mb-2">
              <h2 className="text-lg font-bold" style={{ fontFamily: '"SimHei","黑体",sans-serif' }}>
                {meta.thesisType}
              </h2>
            </div>
          )}
          {bi && ok(meta.thesisTypeEn) && (
            <div className="mb-6">
              <p className="text-base italic text-gray-600 font-serif">{meta.thesisTypeEn}</p>
            </div>
          )}

          {/* ── 学院 ── */}
          {ok(meta.college) && (
            <div className="mb-6">
              <h3 className="text-lg font-bold" style={{ fontFamily: '"SimHei","黑体",sans-serif' }}>
                {meta.college}
              </h3>
              {bi && (
                <p className="text-xs text-gray-500 font-serif mt-0.5">College of Continuing Education</p>
              )}
            </div>
          )}

          <div className="w-16 border-t border-gray-300 my-8" />

          {/* ── 题目（多行下划线）── */}
          <div className="mb-12">
            <div className="mb-2">
              {ok(meta.title) ? (
                <UnderlineText text={meta.title} bold fontSize={18} />
              ) : (
                <p className="text-gray-300 italic">（论文题目待填写）</p>
              )}
            </div>
            {bi && (
              <div className="mt-3">
                {ok(meta.titleEn) ? (
                  <UnderlineText text={meta.titleEn} fontSize={14} />
                ) : null}
              </div>
            )}
          </div>

          {/* ── 学生信息 ── */}
          <div className="space-y-2 mb-8">
            {ok(meta.author) && (
              <InfoLine labelCN="学生姓名" labelEN="Name" value={meta.author} bilingual={bi} />
            )}
            {ok(meta.studentId) && (
              <InfoLine labelCN="学　　号" labelEN="Student ID" value={meta.studentId} bilingual={bi} />
            )}
            {ok(meta.major) && (
              <InfoLine labelCN="班级/专业" labelEN="Class/Major" value={meta.major} bilingual={bi} />
            )}
            {ok(meta.advisor) && (
              <InfoLine labelCN="指导教师" labelEN="Advisor" value={meta.advisor} bilingual={bi} />
            )}
            {meta.coAdvisors.filter(ok).map((ca, i) => (
              <InfoLine key={i} labelCN="联合指导教师" labelEN="Co-Advisor" value={ca} bilingual={bi} />
            ))}
            {ok(meta.offCampusAdvisor) && (
              <InfoLine labelCN="校外指导教师" labelEN="Off-Campus Advisor" value={meta.offCampusAdvisor} bilingual={bi} />
            )}
          </div>

          {/* ── 日期 ── */}
          {ok(meta.submitDate) && (
            <div className="mt-12">
              <p className="text-sm text-gray-600">{meta.submitDate}</p>
            </div>
          )}
        </div>
      </div>

      {/* 容量提示 */}
      <p className="text-[10px] text-gray-400 text-center">
        {meta.title.length > 38
          ? '⚠ 题目较长，将以多行显示 · 下划线自动对齐'
          : '预览基于 CSS 仿真，最终 Word 输出以排版引擎为准'}
      </p>
    </div>
  );
};
