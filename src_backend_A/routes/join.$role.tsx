import { createFileRoute, notFound } from '@tanstack/react-router';
import { ProfileJourney } from '../components/profile-journey';
import { pageMeta } from '../lib/page-meta';

type JoinRole = 'creator' | 'brand';
type JoinRouteParams = { role: string };
const fileRoute = createFileRoute as any;

export const Route = fileRoute('/join/$role')({
  beforeLoad: ({ params }: { params: JoinRouteParams }) => {
    if (params.role !== 'creator' && params.role !== 'brand') {
      throw notFound();
    }
  },
  head: ({ params }: { params: JoinRouteParams }) =>
    pageMeta(
      params.role === 'creator' ? 'Creator Profile Journey' : 'Brand Profile Journey',
      'Explore your demo profile journey. Details are not saved or verified.'
    ),
  component: RoleJourney,
}) as any;

function RoleJourney() {
  const { role } = Route.useParams() as { role?: JoinRole };

  if (role !== 'creator' && role !== 'brand') return null;

  return <ProfileJourney role={role} />;
}
