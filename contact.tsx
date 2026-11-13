import { createFileRoute } from '@tanstack/react-router';
import { InfoPage, infoContent } from '@/components/info-page';
import { pageMeta } from '@/lib/page-meta';
export const Route = createFileRoute('/contact')({ head: () => pageMeta(infoContent.contact.title, infoContent.contact.intro), component: () => <InfoPage type="contact" /> });
