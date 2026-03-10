with open('.obsidian/plugins/obsidian-mypaper-plugin/src/settings.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换 titleFontFamily: 1 为 titleFontFamily: 4
content = content.replace('titleFontFamily: 1,', 'titleFontFamily: 4,')

# 替换 metaFontFamily: 1 为 metaFontFamily: 4
content = content.replace('metaFontFamily: 1,', 'metaFontFamily: 4,')

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/settings.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("默认字体已改为 Comic Sans！")
