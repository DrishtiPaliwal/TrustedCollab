import { createFileRoute } from '@tanstack/react-router';
import { InfoPage, infoContent } from '@/components/info-page';
import { pageMeta } from '@/lib/page-meta';
export const Route = createFileRoute('/help')({ head: () => pageMeta(infoContent.help.title, infoContent.help.intro), component: () => <InfoPage type="help" /> });
