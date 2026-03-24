#!/usr/bin/env python3
import re

with open('src/ui/PaperView.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换有问题的保存按钮代码部分
old_pattern = r'''      // 更新灵感
      const ideaIndex = this\.plugin\.settings\.ideas\.findIndex\(i => i\.id === idea\.id\);
      if \(ideaIndex !== -1\) \{
        this\.plugin\.settings\.ideas\[ideaIndex\]!\.title = newTitle;
        this\.plugin\.settings\.ideas\[ideaIndex\]!\.content = newContent;
        await this\.plugin\.saveSettings\(\);
        new Notice\('✓ 灵感已更新'\);
        modal\.close\(\);
        parentModal\.close\(\);
        this\.showIdeasLibraryModal\(\);
        this\.render\(\);
      \}
    \}\)\;'''

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

content = re.sub(old_pattern, new_code, content, flags=re.DOTALL)

with open('src/ui/PaperView.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ 已修复保存按钮的类型错误')
