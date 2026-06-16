import React from 'react';

/**
 * CommerceBanner — 商业化展示（纯前端占位）
 *
 * 展示即将推出的高级功能，引导用户关注后续开发。
 * 当前不做任何付费逻辑，仅为前端展示。
 */
export const CommerceBanner: React.FC = () => {
  const features = [
    {
      icon: '🔬',
      title: 'AI 语法精修',
      desc: '接入 Sapling API，自动纠正中英双语语法错误、拼写错误和学术语调问题，告别低级语病被导师打回。',
      status: '开发中',
    },
    {
      icon: '🤖',
      title: 'AI 痕迹预警',
      desc: '集成 ZeroGPT 检测引擎，一键扫描全篇高 AI 生成嫌疑段落，提前规避学术不端风险。',
      status: '开发中',
    },
    {
      icon: '📚',
      title: '百校模板库',
      desc: '内置清北复交等 Top 100 高校官方毕业论文模板（本/硕/博分类），一键切换目标学校格式。',
      status: '即将推出',
    },
    {
      icon: '☁️',
      title: '云端同步',
      desc: '自定义排版参数和个人模板永久保存云端，跨设备无缝同步，换电脑也能继续用。',
      status: '规划中',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
      {/* 顶部横幅 */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-500 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">🚀 Pro 版即将上线</h3>
            <p className="text-brand-100 text-xs mt-1">
              高阶质检 + 百校模板 + 云端同步，让你的论文万无一失
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">
            💡 提出你的建议
          </span>
        </div>
      </div>

      {/* 功能卡片 */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map(f => (
          <div
            key={f.title}
            className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">{f.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">{f.title}</h4>
                  <span className={`
                    text-[10px] px-1.5 py-0.5 rounded-full font-medium
                    ${f.status === '开发中' ? 'bg-amber-100 text-amber-700' :
                      f.status === '即将推出' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-500'}
                  `}>
                    {f.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部引导 */}
      <div className="px-6 pb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          当前版本完全免费 · 纯本地处理 · 零隐私风险
        </p>
        <a
          href="mailto:yzmxsc@163.com"
          className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          ✉️ 欢迎来信提建议
        </a>
      </div>
    </div>
  );
};
