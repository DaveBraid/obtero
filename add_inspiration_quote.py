#!/usr/bin/env python3
import os

script_dir = "/home/andew/Nutstore Files/我的坚果云/Obsidian/.obsidian/plugins/obsidian-mypaper-plugin"
source_file = os.path.join(script_dir, "src/ui/PaperView.ts")

# 读取文件
with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# ─────────────────────────────────────────────────────────────
# 1. 修改记录灵感Modal，添加激励语
# ─────────────────────────────────────────────────────────────

old_add_idea_modal_start = '''  private showAddIdeaModal(): void {
    const modal = new Modal(this.app);
    modal.contentEl.createEl('h2', { text: '记录灵感' });'''

new_add_idea_modal_start = '''  private showAddIdeaModal(): void {
    const modal = new Modal(this.app);

    // 标题栏
    const header = modal.contentEl.createDiv();
    header.style.cssText = 'padding: 24px 24px 16px 24px; background: var(--background-secondary); border-bottom: 1px solid var(--background-modifier-border);';
    header.createEl('h2', { text: '记录灵感' }).style.cssText = 'margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: var(--text-normal);';

    // 激励语
    header.createEl('p', { text: '不记录的灵感，就像没有按下快门的风景。' }).style.cssText = 'margin: 0; font-size: 13px; color: var(--text-muted); font-style: italic;';'''

content = content.replace(old_add_idea_modal_start, new_add_idea_modal_start)

# 保存
with open(source_file, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ 步骤 1/2：已添加激励语到记录灵感页面')
print('   - 标题：记录灵感')
print('   - 激励语：不记录的灵感，就像没有按下快门的风景。')
