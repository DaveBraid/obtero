import re

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/settings.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_text = """          });
      });

    // 卡片尺寸设置
    this.addProminentSubHeader(controls, '卡片尺寸');"""

new_text = """          });
      });

    // 标题颜色
    new Setting(controls)
      .setName('标题颜色')
      .addColorPicker(colorPicker => {
        colorPicker
          .setValue(field.titleTextColor || field.textColor)
          .onChange(async value => {
            this.plugin.settings.fields[index].titleTextColor = value;
            await this.plugin.saveSettings();
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
          });
      });

    // 正文颜色
    new Setting(controls)
      .setName('正文颜色')
      .addColorPicker(colorPicker => {
        colorPicker
          .setValue(field.metaTextColor || field.textColor)
          .onChange(async value => {
            this.plugin.settings.fields[index].metaTextColor = value;
            await this.plugin.saveSettings();
            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]!);
            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]!);
          });
      });

    // 卡片尺寸设置
    this.addProminentSubHeader(controls, '卡片尺寸');"""

new_content = content.replace(old_text, new_text)

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/settings.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("修改成功！")
