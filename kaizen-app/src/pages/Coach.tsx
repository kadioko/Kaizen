import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatPercent } from '../utils/helpers';
import { Brain, Send, Sparkles, AlertTriangle } from 'lucide-react';
import { ChatMessage } from '../types';

const COACHING_RESPONSES: Record<string, string> = {
  default: "I'm your AI trading coach. I can help you analyze your trading patterns, review your portfolio, and suggest improvements. Ask me about:\n\n- Your portfolio risk\n- Position sizing\n- Trading psychology\n- Strategy review\n- Market analysis basics",
  risk: "Looking at your portfolio, here are my observations on risk:\n\n**Position Sizing**: Make sure no single position exceeds 5% of your portfolio. The 2% rule for risk per trade is a good starting point.\n\n**Diversification**: Consider spreading across different sectors. Tech-heavy portfolios can be volatile during sector rotations.\n\n**Cash Reserve**: Keep at least 20-30% cash to capitalize on opportunities and reduce drawdown risk.\n\nRemember: The goal isn't to maximize returns — it's to maximize risk-adjusted returns while surviving drawdowns.",
  psychology: "Common psychological traps I see in trading journals:\n\n1. **Revenge Trading**: After a loss, the urge to \"make it back\" leads to larger, riskier trades\n2. **Confirmation Bias**: Only seeking information that supports your existing positions\n3. **FOMO**: Chasing stocks that have already made significant moves\n4. **Anchoring**: Fixating on your entry price rather than current market conditions\n\n**My recommendation**: Before every trade, write down your thesis, entry, stop loss, and target. If you can't articulate these clearly, don't take the trade.",
  strategy: "Here's a framework for evaluating your strategy:\n\n1. **Define Your Edge**: What specific advantage do you have? If you can't articulate it, you may not have one.\n\n2. **Backtest**: Before trading real capital, test your strategy against historical data. Be honest about slippage and commissions.\n\n3. **Start Small**: Even with a paper trading account, practice discipline with realistic position sizes.\n\n4. **Review Weekly**: Track your win rate, average win vs. average loss, and profit factor.\n\n**Important truth**: Most retail trading strategies underperform simple buy-and-hold of index funds. Your strategy needs to overcome this hurdle to be worth the time and effort.",
  performance: "Let me analyze your trading performance:\n\n**Key metrics to track:**\n- Win rate (aim for >50% with proper R:R)\n- Average win vs. average loss (aim for 2:1 or better)\n- Profit factor (total gains / total losses, aim for >1.5)\n- Maximum drawdown (keep under 20%)\n- Sharpe ratio (risk-adjusted returns)\n\n**Common issues I see:**\n- Cutting winners too early\n- Letting losers run too long\n- Trading too frequently (overtrading)\n- Not following the trading plan\n\nTrack these metrics consistently and look for patterns in your best and worst trades.",
  journal: "Your trading journal is your most powerful improvement tool. Here's what to track:\n\n**Per Trade:**\n- Entry/exit prices and times\n- Position size and risk amount\n- Strategy/setup that triggered the trade\n- Emotional state (confident, fearful, greedy, neutral, FOMO)\n- Outcome and notes\n\n**Daily:**\n- Did you follow your trading plan?\n- What went well?\n- What could improve?\n- Rate your discipline (1-5)\n\n**Weekly:**\n- Review all trades\n- Calculate performance metrics\n- Identify patterns in wins and losses\n- Adjust strategy if needed\n\nThe traders who journal consistently improve faster than those who don't. Period.",
};

export default function Coach() {
  const { isDark } = useTheme();
  const { trades, positions, balance, getPerformanceMetrics } = useTrading();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: COACHING_RESPONSES.default,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');

  const cardBg = isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100';
  const inputBg = isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900';

  const getResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();
    const metrics = getPerformanceMetrics();
    const totalPortfolio = balance + positions.reduce((s, p) => s + p.currentPrice * p.shares, 0);

    if (lower.includes('portfolio') || lower.includes('position') || lower.includes('holding')) {
      if (positions.length === 0) {
        return "You don't have any open positions yet. That's perfectly fine — there's no rush. When you're ready, start with small positions in stocks you've researched thoroughly. Use the paper trading simulator to practice without risk.";
      }
      const posDetails = positions.map(p => {
        const pnl = ((p.currentPrice - p.entryPrice) / p.entryPrice * 100);
        return `- **${p.symbol}**: ${p.shares} shares, ${formatPercent(pnl)} P&L, ${((p.currentPrice * p.shares / totalPortfolio) * 100).toFixed(1)}% of portfolio`;
      }).join('\n');
      return `Here's your portfolio analysis:\n\n${posDetails}\n\n**Cash**: ${formatCurrency(balance)} (${((balance / totalPortfolio) * 100).toFixed(1)}%)\n**Total Value**: ${formatCurrency(totalPortfolio)}\n\n${balance / totalPortfolio < 0.2 ? '⚠️ Your cash reserve is low. Consider keeping 20-30% in cash.' : '✓ Your cash reserve looks reasonable.'}`;
    }

    if (lower.includes('risk')) return COACHING_RESPONSES.risk;
    if (lower.includes('psycholog') || lower.includes('emotion') || lower.includes('fear') || lower.includes('greed')) return COACHING_RESPONSES.psychology;
    if (lower.includes('strateg') || lower.includes('edge') || lower.includes('approach')) return COACHING_RESPONSES.strategy;
    if (lower.includes('perform') || lower.includes('win rate') || lower.includes('metric')) {
      if (trades.length === 0) {
        return "You haven't made any trades yet, so there's no performance data to analyze. Start with paper trading to build a track record, then come back for analysis.";
      }
      return `Your current stats:\n- **Total Trades**: ${metrics.totalTrades}\n- **Win Rate**: ${metrics.winRate.toFixed(1)}%\n- **Total Return**: ${formatCurrency(metrics.totalReturn)} (${formatPercent(metrics.totalReturnPercent)})\n\n${COACHING_RESPONSES.performance}`;
    }
    if (lower.includes('journal') || lower.includes('track') || lower.includes('log')) return COACHING_RESPONSES.journal;

    return "That's a great question. Here's what I'd suggest:\n\n1. **Focus on process over outcomes** — A good trade can lose money and a bad trade can make money. Judge yourself on whether you followed your plan.\n\n2. **Start simple** — Master one strategy before adding complexity. The best traders often use the simplest approaches.\n\n3. **Be patient** — Consistent improvement compounds over time. There are no shortcuts in developing genuine trading skill.\n\nWant to discuss something specific? Try asking about your portfolio, risk management, trading psychology, or strategy development.";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    const response = getResponse(input);
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
  };

  const quickPrompts = [
    'Analyze my portfolio risk',
    'Review my performance',
    'Help with trading psychology',
    'Suggest a strategy framework',
    'How should I journal trades?',
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold flex items-center gap-3">
          <Brain className="text-gold-400" /> AI Coach
        </h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Honest feedback on your trading patterns and habits
        </p>
      </div>

      <div className={`rounded-xl shadow-sm ${cardBg}`}>
        <div className={`p-4 border-b flex items-center gap-2 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <Sparkles size={16} className="text-gold-400" />
          <span className="text-sm font-medium">Trading Coach</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
            Demo Mode
          </span>
        </div>

        <div className="h-[500px] overflow-y-auto p-6 space-y-6">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-navy-800 text-white'
                  : isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-800'
              }`}>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content.split('\n').map((line, i) => {
                    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    return <p key={i} className={line === '' ? 'h-2' : ''} dangerouslySetInnerHTML={{ __html: boldLine }} />;
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex flex-wrap gap-2 mb-3">
            {quickPrompts.map(prompt => (
              <button
                key={prompt}
                onClick={() => { setInput(prompt); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask your trading coach..."
              className={`flex-1 px-4 py-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-navy-500 ${inputBg}`}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-3 bg-navy-800 text-white rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className={`mt-4 flex items-start gap-2 p-4 rounded-lg ${isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-100'}`}>
        <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <p className={`text-xs ${isDark ? 'text-amber-200/70' : 'text-amber-700'}`}>
          This is a demo coach with pre-built responses. The full version uses Claude AI for personalized,
          contextual coaching based on your actual trading data. The AI coach provides educational insights, not financial advice.
        </p>
      </div>
    </div>
  );
}
