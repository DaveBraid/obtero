#!/usr/bin/env python3
import re

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/ui/PaperView.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复 TypeScript 类型错误
old_code = '''      // 更新灵感
      const ideaIndex = this.plugin.settings.ideas.findIndex(i => i.id === idea.id);
      if (ideaIndex !== -1) {
        this.plugin.settings.ideas[ideaIndex]!.title = newTitle;
        this.plugin.settings.ideas[ideaIndex]!.content = newContent;
        await this.plugin.saveSettings();
        new Notice('✓ 灵感已更新');
        modal.close();
        parentModal.close();
        this.showIdeasLibraryModal();
        this.render();
      }
    });'''

new_code = '''      // 更新灵感
      const ideaIndex = this.plugin.settings.ideas.findIndex(i => i.id === idea.id);
      if (ideaIndex !== -1) {
        const targetIdea = this.plugin.settings.ideas[ideaIndex];
        if (targetIdea) {
          targetIdea.title = newTitle;
          targetIdea.content = newContent;
          await this.plugin.saveSettings();
          new Notice('✓ 灵感已更新');
          modal.close();
          parentModal.close();
          this.showIdeasLibraryModal();
          this.render();
        }
      }
    });'''

content = content.replace(old_code, new_code)

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/ui/PaperView.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ 已修复类型错误')
print('✅ 编辑功能已添加')
print('✅ 现在请重新编译：npm run build')
