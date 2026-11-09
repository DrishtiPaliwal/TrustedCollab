import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatusPill from "@/components/common/StatusPill";
import EmptyState from "@/components/common/EmptyState";
import UploadDocumentDialog from "@/components/documents/UploadDocumentDialog";
import useProfile from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, FileText, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { formatDate, logAudit, toItems } from "@/lib/helpers";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";

/** @typedef {{ id: string, title: string, file_uri?: string, file_name?: string, review_notes?: string, document_type?: string, related_name?: string, created_date?: string, verification_status?: string }} DocumentItem */
/** @typedef {{ id: string, name: string }} ProductItem */
/** @typedef {{ id: string, title: string }} CampaignItem */

export default function Documents() {
  const profile = useProfile();
  const { user } = profile;
  const creatorProfile = /** @type {{ full_name?: string } | null | undefined} */ (profile.creatorProfile);
  const brandProfile = /** @type {{ brand_name?: string } | null | undefined} */ (profile.brandProfile);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [docs, setDocs] = useState(/** @type {DocumentItem[]} */ ([]));
  const [products, setProducts] = useState(/** @type {ProductItem[]} */ ([]));
  const [campaigns, setCampaigns] = useState(/** @type {CampaignItem[]} */ ([]));
  const [busy, setBusy] = useState(true);
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(/** @type {string | null} */ (null));

  const ownerType = user?.account_type === "brand" ? "brand" : "creator";
  const subjectName = brandProfile?.brand_name || creatorProfile?.full_name || user?.full_name;

  const load = async () => {
    if (!user?.id) return;
    setBusy(true);
    const [d, p, c] = await Promise.all([
      base44.entities.Document.filter({ user_id: user.id }, { sort: "-created_date", limit: 60 }),
      base44.entities.Product.filter({ user_id: user.id }, { limit: 50 }),
      base44.entities.Campaign.filter(
        ownerType === "brand" ? { brand_user_id: user.id } : { creator_user_id: user.id },
        { limit: 50 }
      ),
    ]);
    setDocs(toItems(d));
    setProducts(toItems(p));
    setCampaigns(toItems(c));
    setBusy(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    if (searchParams.get("upload") === "1") setOpen(true);
  }, [searchParams]);

  /** @param {DocumentItem} doc */
  const view = async (doc) => {
    setOpening(doc.id);
    try {
      if (!doc.file_uri) throw new Error("Document file is unavailable");
      const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_uri, expires_in: 300 });
      window.open(res.signed_url, "_blank", "noopener,noreferrer");
    } catch {
      toast({ title: "Could not open file", description: "The link may have expired. Try again.", variant: "destructive" });
    } finally {
      setOpening(null);
    }
  };

  /** @param {DocumentItem} doc */
  const remove = async (doc) => {
    await base44.entities.Document.delete(doc.id);
    await logAudit(user, "document.deleted", "Document", doc.id, doc.title);
    setDocs((d) => d.filter((x) => x.id !== doc.id));
    toast({ title: "Document deleted", description: doc.title });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Documents"
        title="Uploaded documents"
        description="Private to you and platform administrators. Uploads are reviewed by a person — nothing is verified automatically."
        actions={<Button onClick={() => setOpen(true)} className="h-11 bg-primary hover:bg-primary/90"><Upload className="mr-1.5 h-4 w-4" /> Upload document</Button>}
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-border bg-mint/60 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Files are stored privately and opened through short-lived signed links. Accepted formats: PDF, PNG, JPG, WEBP up to 10 MB.
        </p>
      </div>

      <SectionCard bodyClassName="p-0">
        {busy ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : docs.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={FileText} title="No documents uploaded" description="Add laboratory reports, licences, registration papers or campaign evidence." action={<Button onClick={() => setOpen(true)} className="h-11 bg-primary hover:bg-primary/90">Upload a document</Button>} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Document", "Type", "Related to", "Uploaded", "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-5 py-4">
                      <p className="text-[14px] font-semibold text-navy">{d.title}</p>
                      <p className="text-[12px] text-muted-foreground">{d.file_name}</p>
                      {d.review_notes && <p className="mt-1 max-w-xs text-[12px] text-warning">Reviewer: {d.review_notes}</p>}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-muted-foreground">{DOCUMENT_TYPES.find((t) => t.value === d.document_type)?.label || d.document_type}</td>
                    <td className="px-5 py-4 text-[13px] text-muted-foreground">{d.related_name || "Profile"}</td>
                    <td className="px-5 py-4 text-[13px] text-muted-foreground">{formatDate(d.created_date)}</td>
                    <td className="px-5 py-4"><StatusPill status={d.verification_status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => view(d)} disabled={opening === d.id} className="h-9 text-[13px]">
                          {opening === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="mr-1 h-3.5 w-3.5" />} View
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 text-muted-foreground hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this document?</AlertDialogTitle>
                              <AlertDialogDescription>“{d.title}” will be removed permanently, along with the file.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(d)} className="bg-danger hover:bg-danger/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <UploadDocumentDialog
        open={open}
        onOpenChange={setOpen}
        ownerType={ownerType}
        products={products.map((p) => ({ id: p.id, name: p.name }))}
        campaigns={campaigns.map((c) => ({ id: c.id, name: c.title }))}
        subjectName={subjectName}
        onSaved={load}
      />
    </div>
  );
}