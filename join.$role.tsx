import { createFileRoute, notFound } from '@tanstack/react-router';
import { ProfileJourney } from '@/components/profile-journey';
import { pageMeta } from '@/lib/page-meta';
export const Route = createFileRoute('/join/$role')({ beforeLoad: ({ params }) => { if (params.role !== 'creator' && params.role !== 'brand') throw notFound(); }, head: ({ params }) => pageMeta(params.role === 'creator' ? 'Creator Profile Journey' : 'Brand Profile Journey', 'Explore your demo profile journey. Details are not saved or verified.'), component: RoleJourney });
function RoleJourney() { const { role } = Route.useParams(); if (role !== 'creator' && role !== 'brand') return null; return <ProfileJourney role={role} />; }
