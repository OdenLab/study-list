import React from 'react';
import { DayData } from '../types';
import { getWeeks, getDayType, formatChineseDate } from '../utils/dateHelpers';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface WeekViewProps {
  daysData: Record<string, DayData>;
  currentDateStr: string;
  onSelectDate: (dateStr: string) => void;
  onViewChange: (view: 'day' | 'week' | 'month' | 'stats' | 'quotes' | 'wheel') => void;
}

export default function WeekView({
  daysData,
  currentDateStr,
  onSelectDate,
  onViewChange
}: WeekViewProps) {
  const weeks = getWeeks();
  
  // Find current week based on currently selected date
  const currentWeekIndex = weeks.findIndex(w => w.dates.includes(currentDateStr));
  const activeWeekIndex = currentWeekIndex !== -1 ? currentWeekIndex : 0;
  const activeWeek = weeks[activeWeekIndex];

  const handlePrevWeek = () => {
    if (activeWeekIndex > 0) {
      const prevWeekDates = weeks[activeWeekIndex - 1].dates;
      // Select the Monday of the previous week
      onSelectDate(prevWeekDates[0]);
    }
  };

  const handleNextWeek = () => {
    if (activeWeekIndex < weeks.length - 1) {
      const nextWeekDates = weeks[activeWeekIndex + 1].dates;
      // Select the Monday of the next week
      onSelectDate(nextWeekDates[0]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" id="week-view">
      {/* Header and week navigator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-sans font-semibold tracking-tight text-neutral-850 flex items-center gap-1.5">
            <Calendar className="w-5 h-5 text-neutral-700 stroke-[1.5]" />
            暑期第 {activeWeek.weekNum} 周周视图
          </h2>
          <p className="text-xs text-neutral-500 font-sans mt-1">
            {formatChineseDate(activeWeek.startDate).split(' / ')[0]} 至 {formatChineseDate(activeWeek.endDate).split(' / ')[0]}
          </p>
        </div>

        {/* Week navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            disabled={activeWeekIndex === 0}
            className={`p-2 rounded-lg border transition-all duration-200 ${
              activeWeekIndex === 0
                ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                : 'border-neutral-300 text-neutral-600 hover:bg-neutral-800 hover:text-white hover:border-neutral-800'
            }`}
            id="prev-week-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-sans font-medium text-neutral-700 px-3">
            第 {activeWeek.weekNum} / 7 周
          </span>

          <button
            onClick={handleNextWeek}
            disabled={activeWeekIndex === weeks.length - 1}
            className={`p-2 rounded-lg border transition-all duration-200 ${
              activeWeekIndex === weeks.length - 1
                ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                : 'border-neutral-300 text-neutral-600 hover:bg-neutral-800 hover:text-white hover:border-neutral-800'
            }`}
            id="next-week-btn"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7 Days Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4" id="week-days-grid">
        {activeWeek.dates.map((dStr) => {
          const dayData = daysData[dStr];
          const dType = getDayType(dStr);
          const isCurrentSelected = dStr === currentDateStr;

          if (!dayData) return null;

          // Compute stats for progress bar
          let totalItemsCount = 0;
          let completedItemsCount = 0;
          let uncompletedItemsCount = 0;

          if (dType === 'weekday') {
            dayData.items.forEach(item => {
              // Rule: item 6 only counted if filled
              const isItem6 = item.id.endsWith('-6');
              if (isItem6 && !dayData.item6Text) return;
              
              totalItemsCount++;
              if (item.status === 'completed') completedItemsCount++;
              else if (item.status === 'uncompleted') uncompletedItemsCount++;
            });
          } else if (dType === 'saturday') {
            dayData.items.forEach(item => {
              totalItemsCount++;
              if (item.status === 'completed') completedItemsCount++;
              else if (item.status === 'uncompleted') uncompletedItemsCount++;
            });
          }

          const completionRate = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;
          const [mStr, dValStr, dWeekStr] = formatChineseDate(dStr).split(' ')[0].replace('日', '').split(/[月(]/);
          const formattedWeek = dWeekStr ? dWeekStr.replace(')', '') : '';

          return (
            <motion.div
              key={dStr}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => {
                onSelectDate(dStr);
                onViewChange('day');
              }}
              className={`p-5 rounded-2xl border cursor-pointer flex flex-col justify-between min-h-[190px] transition-all duration-300 shadow-sm relative overflow-hidden group ${
                isCurrentSelected 
                  ? 'border-neutral-800 bg-neutral-900 text-white' 
                  : 'border-neutral-200/70 bg-white hover:border-neutral-400'
              }`}
              id={`week-day-card-${dStr}`}
            >
              {/* Highlight bar for today */}
              {isCurrentSelected && (
                <div className="absolute top-0 left-0 w-full h-1 bg-neutral-100" />
              )}

              {/* Day Header */}
              <div>
                <div className="flex items-start justify-between">
                  <span className={`text-xs font-sans tracking-wide ${isCurrentSelected ? 'text-neutral-400' : 'text-neutral-400'}`}>
                    {formattedWeek}
                  </span>
                  
                  {/* Warning Dot */}
                  {uncompletedItemsCount > 0 && (
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" title={`${uncompletedItemsCount}项未完成`} />
                  )}
                  {uncompletedItemsCount === 0 && completedItemsCount === totalItemsCount && totalItemsCount > 0 && (
                    <span className="w-2 h-2 bg-emerald-400 rounded-full" title="全部完成" />
                  )}
                </div>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-2xl font-mono font-semibold ${isCurrentSelected ? 'text-white' : 'text-neutral-800'}`}>
                    {dValStr}
                  </span>
                  <span className={`text-xs font-sans ${isCurrentSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {mStr}月
                  </span>
                </div>
              </div>

              {/* Tasks overview */}
              <div className="mt-4 space-y-2">
                {dType === 'sunday' ? (
                  <div className="text-[10px] py-1 text-neutral-400 font-sans border-t border-dashed border-neutral-200 mt-2">
                    📊 本周统计页
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className={isCurrentSelected ? 'text-neutral-300' : 'text-neutral-500'}>
                        完成率: {completionRate}%
                      </span>
                      <span className={isCurrentSelected ? 'text-neutral-400' : 'text-neutral-400'}>
                        {completedItemsCount}/{totalItemsCount}
                      </span>
                    </div>

                    <div className="w-full h-1 bg-neutral-100/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isCurrentSelected ? 'bg-white' : 'bg-neutral-800'}`}
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Click to enter action overlay */}
              <div className="mt-4 flex items-center justify-between border-t border-neutral-100/30 pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-[10px] font-sans">进入查看</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
