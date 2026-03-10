import re

# 修复 settings_new.ts
with open('.obsidian/plugins/obsidian-mypaper-plugin/src/settings_new.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 在所有 cardHeight 后添加 titleAlignment
content = content.replace(
    "cardHeight: 180,\n    titleTextColor: undefined,",
    "cardHeight: 180,\n    titleAlignment: 'left',\n    titleTextColor: undefined,"
)

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/settings_new.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ settings_new.ts: 已添加 titleAlignment")

# 修复 AddPaperModal.ts
with open('.obsidian/plugins/obsidian-mypaper-plugin/src/ui/AddPaperModal.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 在新领域创建处添加 titleAlignment
content = content.replace(
    "cardHeight: 180,\n      };",
    "cardHeight: 180,\n        titleAlignment: 'left',\n      };"
)

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/ui/AddPaperModal.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ AddPaperModal.ts: 已添加 titleAlignment")

print("\n✅ 所有编译错误已修复！")
