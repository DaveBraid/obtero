# 读取文件
with open('PaperView.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 找到并替换有问题的代码
old_code = '''      // 更新灵感
      const ideaIndex = this.plugin.settings.ideas.findIndex(i => i.id === idea.id);
      if (ideaIndex !== -1) {
        const targetIdea = this.plugin.settings.ideas[ideaIndex];
        if (targetIdea) {
          targetIdea.title = newTitle;
          targetIdea.content = newContent;'''

new_code = '''      // 更新灵感
      const ideas = this.plugin.settings.ideas || [];
      const ideaIndex = ideas.findIndex(i => i.id === idea.id);
      if (ideaIndex !== -1 && ideas[ideaIndex]) {
        ideas[ideaIndex]!.title = newTitle;
        ideas[ideaIndex]!.content = newContent;'''

content = content.replace(old_code, new_code)

# 写回文件
with open('PaperView.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("TypeScript 类型错误修复完成")
