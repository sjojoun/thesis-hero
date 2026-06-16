import React from 'react';
import type { TemplateConfig } from '@/types';
import { dxaToMm, halfPtToPt, formatLineSpacing, alignmentLabel } from '@/lib/utils';

interface TemplateInfoProps {
  config: TemplateConfig;
}

/** 模板详情预览卡片（只读展示） */
export const PreviewCard: React.FC<TemplateInfoProps> = ({ config }) => {
  const items = [
    { label: '正文', value: `${config.body.fontFamilyCN} ${halfPtToPt(config.body.fontSize)}pt · ${formatLineSpacing(config.body.lineSpacing)}行距 · ${alignmentLabel(config.body.alignment)}` },
    { label: '一级标题', value: `${config.h1.fontFamilyCN} ${halfPtToPt(config.h1.fontSize)}pt · ${config.h1.bold ? '加粗' : ''} · ${alignmentLabel(config.h1.alignment)}` },
    { label: '二级标题', value: `${config.h2.fontFamilyCN} ${halfPtToPt(config.h2.fontSize)}pt · ${config.h2.bold ? '加粗' : ''}` },
    { label: '页边距', value: `上${dxaToMm(config.page.marginTop)}mm 下${dxaToMm(config.page.marginBottom)}mm 左${dxaToMm(config.page.marginLeft)}mm 右${dxaToMm(config.page.marginRight)}mm` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map(item => (
        <div key={item.label} className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
            {item.label}
          </span>
          <span className="text-xs text-gray-700 leading-relaxed">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};
