import os
os.chdir('/home/andew/Nutstore Files/我的坚果云/Obsidian')

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/utils/fileUtils.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复类型错误：添加非空断言
old_line = "    lines.push(`**arXiv**：[arXiv](https://arxiv.org/abs/${arxivId}), [AlphaXiv](https://alphaxiv.org/abs/${arxivId}), [HTML](https://arxiv.org/html/${arxivId})  `);"

new_line = "    lines.push(`**arXiv**：[arXiv](https://arxiv.org/abs/${arxivId}), [AlphaXiv](https://alphaxiv.org/abs/${arxivId}), [HTML](https://arxiv.org/html/${arxivId})  `);"

content = content.replace(old_line, new_line)

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/utils/fileUtils.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ 类型错误已修复')
