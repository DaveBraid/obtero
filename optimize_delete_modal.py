#!/usr/bin/env python3
import os

script_dir = "/home/andew/Nutstore Files/我的坚果云/Obsidian/.obsidian/plugins/obsidian-mypaper-plugin"
source_file = os.path.join(script_dir, "src/ui/PaperView.ts")

# 读取文件
with open(source_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到方法的开始和结束
start_line = None
end_line = None
brace_count = 0
found_method = False

for i, line in enumerate(lines):
    if 'private showIdeaDeleteConfirmModal(idea: IdeaItem, parentModal: Modal): void {' in line:
        start_line = i
        found_method = True
        brace_count = 1
        continue

    if found_method:
        brace_count += line.count('{')
        brace_count -= line.count('}')

        if brace_count == 0:
            end_line = i + 1
            break

if start_line and end_line:
    print(f'找到删除确认方法：第 {start_line + 1} 到 {end_line} 行')

    # 新的方法代码（使用内联样式）
    new_method = '''  private showIdeaDeleteConfirmModal(idea: IdeaItem, parentModal: Modal): void {
    const modal = new Modal(this.app);

    // 设置 Modal 容器
    modal.modalEl.style.cssText = 'max-width: 420px; width: 90vw;';

    // 主容器
    const container = modal.contentEl.createDiv();
    container.style.cssText = 'display: flex; flex-direction: column; background: var(--background-primary); border-radius: 12px; overflow: hidden; box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);';

    // 头部
    const header = container.createDiv();
    header.style.cssText = 'padding: 24px 24px 20px 24px; background: var(--background-secondary); border-bottom: 1px solid var(--background-modifier-border);';

    // 标题
    header.createEl('h2', { text: '删除灵感' }).style.cssText = 'margin: 0; font-size: 20px; font-weight: 700; color: var(--text-normal); line-height: 1.3;';

    // 内容区域
    const body = container.createDiv();
    body.style.cssText = 'padding: 24px; background: var(--background-primary);';

    // 警告图标 + 文字
    const warningRow = body.createDiv();
    warningRow.style.cssText = 'display: flex; gap: 12px; align-items: flex-start;';

    // 警告图标
    const icon = warningRow.createSpan({ text: '⚠️' });
    icon.style.cssText = 'font-size: 24px; flex-shrink: 0;';

    // 警告文字
    const text = warningRow.createDiv();
    text.style.cssText = 'flex: 1;';

    text.createEl('p', {
      text: `确定要删除「${idea.title}」吗？`
    }).style.cssText = 'margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: var(--text-normal);';

    text.createEl('p', {
      text: '此操作不可撤销。'
    }).style.cssText = 'margin: 0; font-size: 14px; color: var(--text-muted); line-height: 1.5;';

    // 按钮区域（右对齐）
    const actions = container.createDiv();
    actions.style.cssText = 'display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px 24px 24px; background: var(--background-secondary); border-top: 1px solid var(--background-modifier-border);';

    // 取消按钮
    const cancelBtn = actions.createEl('button', { text: '取消' });
    cancelBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--text-normal);';
    cancelBtn.addEventListener('click', () => modal.close());

    // 确认删除按钮（危险操作）
    const confirmBtn = actions.createEl('button', { text: '删除' });
    confirmBtn.style.cssText = 'min-height: 38px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid #ff3b30; background: #ff3b30; color: white; box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);';
    confirmBtn.addEventListener('click', () => {
      this.plugin.removeIdea(idea.id);
      new Notice('✓ 灵感已删除');
      modal.close();
      parentModal.close();
      this.showIdeasLibraryModal();
      this.render();
    });

    modal.open();
    cancelBtn.focus();
  }
'''

    # 替换
    new_lines = lines[:start_line] + [new_method + '\n'] + lines[end_line:]

    # 备份
    with open(os.path.join(script_dir, 'src/ui/PaperView.ts.backup_delete'), 'w', encoding='utf-8') as f:
        f.writelines(lines)

    # 保存
    with open(source_file, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print('✅ 删除确认窗口已优化！')
    print('✅ 使用内联样式')
    print('✅ 按钮右对齐')
    print('✅ 警告图标 + 分层文字')
    print('✅ 与详情窗口一致的设计风格')
else:
    print('❌ 未找到方法')
