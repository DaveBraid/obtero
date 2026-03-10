const fs = require('fs');
const lines = fs.readFileSync('src/settings.ts', 'utf8').split('\n');
let result = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('文字色') && lines[i].includes('setName')) {
    skip = true;
    result.push('    // 标题颜色');
    result.push('    new Setting(controls)');
    result.push('      .setName("标题颜色")');
    result.push('      .addColorPicker(colorPicker => {');
    result.push('        colorPicker');
    result.push('          .setValue(field.titleTextColor || field.textColor)');
    result.push('          .onChange(async value => {');
    result.push('            this.plugin.settings.fields[index].titleTextColor = value;');
    result.push('            await this.plugin.saveSettings();');
    result.push('            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]\!);');
    result.push('            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]\!);');
    result.push('          });');
    result.push('      });');
    result.push('');
    result.push('    // 正文颜色');
    result.push('    new Setting(controls)');
    result.push('      .setName("正文颜色")');
    result.push('      .addColorPicker(colorPicker => {');
    result.push('        colorPicker');
    result.push('          .setValue(field.metaTextColor || field.textColor)');
    result.push('          .onChange(async value => {');
    result.push('            this.plugin.settings.fields[index].metaTextColor = value;');
    result.push('            await this.plugin.saveSettings();');
    result.push('            this.updateFieldPreview(cardPreview, this.plugin.settings.fields[index]\!);');
    result.push('            this.updateFontPreview(fontPreview, this.plugin.settings.fields[index]\!);');
    result.push('          });');
    result.push('      });');
    result.push('');
    continue;
  }
  if (skip && lines[i].trim() === '});') { skip = false; continue; }
  if (skip) continue;
  result.push(lines[i]);
}
fs.writeFileSync('src/settings.ts', result.join('\n'), 'utf8');
console.log('OK');
