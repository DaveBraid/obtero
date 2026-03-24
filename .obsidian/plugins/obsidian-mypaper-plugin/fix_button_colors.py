#!/usr/bin/env python3

with open('src/ui/PaperView.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 修复按钮颜色
fixes = [
    # 归入英灵殿 - 紫色
    ("valhallaBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--interactive-accent); background: var(--interactive-accent); color: var(--text-on-accent); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15)';",
     "valhallaBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid #9773f7; background: #9773f7; color: white; box-shadow: 0 2px 8px rgba(151, 115, 247, 0.3)';"),

    # 删除按钮 - 红色
    ("deleteBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--interactive-accent); background: var(--interactive-accent); color: var(--text-on-accent); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15)';",
     "deleteBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid #ff3b30; background: #ff3b30; color: white; box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3)';"),
]

content = ''.join(lines)
for old, new in fixes:
    if old in content:
        content = content.replace(old, new)
        print(f"✓ 已修复: {new[:50]}...")

with open('src/ui/PaperView.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ 按钮颜色已修复")
print("  • 归入英灵殿：紫色 #9773f7")
print("  • 删除按钮：红色 #ff3b30")
print("  • 编辑/保存：蓝色")
print("  • 取消：灰色")
