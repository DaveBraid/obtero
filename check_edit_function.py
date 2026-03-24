#!/usr/bin/env python3
# 检查 showIdeaActionModal 方法

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/ui/PaperView.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到 showIdeaActionModal 方法
start_line = None
end_line = None
brace_count = 0
found_method = False

for i, line in enumerate(lines):
    if 'private showIdeaActionModal(idea: IdeaItem, parentModal: Modal): void {' in line:
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
    print(f"找到方法：第 {start_line + 1} 到 {end_line} 行\n")

    # 检查是否包含编辑功能的关键代码
    method_code = ''.join(lines[start_line:end_line])

    if 'titleInput' in method_code:
        print("✅ 包含 titleInput（可编辑标题）")
    else:
        print("❌ 未找到 titleInput（可编辑标题）")

    if 'contentTextarea' in method_code:
        print("✅ 包含 contentTextarea（可编辑正文）")
    else:
        print("❌ 未找到 contentTextarea（可编辑正文）")

    if '保存修改' in method_code or '💾 保存' in method_code:
        print("✅ 包含保存修改按钮")
    else:
        print("❌ 未找到保存修改按钮")

    if 'targetIdea.title = newTitle' in method_code:
        print("✅ 包含更新标题的代码")
    else:
        print("❌ 未找到更新标题的代码")
else:
    print("❌ 未找到方法")
