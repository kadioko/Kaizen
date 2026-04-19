import React, { Fragment, useMemo, useState } from 'react';
import { AlertTriangle, Brain, Send, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatPercent } from '../utils/helpers';
import { ChatMessage } from '../types';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

const COACHING_RESPONSES: Record<string, string> = {
  default:
    "I'm your AI trading coach. I can help you analyze your trading patterns, review your portfolio, and suggest improvements across stocks, prediction markets, forex, and crypto. Ask me about:\n\n- Your portfolio risk\n- Position sizing\n- Trading psychology\n- Strategy review\n- Prediction market process\n- Forex risk control\n- Crypto volatility management",
  risk:
    "Looking at your portfolio, here are my observations on risk:\n\n**Position Sizing**: Make sure no single position exceeds 5% of your portfolio. The 2% rule for risk per trade is a good starting point.\n\n**Diversification**: Consider spreading across different sectors. Tech-heavy portfolios can be volatile during sector rotations.\n\n**Cash Reserve**: Keep at least 20-30% cash to capitalize on opportunities and reduce drawdown risk.\n\nRemember: The goal isn't to maximize returns - it's to maximize risk-adjusted returns while surviving drawdowns.",
  psychology:
    'Common psychological traps I see in trading journals:\n\n1. **Revenge Trading**: After a loss, the urge to "make it back" leads to larger, riskier trades\n2. **Confirmation Bias**: Only seeking information that supports your existing positions\n3. **FOMO**: Chasing stocks that have already made significant moves\n4. **Anchoring**: Fixating on your entry price rather than current market conditions\n\n**My recommendation**: Before every trade, write down your thesis, entry, stop loss, and target. If you cannot articulate these clearly, do not take the trade.',
  strategy:
    "Here's a framework for evaluating your strategy:\n\n1. **Define Your Edge**: What specific advantage do you have? If you cannot articulate it, you may not have one.\n\n2. **Backtest**: Before trading real capital, test your strategy against historical data. Be honest about slippage and commissions.\n\n3. **Start Small**: Even with a paper trading account, practice discipline with realistic position sizes.\n\n4. **Review Weekly**: Track your win rate, average win vs. average loss, and profit factor.\n\n**Important truth**: Most retail trading strategies underperform simple buy-and-hold of index funds. Your strategy needs to overcome this hurdle to be worth the time and effort.",
  performance:
    "Let me analyze your trading performance:\n\n**Key metrics to track:**\n- Win rate (aim for >50% with proper R:R)\n- Average win vs. average loss (aim for 2:1 or better)\n- Profit factor (total gains / total losses, aim for >1.5)\n- Maximum drawdown (keep under 20%)\n- Sharpe ratio (risk-adjusted returns)\n\n**Common issues I see:**\n- Cutting winners too early\n- Letting losers run too long\n- Trading too frequently (overtrading)\n- Not following the trading plan\n\nTrack these metrics consistently and look for patterns in your best and worst trades.",
  journal:
    "Your trading journal is your most powerful improvement tool. Here's what to track:\n\n**Per Trade:**\n- Entry/exit prices and times\n- Position size and risk amount\n- Strategy/setup that triggered the trade\n- Emotional state (confident, fearful, greedy, neutral, FOMO)\n- Outcome and notes\n\n**Daily:**\n- Did you follow your trading plan?\n- What went well?\n- What could improve?\n- Rate your discipline (1-5)\n\n**Weekly:**\n- Review all trades\n- Calculate performance metrics\n- Identify patterns in wins and losses\n- Adjust strategy if needed\n\nThe traders who journal consistently improve faster than those who do not. Period.",
  prediction:
    'Prediction markets reward **probabilistic thinking**, not hot takes. Treat every contract like a probability estimate and ask:\n\n- What does the current price imply?\n- What information is the crowd missing?\n- What catalyst changes the odds?\n\n**Best practice:** size small, avoid all-in conviction bets, and separate your personal opinion from the market-implied probability.',
  forex:
    "In forex, your edge usually comes from **discipline and risk control**, not giant directional calls. Focus on:\n\n- Trading the most liquid pairs first\n- Respecting macro event risk\n- Using smaller risk because leverage magnifies mistakes\n- Avoiding overtrading around CPI, central bank, or NFP releases\n\nIf you're new, master EURUSD, GBPUSD, and USDJPY before adding more pairs.",
  crypto:
    'Crypto can punish sloppy execution. Your advantage comes from **volatility management**:\n\n- Reduce size versus stocks\n- Plan exits before entry\n- Expect larger intraday swings\n- Avoid chasing vertical moves\n\nStart with BTC, ETH, and SOL only. If you cannot manage risk on the large caps, smaller tokens will magnify the problem.',
};

function renderFormattedMessage(content: string) {
  const lines = content.split('\n');

  return lines.map((line, index) => {
    const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);

    return (
      <p key={`${line}-${index}`} className={line === '' ? 'h-2' : ''}>
        {parts.map((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
          }
          return <Fragment key={partIndex}>{part}</Fragment>;
        })}
      </p>
    );
  });
}

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

  const metrics = getPerformanceMetrics();
  const totalPortfolio = balance + positions.reduce((sum, position) => sum + position.currentPrice * position.shares, 0);

  const getResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();

    if (lower.includes('portfolio') || lower.includes('position') || lower.includes('holding')) {
      if (positions.length === 0) {
        return "You do not have any open positions yet. That's fine. Start with small positions in one market you understand well, then expand only after your process is consistent.";
      }

      const positionDetails = positions
        .map((position) => {
          const pnl = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
          return `- **${position.symbol}**: ${position.shares} shares, ${formatPercent(pnl)} P&L, ${((position.currentPrice * position.shares / totalPortfolio) * 100).toFixed(1)}% of portfolio`;
        })
        .join('\n');

      return `Here's your portfolio analysis:\n\n${positionDetails}\n\n**Cash**: ${formatCurrency(balance)} (${((balance / totalPortfolio) * 100).toFixed(1)}%)\n**Total Value**: ${formatCurrency(totalPortfolio)}\n\n${balance / totalPortfolio < 0.2 ? 'Your cash reserve is low. Consider keeping 20-30% in cash.' : 'Your cash reserve looks reasonable.'}`;
    }

    if (lower.includes('risk')) return COACHING_RESPONSES.risk;
    if (lower.includes('psycholog') || lower.includes('emotion') || lower.includes('fear') || lower.includes('greed')) return COACHING_RESPONSES.psychology;
    if (lower.includes('prediction') || lower.includes('polymarket') || lower.includes('probability')) return COACHING_RESPONSES.prediction;
    if (lower.includes('forex') || lower.includes('eurusd') || lower.includes('gbpusd') || lower.includes('usdjpy') || lower.includes('fx')) return COACHING_RESPONSES.forex;
    if (lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('btc') || lower.includes('ethereum') || lower.includes('eth') || lower.includes('solana') || lower.includes('sol')) return COACHING_RESPONSES.crypto;
    if (lower.includes('strateg') || lower.includes('edge') || lower.includes('approach')) return COACHING_RESPONSES.strategy;
    if (lower.includes('perform') || lower.includes('win rate') || lower.includes('metric')) {
      if (trades.length === 0) {
        return "You have not made any trades yet, so there is no performance data to analyze. Start with paper trading to build a track record, then come back for analysis.";
      }

      return `Your current stats:\n- **Total Trades**: ${metrics.totalTrades}\n- **Win Rate**: ${metrics.winRate.toFixed(1)}%\n- **Total Return**: ${formatCurrency(metrics.totalReturn)} (${formatPercent(metrics.totalReturnPercent)})\n\n${COACHING_RESPONSES.performance}`;
    }
    if (lower.includes('journal') || lower.includes('track') || lower.includes('log')) return COACHING_RESPONSES.journal;

    return "That's a good question. Here's what I'd suggest:\n\n1. **Focus on process over outcomes** - a good trade can lose money and a bad trade can make money. Judge yourself on whether you followed your plan.\n\n2. **Start simple** - master one strategy before adding complexity. The best traders often use the simplest approaches.\n\n3. **Be patient** - consistent improvement compounds over time. There are no shortcuts in developing real trading skill.\n\nWant to discuss something specific? Try asking about your portfolio, risk management, trading psychology, or strategy development.";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: getResponse(input),
      timestamp: new Date().toISOString(),
    };

    setMessages((previous) => [...previous, userMessage, assistantMessage]);
    setInput('');
  };

  const quickPrompts = [
    'Analyze my portfolio risk',
    'Review my performance',
    'How should I trade prediction markets?',
    'How do I manage forex risk?',
    'Give me crypto risk tips',
    'Help with trading psychology',
    'Suggest a strategy framework',
  ];

  const coachSummary = useMemo(
    () => [
      { label: 'Trades reviewed', value: metrics.totalTrades.toString(), icon: Target },
      { label: 'Win rate', value: `${metrics.winRate.toFixed(1)}%`, icon: TrendingUp },
      { label: 'Open positions', value: positions.length.toString(), icon: Brain },
    ],
    [metrics.totalTrades, metrics.winRate, positions.length]
  );

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-navy-950 to-slate-900 text-white shadow-[0_35px_100px_-48px_rgba(15,58,107,0.95)]">
        <CardContent className="relative p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.2),transparent_42%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.25fr_0.95fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">
                <Sparkles size={14} />
                Coaching Loop
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight sm:text-5xl">
                Honest feedback, faster learning.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                The coach now sits inside the same polished operating loop as the rest of the app, with stronger framing, safer rendering, and clearer context for your questions.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {coachSummary.map((item) => (
                <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-gold-300" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                      <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className={`flex items-center gap-2 border-b p-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
            <Sparkles size={16} className="text-gold-400" />
            <span className="text-sm font-medium">Trading Coach</span>
            <Badge variant="outline">Demo Mode</Badge>
          </div>

          <div className="h-[520px] space-y-6 overflow-y-auto p-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-[1.35rem] px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-navy-800 text-white'
                      : isDark
                        ? 'bg-white/5 text-slate-200'
                        : 'bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="space-y-1 text-sm leading-relaxed whitespace-pre-wrap">
                    {renderFormattedMessage(message.content)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`border-t p-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
            <div className="mb-3 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <Button key={prompt} onClick={() => setInput(prompt)} variant="secondary" size="sm">
                  {prompt}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                placeholder="Ask your trading coach..."
                className="h-12 flex-1 rounded-full"
              />
              <Button onClick={handleSend} disabled={!input.trim()} className="h-12 px-5">
                <Send size={18} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={`flex items-start gap-3 rounded-[1.2rem] border p-4 text-xs ${isDark ? 'border-amber-800/30 bg-amber-900/20 text-amber-200/70' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
        <p>
          This is a demo coach with pre-built responses. The full version would use live AI reasoning grounded in your real trading data. Coaching here is educational, not financial advice.
        </p>
      </div>
    </div>
  );
}
