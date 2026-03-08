import { Article } from '../types';

export const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'The 2% Rule: Why Position Sizing Matters More Than Stock Picking',
    excerpt: 'Most traders fail not because they pick the wrong stocks, but because they risk too much on a single trade. Learn the rule that professional traders live by.',
    content: `## The Foundation of Risk Management

The single most important rule in trading is simple: never risk more than 2% of your total portfolio on any single trade.

### Why 2%?

If you risk 2% per trade and have a string of 10 consecutive losses (which happens more often than you think), you'd still retain about 82% of your capital. Compare this to risking 10% per trade — after 10 losses, you'd be down to 35% of your starting capital.

### How to Calculate Position Size

1. **Determine your risk per trade**: 2% of $100,000 = $2,000
2. **Set your stop loss**: If buying at $50 with a stop at $47, risk per share = $3
3. **Calculate shares**: $2,000 / $3 = 666 shares maximum

### The Math of Ruin

| Risk Per Trade | Losses to Lose 50% | Recovery Needed |
|---|---|---|
| 2% | 34 trades | 100% gain |
| 5% | 13 trades | 100% gain |
| 10% | 7 trades | 100% gain |

### Key Takeaways

- Position sizing is your primary defense against ruin
- The 2% rule ensures you survive long losing streaks
- Professional traders focus on risk management first, returns second
- Your edge compounds only if you stay in the game

*Remember: The goal isn't to make money on every trade. The goal is to stay in the game long enough for your edge to play out.*`,
    category: 'risk-management',
    readTime: 8,
    date: '2024-01-15',
    author: 'Kaizen Research',
  },
  {
    id: '2',
    title: 'Trading Psychology: How Your Brain Sabotages Your Trades',
    excerpt: 'Understanding cognitive biases like loss aversion, confirmation bias, and the disposition effect can transform your trading results.',
    content: `## Your Brain Wasn't Built for Trading

Evolution designed your brain for survival, not for navigating financial markets. Understanding these built-in biases is the first step to overcoming them.

### Loss Aversion

Studies show losses feel roughly 2.5x more painful than equivalent gains feel good. This means:
- You hold losers too long, hoping they'll recover
- You sell winners too quickly, locking in small gains
- You avoid taking necessary risks

### Confirmation Bias

Once you form an opinion about a stock, your brain selectively filters information to confirm your existing belief. You'll:
- Seek out bullish articles after buying
- Dismiss negative data that contradicts your thesis
- Overweight information that supports your position

### The Disposition Effect

Traders tend to sell winning positions and hold losing ones. This is the exact opposite of what successful trading requires.

### FOMO (Fear of Missing Out)

When you see a stock surging, your brain triggers the same fear response as a physical threat. This leads to:
- Chasing stocks at highs
- Buying without analysis
- Ignoring your trading plan

### How to Combat These Biases

1. **Follow a written trading plan** — remove emotion from decisions
2. **Use stop losses religiously** — automate your exit strategy
3. **Keep a trading journal** — review decisions objectively
4. **Take breaks** — step away when emotional
5. **Practice with paper trading** — build discipline risk-free

*The best traders aren't the smartest. They're the most disciplined.*`,
    category: 'psychology',
    readTime: 10,
    date: '2024-02-01',
    author: 'Kaizen Research',
  },
  {
    id: '3',
    title: 'Moving Averages: The Foundation of Technical Analysis',
    excerpt: 'Simple and exponential moving averages are the building blocks of technical trading. Learn how to use them effectively without over-complicating your strategy.',
    content: `## Understanding Moving Averages

Moving averages smooth price data to help identify trends. They're the most widely used technical indicator for good reason — they're simple, effective, and versatile.

### Simple Moving Average (SMA)

The SMA calculates the average closing price over a specific number of periods.

**Common periods:**
- **20-day SMA**: Short-term trend
- **50-day SMA**: Medium-term trend
- **200-day SMA**: Long-term trend

### Exponential Moving Average (EMA)

The EMA gives more weight to recent prices, making it more responsive to new information. It's preferred by many active traders.

### Key Signals

**Golden Cross**: When the 50-day MA crosses above the 200-day MA — bullish signal
**Death Cross**: When the 50-day MA crosses below the 200-day MA — bearish signal

### Important Caveats

- Moving averages are **lagging indicators** — they confirm trends, they don't predict them
- In choppy/sideways markets, moving averages generate many false signals
- No single indicator should be used in isolation
- Backtesting shows most MA crossover strategies underperform buy-and-hold for indices

### Practical Application

Use moving averages as one input among many. They're most useful for:
1. Identifying the prevailing trend direction
2. Finding dynamic support and resistance levels
3. Filtering trades (only take longs above the 200 MA, for example)

*Moving averages tell you where the market has been, not where it's going. Use them wisely.*`,
    category: 'technical-analysis',
    readTime: 7,
    date: '2024-02-15',
    author: 'Kaizen Research',
  },
  {
    id: '4',
    title: 'Building a Trading Plan That Actually Works',
    excerpt: 'A trading plan is your blueprint for consistency. Without one, you\'re gambling. Here\'s how to build a plan that keeps you disciplined and accountable.',
    content: `## Why You Need a Trading Plan

Studies consistently show that traders with written plans outperform those without. A plan removes emotion from the equation and provides a framework for consistent decision-making.

### Elements of a Complete Trading Plan

#### 1. Trading Goals
- Monthly return targets (be realistic: 2-5% is excellent)
- Maximum acceptable drawdown
- Number of trades per week/month

#### 2. Entry Criteria
- What setups do you trade?
- What indicators must align?
- What timeframe are you analyzing?

#### 3. Exit Criteria
- Where is your stop loss? (Set BEFORE entering)
- What is your profit target?
- How do you trail stops on winners?

#### 4. Risk Management Rules
- Maximum risk per trade (1-2%)
- Maximum correlated positions
- Daily loss limit

#### 5. Review Process
- Daily: Review all trades taken
- Weekly: Analyze win rate and P&L
- Monthly: Review strategy performance

### Common Mistakes

1. **Making the plan too complex** — simplicity wins
2. **Not following the plan** — the plan only works if you execute it
3. **Not updating the plan** — markets change, your plan should evolve
4. **Setting unrealistic targets** — 50% annual returns is not sustainable

### The Kaizen Approach

Start simple. Master one strategy. Track everything. Improve incrementally.

*Your trading plan is a living document. Review it. Refine it. Trust it.*`,
    category: 'strategy',
    readTime: 9,
    date: '2024-03-01',
    author: 'Kaizen Research',
  },
  {
    id: '5',
    title: 'Understanding RSI: Beyond Overbought and Oversold',
    excerpt: 'The Relative Strength Index is more nuanced than most traders realize. Learn how to use RSI divergences and trend confirmation effectively.',
    content: `## RSI: More Than Just 70/30

The Relative Strength Index (RSI) is one of the most popular momentum indicators, but most traders use it incorrectly. Simply buying when RSI is below 30 and selling above 70 is a losing strategy in trending markets.

### How RSI Works

RSI measures the magnitude of recent price changes on a scale of 0 to 100. It compares the average gain to the average loss over a specified period (typically 14 days).

### RSI in Trends vs. Ranges

**In a strong uptrend**: RSI tends to stay between 40-80. Levels near 40-50 are actually buying opportunities.

**In a strong downtrend**: RSI tends to stay between 20-60. Levels near 50-60 can be selling opportunities.

**In a range**: Traditional 30/70 levels work better.

### RSI Divergence

This is the most powerful RSI signal:
- **Bullish divergence**: Price makes a lower low, but RSI makes a higher low
- **Bearish divergence**: Price makes a higher high, but RSI makes a lower high

Divergences suggest momentum is shifting before price confirms it.

### Limitations

- RSI can remain overbought/oversold for extended periods in strong trends
- Like all indicators, it's a tool, not a crystal ball
- Always use RSI in conjunction with price action and other analysis

*RSI is most valuable when it diverges from price — that's when it tells you something the chart alone doesn't.*`,
    category: 'technical-analysis',
    readTime: 8,
    date: '2024-03-15',
    author: 'Kaizen Research',
  },
  {
    id: '6',
    title: 'The Truth About Day Trading: What the Statistics Say',
    excerpt: 'Research shows that the vast majority of day traders lose money. Understanding why can help you decide if day trading is right for you.',
    content: `## An Honest Look at Day Trading

We believe in transparency. Here are the facts that many trading platforms won't tell you.

### The Statistics

- A study of Brazilian day traders found that **97% of those who persisted for more than 300 days lost money**
- Only 1.1% earned more than the minimum wage
- The average individual day trader **underperforms** a buy-and-hold strategy

### Why Most Day Traders Fail

1. **Transaction costs**: Commissions and spreads eat into profits
2. **Overtrading**: More trades = more opportunities to make mistakes
3. **Emotional decision-making**: Speed amplifies cognitive biases
4. **Information disadvantage**: Institutions have better data and faster execution
5. **Survivorship bias**: You only hear from the winners

### Does This Mean You Shouldn't Trade?

Not necessarily. But you should:
- Start with paper trading (that's why we built the simulator)
- Trade with money you can afford to lose
- Focus on learning, not earning, for the first year
- Track every trade and analyze your mistakes
- Consider longer timeframes (swing trading, position trading)

### What Successful Traders Do Differently

The small percentage who succeed consistently:
- Have strict risk management rules
- Specialize in one or two setups
- Keep detailed journals
- Treat trading as a business, not entertainment
- Continuously educate themselves

*We'd rather give you honest data than false hope. Your success starts with realistic expectations.*`,
    category: 'strategy',
    readTime: 7,
    date: '2024-04-01',
    author: 'Kaizen Research',
  },
];
