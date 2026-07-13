import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DayData, TaskItem, LikedQuote } from '../types';
import { getQuoteForDate } from '../data/quotes';
import { formatChineseDate, getDayType, parseLocalDate } from '../utils/dateHelpers';
import { 
  Heart, 
  Copy, 
  Check, 
  AlertCircle, 
  Trash2, 
  Plus, 
  ArrowLeftRight, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

interface DayViewProps {
  dayData: DayData;
  likedQuotes: LikedQuote[];
  onToggleLikeQuote: (dateStr: string, quote: string) => void;
  onUpdateDayData: (dateStr: string, data: Partial<DayData>) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onJumpToSunday: () => void;
  onReturnFromSunday?: () => void;
  lastVisitedDay?: string;
}

export default function DayView({
  dayData,
  likedQuotes,
  onToggleLikeQuote,
  onUpdateDayData,
  onPrevDay,
  onNextDay,
  onJumpToSunday,
  onReturnFromSunday,
  lastVisitedDay
}: DayViewProps) {
  const quoteText = getQuoteForDate(dayData.dateStr);
  const isLiked = likedQuotes.some(q => q.dateStr === dayData.dateStr);
  const dType = getDayType(dayData.dateStr);

  const [copied, setCopied] = React.useState(false);

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(quoteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cycle status: pending -> completed -> uncompleted
  const handleCycleStatus = (index: number) => {
    const newItems = [...dayData.items];
    const item = newItems[index];
    
    // Skip if waived
    if (item.isWaived) return;

    if (item.status === 'pending') {
      item.status = 'completed';
    } else if (item.status === 'completed') {
      item.status = 'uncompleted';
    } else {
      item.status = 'pending';
    }

    onUpdateDayData(dayData.dateStr, { items: newItems });
  };

  // 1. WEEKDAY HANDLERS
  const handleItem4Change = (val: string) => {
    const updatedItems = [...dayData.items];
    updatedItems[3].text = `生物: ${val}`;
    onUpdateDayData(dayData.dateStr, { 
      item4Text: val,
      items: updatedItems
    });
  };

  const handleItem6Change = (val: string) => {
    const updatedItems = [...dayData.items];
    updatedItems[5].text = val;
    onUpdateDayData(dayData.dateStr, { 
      item6Text: val,
      items: updatedItems
    });
  };

  const handleItem7Change = (val: string) => {
    const updatedItems = [...dayData.items];
    updatedItems[6].text = `生物课本 ${val} 阅读研习`;
    onUpdateDayData(dayData.dateStr, { 
      blankText7: val,
      items: updatedItems
    });
  };

  const handleDiaryChange = (val: string) => {
    onUpdateDayData(dayData.dateStr, { diary: val });
  };

  // 2. SATURDAY BULLET LIST ENGINE (1.5x scale)
  const satInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSatItemTextChange = (index: number, val: string) => {
    const updatedItems = [...dayData.items];
    updatedItems[index].text = val;
    onUpdateDayData(dayData.dateStr, { items: updatedItems });
  };

  const handleSatKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const updatedItems = [...dayData.items];
      const newId = `${dayData.dateStr}-sat-${Date.now()}`;
      
      // Insert empty bullet after index
      updatedItems.splice(index + 1, 0, {
        id: newId,
        text: '',
        status: 'pending'
      });
      
      onUpdateDayData(dayData.dateStr, { items: updatedItems });
      
      // Auto-focus next input after render
      setTimeout(() => {
        satInputRefs.current[index + 1]?.focus();
      }, 50);
    } else if (e.key === 'Backspace' && dayData.items[index].text === '' && dayData.items.length > 1) {
      e.preventDefault();
      const updatedItems = [...dayData.items];
      updatedItems.splice(index, 1);
      onUpdateDayData(dayData.dateStr, { items: updatedItems });
      
      // Focus previous input
      setTimeout(() => {
        const focusIndex = index - 1 >= 0 ? index - 1 : 0;
        satInputRefs.current[focusIndex]?.focus();
      }, 50);
    }
  };

  const handleAddSatItem = () => {
    const updatedItems = [...dayData.items];
    updatedItems.push({
      id: `${dayData.dateStr}-sat-${Date.now()}`,
      text: '',
      status: 'pending'
    });
    onUpdateDayData(dayData.dateStr, { items: updatedItems });
  };

  const handleRemoveSatItem = (index: number) => {
    if (dayData.items.length <= 1) return;
    const updatedItems = [...dayData.items];
    updatedItems.splice(index, 1);
    onUpdateDayData(dayData.dateStr, { items: updatedItems });
  };

  // 3. SUNDAY STATS CALCULATION & REPORT
  // Render Sunday statistics for the active week
  const renderSundayReport = () => {
    // Collect entire week's data (Mon-Sat)
    // We retrieve the 6 preceding dates belonging to the same week
    const currentWeekDates: string[] = [];
    const targetDate = parseLocalDate(dayData.dateStr);
    
    // Sunday is day index 0 in JS date. Let's find preceding Monday to Saturday
    for (let i = 6; i >= 1; i--) {
      const d = new Date(targetDate);
      d.setDate(targetDate.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      currentWeekDates.push(`${y}-${m}-${dateVal}`);
    }

    let weekPlanWords = 0;
    let weekDiaryWords = 0;
    let weekTotalItems = 0;
    let weekCompleted = 0;
    let weekUncompleted = 0;

    const subjectBreakdown: Record<string, number> = {
      '语文': 0, '数学': 0, '英语': 0, '物理': 0, '化学': 0, '生物': 0
    };

    const mapSaturdaySubject = (text: string): string => {
      const t = text.toLowerCase();
      if (t.includes('语') || t.includes('文')) return '语文';
      if (t.includes('数') || t.includes('代数') || t.includes('几何')) return '数学';
      if (t.includes('英') || t.includes('单词') || t.includes('english')) return '英语';
      if (t.includes('物') || t.includes('力') || t.includes('电')) return '物理';
      if (t.includes('化') || t.includes('酸') || t.includes('碱')) return '化学';
      if (t.includes('生') || t.includes('细胞') || t.includes('基因')) return '生物';
      return '';
    };

    currentWeekDates.forEach(dStr => {
      // Find saved day state
      // Note: we can read from parent's full database which we pass down implicitly if we read from a simulated context, or we can look it up in local storage directly or pass the whole DB object in props. Yes, daysData is available in props! We mapped it or we can pass it down!
      // Let's check: can we lookup from daysData? Wait! Let's pass `daysData` to DayView or load it.
      // Wait, let's look at the parent's props: we can pass a reference or load from localStorage.
      // To be safe, we can read directly from localStorage since everything is written in real-time!
      const raw = localStorage.getItem('daysData_v1');
      if (!raw) return;
      const db = JSON.parse(raw);
      const dayState = db[dStr];
      if (!dayState) return;

      const type = getDayType(dStr);
      if (type === 'weekday') {
        weekPlanWords += (dayState.item4Text || "").length;
        weekPlanWords += (dayState.item6Text || "").length;
        weekPlanWords += (dayState.blankText7 || "").length;
        weekDiaryWords += (dayState.diary || "").length;

        dayState.items.forEach((item: TaskItem) => {
          const isItem6 = item.id.endsWith('-6');
          if (isItem6 && !dayState.item6Text) return; // Skip empty 6

          weekTotalItems++;
          if (item.status === 'completed') {
            weekCompleted++;
          } else if (item.status === 'uncompleted') {
            weekUncompleted++;
            if (item.subject && subjectBreakdown[item.subject] !== undefined) {
              subjectBreakdown[item.subject]++;
            }
          }
        });
      } else if (type === 'saturday') {
        dayState.items.forEach((item: TaskItem) => {
          weekPlanWords += item.text.length;
          weekTotalItems++;
          
          if (item.status === 'completed') {
            weekCompleted++;
          } else if (item.status === 'uncompleted') {
            weekUncompleted++;
            const sub = mapSaturdaySubject(item.text);
            if (sub && subjectBreakdown[sub] !== undefined) {
              subjectBreakdown[sub]++;
            }
          }
        });
      }
    });

    const completionRate = weekTotalItems > 0 ? Math.round((weekCompleted / weekTotalItems) * 100) : 0;

    return (
      <div className="p-6 border border-neutral-200/60 rounded-2xl bg-white shadow-xs max-w-2xl mx-auto space-y-6" id="sunday-stats-report">
        <div className="text-center border-b border-neutral-100 pb-4">
          <span className="text-[10px] text-neutral-400 font-sans block tracking-widest uppercase mb-1">WEEKLY STATS REPORT</span>
          <h3 className="font-sans font-semibold text-lg text-neutral-800">本周复盘分析报告</h3>
          <p className="text-xs text-neutral-500 font-sans mt-1">周日专属盘点 · 复盘是飞跃的开始</p>
        </div>

        {/* Circular Dial and high level counts */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            {/* SVG Circular dial */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="64" cy="64" r="54" 
                  className="stroke-neutral-100 fill-none" 
                  strokeWidth="6" 
                />
                <circle 
                  cx="64" cy="64" r="54" 
                  className="stroke-neutral-800 fill-none transition-all duration-1000" 
                  strokeWidth="6" 
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - completionRate / 100)}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-mono font-bold text-neutral-800">{completionRate}%</span>
                <span className="text-[9px] text-neutral-400 font-sans">本周完成率</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 space-y-3">
            <div className="flex justify-between items-center text-xs py-1 border-b border-neutral-100">
              <span className="text-neutral-500 font-sans">计划字数累计</span>
              <span className="font-mono font-medium text-neutral-800">{weekPlanWords} 字</span>
            </div>
            <div className="flex justify-between items-center text-xs py-1 border-b border-neutral-100">
              <span className="text-neutral-500 font-sans">日记字数累计</span>
              <span className="font-mono font-medium text-neutral-800">{weekDiaryWords} 字</span>
            </div>
            <div className="flex justify-between items-center text-xs py-1 border-b border-neutral-100">
              <span className="text-neutral-500 font-sans">总计划项</span>
              <span className="font-mono font-medium text-neutral-800">{weekTotalItems} 项</span>
            </div>
            <div className="flex justify-between items-center text-xs py-1 border-b border-neutral-100">
              <span className="text-neutral-500 font-sans">已完成项目</span>
              <span className="font-mono font-medium text-emerald-600">{weekCompleted} 项</span>
            </div>
            <div className="flex justify-between items-center text-xs py-1 border-b border-neutral-100">
              <span className="text-neutral-500 font-sans">未完成项警告</span>
              <span className="font-mono font-medium text-red-500">{weekUncompleted} 项</span>
            </div>
          </div>
        </div>

        {/* Uncompleted subject distribution */}
        <div className="pt-4 border-t border-neutral-100">
          <h4 className="text-xs font-sans font-semibold text-neutral-800 mb-3 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            本周未完成分布 (分科统计)
          </h4>
          
          {weekUncompleted === 0 ? (
            <div className="py-6 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50">
              <Award className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-emerald-600 font-sans font-medium">✨ 完美的一周！无任何未完成项！</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">请继续保持这样高效的专注状态。</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(subjectBreakdown).map(([sub, count]) => (
                <div key={sub} className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-lg flex justify-between items-center">
                  <span className="text-xs text-neutral-600 font-sans">{sub}</span>
                  <span className={`text-xs font-mono font-semibold ${count > 0 ? 'text-red-500' : 'text-neutral-400'}`}>
                    {count} 项
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back navigation */}
        {onReturnFromSunday && lastVisitedDay && (
          <div className="pt-4 flex justify-center">
            <button
              onClick={onReturnFromSunday}
              className="py-2.5 px-6 rounded-xl border border-neutral-350 text-xs font-sans font-medium hover:bg-neutral-800 hover:text-white hover:border-neutral-850 transition-all duration-300 shadow-sm"
              id="return-from-stats-btn"
            >
              ↩️ 返回之前的视图 ({formatChineseDate(lastVisitedDay).split(' / ')[0]})
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6" id="day-view-container">
      {/* Daily poetry quote banner */}
      <div 
        className="p-5 border border-neutral-200/50 rounded-2xl bg-white shadow-2xs flex flex-col justify-between gap-3 relative overflow-hidden group min-h-[90px] mb-8"
        id="quote-banner"
      >
        <div className="flex items-start justify-between gap-4">
          <p 
            onClick={handleCopyQuote}
            className="text-neutral-800 text-sm md:text-base leading-relaxed font-sans select-none cursor-pointer hover:text-neutral-900 transition-colors"
            title="点击复制金句"
            id="quote-text-display"
          >
            “{quoteText}”
          </p>
          
          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleCopyQuote}
              className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 transition-colors"
              title="复制句子"
              id="quote-copy-icon-btn"
            >
              <Copy className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
            <button
              onClick={() => onToggleLikeQuote(dayData.dateStr, quoteText)}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              title={isLiked ? "取消收藏" : "收藏金句"}
              id="quote-like-icon-btn"
            >
              <Heart className={`w-3.5 h-3.5 transition-all ${isLiked ? 'text-red-500 fill-red-500' : 'text-neutral-400'}`} />
            </button>
          </div>
        </div>

        {copied && (
          <div className="absolute bottom-2 right-4 text-[9px] bg-neutral-900 text-white py-0.5 px-2 rounded font-sans animate-fade-in">
            诗句已复制到剪贴板
          </div>
        )}
      </div>

      {/* Date switching slide bar */}
      <div className="flex items-center justify-between mb-8" id="date-slider-controls">
        <button
          onClick={onPrevDay}
          className="p-2 rounded-xl border border-neutral-250 text-neutral-600 hover:bg-neutral-800 hover:text-white transition-colors duration-200"
          id="prev-day-btn"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <h1 className="text-lg font-sans font-semibold tracking-tight text-neutral-800" id="date-display-header">
            {formatChineseDate(dayData.dateStr)}
          </h1>
          <p className="text-[10px] text-neutral-400 font-mono tracking-wider mt-0.5 uppercase">
            2026 SUMMER PLANNER
          </p>
        </div>

        <button
          onClick={onNextDay}
          className="p-2 rounded-xl border border-neutral-250 text-neutral-600 hover:bg-neutral-800 hover:text-white transition-colors duration-200"
          id="next-day-btn"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* RENDER VIEW ACCORDING TO DATE TYPE */}
      {dType === 'sunday' ? (
        renderSundayReport()
      ) : dType === 'saturday' ? (
        /* SATURDAY MODE - 1.5x BIGGER ELEMENTS, NO DIARY, CENTRAL大标题 */
        <div className="space-y-6" id="saturday-checklist-panel">
          <div className="text-center py-4 border-b border-neutral-100 mb-2">
            <h2 className="text-2xl font-sans font-bold tracking-tight text-neutral-800 uppercase">
              今日总目标
            </h2>
            <p className="text-[11px] text-neutral-400 font-sans mt-1">
              周六专注时刻 · 自由拟定你的专属挑战列表
            </p>
          </div>

          <div className="space-y-4" id="sat-items-list">
            {dayData.items.map((item, index) => {
              const isComp = item.status === 'completed';
              const isUncomp = item.status === 'uncompleted';
              const isWaived = item.isWaived;

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between border rounded-2xl transition-all duration-300 relative overflow-hidden p-5 ${
                    isWaived 
                      ? 'border-amber-300 bg-amber-50/20 shadow-xs ring-1 ring-amber-100'
                      : isUncomp 
                      ? 'border-red-300 bg-red-50/30' 
                      : isComp 
                      ? 'border-neutral-200/50 bg-neutral-50/30 opacity-70' 
                      : 'border-neutral-350 bg-white hover:border-neutral-500 shadow-sm'
                  }`}
                  id={`sat-item-row-${item.id}`}
                >
                  {/* Glowing stream effect for waived/lucky tickets */}
                  {isWaived && (
                    <div className="absolute inset-0 bg-linear-to-r from-yellow-300/10 via-amber-300/15 to-yellow-300/10 animate-shimmer pointer-events-none" />
                  )}

                  <div className="flex items-center gap-4 flex-1">
                    {/* Tick checkbox - 1.5x larger */}
                    <button
                      id={`sat-checkbox-${item.id}`}
                      onClick={() => handleCycleStatus(index)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isWaived
                          ? 'border-amber-400 bg-amber-50 text-amber-500'
                          : isUncomp
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-600'
                          : isComp
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-500'
                          : 'border-neutral-300 hover:border-neutral-500 bg-white'
                      }`}
                    >
                      {isWaived ? (
                        <Award className="w-4 h-4" />
                      ) : isUncomp ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : isComp ? (
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      ) : null}
                    </button>

                    {/* Prefix and text Input - 1.5x larger */}
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg font-mono font-medium text-neutral-400">{index + 1}.</span>
                      <input
                        ref={(el) => { satInputRefs.current[index] = el; }}
                        type="text"
                        value={item.text}
                        placeholder="输入今日的总目标计划项..."
                        onChange={(e) => handleSatItemTextChange(index, e.target.value)}
                        onKeyDown={(e) => handleSatKeyDown(index, e)}
                        className={`w-full bg-transparent border-none outline-none text-neutral-800 text-lg font-sans placeholder-neutral-300 ${
                          isComp || isWaived ? 'line-through text-neutral-400 italic' : ''
                        }`}
                        disabled={isWaived}
                        id={`sat-input-${item.id}`}
                      />
                    </div>
                  </div>

                  {/* Saturday delete action */}
                  {!isWaived && dayData.items.length > 1 && (
                    <button
                      onClick={() => handleRemoveSatItem(index)}
                      className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors ml-2"
                      title="删除项目"
                      id={`sat-delete-${item.id}`}
                    >
                      <Trash2 className="w-4.5 h-4.5 stroke-[1.5]" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add item helper bottom line */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleAddSatItem}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 border border-neutral-300 py-2 px-4 rounded-xl hover:border-neutral-600 transition-colors"
              id="sat-add-bullet-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              添加新计划项目 (回车亦可)
            </button>
          </div>
        </div>
      ) : (
        /* WEEKDAYS MODE - STRICT TEMPLATES, EDITABLE (4, 6, 7), Notes/Diary */
        <div className="space-y-8" id="weekday-checklist-panel">
          
          {/* Quick Stats shortcut to Sunday */}
          <div className="flex justify-end">
            <button
              onClick={onJumpToSunday}
              className="text-xs text-neutral-500 hover:text-neutral-800 border border-neutral-350 py-1.5 px-3 rounded-xl transition-all hover:bg-neutral-800 hover:text-white"
              id="weekday-to-stats-shortcut"
            >
              📊 查看本周统计
            </button>
          </div>

          <div className="space-y-3.5" id="weekday-items-list">
            {dayData.items.map((item, index) => {
              const isComp = item.status === 'completed';
              const isUncomp = item.status === 'uncompleted';
              const isWaived = item.isWaived;

              // Check index-based editability: ONLY index 3 (item 4), index 5 (item 6), index 6 (item 7)
              const isItem4 = index === 3;
              const isItem6 = index === 5;
              const isItem7 = index === 6;
              const isEditable = isItem4 || isItem6 || isItem7;

              return (
                <div
                  key={item.id}
                  className={`flex items-center border rounded-xl transition-all duration-300 relative overflow-hidden p-3.5 ${
                    isWaived 
                      ? 'border-yellow-300 bg-amber-50/15 shadow-xs ring-1 ring-yellow-100'
                      : isUncomp 
                      ? 'border-red-300 bg-red-50/20' 
                      : isComp 
                      ? 'border-neutral-200 bg-neutral-50/40 opacity-70' 
                      : 'border-neutral-300 bg-white hover:border-neutral-400 shadow-2xs'
                  }`}
                  id={`weekday-row-${item.id}`}
                >
                  {/* Color flowing shimmer for waived slots */}
                  {isWaived && (
                    <div className="absolute inset-0 bg-linear-to-r from-yellow-300/5 via-amber-300/10 to-yellow-300/5 animate-shimmer pointer-events-none" />
                  )}

                  <div className="flex items-center gap-3.5 flex-1">
                    {/* Checkbox circle */}
                    <button
                      id={`weekday-checkbox-${item.id}`}
                      onClick={() => handleCycleStatus(index)}
                      className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                        isWaived
                          ? 'border-amber-400 bg-amber-50 text-amber-500'
                          : isUncomp
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-600'
                          : isComp
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-500'
                          : 'border-neutral-300 hover:border-neutral-400 bg-white'
                      }`}
                    >
                      {isWaived ? (
                        <Award className="w-3 h-3" />
                      ) : isUncomp ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : isComp ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : null}
                    </button>

                    {/* Content text */}
                    <div className="flex-1 font-sans text-sm text-neutral-850">
                      <span className="font-mono text-neutral-400 mr-2">{index + 1}.</span>
                      
                      {isItem4 ? (
                        // Item 4: 生物
                        <div className="inline-flex items-center gap-1 w-full md:w-auto">
                          <span className={`font-semibold mr-1 ${isComp || isWaived ? 'line-through text-neutral-400' : 'text-neutral-700'}`}>生物: </span>
                          <input
                            type="text"
                            value={dayData.item4Text || ""}
                            placeholder="点此填写生物计划详情..."
                            onChange={(e) => handleItem4Change(e.target.value)}
                            className={`flex-1 border-b border-dashed border-neutral-300 outline-none text-neutral-800 placeholder-neutral-350 min-w-[200px] text-xs pb-0.5 ${
                              isComp || isWaived ? 'line-through text-neutral-400 italic' : ''
                            }`}
                            disabled={isWaived}
                            id={`item-4-input-${dayData.dateStr}`}
                          />
                        </div>
                      ) : isItem6 ? (
                        // Item 6: 留空
                        <div className="inline-flex items-center gap-1 w-full md:w-auto">
                          <input
                            type="text"
                            value={dayData.item6Text || ""}
                            placeholder="[此处自由填写额外的个性化目标...]"
                            onChange={(e) => handleItem6Change(e.target.value)}
                            className={`flex-1 border-b border-dashed border-neutral-300 outline-none text-neutral-800 placeholder-neutral-350 min-w-[280px] text-xs pb-0.5 ${
                              isComp || isWaived ? 'line-through text-neutral-400 italic font-normal' : 'font-medium'
                            }`}
                            disabled={isWaived}
                            id={`item-6-input-${dayData.dateStr}`}
                          />
                        </div>
                      ) : isItem7 ? (
                        // Item 7: 生物课本___阅读研习
                        <div className="inline-flex items-center flex-wrap gap-1">
                          <span className={isComp || isWaived ? 'line-through text-neutral-400' : 'text-neutral-700 font-medium'}>生物课本</span>
                          <input
                            type="text"
                            value={dayData.blankText7 || ""}
                            placeholder="空白输入区"
                            onChange={(e) => handleItem7Change(e.target.value)}
                            className={`border-b border-dashed border-neutral-300 outline-none text-center text-neutral-800 font-medium px-2 placeholder-neutral-300 text-xs w-28 pb-0.5 ${
                              isComp || isWaived ? 'line-through text-neutral-400 italic' : ''
                            }`}
                            disabled={isWaived}
                            id={`item-7-input-${dayData.dateStr}`}
                          />
                          <span className={isComp || isWaived ? 'line-through text-neutral-400' : 'text-neutral-700 font-medium'}>阅读研习</span>
                        </div>
                      ) : (
                        // Standard locked tasks
                        <span className={`${isComp || isWaived ? 'line-through text-neutral-400 italic' : 'text-neutral-800'}`}>
                          {item.text}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lock Indicator badge for non-editables */}
                  {!isEditable && (
                    <span className="text-[10px] text-neutral-400 font-sans select-none scale-90">
                      固定
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* WEEKDAY DIARY / NOTES AREA AT THE BOTTOM (日记/日结区) */}
          <div className="pt-6 border-t border-neutral-150" id="diary-section">
            <div className="flex justify-between items-center mb-3">
              <label htmlFor="diary-input" className="text-xs font-sans font-semibold text-neutral-700 tracking-wide flex items-center gap-1">
                🖋️ 今日总结与日记 (日结)
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">
                {(dayData.diary || "").length} 字
              </span>
            </div>

            <textarea
              id="diary-input"
              rows={5}
              value={dayData.diary || ""}
              onChange={(e) => handleDiaryChange(e.target.value)}
              placeholder="执笔记录一整天的收获、情绪与自我启示。每一天的笔迹，都是对抗时间流逝的最好盟友..."
              className="w-full p-4 border border-neutral-300 rounded-xl bg-white text-xs font-sans outline-none placeholder-neutral-350 focus:border-neutral-500 transition-colors shadow-2xs leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}
