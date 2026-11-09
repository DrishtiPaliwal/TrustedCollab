import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ImageUploadField from "@/components/common/ImageUploadField";
import { CREATOR_CATEGORIES, EVIDENCE_LEVELS } from "@/lib/constants";
import { logAudit, stripMeta } from "@/lib/helpers";
import { Loader2 } from "lucide-react";

const EMPTY = {
  name: "", category: "", description: "", retail_price: "", wholesale_price: "", currency: "INR",
  specifications: "", ingredients: "", ingredient_proportions: "", manufacturing_details: "",
  quality_control: "", product_claims: "", side_effects_warnings: "", licenses: "", evidence_level: "brand_provided",
};

/** @param {{ open: boolean, onOpenChange: (open: boolean) => void, product?: any, brandProfile?: any, onSaved?: () => void }} props */
export default function ProductForm({ open, onOpenChange, product, brandProfile, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState(["", "", ""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({ ...EMPTY, ...product, licenses: (product.licenses || []).join(", ") });
      setImages([0, 1, 2].map((i) => product.images?.[i] || ""));
    } else {
      setForm(EMPTY);
      setImages(["", "", ""]);
    }
    setError("");
  }, [open, product]);

  /** @param {string} key @param {any} value */
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  /** @param {import("react").FormEvent<HTMLFormElement>} e */
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...stripMeta(form),
        user_id: user.id,
        brand_profile_id: brandProfile?.id,
        brand_name: brandProfile?.brand_name || user.full_name,
        retail_price: form.retail_price ? Number(form.retail_price) : undefined,
        wholesale_price: form.wholesale_price ? Number(form.wholesale_price) : undefined,
        licenses: form.licenses ? form.licenses.split(",").map((s) => s.trim()).filter(Boolean) : [],
        images: images.filter(Boolean),
      };
      if (product) {
        await base44.entities.Product.update(product.id, payload);
        await logAudit(user, "product.updated", "Product", product.id, form.name);
      } else {
        const created = await base44.entities.Product.create({ ...payload, verification_status: "not_submitted" });
        await logAudit(user, "product.created", "Product", created.id, form.name);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-[20px] font-bold text-navy">{product ? "Edit product" : "Add a product"}</DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground">
            Claims you record here stay labelled as brand-provided until an administrator verifies the documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-[13px] font-semibold text-navy">Product name *</Label>
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5 h-11" placeholder="Hydrating face serum" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CREATOR_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Evidence level</Label>
              <Select value={form.evidence_level} onValueChange={(v) => set("evidence_level", v)}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{EVIDENCE_LEVELS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[13px] font-semibold text-navy">Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Retail price</Label>
              <Input type="number" min="0" value={form.retail_price} onChange={(e) => set("retail_price", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Wholesale price</Label>
              <Input type="number" min="0" value={form.wholesale_price} onChange={(e) => set("wholesale_price", e.target.value)} className="mt-1.5 h-11" />
            </div>
          </div>

          <div>
            <Label className="text-[13px] font-semibold text-navy">Product images</Label>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {images.map((img, i) => (
                <ImageUploadField
                  key={i}
                  value={img}
                  label={i === 0 ? "Main image" : "Add image"}
                  onChange={(url) => setImages((prev) => prev.map((p, idx) => (idx === i ? url : p)))}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
            <p className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">Composition & manufacturing</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-[13px] font-semibold text-navy">Specifications</Label>
                <Textarea rows={2} value={form.specifications} onChange={(e) => set("specifications", e.target.value)} className="mt-1.5" placeholder="Volume, dimensions, materials" />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Ingredients</Label>
                <Textarea rows={2} value={form.ingredients} onChange={(e) => set("ingredients", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Ingredient proportions</Label>
                <Textarea rows={2} value={form.ingredient_proportions} onChange={(e) => set("ingredient_proportions", e.target.value)} className="mt-1.5" placeholder="Niacinamide 5%, HA 1%…" />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Manufacturing details</Label>
                <Textarea rows={2} value={form.manufacturing_details} onChange={(e) => set("manufacturing_details", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Quality control</Label>
                <Textarea rows={2} value={form.quality_control} onChange={(e) => set("quality_control", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-[13px] font-semibold text-navy">Licenses held</Label>
                <Input value={form.licenses} onChange={(e) => set("licenses", e.target.value)} className="mt-1.5 h-11" placeholder="Comma separated" />
              </div>
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Product claims</Label>
              <Textarea rows={2} value={form.product_claims} onChange={(e) => set("product_claims", e.target.value)} className="mt-1.5" placeholder="Claims made in marketing — recorded as brand-provided" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Known side effects & warnings</Label>
              <Textarea rows={2} value={form.side_effects_warnings} onChange={(e) => set("side_effects_warnings", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          {error && <p className="text-[13px] text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11">Cancel</Button>
            <Button type="submit" disabled={saving} className="h-11 bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} {product ? "Save changes" : "Add product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}