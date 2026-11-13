import { createFileRoute } from '@tanstack/react-router';
import { EvidenceLevels, TrustFeatures, FinalCTA } from '../components/marketing';
import { pageMeta } from '../lib/page-meta';

export const Route = (createFileRoute as any)('/trust')({
  head: () => pageMeta(
    'Trust & Verification',
    'Understand the difference between self-reported information, platform data, supporting documents and independent verification.'
  ),
  component: Trust,
});

function Trust() {
  return (
    <>
      <section className="section-band bg-secondary">
        <div className="site-container">
          <p className="eyebrow">Our foundation</p>
          <h1 className="section-heading mt-4">
            Trust is earned.
            <br />
            Evidence makes it visible.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Information should tell you not only what is claimed, but where it comes from, what supports it and what has actually been reviewed.
          </p>
        </div>
      </section>

      <section className="section-band">
        <div className="site-container">
          <h2 className="section-heading mb-8">Four levels. No blurred lines.</h2>
          <EvidenceLevels />
          <div className="journey-banner mt-8">
            No identities, social accounts or product claims are being verified in this phase. Future verification labels will identify the scope, source and date of the review—not imply a blanket endorsement.
          </div>
        </div>
      </section>

      <section className="section-band bg-muted">
        <div className="site-container">
          <h2 className="section-heading mb-8">Credibility, with context.</h2>
          <TrustFeatures />
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
