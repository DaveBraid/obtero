with open('.obsidian/plugins/obsidian-mypaper-plugin/src/ui/PaperView.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到并修复保存按钮部分的代码
for i in range(len(lines)):
    if i >= 1300 and i <= 1315:
        # 找到 await this.plugin.saveSettings(); 行
        if 'await this.plugin.saveSettings();' in lines[i]:
            # 检查下一行是否正确
            if i + 1 < len(lines) and 'new Notice' not in lines[i+1]:
                # 需要添加缺失的代码
                lines.insert(i+1, '          new Notice(\'✓ 灵感已更新\');\n')
                lines.insert(i+2, '          modal.close();\n')
                lines.insert(i+3, '          parentModal.close();\n')
                lines.insert(i+4, '          this.showIdeasLibraryModal();\n')
                lines.insert(i+5, '          this.render();\n')
                lines.insert(i+6, '        }\n')
                break

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/ui/PaperView.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('✅ 已修复')
