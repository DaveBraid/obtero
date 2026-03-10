import re

# 读取文件
with open('.obsidian/plugins/obsidian-mypaper-plugin/src/types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 在 FieldStyle 接口中添加 titleAlignment 字段
old_card_size = '''  // 卡片尺寸
  cardWidth: number;         // 卡片宽度
  cardHeight: number;        // 卡片高度
}'''

new_card_size = '''  // 卡片尺寸
  cardWidth: number;         // 卡片宽度
  cardHeight: number;        // 卡片高度

  // 标题对齐
  titleAlignment: 'left' | 'center';  // 标题对齐方式
}'''

content = content.replace(old_card_size, new_card_size)

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/types.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ types.ts 已更新：添加 titleAlignment 字段")
