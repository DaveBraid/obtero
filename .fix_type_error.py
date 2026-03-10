import os
os.chdir('/home/andew/Nutstore Files/我的坚果云/Obsidian')

# 读取 fileUtils.ts
with open('.obsidian/plugins/obsidian-mypaper-plugin/src/utils/fileUtils.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复类型错误
old_code = '''  if (paper.abstract) {
    lines.push('', '## 摘要', '', paper.abstract);
  }
  if (translatedAbstract) {
    // 添加折叠的翻译区块
    lines.push('', '> [!翻译]-', '> ', '> ## 摘要翻译', '> ');
    // 将翻译内容按行分割，每行加上 > 前缀
    const translatedLines = translatedAbstract.split('\\n');
    translatedLines.forEach(line => lines.push('> ' + line));
    lines.push('> ');
    // 添加原文
    const originalLines = paper.abstract.split('\\n');
    originalLines.forEach(line => lines.push('> ' + line));
  }'''

new_code = '''  if (paper.abstract) {
    lines.push('', '## 摘要', '', paper.abstract);
  }
  if (translatedAbstract && paper.abstract) {
    // 添加折叠的翻译区块
    lines.push('', '> [!翻译]-', '> ', '> ## 摘要翻译', '> ');
    // 将翻译内容按行分割，每行加上 > 前缀
    const translatedLines = translatedAbstract.split('\\n');
    translatedLines.forEach(line => lines.push('> ' + line));
    lines.push('> ');
    // 添加原文
    const originalLines = paper.abstract.split('\\n');
    originalLines.forEach(line => lines.push('> ' + line));
  }'''

content = content.replace(old_code, new_code)

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/utils/fileUtils.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ 已修复类型错误')
