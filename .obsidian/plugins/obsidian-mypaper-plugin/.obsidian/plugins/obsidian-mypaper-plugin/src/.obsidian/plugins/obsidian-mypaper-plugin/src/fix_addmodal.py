import re

# 修复 AddPaperModal.ts
with open('ui/AddPaperModal.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 修改 titleAlignment 的类型声明
content = content.replace(
    "titleAlignment: 'left',\n      };",
    "titleAlignment: 'left' as 'left' | 'center',\n      };"
)

with open('ui/AddPaperModal.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ AddPaperModal.ts: 已修复类型")
