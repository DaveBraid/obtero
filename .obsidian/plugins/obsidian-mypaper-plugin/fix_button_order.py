#!/usr/bin/env python3
"""
调整按钮顺序：删除按钮在最右边
"""

import re

def main():
    with open('src/ui/PaperView.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # 查找按钮创建部分
    # 当前顺序：editBtn, saveBtn, cancelEditBtn, valhallaBtn, deleteBtn
    # 需要调整为：editBtn, valhallaBtn, deleteBtn, saveBtn, cancelEditBtn
    # 但这样会导致显示/隐藏逻辑混乱

    # 实际上，查看模式显示：editBtn, valhallaBtn, deleteBtn
    # 编辑模式显示：saveBtn, cancelEditBtn

    # 让我重新组织按钮的创建顺序，使其更清晰
    old_button_section = '''    // 编辑按钮（查看模式显示）
    const editBtn = actions.createEl('button', { text: '✏️ 编辑' });
    editBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--interactive-accent); background: var(--interactive-accent); color: var(--text-on-accent); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);';

    // 保存按钮（编辑模式显示，初始隐藏）
    const saveBtn = actions.createEl('button', { text: '💾 保存' });
    saveBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--interactive-accent); background: var(--interactive-accent); color: var(--text-on-accent); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); display: none;';

    // 取消按钮（编辑模式显示，初始隐藏）
    const cancelEditBtn = actions.createEl('button', { text: '取消' });
    cancelEditBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--text-normal); display: none;';

    // 归入英灵殿（查看模式显示）
    const valhallaBtn = actions.createEl('button', { text: '✨ 归入英灵殿' });
    valhallaBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid #9773f7; background: #9773f7; color: white; box-shadow: 0 2px 8px rgba(151, 115, 247, 0.3);';

    // 删除（查看模式显示）
    const deleteBtn = actions.createEl('button', { text: '删除' });
    deleteBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid #ff3b30; background: #ff3b30; color: white; box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);';'''

    new_button_section = '''    // 编辑按钮（查看模式显示）
    const editBtn = actions.createEl('button', { text: '✏️ 编辑' });
    editBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--interactive-accent); background: var(--interactive-accent); color: var(--text-on-accent); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);';

    // 归入英灵殿（查看模式显示）
    const valhallaBtn = actions.createEl('button', { text: '✨ 归入英灵殿' });
    valhallaBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid #9773f7; background: #9773f7; color: white; box-shadow: 0 2px 8px rgba(151, 115, 247, 0.3);';

    // 删除（查看模式显示）- 放在最右边
    const deleteBtn = actions.createEl('button', { text: '删除' });
    deleteBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid #ff3b30; background: #ff3b30; color: white; box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);';

    // 保存按钮（编辑模式显示，初始隐藏）
    const saveBtn = actions.createEl('button', { text: '💾 保存' });
    saveBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--interactive-accent); background: var(--interactive-accent); color: var(--text-on-accent); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); display: none;';

    // 取消按钮（编辑模式显示，初始隐藏）
    const cancelEditBtn = actions.createEl('button', { text: '取消' });
    cancelEditBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--text-normal); display: none;';'''

    if old_button_section in content:
        content = content.replace(old_button_section, new_button_section)
        print("✓ 已调整按钮顺序")
        print("  查看模式：编辑 → 归入英灵殿 → 删除")
        print("  编辑模式：保存 → 取消")
    else:
        print("⚠ 未找到按钮创建代码，可能已被修改")

    with open('src/ui/PaperView.ts', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
