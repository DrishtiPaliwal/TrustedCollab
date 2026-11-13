import { createFileRoute } from '@tanstack/react-router';
import { AudiencePage } from '@/components/audience-page';
import { pageMeta } from '@/lib/page-meta';
export const Route = createFileRoute('/for-brands')({ head: () => pageMeta('For Brands', 'Present company credibility, product information and documented campaigns to connect with creators.'), component: () => <AudiencePage role="brand" /> });
