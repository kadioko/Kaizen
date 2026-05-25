export const commanderViews = [
  { slug: 'dashboard', label: 'Dashboard', detail: 'Context and workflow' },
  { slug: 'levels', label: 'Levels', detail: 'Key references' },
  { slug: 'order-flow', label: 'Order-Flow', detail: 'Rows and imports' },
  { slug: 'plans', label: 'Plans', detail: 'Setups and risk' },
  { slug: 'journal', label: 'Journal', detail: 'Review and notes' },
  { slug: 'analytics', label: 'Analytics', detail: 'Performance breakdowns' },
  { slug: 'settings', label: 'Settings', detail: 'Templates and playbooks' },
] as const;

export type CommanderViewSlug = (typeof commanderViews)[number]['slug'];
