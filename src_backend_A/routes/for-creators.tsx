import { createFileRoute } from '@tanstack/react-router';
import { AudiencePage } from '../components/audience-page';
import { pageMeta } from '../lib/page-meta';

export const Route = createFileRoute('/for-creators' as never)({
  head: () =>
    pageMeta(
      'For Creators',
      'Showcase your social presence, collaboration history and supporting evidence to build credible brand partnerships.',
    ),
  component: () => <AudiencePage role="creator" />, 
});
