#!/usr/bin/env python3
with open('src/ui/PaperView.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old = '''      // 更新灵感
      const ideaIndex = this.plugin.settings.ideas.findIndex(i => i.id === idea.id);
      if (ideaIndex !== -1) {
        this.plugin.settings.ideas[ideaIndex]!.title = newTitle;
        this.plugin.settings.ideas[ideaIndex]!.content = newContent;
        await this.plugin.saveSettings();'''

new = '''      // 更新灵感
      const ideaIndex = this.plugin.settings.ideas.findIndex(i => i.id === idea.id);
      if (ideaIndex !== -1) {
        const targetIdea = this.plugin.settings.ideas[ideaIndex];
        if (targetIdea) {
          targetIdea.title = newTitle;
          targetIdea.content = newContent;
          await this.plugin.saveSettings();'''

content = content.replace(old, new)

with open('src/ui/PaperView.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ 已修复 TypeScript 类型错误')
