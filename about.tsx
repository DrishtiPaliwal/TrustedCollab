import { createFileRoute } from '@tanstack/react-router';
import { InfoPage, infoContent } from '@/components/info-page';
import { pageMeta } from '@/lib/page-meta';
export const Route = createFileRoute('/about')({ head: () => pageMeta(infoContent.about.title, infoContent.about.intro), component: () => <InfoPage type="about" /> });
