import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

export const AboutSection: React.FC = () => {
  return (
    <section className="about-section">
      <Card className="about-card border-brand-100">
        <CardContent className="p-6">
          <div className="about-header flex items-center gap-3 mb-5">
            <span className="text-2xl">ℹ️</span>
            <h2 className="text-lg font-bold text-gray-900">关于我们</h2>
          </div>

          <div className="about-body space-y-5">
            <div className="about-intro">
              <p className="text-sm text-gray-600 leading-relaxed">
                这是一个<strong className="text-gray-800">测试项目</strong>，后续会上线完整项目。
                感谢您的关注与支持！如有任何问题欢迎发邮件咨询。
              </p>
            </div>

            <div className="about-grid grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* 左侧：公司信息 */}
              <div className="about-info sm:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-gray-800">
                  🏢 扬州铭玄数崇物联科技有限公司
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  专注于<strong className="text-gray-800">软件定制开发</strong>，为企业和个人提供高质量的软件开发服务。
                </p>

                <div className="about-student rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <span className="inline-block text-xs font-bold text-amber-700 bg-amber-100 rounded-full px-3 py-1 mb-2">
                    🎓 大学生优惠政策
                  </span>
                  <p className="text-sm text-amber-800">
                    代写毕业论文 · 软件类毕业设计 · 课程项目开发
                  </p>
                </div>

                <p className="about-contact text-sm text-gray-600">
                  📧 咨询邮箱：{' '}
                  <a href="mailto:yzmxsc@163.com" className="text-brand-600 hover:text-brand-700 underline underline-offset-2">
                    yzmxsc@163.com
                  </a>
                </p>

                <p className="about-welcome text-sm text-gray-500">
                  欢迎企业、个人前来咨询合作！
                </p>
              </div>

              {/* 右侧：赞助 + 友链 */}
              <div className="about-support space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-3">💛 支持一下</h3>
                  <div className="about-qr rounded-xl border border-gray-200 p-2 bg-white w-40 mx-auto">
                    <img
                      src="2605159b04a305e3f07c550cbca486eb.jpg"
                      alt="收款码"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                  <p className="about-qr-hint text-center text-xs text-gray-400 mt-2">
                    扫码支持我们
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">🔗 友情链接</h3>
                  <a
                    href="https://office-toolkit-suite.2101883303.workers.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 hover:underline underline-offset-2 transition-colors"
                  >
                    🔧 Office 工具箱套件
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
