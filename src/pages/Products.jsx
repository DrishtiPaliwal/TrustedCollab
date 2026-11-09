import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/common/PageHeader";
import StatusPill from "@/components/common/StatusPill";
import EmptyState from "@/components/common/EmptyState";
import ProductForm from "@/components/products/ProductForm";
import UploadDocumentDialog from "@/components/documents/UploadDocumentDialog";
import useProfile from "@/hooks/useProfile";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileCheck2, Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { formatMoney, logAudit, toItems } from "@/lib/helpers";
import { evidenceLevelLabel } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";

/** @typedef {{ id: string, name: string, images?: string[], category?: string, verification_status?: string, description?: string, evidence_level?: string, retail_price?: number | string, currency?: string }} Product */

export default function Products() {
  const { user, brandProfile, loading } = useProfile();
  /** @type {{ brand_name?: string } | null} */
  const profile = /** @type {{ brand_name?: string } | null} */ (brandProfile);
  const { toast } = useToast();
  const [products, setProducts] = useState(/** @type {Product[]} */ ([]));
  const [busy, setBusy] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(/** @type {Product | null} */ (null));
  const [docOpen, setDocOpen] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    setBusy(true);
    const res = await base44.entities.Product.filter({ user_id: user.id }, { sort: "-created_date", limit: 50 });
    setProducts(toItems(res));
    setBusy(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  /** @param {Product} product */
  const remove = async (product) => {
    await base44.entities.Product.delete(product.id);
    await logAudit(user, "product.deleted", "Product", product.id, product.name);
    setProducts((p) => p.filter((x) => x.id !== product.id));
    toast({ title: "Product removed", description: product.name });
  };

  /** @param {Product} product */
  const requestVerification = async (product) => {
    await base44.entities.VerificationRecord.create({
      subject_user_id: user.id,
      subject_name: profile?.brand_name || user.full_name || user.email,
      subject_type: "product",
      category: "product_document",
      related_id: product.id,
      related_name: product.name,
      status: "pending",
      submitted_at: new Date().toISOString(),
      method: "administrator",
    });
    await base44.entities.Product.update(product.id, { verification_status: "pending" });
    await load();
    toast({ title: "Submitted for review", description: "An administrator will check the product documents." });
  };

  if (!loading && user && user.account_type !== "brand") {
    return (
      <div>
        <PageHeader eyebrow="Products" title="Products are managed by brands" description="Switch to a brand account to publish products and evidence." />
        <EmptyState icon={Package} title="Creator account" description="Creators record collaborations, not product catalogues. Brands publish the products you promote." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Product management"
        title="Products & evidence"
        description="Product claims stay brand-provided until lab reports, licences or certificates are reviewed."
        actions={
          <>
            <Button variant="outline" onClick={() => setDocOpen(true)} className="h-11"><FileCheck2 className="mr-1.5 h-4 w-4" /> Upload evidence</Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="h-11 bg-primary hover:bg-primary/90"><Plus className="mr-1.5 h-4 w-4" /> Add product</Button>
          </>
        }
      />

      {busy ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product with its composition, claims and supporting documents so creators can evaluate it."
          action={<Button onClick={() => { setEditing(null); setFormOpen(true); }} className="h-11 bg-primary hover:bg-primary/90">Add a product</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="card-flat flex flex-col overflow-hidden">
              <div className="aspect-[16/9] bg-muted">
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.name} fittingType="fill" className="h-full w-full" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground"><Package className="h-7 w-7" /></div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-[15px] font-bold text-navy">{p.name}</p>
                    <p className="truncate text-[12.5px] text-muted-foreground">{p.category || "Uncategorised"}</p>
                  </div>
                  <StatusPill status={p.verification_status || "unverified"} />
                </div>
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{p.description || "No description."}</p>
                <div className="mt-3 flex items-center justify-between text-[12px]">
                  <span className="text-muted-foreground">{evidenceLevelLabel(p.evidence_level ?? "")}</span>
                  <span className="font-semibold text-navy">{formatMoney(p.retail_price, p.currency)}</span>
                </div>
                <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-3">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(p); setFormOpen(true); }} className="h-9 text-[13px]"><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                  {p.verification_status !== "pending" && p.verification_status !== "verified" && (
                    <Button variant="outline" size="sm" onClick={() => requestVerification(p)} className="h-9 text-[13px]"><FileCheck2 className="mr-1 h-3.5 w-3.5" /> Review</Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="ml-auto h-9 text-muted-foreground hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {p.name}?</AlertDialogTitle>
                        <AlertDialogDescription>This removes the product and its claims from the marketplace. Uploaded documents are kept separately.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(p)} className="bg-danger hover:bg-danger/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductForm open={formOpen} onOpenChange={setFormOpen} product={editing} brandProfile={profile} onSaved={load} />
      <UploadDocumentDialog
        open={docOpen}
        onOpenChange={setDocOpen}
        ownerType="brand"
        products={products.map((p) => ({ id: p.id, name: p.name }))}
        campaigns={[]}
        subjectName={profile?.brand_name || user?.full_name || user?.email || ""}
        onSaved={load}
      />
    </div>
  );
}