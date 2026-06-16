import React, { useState } from 'react';

interface AccordionItem {
  id: string;
  title: string;
  icon?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ items, className = '' }) => {
  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(items.filter(i => i.defaultOpen).map(i => i.id))
  );

  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={`divide-y divide-gray-100 border border-gray-100 rounded-xl bg-white card-shadow ${className}`}>
      {items.map(item => {
        const isOpen = openIds.has(item.id);
        return (
          <div key={item.id} className="overflow-hidden first:rounded-t-xl last:rounded-b-xl">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                {item.icon && <span>{item.icon}</span>}
                {item.title}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 16 16"
                fill="none"
              >
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6l4 4 4-4" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-5 pb-4 animate-fade-in">
                {item.children}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
