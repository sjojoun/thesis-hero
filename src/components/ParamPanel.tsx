import React from 'react';
import type { TemplateConfig, PageConfig, ParagraphStyleConfig, HeaderFooterConfig } from '@/types';
import { Accordion } from '@/components/ui/Accordion';
import { mmToDxa, dxaToMm, ptToHalfPt, halfPtToPt, ptToDxa, dxaToPt } from '@/lib/utils';

/** 中文字体选项 */
const CN_FONT_OPTIONS = ['宋体', '黑体', '楷体', '仿宋', '微软雅黑', '华文中宋'];
/** 西文字体选项 */
const EN_FONT_OPTIONS = ['Times New Roman', 'Arial', 'Calibri', 'Helvetica', 'Georgia'];
/** 行距选项（倍数） */
const LINE_SPACING_OPTIONS = [
  { label: '单倍行距', value: 240 },
  { label: '1.25 倍', value: 300 },
  { label: '1.5 倍', value: 360 },
  { label: '双倍行距', value: 480 },
];

interface ParamPanelProps {
  config: TemplateConfig;
  onChange: (config: TemplateConfig) => void;
  disabled: boolean;
}

/**
 * 深度克隆配置对象（避免引用修改）
 */
const cloneConfig = (c: TemplateConfig): TemplateConfig => JSON.parse(JSON.stringify(c));

export const ParamPanel: React.FC<ParamPanelProps> = ({ config, onChange, disabled }) => {
  const updatePage = (key: keyof PageConfig, value: number) => {
    const next = cloneConfig(config);
    (next.page as any)[key] = value;
    onChange(next);
  };

  const updateStyle = (
    target: 'body' | 'h1' | 'h2' | 'h3',
    key: keyof ParagraphStyleConfig,
    value: any
  ) => {
    const next = cloneConfig(config);
    (next[target] as any)[key] = value;
    onChange(next);
  };

  const updateHeaderFooter = (key: keyof HeaderFooterConfig, value: any) => {
    const next = cloneConfig(config);
    (next.headerFooter as any)[key] = value;
    onChange(next);
  };

  // ── 页边距滑条渲染 ──
  const marginSlider = (
    label: string,
    dxaValue: number,
    onChangeDxa: (v: number) => void
  ) => {
    const mmValue = dxaToMm(dxaValue);
    return (
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">{label}</span>
          <span className="text-xs font-mono text-gray-700">{mmValue} mm</span>
        </div>
        <input
          type="range"
          min={mmToDxa(10)}
          max={mmToDxa(60)}
          step={mmToDxa(1)}
          value={dxaValue}
          onChange={e => onChangeDxa(Number(e.target.value))}
          disabled={disabled}
          className="param-slider"
        />
      </div>
    );
  };

  // ── 字体选择器 ──
  const fontSelect = (
    label: string,
    cnFont: string,
    enFont: string,
    onCN: (v: string) => void,
    onEN: (v: string) => void
  ) => (
    <div className="mb-3">
      <span className="text-xs text-gray-500 block mb-1">{label}</span>
      <div className="flex gap-2">
        <select
          value={cnFont}
          onChange={e => onCN(e.target.value)}
          disabled={disabled}
          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          {CN_FONT_OPTIONS.map(f => (
            <option key={f} value={f}>{f}（中文）</option>
          ))}
        </select>
        <select
          value={enFont}
          onChange={e => onEN(e.target.value)}
          disabled={disabled}
          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          {EN_FONT_OPTIONS.map(f => (
            <option key={f} value={f}>{f}（英文）</option>
          ))}
        </select>
      </div>
    </div>
  );

  // ── 字号 + 加粗 ──
  const sizeAndBold = (
    target: 'body' | 'h1' | 'h2' | 'h3',
    style: ParagraphStyleConfig
  ) => (
    <div className="mb-3">
      <span className="text-xs text-gray-500 block mb-1">字号与加粗</span>
      <div className="flex items-center gap-3">
        <select
          value={style.fontSize}
          onChange={e => updateStyle(target, 'fontSize', Number(e.target.value))}
          disabled={disabled}
          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          {[9, 10, 11, 12, 14, 15, 16, 18, 22].map(pt => (
            <option key={pt} value={ptToHalfPt(pt)}>
              {['', '', '', '小四', '四号', '小三', '三号', '', '二号'][pt - 9] || ''} {pt}pt
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={style.bold}
            onChange={e => updateStyle(target, 'bold', e.target.checked)}
            disabled={disabled}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-400"
          />
          加粗
        </label>
      </div>
    </div>
  );

  // ── 首行缩进 ──
  const indentSlider = (target: 'body' | 'h1' | 'h2' | 'h3', style: ParagraphStyleConfig) => (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">首行缩进</span>
        <span className="text-xs font-mono text-gray-700">
          {style.firstLineIndent ? `${(style.firstLineIndent / 20).toFixed(0)} pt (${(style.firstLineIndent / 480).toFixed(1)} 字符)` : '无缩进'}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={ptToDxa(48)}
        step={ptToDxa(2)}
        value={style.firstLineIndent ?? 0}
        onChange={e => updateStyle(target, 'firstLineIndent', Number(e.target.value))}
        disabled={disabled}
        className="param-slider"
      />
    </div>
  );

  // ── 行距 ──
  const lineSpacingSelect = (target: 'body' | 'h1' | 'h2' | 'h3', style: ParagraphStyleConfig) => (
    <div className="mb-3">
      <span className="text-xs text-gray-500 block mb-1">行距</span>
      <select
        value={style.lineSpacing}
        onChange={e => updateStyle(target, 'lineSpacing', Number(e.target.value))}
        disabled={disabled}
        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
      >
        {LINE_SPACING_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  // ── 对齐方式 ──
  const alignmentSelect = (target: 'body' | 'h1' | 'h2' | 'h3', style: ParagraphStyleConfig) => (
    <div className="mb-3">
      <span className="text-xs text-gray-500 block mb-1">对齐方式</span>
      <div className="flex gap-1.5">
        {([
          { v: 'left', label: '左' },
          { v: 'center', label: '中' },
          { v: 'right', label: '右' },
          { v: 'both', label: '两端' },
        ] as const).map(opt => (
          <button
            key={opt.v}
            type="button"
            onClick={() => updateStyle(target, 'alignment', opt.v)}
            disabled={disabled}
            className={`
              flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors
              ${style.alignment === opt.v
                ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-300'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const styleSection = (target: 'body' | 'h1' | 'h2' | 'h3', label: string) => {
    const style = config[target];
    return (
      <div className="p-4 bg-gray-50/50 rounded-xl">
        <h4 className="text-xs font-semibold text-gray-800 mb-3">{label}</h4>
        {fontSelect(
          '字体',
          style.fontFamilyCN,
          style.fontFamilyEN,
          v => updateStyle(target, 'fontFamilyCN', v),
          v => updateStyle(target, 'fontFamilyEN', v)
        )}
        {sizeAndBold(target, style)}
        {lineSpacingSelect(target, style)}
        {alignmentSelect(target, style)}
        {indentSlider(target, style)}
      </div>
    );
  };

  const accordionItems = [
    {
      id: 'page',
      title: '页面设置',
      icon: '📄',
      defaultOpen: true,
      children: (
        <div>
          {marginSlider('上边距', config.page.marginTop, v => updatePage('marginTop', v))}
          {marginSlider('下边距', config.page.marginBottom, v => updatePage('marginBottom', v))}
          {marginSlider('左边距', config.page.marginLeft, v => updatePage('marginLeft', v))}
          {marginSlider('右边距', config.page.marginRight, v => updatePage('marginRight', v))}
        </div>
      ),
    },
    {
      id: 'body',
      title: '正文样式',
      icon: '📝',
      children: styleSection('body', '正文（普通段落）'),
    },
    {
      id: 'h1',
      title: '一级标题（章）',
      icon: 'H1',
      children: styleSection('h1', '章标题 · 如"第一章 绪论"'),
    },
    {
      id: 'h2',
      title: '二级标题（节）',
      icon: 'H2',
      children: styleSection('h2', '节标题 · 如"1.1 研究背景"'),
    },
    {
      id: 'h3',
      title: '三级标题（条）',
      icon: 'H3',
      children: styleSection('h3', '条标题 · 如"1.1.1 国内研究现状"'),
    },
    {
      id: 'hf',
      title: '页眉与页脚',
      icon: '🏷️',
      children: (
        <div>
          <div className="mb-3">
            <label className="text-xs text-gray-500 block mb-1">页眉文字</label>
            <input
              type="text"
              value={config.headerFooter.headerText}
              onChange={e => updateHeaderFooter('headerText', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
              placeholder="如：XX大学学士学位论文"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={config.headerFooter.showPageNumber}
              onChange={e => updateHeaderFooter('showPageNumber', e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-400"
            />
            显示页码（页脚居中）
          </label>
        </div>
      ),
    },
  ];

  return <Accordion items={accordionItems} />;
};
