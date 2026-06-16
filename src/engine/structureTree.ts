/**
 * 🌳 论文结构树引擎 (Structure Tree)
 * 从 HTML 标题构建嵌套树形 JSON，供侧边栏组件可视化。
 */

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

export interface TreeNode {
  level: number;
  text: string;
  id: string;
  children: TreeNode[];
}

export type StructureTree = TreeNode[];

export function buildStructureTree(html: string): StructureTree {
  const doc = parseHtml(html);
  const headings = [...doc.querySelectorAll('h1, h2, h3')].map((el, idx) => {
    const level = parseInt(el.tagName.charAt(1), 10);
    const text = el.textContent?.trim() ?? '';
    const id = `struc-heading-${idx}`;
    el.setAttribute('id', id);
    return { level, text, id };
  });

  const tree: StructureTree = [];
  const stack: (TreeNode & { _node: typeof headings[0] })[] = [];

  for (const h of headings) {
    const node: TreeNode = { ...h, children: [] };
    const stackItem = { ...node, _node: h };

    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node);
    } else {
      tree.push(node);
    }
    stack.push(stackItem);
  }

  return tree;
}

export function flattenTree(tree: StructureTree): { level: number; text: string; id: string }[] {
  const result: { level: number; text: string; id: string }[] = [];
  function walk(nodes: StructureTree) {
    for (const n of nodes) {
      result.push({ level: n.level, text: n.text, id: n.id });
      walk(n.children);
    }
  }
  walk(tree);
  return result;
}
