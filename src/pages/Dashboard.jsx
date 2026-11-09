import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import CreatorDashboard from "@/components/dashboard/CreatorDashboard";
import BrandDashboard from "@/components/dashboard/BrandDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Building2, UserRound } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "admin") return <AdminDashboard />;

  if (!user.account_type || user.onboarding_complete !== true) {
    return (
      <div>
        <PageHeader
          eyebrow="Welcome to CreatorTrust"
          title="Choose how you'll use the platform"
          description="Creators and brands get separate profiles, dashboards and permissions. Pick one to finish setting up — you can only choose once."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SectionCard bodyClassName="p-6">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-mint text-primary"><UserRound className="h-5 w-5" /></span>
            <h3 className="mt-3 text-[17px] font-bold text-navy">I'm a creator</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
              Build an evidence-backed profile with connected accounts, verified documents and confirmed collaborations.
            </p>
            <Button asChild className="mt-4 h-11 bg-primary hover:bg-primary/90"><Link to="/onboarding">Creator setup</Link></Button>
          </SectionCard>
          <SectionCard bodyClassName="p-6">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-mint text-primary"><Building2 className="h-5 w-5" /></span>
            <h3 className="mt-3 text-[17px] font-bold text-navy">I'm a brand</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
              Publish products with real evidence, record campaign outcomes and find creators whose numbers you can check.
            </p>
            <Button asChild className="mt-4 h-11 bg-primary hover:bg-primary/90"><Link to="/onboarding">Brand setup</Link></Button>
          </SectionCard>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> Verification is always performed by an administrator — never granted automatically.
        </p>
      </div>
    );
  }

  return user.account_type === "brand" ? <BrandDashboard user={user} /> : <CreatorDashboard user={user} />;
}