/**
 * 📑 复杂页眉页脚与双轨页码配置引擎
 *
 * 功能：
 *   1. 前置部分(摘要→目录) 使用罗马数字页码 I, II, III...
 *   2. 正文部分(引言→附录) 使用阿拉伯数字页码 1, 2, 3...
 *   3. 奇数页眉：毕业设计说明书（论文）+ 论文题目
 *   4. 偶数页眉：章节名 + 毕业设计说明书（论文）
 *
 * 实现：生成 CSS 规则 + JS 注入页面标记
 */

export interface PageConfig {
  /** 论文题目（页眉用） */
  paperTitle: string;
  /** 前置部分结束的 H1 标题文本（从此标题开始算正文） */
  mainMatterStartHeading: string;
  /** 是否启用奇偶页异构 */
  useOddEvenHeaders: boolean;
}

export interface PageConfigResult {
  /** 注入 HTML 的 body class 标记 */
  bodyClass: string;
  /** 注入<head>的 <style> 内容 */
  css: string;
  /** 注入页面的标记 script */
  initScript: string;
}

/**
 * 生成页眉页脚 + 双轨页码的完整 CSS + JS
 */
export function buildPageConfig(config: PageConfig): PageConfigResult {
  const { paperTitle, useOddEvenHeaders } = config;

  // ── CSS Paged Media + 屏幕预览兼容 ──
  const css = /* css */ `
    /* ===== 前置部分：罗马数字页码 ===== */
    .front-matter {
      counter-reset: front-page;
    }

    .front-matter .page-break {
      page: front;
    }

    @page front {
      @bottom-center {
        content: counter(front-page, upper-roman);
        font-family: "Times New Roman", serif;
        font-size: 10pt;
      }
    }

    /* ===== 正文部分：阿拉伯数字页码 ===== */
    .main-matter {
      counter-reset: main-page;
    }

    .main-matter .page-break {
      page: main;
    }

    /* 奇数页页眉 */
    @page main :right {
      @top-center {
        content: "毕业设计说明书（论文）   ${paperTitle || '论文题目'}";
        font-family: SimSun, serif;
        font-size: 9pt;
        border-bottom: 1px solid #333;
        padding-bottom: 4px;
      }
      @bottom-center {
        content: counter(main-page);
        font-family: "Times New Roman", serif;
        font-size: 10pt;
      }
    }

    /* 偶数页页眉 */
    @page main :left {
      @top-center {
        content: string(chapter-title) "   毕业设计说明书（论文）";
        font-family: SimSun, serif;
        font-size: 9pt;
        border-bottom: 1px solid #333;
        padding-bottom: 4px;
      }
      @bottom-center {
        content: counter(main-page);
        font-family: "Times New Roman", serif;
        font-size: 10pt;
      }
    }

    /* 抓取当前页的 H1 文本作为页眉 */
    .main-matter h1 {
      string-set: chapter-title content();
    }

    /* ===== 屏幕预览模拟样式 ===== */
    .dual-page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9pt;
      color: #555;
      border-bottom: 1px solid #ccc;
      padding: 4px 0;
      margin-bottom: 12px;
    }
    .dual-page-footer {
      display: flex;
      justify-content: center;
      font-family: "Times New Roman", serif;
      font-size: 10pt;
      color: #555;
      border-top: 1px solid #ccc;
      padding-top: 4px;
      margin-top: 12px;
    }
  `;

  // ── JS 初始化脚本生成（字符串形式，注入 HTML） ──
  const initScript = /* js */ `
    (function() {
      // 查找前置部分的所有页面分隔
      const frontPages = document.querySelectorAll('.front-matter .page-break');
      frontPages.forEach(function(page, i) {
        const footer = page.querySelector('.dual-page-footer');
        if (footer) {
          footer.textContent = toRoman(i + 1);
        } else {
          const f = document.createElement('div');
          f.className = 'dual-page-footer';
          f.textContent = toRoman(i + 1);
          page.appendChild(f);
        }
      });

      // 查找正文部分的页面分隔
      const mainPages = document.querySelectorAll('.main-matter .page-break');
      mainPages.forEach(function(page, i) {
        const footer = page.querySelector('.dual-page-footer');
        if (footer) {
          footer.textContent = String(i + 1);
        } else {
          const f = document.createElement('div');
          f.className = 'dual-page-footer';
          f.textContent = String(i + 1);
          page.appendChild(f);
        }

        // 偶数页页眉：取首个 H1 文本
        if (i % 2 === 1 && ${useOddEvenHeaders}) {
          const h1 = page.querySelector('h1');
          const header = page.querySelector('.dual-page-header');
          const headerText = (h1 ? h1.textContent : '') + '   毕业设计说明书（论文）';
          if (header) {
            header.textContent = headerText;
          }
        }
      });

      function toRoman(n) {
        var vals = [
          [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
          [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
        ];
        var r = '';
        for (var i = 0; i < vals.length; i++) {
          while (n >= vals[i][0]) { r += vals[i][1]; n -= vals[i][0]; }
        }
        return r || 'I';
      }
    })();
  `;

  return {
    bodyClass: 'page-config-active',
    css: `<style data-page-config>${css}</style>`,
    initScript: `<script data-page-init>${initScript}</script>`,
  };
}

/**
 * 对 HTML 进行前/正文章节切分（注入 class 标记）
 * @param html 原始 mammoth HTML
 * @param mainMatterStartHeading 正文开始的 H1 标题文本
 * @returns 标记后的 HTML
 */
export function markPageSections(html: string, mainMatterStartHeading: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const body = doc.body;
  const children = Array.from(body.children);
  let inMain = false;

  for (const child of children) {
    if (!inMain && child.tagName === 'H1') {
      const text = child.textContent?.trim() || '';
      if (text.includes(mainMatterStartHeading) || text === mainMatterStartHeading) {
        inMain = true;
      }
    }

    if (inMain) {
      child.classList.add('main-matter-page');
    } else {
      child.classList.add('front-matter-page');
    }
  }

  return doc.body.innerHTML;
}

/**
 * 将罗马数字页码注入 body（前置部分标记）
 */
export function injectPageNumbering(html: string): string {
  // 包装前置/正文的每个 H1 前插入分页标记
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');

  // 对每个 H1 前插入分页标记（如果它是章节开始）
  const h1s = doc.querySelectorAll('h1');
  h1s.forEach((h1, i) => {
    const wrap = doc.createElement('div');
    const isFront = h1.closest('.front-matter-page');
    wrap.className = 'page-break';
    if (isFront) {
      // 已在前置标记
    }
    h1.parentNode?.insertBefore(wrap, h1);
    wrap.appendChild(h1);
  });

  // 确保所有 .front-matter-page 元素在前置容器里
  const frontItems = doc.querySelectorAll('.front-matter-page');
  if (frontItems.length > 0) {
    let frontWrap = doc.querySelector('.front-matter');
    if (!frontWrap) {
      frontWrap = doc.createElement('div');
      frontWrap.className = 'front-matter';
      const first = frontItems[0];
      first.parentNode?.insertBefore(frontWrap, first);
    }
    frontItems.forEach(el => frontWrap!.appendChild(el));
  }

  return doc.body.innerHTML;
}
