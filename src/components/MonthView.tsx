import React from 'react';
import { DayData } from '../types';
import { ALL_DATES, START_DATE, END_DATE, parseLocalDate, getDayType, formatChineseDate } from '../utils/dateHelpers';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, AlertTriangle, Moon } from 'lucide-react';

interface MonthViewProps {
  daysData: Record<string, DayData>;
  currentDateStr: string;
  onSelectDate: (dateStr: string) => void;
  onViewChange: (view: 'day' | 'week' | 'month' | 'stats' | 'quotes' | 'wheel') => void;
}

export default function MonthView({
  daysData,
  currentDateStr,
  onSelectDate,
  onViewChange
}: MonthViewProps) {

  // Helper to generate calendar matrix for a given year and month (1-indexed)
  const generateMonthGrid = (year: number, month: number) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    // JS getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // We want Monday as the first column (0 = Monday, ..., 6 = Sunday)
    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6; // Sunday becomes 6
    
    const totalDays = lastDay.getDate();
    const grid: { dateStr: string | null; dayNum: number | null }[] = [];
    
    // Pad preceding empty slots
    for (let i = 0; i < startOffset; i++) {
      grid.push({ dateStr: null, dayNum: null });
    }
    
    // Fill days
    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(month).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      grid.push({
        dateStr: `${year}-${mStr}-${dStr}`,
        dayNum: d
      });
    }
    
    return grid;
  };

  const julyGrid = generateMonthGrid(2026, 7);
  const augustGrid = generateMonthGrid(2026, 8);

  const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

  const renderMonthCalendar = (monthName: string, grid: typeof julyGrid) => {
    return (
      <div className="flex-1 p-5 border border-neutral-200/60 rounded-2xl bg-white shadow-sm flex flex-col justify-between">
        <h3 className="text-center font-sans font-semibold text-neutral-800 text-sm tracking-wide mb-4 border-b border-neutral-100 pb-2">
          {monthName}
        </h3>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((w, idx) => (
            <div key={idx} className="text-center text-[10px] text-neutral-400 font-sans font-medium py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 flex-1">
          {grid.map((cell, idx) => {
            const { dateStr, dayNum } = cell;
            if (!dateStr || !dayNum) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const inRange = dateStr >= START_DATE && dateStr <= END_DATE;
            const dayData = daysData[dateStr];
            const isSelected = dateStr === currentDateStr;
            const dType = getDayType(dateStr);

            // Calculate status dots
            let dotType: 'none' | 'complete' | 'uncompleted' | 'sunday_stats' = 'none';
            if (inRange && dayData) {
              if (dType === 'sunday') {
                dotType = 'sunday_stats';
              } else {
                let totalTasks = 0;
                let completedTasks = 0;
                let uncompletedTasks = 0;

                dayData.items.forEach(item => {
                  const isItem6 = item.id.endsWith('-6');
                  if (dType === 'weekday' && isItem6 && !dayData.item6Text) return;
                  
                  totalTasks++;
                  if (item.status === 'completed') completedTasks++;
                  else if (item.status === 'uncompleted') uncompletedTasks++;
                });

                if (uncompletedTasks > 0) dotType = 'uncompleted';
                else if (totalTasks > 0 && completedTasks === totalTasks) dotType = 'complete';
              }
            }

            return (
              <div
                key={dateStr}
                onClick={() => {
                  if (inRange) {
                    onSelectDate(dateStr);
                    onViewChange('day');
                  }
                }}
                className={`aspect-square rounded-lg border flex flex-col items-center justify-center relative select-none transition-all duration-300 ${
                  !inRange 
                    ? 'border-transparent text-neutral-300 cursor-not-allowed text-[10px]' 
                    : isSelected
                    ? 'border-neutral-800 bg-neutral-900 text-white font-semibold cursor-pointer z-10'
                    : 'border-neutral-100 hover:border-neutral-400 bg-neutral-50/40 text-neutral-700 cursor-pointer'
                }`}
                id={`calendar-tile-${dateStr}`}
              >
                <span className="text-xs font-mono">{dayNum}</span>

                {/* Status indicator dots */}
                {dotType === 'uncompleted' && (
                  <span className="absolute bottom-1 w-1 h-1 bg-red-400 rounded-full animate-pulse" />
                )}
                {dotType === 'complete' && (
                  <span className="absolute bottom-1 w-1 h-1 bg-emerald-400 rounded-full" />
                )}
                {dotType === 'sunday_stats' && (
                  <span className="absolute bottom-1 w-1 h-1 bg-neutral-400 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" id="month-view">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-sans font-semibold tracking-tight text-neutral-800 flex items-center justify-center gap-2">
          <Calendar className="w-6 h-6 text-neutral-800 stroke-[1.5]" />
          暑期月视图
        </h2>
        <p className="text-xs text-neutral-500 font-sans mt-2">
          支持全局预览七、八月。绿色圆点表示当日全优，红色闪烁点表示有未完成项目。点击即可穿梭。
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch" id="months-container">
        {renderMonthCalendar('2026年 7月 / July', julyGrid)}
        {renderMonthCalendar('2026年 8月 / August', augustGrid)}
      </div>

      <div className="mt-8 border border-neutral-200/50 rounded-xl p-4 bg-neutral-50/50 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 font-sans">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          <span>全优完结 (无漏)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-red-400 rounded-full" />
          <span>留有缺憾 (有未完成)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-neutral-300 rounded-full" />
          <span>周统计汇总</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 border border-neutral-200 bg-white rounded-lg" />
          <span>无任务 / 未记录</span>
        </div>
      </div>
    </div>
  );
}
