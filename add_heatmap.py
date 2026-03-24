#!/usr/bin/env python3

with open('.obsidian/plugins/obsidian-mypaper-plugin/src/ui/PaperView.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 新的renderCalendar方法（带热力图）
new_method = '''  private renderCalendar(container: HTMLElement): void {
    const section = container.createDiv({ cls: 'pm-dashboard-section' });

    const header = section.createDiv({ cls: 'pm-calendar-header' });

    const currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth() + 1;

    // 年月显示 + 颜色指示条容器
    const headerMain = header.createDiv({ cls: 'pm-calendar-header-main' });

    const yearMonthDisplay = headerMain.createDiv({ cls: 'pm-calendar-yearmonth-clickable' });
    yearMonthDisplay.createSpan({
      cls: 'pm-calendar-current',
      text: `${currentYear}年${currentMonth}月`
    });
    yearMonthDisplay.addEventListener('click', () => this.showMonthPickerModal());

    // 颜色指示条
    const legend = section.createDiv({ cls: 'pm-calendar-legend' });
    legend.createSpan({ cls: 'pm-calendar-legend-label', text: '灵感数量：' });

    const legendBar = legend.createDiv({ cls: 'pm-calendar-legend-bar' });

    const legendLevels = [
      { count: 0, color: 'var(--background-secondary)', label: '0' },
      { count: 1, color: 'rgba(67, 160, 71, 0.3)', label: '1' },
      { count: 2, color: 'rgba(67, 160, 71, 0.5)', label: '2' },
      { count: 3, color: 'rgba(67, 160, 71, 0.7)', label: '3' },
      { count: 4, color: 'rgba(67, 160, 71, 0.85)', label: '4' },
      { count: 5, color: 'rgba(67, 160, 71, 1)', label: '5+' }
    ];

    legendLevels.forEach(level => {
      const legendItem = legendBar.createDiv({ cls: 'pm-calendar-legend-item' });
      legendItem.style.cssText = `display: flex; align-items: center; gap: 6px;`;

      const legendColor = legendItem.createDiv({ cls: 'pm-calendar-legend-color' });
      legendColor.style.cssText = `width: 20px; height: 20px; border-radius: 50%; background: ${level.color};`;

      const legendLabel = legendItem.createSpan({ cls: 'pm-calendar-legend-text', text: level.label });
      legendLabel.style.cssText = 'font-size: 12px; color: var(--text-muted);';
    });

    const calendarGrid = section.createDiv({ cls: 'pm-calendar-grid' });

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    for (const day of weekdays) {
      const dayHeader = calendarGrid.createDiv({ cls: 'pm-calendar-day-header' });
      dayHeader.textContent = day;
    }

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarGrid.createDiv({ cls: 'pm-calendar-day-empty' });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = calendarGrid.createDiv({ cls: 'pm-calendar-day' });

      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayIdeas = (this.plugin.settings.ideas || []).filter(idea => {
        const ideaDate = new Date(idea.createdAt);
        const ideaDateStr = `${ideaDate.getFullYear()}-${String(ideaDate.getMonth() + 1).padStart(2, '0')}-${String(ideaDate.getDate()).padStart(2, '0')}`;
        return ideaDateStr === dateStr;
      });

      const dayNumber = dayCell.createDiv({ cls: 'pm-calendar-day-number' });
      dayNumber.textContent = String(day);

      // 根据灵感数量设置背景色（热力图效果）
      const ideaCount = dayIdeas.length;
      if (ideaCount > 0) {
        dayCell.classList.add('pm-calendar-day-has-ideas');

        // 根据数量设置颜色强度
        let heatColor = '';
        if (ideaCount === 1) {
          heatColor = 'rgba(67, 160, 71, 0.3)';
        } else if (ideaCount === 2) {
          heatColor = 'rgba(67, 160, 71, 0.5)';
        } else if (ideaCount === 3) {
          heatColor = 'rgba(67, 160, 71, 0.7)';
        } else if (ideaCount === 4) {
          heatColor = 'rgba(67, 160, 71, 0.85)';
        } else {
          heatColor = 'rgba(67, 160, 71, 1)';
        }

        dayCell.style.cssText = `background: ${heatColor};`;

        dayCell.addEventListener('click', () => {
          this.showDayIdeasModal(dateStr, dayIdeas);
        });
      } else {
        // 无灵感的天数显示浅灰色背景
        dayCell.style.cssText = 'background: var(--background-secondary);';
      }
    }
  }
'''

# 找到并替换方法
start_idx = None
end_idx = None
brace_count = 0
found = False

for i, line in enumerate(lines):
    if 'private renderCalendar(container: HTMLElement): void {' in line:
        start_idx = i
        found = True
        brace_count = 1
        continue

    if found:
        brace_count += line.count('{')
        brace_count -= line.count('}')

        if brace_count == 0:
            end_idx = i + 1
            break

if start_idx and end_idx:
    print(f"找到renderCalendar方法：第 {start_idx + 1} 到 {end_idx} 行")
    lines[start_idx:end_idx] = [new_method + '\n']

    with open('.obsidian/plugins/obsidian-mypaper-plugin/src/ui/PaperView.ts', 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("✅ 已添加日历热力图功能")
    print("  • 每天圆圈根据灵感数量显示颜色")
    print("  • 0个: 灰色")
    print("  • 1-5个: 绿色渐变")
    print("  • 5+个: 深绿色")
    print("  • 添加颜色指示条")
else:
    print("❌ 未找到renderCalendar方法")
