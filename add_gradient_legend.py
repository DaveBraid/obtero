#!/usr/bin/env python3
with open('.obsidian/plugins/obsidian-mypaper-plugin/src/ui/PaperView.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 修改renderCalendar方法，添加横向渐变指示条
old_calendar = '''  private renderCalendar(container: HTMLElement): void {
    const section = container.createDiv({ cls: 'pm-dashboard-section' });

    const header = section.createDiv({ cls: 'pm-calendar-header' });

    const currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth() + 1;

    // 年月显示 - 可点击
    const yearMonthDisplay = header.createDiv({ cls: 'pm-calendar-yearmonth-clickable' });
    yearMonthDisplay.createSpan({
      cls: 'pm-calendar-current',
      text: `${currentYear}年${currentMonth}月`
    });
    yearMonthDisplay.addEventListener('click', () => this.showMonthPickerModal());'''

new_calendar = '''  private renderCalendar(container: HTMLElement): void {
    const section = container.createDiv({ cls: 'pm-dashboard-section' });

    const header = section.createDiv({ cls: 'pm-calendar-header' });

    const currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth() + 1;

    // 年月显示 + 颜色指示条（横向布局）
    const headerMain = header.createDiv({ cls: 'pm-calendar-header-main' });

    const yearMonthDisplay = headerMain.createDiv({ cls: 'pm-calendar-yearmonth-clickable' });
    yearMonthDisplay.createSpan({
      cls: 'pm-calendar-current',
      text: `${currentYear}年${currentMonth}月`
    });
    yearMonthDisplay.addEventListener('click', () => this.showMonthPickerModal());

    // 横向渐变颜色指示条
    const legend = headerMain.createDiv({ cls: 'pm-calendar-legend-inline' });
    legend.createSpan({ cls: 'pm-legend-label', text: '灵感数量：' });

    const legendBar = legend.createDiv({ cls: 'pm-calendar-legend-gradient' });

    // 渐变条
    const gradientColors = [
      { color: 'var(--background-secondary)', count: '0', label: '0' },
      { color: 'rgba(67, 160, 71, 0.3)', count: '1', label: '1' },
      { 'color: 'rgba(67, 160, 71, 0.5)', count: '2', label: '2' },
      { color: 'rgba(67, 160, 71, 0.7)', count: '3', label: '3' },
      { color: 'rgba(67, 160, 71, 0.85)', count: '4', label: '4' },
      { color: 'rgba(67, 160, 71, 1)', count: '5+', label: '5+' }
    ];

    gradientColors.forEach((level, index) => {
      const segment = legendBar.createDiv({ cls: 'pm-calendar-legend-segment' });
      segment.style.cssText = `flex: 1; height: 100%; background: ${level.color}; border-radius: 4px;`;

      // 只在第一个和最后一个显示标签
      if (index === 0 || index === gradientColors.length - 1) {
        const label = segment.createSpan({ cls: 'pm-calendar-legend-label-inline', text: level.label });
        label.style.cssText = index === 0 ? 'position: absolute; left: -28px; font-size: 11px; color: var(--text-muted);' : 'position: absolute; right: -28px; font-size: 11px; color: var(--text-muted);';
      }
    });'''

content = content.replace(old_calendar, new_calendar)

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/ui/PaperView.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 已添加横向渐变颜色指示条")
print("  • 位于'2026年3月'同一行")
print("  • 从左到右渐变：灰 → 绿")
print("  • 6个颜色段：0 1 2 3 4 5+")
