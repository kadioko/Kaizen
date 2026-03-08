import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Check, X, Star, Zap, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Learn the basics of disciplined trading',
    icon: Star,
    features: [
      { text: 'Paper trading (20 trades/month)', included: true },
      { text: 'Basic charts with SMA', included: true },
      { text: '5 alerts per day', included: true },
      { text: 'Educational articles', included: true },
      { text: 'Trade journal', included: true },
      { text: 'Real-time data', included: false },
      { text: 'AI Coach', included: false },
      { text: 'Advanced indicators', included: false },
      { text: 'Backtesting', included: false },
      { text: 'API access', included: false },
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19.99',
    period: '/month',
    description: 'For serious traders building their edge',
    icon: Zap,
    features: [
      { text: 'Unlimited paper trades', included: true },
      { text: 'Full chart suite + all indicators', included: true },
      { text: 'Unlimited alerts', included: true },
      { text: 'Educational articles', included: true },
      { text: 'Advanced trade journal', included: true },
      { text: 'Real-time market data', included: true },
      { text: 'AI Coach (5 sessions/month)', included: true },
      { text: 'Risk analysis tools', included: true },
      { text: 'Backtesting', included: false },
      { text: 'API access', included: false },
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '$99',
    period: '/month',
    description: 'Full platform access for dedicated traders',
    icon: Crown,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited AI Coach sessions', included: true },
      { text: 'Strategy backtesting engine', included: true },
      { text: 'API access for custom tools', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom alert rules', included: true },
      { text: 'Portfolio optimization', included: true },
      { text: 'Export all data', included: true },
      { text: 'Multi-account management', included: true },
      { text: 'Early access to new features', included: true },
    ],
    cta: 'Start Premium Trial',
    highlighted: false,
  },
];

export default function Pricing() {
  const { isDark } = useTheme();

  const cardBg = isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100';

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold">Choose Your Plan</h1>
        <p className={`mt-3 text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Invest in your trading education, not in predictions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
        {plans.map(plan => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.name}
              className={`rounded-xl p-8 shadow-sm relative ${
                plan.highlighted
                  ? 'bg-navy-800 text-white border-2 border-gold-400 scale-105'
                  : cardBg
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-400 text-navy-900 text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <Icon size={20} className={plan.highlighted ? 'text-gold-400' : 'text-navy-600'} />
                <h3 className="text-lg font-bold">{plan.name}</h3>
              </div>

              <div className="mb-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={`text-sm ${plan.highlighted ? 'text-gray-300' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {plan.period}
                </span>
              </div>

              <p className={`text-sm mb-6 ${plan.highlighted ? 'text-gray-300' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {plan.description}
              </p>

              <button
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors mb-8 ${
                  plan.highlighted
                    ? 'bg-gold-400 text-navy-900 hover:bg-gold-300'
                    : 'bg-navy-800 text-white hover:bg-navy-700'
                }`}
              >
                {plan.cta}
              </button>

              <div className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {feature.included ? (
                      <Check size={16} className={plan.highlighted ? 'text-gold-400' : 'text-emerald-500'} />
                    ) : (
                      <X size={16} className={plan.highlighted ? 'text-gray-500' : isDark ? 'text-gray-600' : 'text-gray-300'} />
                    )}
                    <span className={`text-sm ${
                      !feature.included
                        ? plan.highlighted ? 'text-gray-500' : isDark ? 'text-gray-600' : 'text-gray-300'
                        : ''
                    }`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className={`max-w-3xl mx-auto rounded-xl p-8 shadow-sm text-center ${cardBg}`}>
        <h3 className="font-display text-xl font-bold mb-3">Our Promise</h3>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          We don't sell predictions. We don't promise returns. We provide tools and education to help you
          develop disciplined trading habits. Most traders lose money — our goal is to help you understand why
          and build the skills to improve. Start with paper trading, learn the fundamentals, and only risk
          real capital when you have a documented, tested edge.
        </p>
      </div>

      <div className={`max-w-3xl mx-auto mt-8 rounded-xl p-6 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
        <h4 className="font-semibold text-sm mb-4">Frequently Asked Questions</h4>
        <div className="space-y-4">
          {[
            { q: 'Can I really make money trading?', a: 'Statistics show most retail traders lose money. Our platform focuses on education, risk management, and disciplined practice. We believe in transparency about the challenges of trading.' },
            { q: 'Is paper trading realistic?', a: 'Paper trading removes the emotional component of real money, which is actually the hardest part. It\'s excellent for testing strategies and building habits, but real trading adds psychological complexity.' },
            { q: 'What makes Kaizen different?', a: 'We\'re honest. We don\'t promise profits or sell predictions. We focus on the process — risk management, psychology, and continuous improvement. Our AI Coach gives constructive feedback, not buy/sell signals.' },
            { q: 'Can I cancel anytime?', a: 'Yes, all plans are month-to-month with no long-term commitment. Cancel anytime from your account settings.' },
          ].map((faq, i) => (
            <div key={i}>
              <p className="text-sm font-medium">{faq.q}</p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
