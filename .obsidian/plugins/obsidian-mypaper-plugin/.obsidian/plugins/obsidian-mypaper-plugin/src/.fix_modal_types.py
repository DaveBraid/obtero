import re
import os

# 获取vault根目录
vault_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(vault_root)

# 修复 AddPaperModal.ts
modal_path = '.obsidian/plugins/obsidian-mypaper-plugin/src/ui/AddPaperModal.ts'
with open(modal_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 修改 titleAlignment 的类型声明
content = content.replace(
    "titleAlignment: 'left',\n      };",
    "titleAlignment: 'left' as 'left' | 'center',\n      };"
)

with open(modal_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✓ 已修复 {modal_path}")
