import { createFileRoute } from '@tanstack/react-router';
import { InfoPage, infoContent } from '../components/info-page';
import { pageMeta } from '../lib/page-meta';

export const Route = createFileRoute('/privacy' as never)({
  head: () => pageMeta(infoContent.privacy.title, infoContent.privacy.intro),
  component: () => <InfoPage type="privacy" />,
});
