import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Check, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { to: "/", label: "Home" }, { to: "/for-creators", label: "For Creators" },
  { to: "/for-brands", label: "For Brands" }, { to: "/how-it-works", label: "How It Works" },
  { to: "/trust", label: "Trust & Verification" },
] as const;

export function BrandMark() {
  return <Link to="/" aria-label="CreatorTrust home" className="brand-mark"><span className="brand-symbol"><Check size={21} strokeWidth={3} /></span><span>Creator<span className="text-primary">Trust</span></span></Link>;
}
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="site-header relative z-20"><div className="site-container flex h-full items-center justify-between gap-6"><BrandMark />
    <nav aria-label="Main navigation" className="desktop-navigation flex items-center gap-6">{navigation.map(item => <Link key={item.to} to={item.to} activeOptions={{ exact: true }} activeProps={{ "data-active": true }} className="nav-link">{item.label}</Link>)}</nav>
    <div className="desktop-navigation flex items-center gap-3"><Button asChild variant="ghost"><Link to="/login">Log In</Link></Button><Button asChild><Link to="/join">Join CreatorTrust <ArrowUpRight /></Link></Button></div>
    <Button className="mobile-navigation" size="icon" variant="ghost" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
  </div>{open && <nav aria-label="Mobile navigation" className="absolute top-full flex w-full flex-col gap-5 border-b border-border bg-background px-6 py-6">{navigation.map(item => <Link onClick={() => setOpen(false)} key={item.to} to={item.to} className="nav-link">{item.label}</Link>)}<Link to="/login" onClick={() => setOpen(false)}>Log In</Link><Button asChild><Link to="/join" onClick={() => setOpen(false)}>Join CreatorTrust <ArrowUpRight /></Link></Button></nav>}</header>;
}
export function SiteFooter() {
  return <footer className="border-t border-border py-12"><div className="site-container"><div className="flex flex-col justify-between gap-8 md:flex-row"><div><BrandMark /><p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">Collaborations Built on Trust.<br />Partnerships Backed by Data.</p></div><nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm text-muted-foreground"><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms of Service</Link><Link to="/help">Help Centre</Link><Link to="/contact">Social & community <ArrowUpRight className="inline size-3" /></Link></nav></div><div className="mt-10 flex flex-col justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground"><span>© 2026 CreatorTrust. All rights reserved.</span><span>Built for meaningful partnerships. Designed for transparency.</span></div></div></footer>;
}