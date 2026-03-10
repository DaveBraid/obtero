import os
os.chdir('/home/andew/Nutstore Files/我的坚果云/Obsidian')

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/utils/fileUtils.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复模板字符串中的变量引用
old_code = '''  // 添加 arxivId 多链接
  if (paper.arxivId) {
    let arxivId = paper.arxivId;
    if (arxivId.includes('/')) {
      const parts = arxivId.split('/');
      arxivId = parts[parts.length - 1];
    }
    lines.push(`**arXiv**：[arXiv](https://arxiv.org/abs/${arxivId}), [AlphaXiv](https://alphaxiv.org/abs/${arxivId}), [HTML](https://arxiv.org/html/${arxivId})  `);
  }'''

new_code = '''  // 添加 arxivId 多链接
  if (paper.arxivId) {
    let arxivId = paper.arxivId;
    if (arxivId.includes('/')) {
      const parts = arxivId.split('/');
      arxivId = parts[parts.length - 1];
    }
    lines.push(`**arXiv**：[arXiv](https://arxiv.org/abs/${arxivId}), [AlphaXiv](https://alphaxiv.org/abs/${arxivId}), [HTML](https://arxiv.org/html/${arxivId})  `);
  }'''

content = content.replace(old_code, new_code)

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/utils/fileUtils.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ 已修复模板字符串语法')
