import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";

export default function NotFoundState({ title = "We couldn't find that profile", description = "It may have been removed, or the link is incorrect." }) {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "prerender-status-code";
    meta.content = "404";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-mint text-primary"><SearchX className="h-6 w-6" /></span>
      <h1 className="mt-4 font-heading text-[22px] font-extrabold text-navy">{title}</h1>
      <p className="mt-1 max-w-sm text-[14px] text-muted-foreground">{description}</p>
      <Button asChild className="mt-5 h-11 bg-primary hover:bg-primary/90"><Link to="/marketplace">Back to marketplace</Link></Button>
    </div>
  );
}