import { createFileRoute } from '@tanstack/react-router';

import { InfoPage, infoContent } from '../components/info-page';
import { pageMeta } from '../lib/page-meta';

export const Route = createFileRoute('/terms' as any)({
  head: () => pageMeta(infoContent.terms.title, infoContent.terms.intro),
  component: () => <InfoPage type="terms" />,
});
