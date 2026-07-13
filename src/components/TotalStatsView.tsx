import React, { useState } from 'react';
import { DayData, WheelState } from '../types';
import { getWeeks, getDayType } from '../utils/dateHelpers';
import { Award, TrendingUp, Sparkles, Calendar, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

interface TotalStatsViewProps {
  daysData: Record<string, DayData>;
  wheelState: WheelState;
}

export default function TotalStatsView({ daysData, wheelState }: TotalStatsViewProps) {
  const [distMode, setDistMode] = useState<'subject' | 'week'>('subject');

  const weeks = getWeeks();
  const allDays = Object.values(daysData);

  // 1. Calculations
  let totalPlanWords = 0;
  let totalDiaryWords = 0;
  let totalPlanItems = 0;
  let totalCompletedItems = 0;
  let totalUncompletedItems = 0;

  // Track uncompleted tasks by subject
  const subjectUncompleted: Record<string, number> = {
    '语文': 0,
    '数学': 0,
    '英语': 0,
    '物理': 0,
    '化学': 0,
    '生物': 0,
    '其他': 0,
  };

  // Track uncompleted tasks by week
  const weekUncompleted: Record<number, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0
  };

  // Helper to map Saturday items to subjects based on simple keywords
  const mapSaturdaySubject = (text: string): string => {
    const t = text.toLowerCase();
    if (t.includes('语') || t.includes('文')) return '语文';
    if (t.includes('数') || t.includes('代数') || t.includes('几何')) return '数学';
    if (t.includes('英') || t.includes('单词') || t.includes('english')) return '英语';
    if (t.includes('物') || t.includes('力') || t.includes('电')) return '物理';
    if (t.includes('化') || t.includes('酸') || t.includes('碱')) return '化学';
    if (t.includes('生') || t.includes('细胞') || t.includes('基因')) return '生物';
    return '其他';
  };

  // Calculate perfect weeks (当周无未完成项，6.留空视为完成)
  let perfectWeeksCount = 0;
  const weekStats = weeks.map(w => {
    let weekUncompletedCount = 0;
    let weekCompletedCount = 0;
    let weekTotalCount = 0;

    w.dates.forEach(dStr => {
      const dayData = daysData[dStr];
      if (!dayData) return;
      const dType = getDayType(dStr);

      if (dType === 'weekday') {
        // Count editable plans words
        totalPlanWords += (dayData.item4Text || "").length;
        totalPlanWords += (dayData.item6Text || "").length;
        totalPlanWords += (dayData.blankText7 || "").length;

        // Count diary words
        totalDiaryWords += (dayData.diary || "").length;

        dayData.items.forEach(item => {
          // Rule: weekday 6. is empty -> skip plan count
          const isItem6 = item.id.endsWith('-6');
          if (isItem6 && !dayData.item6Text) {
            return;
          }

          weekTotalCount++;
          totalPlanItems++;

          if (item.status === 'completed') {
            weekCompletedCount++;
            totalCompletedItems++;
          } else if (item.status === 'uncompleted') {
            weekUncompletedCount++;
            totalUncompletedItems++;
            // Map uncompleted to subject
            if (item.subject) {
              subjectUncompleted[item.subject] = (subjectUncompleted[item.subject] || 0) + 1;
            } else {
              subjectUncompleted['其他']++;
            }
          }
        });
      } else if (dType === 'saturday') {
        // Saturday items are editable
        dayData.items.forEach(item => {
          totalPlanWords += item.text.length;
          weekTotalCount++;
          totalPlanItems++;

          if (item.status === 'completed') {
            weekCompletedCount++;
            totalCompletedItems++;
          } else if (item.status === 'uncompleted') {
            weekUncompletedCount++;
            totalUncompletedItems++;
            const sub = mapSaturdaySubject(item.text);
            subjectUncompleted[sub] = (subjectUncompleted[sub] || 0) + 1;
          }
        });
      }
    });

    weekUncompleted[w.weekNum] = weekUncompletedCount;

    if (weekTotalCount > 0 && weekUncompletedCount === 0) {
      perfectWeeksCount++;
    }

    return {
      weekNum: w.weekNum,
      total: weekTotalCount,
      completed: weekCompletedCount,
      uncompleted: weekUncompletedCount,
    };
  });

  // Calculate Wheel Stats
  const totalSpins = wheelState.logs.length;
  const wins = wheelState.logs.filter(l => l.prizeId !== 'none');
  const winCount = wins.length;

  // Win prize distribution
  const prizeDistribution: Record<string, number> = {
    '免单项任务': 0,
    '免周六努力': 0,
    '免单日全天': 0,
    '免全周工作日': 0
  };

  wins.forEach(w => {
    if (w.prizeId.startsWith('waive_task')) prizeDistribution['免单项任务']++;
    else if (w.prizeId === 'waive_saturday') prizeDistribution['免周六努力']++;
    else if (w.prizeId.startsWith('waive_weekday')) prizeDistribution['免单日全天']++;
    else if (w.prizeId === 'waive_week') prizeDistribution['免全周工作日']++;
  });

  let luckyScore = 0;
  if (totalSpins > 0) {
    let weight = 0;
    wins.forEach(w => {
      if (w.prizeId.startsWith('waive_task')) weight += 20;
      else if (w.prizeId === 'waive_saturday') weight += 50;
      else if (w.prizeId.startsWith('waive_weekday')) weight += 120;
      else if (w.prizeId === 'waive_week') weight += 1000;
    });
    luckyScore = Math.min(100, Math.round((weight / totalSpins) + (winCount * 15)));
  }

  // Find the week with the highest uncompletes
  let maxUncompletedWeekNum = 1;
  let maxUncompletedWeekVal = -1;
  for (let w = 1; w <= 7; w++) {
    if (weekUncompleted[w] > maxUncompletedWeekVal) {
      maxUncompletedWeekVal = weekUncompleted[w];
      maxUncompletedWeekNum = w;
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" id="total-stats-view">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-sans font-semibold tracking-tight text-neutral-800 flex items-center justify-center gap-2">
          <TrendingUp className="w-6 h-6 text-neutral-800 stroke-[1.5]" />
          假期计划总统计
        </h2>
        <p className="text-xs text-neutral-500 font-sans mt-2">
          汇聚整个假期48天的足迹。每一次笔尖沙沙与自我克制，都在此化为精准数据。
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" id="kpi-grid">
        <div className="p-5 border border-neutral-200/60 rounded-xl bg-white shadow-xs">
          <span className="text-[10px] text-neutral-400 font-sans block uppercase tracking-wider">计划写了多少字</span>
          <span className="text-2xl font-mono font-semibold text-neutral-800 mt-1 block">{totalPlanWords} <span className="text-xs text-neutral-400 font-sans font-normal">字</span></span>
          <p className="text-[10px] text-neutral-400 mt-2">工作日编辑区+周六目标字数</p>
        </div>

        <div className="p-5 border border-neutral-200/60 rounded-xl bg-white shadow-xs">
          <span className="text-[10px] text-neutral-400 font-sans block uppercase tracking-wider">日结日记字数</span>
          <span className="text-2xl font-mono font-semibold text-neutral-800 mt-1 block">{totalDiaryWords} <span className="text-xs text-neutral-400 font-sans font-normal">字</span></span>
          <p className="text-[10px] text-neutral-400 mt-2">周一到周五日记字数总和</p>
        </div>

        <div className="p-5 border border-neutral-200/60 rounded-xl bg-white shadow-xs">
          <span className="text-[10px] text-neutral-400 font-sans block uppercase tracking-wider">满勤周数统计</span>
          <span className="text-2xl font-mono font-semibold text-emerald-600 mt-1 block">{perfectWeeksCount} / 7 <span className="text-xs text-neutral-400 font-sans font-normal">周</span></span>
          <p className="text-[10px] text-neutral-400 mt-2">当周无未完成项(留空6除外)</p>
        </div>

        <div className="p-5 border border-neutral-200/60 rounded-xl bg-white shadow-xs">
          <span className="text-[10px] text-neutral-400 font-sans block uppercase tracking-wider">完成率统计</span>
          <span className="text-2xl font-mono font-semibold text-indigo-600 mt-1 block">
            {totalPlanItems > 0 ? Math.round((totalCompletedItems / totalPlanItems) * 100) : 0}%
          </span>
          <p className="text-[10px] text-neutral-400 mt-2">共 {totalCompletedItems} 项 / 总 {totalPlanItems} 项</p>
        </div>
      </div>

      {/* Section 2: Distribution Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Uncompleted distribution container */}
        <div className="lg:col-span-7 p-6 border border-neutral-200/60 rounded-xl bg-white shadow-sm" id="uncompleted-distribution-panel">
          <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-4">
            <div>
              <h3 className="font-sans font-semibold text-sm text-neutral-800">未完成项分布统计</h3>
              <p className="text-[10px] text-neutral-400 font-sans mt-0.5">多视角定位弱点：按科目或按周查看</p>
            </div>
            
            {/* Toggle switch */}
            <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200/60">
              <button
                onClick={() => setDistMode('subject')}
                className={`px-3 py-1 text-xs rounded-md transition-all font-sans ${
                  distMode === 'subject' 
                    ? 'bg-white text-neutral-800 shadow-xs font-medium' 
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                按科目
              </button>
              <button
                onClick={() => setDistMode('week')}
                className={`px-3 py-1 text-xs rounded-md transition-all font-sans ${
                  distMode === 'week' 
                    ? 'bg-white text-neutral-800 shadow-xs font-medium' 
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                按周
              </button>
            </div>
          </div>

          {/* Chart area */}
          <div className="space-y-4">
            {distMode === 'subject' ? (
              Object.entries(subjectUncompleted).map(([sub, count]) => {
                const maxVal = Math.max(...Object.values(subjectUncompleted), 1);
                const percent = Math.round((count / maxVal) * 100);
                return (
                  <div key={sub} className="flex items-center gap-3">
                    <span className="w-12 text-xs text-neutral-600 font-sans text-right">{sub}</span>
                    <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full transition-all duration-1000 rounded-full ${count > 0 ? 'bg-red-400/80' : 'bg-neutral-300'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-10 text-xs font-mono font-medium text-neutral-700">{count} 项</span>
                  </div>
                );
              })
            ) : (
              weekStats.map((stat) => {
                const maxVal = Math.max(...Object.values(weekUncompleted), 1);
                const percent = Math.round((stat.uncompleted / maxVal) * 100);
                const isMax = stat.weekNum === maxUncompletedWeekNum && stat.uncompleted > 0;
                return (
                  <div key={stat.weekNum} className="flex items-center gap-3">
                    <span className="w-12 text-xs text-neutral-600 font-sans text-right">第{stat.weekNum}周</span>
                    <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full transition-all duration-1000 rounded-full ${
                          isMax ? 'bg-red-500/80' : stat.uncompleted > 0 ? 'bg-neutral-700' : 'bg-emerald-400/85'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-14 text-xs font-mono font-medium text-neutral-700 text-right">
                      {stat.uncompleted} 项 {isMax && '⚠️'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="mt-6 text-[10px] text-neutral-400 flex items-start gap-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400 stroke-[1.5]" />
            <span>
              {distMode === 'subject' 
                ? '提示：工作日的【6.留空】无法准确识别学科，以及周六未包含学科关键字的目标，将归于【其他】。'
                : `提示：未完成项分布表明第 ${maxUncompletedWeekNum} 周累积的未完成计划最多（共 ${maxUncompletedWeekVal} 项）。`
              }
            </span>
          </div>
        </div>

        {/* Wheel Stats and index */}
        <div className="lg:col-span-5 p-6 border border-neutral-200/60 rounded-xl bg-white shadow-sm flex flex-col justify-between" id="wheel-stats-panel">
          <div>
            <h3 className="font-sans font-semibold text-sm text-neutral-800 flex items-center gap-1.5 border-b border-neutral-100 pb-3 mb-4">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              摸鱼大转盘数据
            </h3>

            <div className="space-y-4">
              {/* Ouhuang Index */}
              <div className="p-4 bg-neutral-50 border border-neutral-150 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-neutral-500 font-sans font-medium">欧皇指数</span>
                  <span className="text-xs font-mono font-semibold text-neutral-800">{luckyScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-neutral-800 transition-all duration-1000" 
                    style={{ width: `${luckyScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                  基于你获得的免除卡稀有度与总转盘次数综合评定。
                </p>
              </div>

              {/* Counts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="py-2.5 px-3 bg-neutral-50 rounded-lg border border-neutral-100 text-center">
                  <span className="text-[10px] text-neutral-400 block font-sans">中奖次数</span>
                  <span className="text-base font-mono font-semibold text-emerald-600 mt-0.5 block">{winCount} 次</span>
                </div>
                <div className="py-2.5 px-3 bg-neutral-50 rounded-lg border border-neutral-100 text-center">
                  <span className="text-[10px] text-neutral-400 block font-sans">总抽奖次数</span>
                  <span className="text-base font-mono font-semibold text-neutral-800 mt-0.5 block">{totalSpins} 次</span>
                </div>
              </div>

              {/* Prize list distribution */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <span className="text-[10px] text-neutral-400 block font-sans font-medium">免除类型分布：</span>
                {Object.entries(prizeDistribution).map(([pName, count]) => (
                  <div key={pName} className="flex justify-between items-center text-xs font-sans">
                    <span className="text-neutral-500">{pName}</span>
                    <span className="font-mono font-medium text-neutral-700">{count} 次</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Week Progress Breakdown List */}
      <div className="p-6 border border-neutral-200/60 rounded-xl bg-white shadow-sm" id="weekly-breakdown-panel">
        <h3 className="font-sans font-semibold text-sm text-neutral-800 border-b border-neutral-100 pb-3 mb-4 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-neutral-500" />
          暑期每周进度盘点 (1 - 7周)
        </h3>
        
        <div className="space-y-4" id="weekly-breakdown-list">
          {weeks.map((w) => {
            const stat = weekStats.find(s => s.weekNum === w.weekNum);
            const total = stat?.total || 0;
            const completed = stat?.completed || 0;
            const uncompleted = stat?.uncompleted || 0;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isPerfect = total > 0 && uncompleted === 0;

            return (
              <div 
                key={w.weekNum} 
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100/50 rounded-xl border border-neutral-200/40 transition-colors gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-sans font-medium text-neutral-800">第 {w.weekNum} 周</span>
                    {isPerfect && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-sans font-medium border border-emerald-200">
                        ✨ 当周满勤
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-sans">
                    {w.startDate.substring(5)} 至 {w.endDate.substring(5)}
                  </div>
                </div>

                {/* Progress bar info */}
                <div className="flex-1 max-w-xs md:mx-6">
                  <div className="flex justify-between items-center text-[10px] text-neutral-400 mb-1">
                    <span>当周完成率</span>
                    <span className="font-mono">{rate}%</span>
                  </div>
                  <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isPerfect ? 'bg-emerald-500' : 'bg-neutral-800'}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono font-medium">
                  <div className="text-neutral-500">
                    总数: <span className="text-neutral-800 font-semibold">{total}</span>
                  </div>
                  <div className="text-emerald-600">
                    已完成: <span>{completed}</span>
                  </div>
                  <div className={uncompleted > 0 ? 'text-red-500' : 'text-neutral-400'}>
                    未完成: <span>{uncompleted}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
