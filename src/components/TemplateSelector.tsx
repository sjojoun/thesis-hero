import React from 'react';
import type { TemplateConfig } from '@/types';
import { AVAILABLE_CONFIGS } from '@/types';
import { Select } from '@/components/ui/Select';
import { PreviewCard } from './PreviewCard';

interface TemplateSelectorProps {
  current: TemplateConfig;
  onChange: (config: TemplateConfig) => void;
  disabled: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  current,
  onChange,
  disabled,
}) => {
  const options = AVAILABLE_CONFIGS.map(c => ({
    value: c.id,
    label: `${c.name} (${c.degree})`,
  }));

  const handleChange = (value: string) => {
    const found = AVAILABLE_CONFIGS.find(c => c.id === value);
    if (found) onChange(found);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          选择排版模板 / Template
        </label>
        <Select
          options={options}
          value={current.id}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
      {current.description && (
        <p className="text-xs text-gray-400 leading-relaxed">{current.description}</p>
      )}
      <PreviewCard config={current} />
    </div>
  );
};
