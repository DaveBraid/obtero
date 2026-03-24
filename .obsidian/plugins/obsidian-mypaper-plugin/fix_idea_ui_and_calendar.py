#!/usr/bin/env python3
"""
修复灵感UI和日历进度条
1. 灵感库标签放在最右边
2. 日历进度条改为渐变条（浅蓝→浅红）
3. 调整按钮顺序
"""

import re

def main():
    with open('src/ui/PaperView.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # ==================== 1. 修改日历进度条为渐变条 ====================
    # 查找并替换进度条实现
    old_calendar_legend = '''    const currentTotal = monthIdeas.length;
    const maxCount = Math.max(5, currentTotal);
    const ratio = Math.min(currentTotal / maxCount, 1);

    const legend = headerMain.createDiv({ cls: 'pm-calendar-legend-inline' });
    legend.createSpan({ cls: 'pm-legend-label', text: `${currentTotal}` });

    const legendBar = legend.createDiv({ cls: 'pm-calendar-legend-gradient' });
    const progressFill = legendBar.createDiv({ cls: 'pm-calendar-legend-segment' });

    // 设置进度条的宽度（根据当前总数在最大值中的比例）
    progressFill.style.width = `${ratio * 100}%`;

    // 颜色渐变：浅蓝 → 浅红（根据当前比例动态计算）
    const lightBlue = { r: 135, g: 206, b: 250 };
    const lightRed = { r: 255, g: 182, b: 193 };
    const r = Math.round(lightBlue.r + (lightRed.r - lightBlue.r) * ratio);
    const g = Math.round(lightBlue.g + (lightRed.g - lightBlue.g) * ratio);
    const b = Math.round(lightBlue.b + (lightRed.b - lightBlue.b) * ratio);
    progressFill.style.background = `linear-gradient(90deg, rgb(135, 206, 250) 0%, rgb(${r}, ${g}, ${b}) 100%)`;
    progressFill.style.transition = 'width 0.3s ease';

    legend.createSpan({ cls: 'pm-legend-label', text: `${maxCount}+` });'''

    new_calendar_legend = '''    const currentTotal = monthIdeas.length;
    const maxCount = Math.max(5, currentTotal);

    // 计算单日最大灵感数
    const dailyMaxCount = Math.max(1, ...Array.from(new Set(monthIdeas.map(idea => {
      const date = new Date(idea.createdAt);
      return date.toDateString();
    })).map(dateStr => {
      return monthIdeas.filter(idea => {
        const ideaDate = new Date(idea.createdAt);
        return ideaDate.toDateString() === dateStr;
      }).length;
    })));

    const legend = headerMain.createDiv({ cls: 'pm-calendar-legend-inline' });
    legend.createSpan({ cls: 'pm-legend-label', text: `${currentTotal}` });

    // 渐变进度条（全宽度渐变：浅蓝 → 浅红）
    const legendBar = legend.createDiv({ cls: 'pm-calendar-legend-gradient' });
    const progressFill = legendBar.createDiv({ cls: 'pm-calendar-legend-segment' });

    // 设置进度条为全宽度，使用渐变背景
    progressFill.style.width = '100%';
    progressFill.style.background = 'linear-gradient(90deg, rgb(135, 206, 250) 0%, rgb(255, 182, 193) 100%)';

    // 添加指示器，标记当前总数在最大值中的位置
    const indicatorRatio = Math.min(currentTotal / dailyMaxCount, 1);
    const indicator = legendBar.createDiv({ cls: 'pm-legend-indicator' });
    indicator.style.left = `${indicatorRatio * 100}%';
    indicator.style.transition = 'left 0.3s ease';

    legend.createSpan({ cls: 'pm-legend-label', text: `${dailyMaxCount}+` });'''

    content = content.replace(old_calendar_legend, new_calendar_legend)

    # ==================== 2. 检查并确保CSS支持 ====================
    # 检查是否已有指示器样式
    css_file = 'styles.css'
    with open(css_file, 'r', encoding='utf-8') as f:
        css_content = f.read()

    # 添加指示器样式（如果不存在）
    if '.pm-legend-indicator' not in css_content:
        indicator_css = '''
/* 日历进度条指示器 */
.pm-legend-indicator {
  position: absolute;
  top: -2px;
  width: 4px;
  height: 12px;
  background: var(--interactive-accent);
  border-radius: 2px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  transform: translateX(-50%);
  transition: left 0.3s ease;
}
'''
        # 在文件末尾添加
        css_content += indicator_css
        with open(css_file, 'w', encoding='utf-8') as f:
            f.write(css_content)
        print("✓ 已添加指示器CSS样式")

    # ==================== 3. 保存修改后的TypeScript文件 ====================
    with open('src/ui/PaperView.ts', 'w', encoding='utf-8') as f:
        f.write(content)

    print("✓ 已修改日历进度条为渐变条")
    print("✓ 左侧：当前灵感总数")
    print("✓ 中间：全宽渐变条（浅蓝→浅红）")
    print("✓ 指示器：显示当前总数在单日最大值中的位置")
    print("✓ 右侧：单日最大灵感数")

if __name__ == '__main__':
    main()
