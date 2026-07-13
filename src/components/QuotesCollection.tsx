import React, { useState } from 'react';
import { LikedQuote } from '../types';
import { Heart, Copy, Check, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatChineseDate } from '../utils/dateHelpers';

interface QuotesCollectionProps {
  likedQuotes: LikedQuote[];
  onUnlike: (dateStr: string) => void;
}

export default function QuotesCollection({ likedQuotes, onUnlike }: QuotesCollectionProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Chronological order: oldest to newest (ascending timestamp)
  const sortedQuotes = [...likedQuotes].sort((a, b) => a.likedAt - b.likedAt);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" id="quotes-collection-view">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-sans font-semibold tracking-tight text-neutral-800 flex items-center justify-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-red-500 stroke-[1.5]" />
          赠语收藏页
        </h2>
        <p className="text-xs text-neutral-500 font-sans mt-2">
          纸上流淌的诗意，皆是通往理想世界的阶梯。点击文字即可复制。
        </p>
      </div>

      {sortedQuotes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 border border-dashed border-neutral-300 rounded-xl bg-neutral-50/50"
          id="quotes-empty-state"
        >
          <Heart className="w-10 h-10 text-neutral-300 mx-auto mb-4 stroke-[1.2]" />
          <p className="text-sm text-neutral-400 font-sans">暂无收藏的每日赠语</p>
          <p className="text-xs text-neutral-400 mt-1">在每日清单顶部为心仪的诗句点赞，它便会静静躺在这里。</p>
        </motion.div>
      ) : (
        <div className="space-y-4" id="quotes-list-container">
          <AnimatePresence mode="popLayout">
            {sortedQuotes.map((item, index) => (
              <motion.div
                key={item.dateStr}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="p-5 border border-neutral-200/60 rounded-xl bg-white hover:border-neutral-400/80 transition-all duration-300 shadow-sm flex flex-col justify-between gap-4 group relative"
                id={`quote-card-${item.dateStr}`}
              >
                {/* Date indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-sans">
                    <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>{formatChineseDate(item.dateStr).split(' / ')[0]}</span>
                    <span className="text-neutral-300 font-mono">|</span>
                    <span className="font-mono text-[10px] text-neutral-400">{formatChineseDate(item.dateStr).split(' / ')[1]}</span>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleCopy(item.quote, index)}
                      className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors"
                      title="复制赠语"
                      id={`copy-btn-${item.dateStr}`}
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onUnlike(item.dateStr)}
                      className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-red-500 transition-colors"
                      title="取消收藏"
                      id={`unlike-btn-${item.dateStr}`}
                    >
                      <Heart className="w-4 h-4 fill-red-500 stroke-red-500" />
                    </button>
                  </div>
                </div>

                {/* Poetry Text */}
                <p 
                  onClick={() => handleCopy(item.quote, index)}
                  className="text-neutral-800 text-sm md:text-base leading-relaxed font-sans cursor-pointer hover:text-neutral-900 transition-colors select-none"
                  title="点击复制"
                  id={`quote-text-${item.dateStr}`}
                >
                  “{item.quote}”
                </p>

                {/* Copied indicator tooltip */}
                <AnimatePresence>
                  {copiedIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-2 right-4 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-200"
                    >
                      诗句已复制到剪贴板
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
