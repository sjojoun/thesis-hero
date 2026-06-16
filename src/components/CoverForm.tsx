import React, { useState } from 'react';
import type { CoverMeta } from '@/types';

interface CoverFormProps {
  value: CoverMeta;
  onChange: (meta: CoverMeta) => void;
  disabled: boolean;
}

/** ── 双语开关 ── */
const BilingualToggle: React.FC<{ on: boolean; onChange: (v: boolean) => void }> = ({ on, onChange }) => (
  <label className="flex items-center justify-between cursor-pointer group">
    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
      📄 封面信息 / Cover Info
    </span>
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-400 select-none">
        中英双语 / Bilingual
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`
          relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full
          transition-colors duration-200 ease-in-out
          ${on ? 'bg-brand-500' : 'bg-gray-200'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-4 w-4 translate-y-0.5
            rounded-full bg-white shadow ring-0 transition-transform duration-200
            ${on ? 'translate-x-[18px]' : 'translate-x-[2px]'}
          `}
        />
      </button>
    </div>
  </label>
);

/** ── 单字段输入（含双语标签）── */
interface FieldProps {
  labelCN: string;
  labelEN: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled: boolean;
  showEN: boolean;
}

const Field: React.FC<FieldProps> = ({ labelCN, labelEN, value, onChange, placeholder, disabled, showEN }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
      <span className="text-gray-800">{labelCN}</span>
      {showEN && <span className="text-gray-400 font-normal text-[11px]">{labelEN}</span>}
    </label>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? labelCN}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
                 disabled:opacity-50 disabled:cursor-not-allowed
                 placeholder:text-gray-300 transition-all"
    />
  </div>
);

/** ── 动态列表字段（＋－按钮）── */
const DynamicList: React.FC<{
  labelCN: string;
  labelEN: string;
  items: string[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, v: string) => void;
  showEN: boolean;
  disabled: boolean;
}> = ({ labelCN, labelEN, items, onAdd, onRemove, onChange, showEN, disabled }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
        <span className="text-gray-800">{labelCN}</span>
        {showEN && <span className="text-gray-400 font-normal text-[11px]">{labelEN}</span>}
      </label>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="text-[10px] text-brand-500 hover:text-brand-600 font-medium
                   disabled:opacity-40 transition-colors"
      >
        ＋ 添加
      </button>
    </div>
    {items.map((item, i) => (
      <div key={i} className="flex gap-1.5 items-center animate-fade-in">
        <input
          type="text"
          value={item}
          onChange={e => onChange(i, e.target.value)}
          placeholder={`${labelCN} ${i + 1}`}
          disabled={disabled}
          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     placeholder:text-gray-300 transition-all"
        />
        <button
          type="button"
          onClick={() => onRemove(i)}
          disabled={disabled}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
          title="移除"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    ))}
    {items.length === 0 && (
      <p className="text-[10px] text-gray-300 italic pl-1">如有多个联合导师，点击「＋ 添加」</p>
    )}
  </div>
);

/** ── 折叠区域 ── */
const Collapse: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({
  title, defaultOpen = true, children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50/50 hover:bg-gray-50
                   transition-colors text-left"
      >
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs font-semibold text-gray-600">{title}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-2 space-y-3">{children}</div>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════════════

export const CoverForm: React.FC<CoverFormProps> = ({ value, onChange, disabled }) => {
  const bi = value.bilingual;

  const set = <K extends keyof CoverMeta>(k: K, v: CoverMeta[K]) =>
    onChange({ ...value, [k]: v });

  // 联合导师
  const addCA = () => set('coAdvisors', [...value.coAdvisors, '']);
  const rmCA = (i: number) =>
    set('coAdvisors', value.coAdvisors.filter((_, j) => j !== i));
  const chCA = (i: number, v: string) =>
    set('coAdvisors', value.coAdvisors.map((s, j) => (j === i ? v : s)));

  return (
    <div className="space-y-4">
      {/* ── 双语开关 ── */}
      <BilingualToggle on={bi} onChange={v => set('bilingual', v)} />

      {/* ── 基础信息 ── */}
      <Collapse title="🏫 学校 & 论文类型 / School & Type">
        <Field labelCN="学校" labelEN="University" value={value.school}
          onChange={v => set('school', v)} disabled={disabled} showEN={bi} />
        <Field labelCN="学院/系" labelEN="College/Dept" value={value.college}
          onChange={v => set('college', v)} disabled={disabled} showEN={bi} />
        <Field labelCN="论文类型" labelEN="Thesis Type" value={value.thesisType}
          onChange={v => set('thesisType', v)} disabled={disabled} showEN={bi}
          placeholder="如：毕业设计说明书（论文）" />
        {bi && (
          <Field labelCN="论文类型(英文)" labelEN="Thesis Type (EN)" value={value.thesisTypeEn}
            onChange={v => set('thesisTypeEn', v)} disabled={disabled} showEN={bi}
            placeholder="Graduation Project Report (Thesis)" />
        )}
      </Collapse>

      {/* ── 论文题目 ── */}
      <Collapse title="📝 论文题目 / Title">
        <Field labelCN="中文题目" labelEN="Title (CN)" value={value.title}
          onChange={v => set('title', v)} disabled={disabled} showEN={bi} />
        {bi && (
          <Field labelCN="英文题目" labelEN="Title (EN)" value={value.titleEn}
            onChange={v => set('titleEn', v)} disabled={disabled} showEN={bi} />
        )}
      </Collapse>

      {/* ── 作者信息 ── */}
      <Collapse title="👤 作者信息 / Author">
        <div className="grid grid-cols-2 gap-3">
          <Field labelCN="姓名" labelEN="Name" value={value.author}
            onChange={v => set('author', v)} disabled={disabled} showEN={bi} />
          <Field labelCN="学号" labelEN="Student ID" value={value.studentId}
            onChange={v => set('studentId', v)} disabled={disabled} showEN={bi} />
        </div>
        <Field labelCN="班级/专业" labelEN="Class/Major" value={value.major}
          onChange={v => set('major', v)} disabled={disabled} showEN={bi} />
        <Field labelCN="指导教师" labelEN="Advisor" value={value.advisor}
          onChange={v => set('advisor', v)} disabled={disabled} showEN={bi} />

        {/* 联合导师动态列表 */}
        <DynamicList
          labelCN="联合指导教师" labelEN="Co-Advisors"
          items={value.coAdvisors}
          onAdd={addCA} onRemove={rmCA} onChange={chCA}
          showEN={bi} disabled={disabled}
        />
      </Collapse>

      {/* ── 其他 ── */}
      <Collapse title="📅 其他 / Other">
        <Field labelCN="校外指导教师" labelEN="Off-Campus Advisor" value={value.offCampusAdvisor}
          onChange={v => set('offCampusAdvisor', v)} disabled={disabled} showEN={bi}
          placeholder="如有请填写，无则留空" />
        <Field labelCN="提交日期" labelEN="Date" value={value.submitDate}
          onChange={v => set('submitDate', v)} disabled={disabled} showEN={bi}
          placeholder="如：2026年6月" />
      </Collapse>

      {/* 选填提示 */}
      <p className="text-[10px] text-gray-400 text-center leading-relaxed">
        所有字段均可留空 · 留空则不生成对应行 · 填写任意字段后即生成封面
      </p>
    </div>
  );
};
