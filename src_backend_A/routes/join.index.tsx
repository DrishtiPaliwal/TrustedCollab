import { createFileRoute, Link } from '@tanstack/react-router';
import { UserRound, Building2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { pageMeta } from '../lib/page-meta';

export const Route = createFileRoute('/join' as never)({
  head: () => pageMeta('Join CreatorTrust', 'Choose your creator or brand journey and explore a transparent profile preview.'),
  component: Join,
});

function Join() {
  return (
    <section className="section-band">
      <div className="site-container max-w-4xl">
        <p className="eyebrow justify-center">Your next chapter</p>
        <h1 className="section-heading mt-4 text-center">Great partnerships start with you.</h1>
        <p className="mt-4 text-center text-muted-foreground">How would you like to join CreatorTrust?</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {([
            {
              role: 'creator',
              title: 'I’m a Creator',
              icon: UserRound,
              text: 'Turn your creativity and credibility into meaningful brand partnerships.',
            },
            {
              role: 'brand',
              title: 'I’m a Brand',
              icon: Building2,
              text: 'Connect with credible creators who share your vision and values.',
            },
          ] as const).map(({ role, title, icon: Icon, text }) => (
            <article className="feature-card" key={role}>
              <div className="icon-tile">
                <Icon />
              </div>
              <h2 className="mt-6 text-xl font-bold">{title}</h2>
              <p className="my-4 text-sm leading-6 text-muted-foreground">{text}</p>
              <Button asChild className="mt-3 w-full">
                <Link to="/join/$role" params={{ role }}>
                  Explore {role} profile <ArrowRight />
                </Link>
              </Button>
            </article>
          ))}
        </div>

        <p className="journey-banner mt-7">
          Demo journeys only. Registration and saved accounts are not enabled in this phase.
        </p>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Looking for account access?{' '}
          <Link to="/login" className="font-semibold text-primary">
            Log In
          </Link>
        </p>
      </div>
    </section>
  );
}
