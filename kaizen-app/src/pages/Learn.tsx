import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ARTICLES } from '../data/articles';
import { GraduationCap, Clock, ArrowLeft, BookOpen, Shield, Brain, TrendingUp, Target } from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: BookOpen },
  { key: 'risk-management', label: 'Risk Management', icon: Shield },
  { key: 'psychology', label: 'Psychology', icon: Brain },
  { key: 'technical-analysis', label: 'Technical Analysis', icon: TrendingUp },
  { key: 'strategy', label: 'Strategy', icon: Target },
];

export default function Learn() {
  const { isDark } = useTheme();
  const [category, setCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const filtered = category === 'all' ? ARTICLES : ARTICLES.filter(a => a.category === category);
  const article = selectedArticle ? ARTICLES.find(a => a.id === selectedArticle) : null;

  const cardBg = isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100';

  if (article) {
    return (
      <div>
        <button
          onClick={() => setSelectedArticle(null)}
          className={`flex items-center gap-2 text-sm mb-6 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <ArrowLeft size={16} /> Back to articles
        </button>

        <article className={`rounded-xl p-8 shadow-sm ${cardBg}`}>
          <div className="mb-6">
            <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-navy-50 text-navy-700'}`}>
              {article.category.replace('-', ' ')}
            </span>
            <h1 className="font-display text-3xl font-bold mt-4 leading-tight">{article.title}</h1>
            <div className={`flex items-center gap-4 mt-3 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <span>{article.author}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {article.readTime} min read</span>
            </div>
          </div>

          <div className={`prose max-w-none text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {article.content.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-8 mb-3">{line.replace('## ', '')}</h2>;
              if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold mt-6 mb-2">{line.replace('### ', '')}</h3>;
              if (line.startsWith('#### ')) return <h4 key={i} className="font-semibold mt-4 mb-1">{line.replace('#### ', '')}</h4>;
              if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1">{formatBold(line.replace('- ', ''))}</li>;
              if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ') || line.startsWith('5. '))
                return <li key={i} className="ml-4 mb-1 list-decimal">{formatBold(line.replace(/^\d+\.\s/, ''))}</li>;
              if (line.startsWith('|')) return <p key={i} className="font-mono text-xs">{line}</p>;
              if (line.startsWith('*') && line.endsWith('*'))
                return <p key={i} className={`italic mt-4 ${isDark ? 'text-gold-400' : 'text-navy-700'}`}>{line.replace(/\*/g, '')}</p>;
              if (line === '') return <br key={i} />;
              return <p key={i} className="mb-2">{formatBold(line)}</p>;
            })}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="text-gold-400" /> Educational Hub
        </h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Learn the fundamentals of disciplined trading
        </p>
      </div>

      <div className={`rounded-xl p-6 shadow-sm mb-8 ${isDark ? 'bg-navy-900/30 border border-navy-800' : 'bg-navy-50 border border-navy-100'}`}>
        <div className="flex items-start gap-3">
          <BookOpen size={20} className="text-gold-400 mt-0.5" />
          <div>
            <h3 className="font-semibold">Why Education Matters</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Studies show that 90% of day traders lose money. The traders who succeed share common traits:
              disciplined risk management, continuous learning, and emotional control. These articles cover the
              fundamentals that separate informed traders from gamblers.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === cat.key
                  ? 'bg-navy-800 text-white'
                  : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon size={14} />
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(article => (
          <button
            key={article.id}
            onClick={() => setSelectedArticle(article.id)}
            className={`rounded-xl p-6 shadow-sm text-left transition-all hover:shadow-md ${cardBg}`}
          >
            <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-navy-50 text-navy-700'}`}>
              {article.category.replace('-', ' ')}
            </span>
            <h3 className="font-semibold mt-3 leading-snug">{article.title}</h3>
            <p className={`text-sm mt-2 line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{article.excerpt}</p>
            <div className={`flex items-center gap-3 mt-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <span className="flex items-center gap-1"><Clock size={12} /> {article.readTime} min</span>
              <span>{article.author}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
}
