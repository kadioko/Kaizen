import { IntelligenceView } from '@/components/intelligence-view';

export default async function ViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  return <IntelligenceView view={view} />;
}
