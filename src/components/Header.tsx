import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo + 名称 */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
              <path d="M8 12h20M8 18h16M8 24h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="28" cy="22" r="5" fill="#A5B4FC" stroke="#4F46E5" strokeWidth="1.5"/>
              <path d="M28 19.5v2.5l1.5 1.5" stroke="#4F46E5" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              毕设救星
            </h1>
            <p className="text-xs text-gray-400 -mt-0.5">
              论文排版助手 · Thesis Formatter
            </p>
          </div>
        </div>

        {/* 右侧信息 */}
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-400 bg-green-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
             本地 / Local · 零隐私 / Zero-Risk
          </span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="GitHub"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};
