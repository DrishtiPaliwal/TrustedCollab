/**
 * @typedef {{
 *   logo?: string
 *   company_name?: string
 *   brand_name?: string
 *   website?: string
 *   registration_number?: string
 *   industry?: string
 *   years_in_operation?: number | string
 *   address?: string
 *   description?: string
 *   contact_name?: string
 *   contact_email?: string
 *   contact_phone?: string
 *   company_size?: string
 *   preferred_creator_categories?: string[]
 *   preferred_locations?: string[]
 *   typical_budget_min?: number | string
 *   typical_budget_max?: number | string
 *   currency?: string
 *   collaboration_requirements?: string
 * }} BrandProfileFormData
 */

/**
 * @typedef {{
 *   form: BrandProfileFormData
 *   setForm: (updater: (current: BrandProfileFormData) => BrandProfileFormData) => void
 *   onSubmit: (event: any) => void
 *   submitLabel?: string
 *   busy?: boolean
 *   error?: string | null
 * }} BrandProfileFormProps
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import TagPicker from "@/components/common/TagPicker";
import ImageUploadField from "@/components/common/ImageUploadField";
import { CREATOR_CATEGORIES, INDUSTRIES, LOCATIONS } from "@/lib/constants";

export default function BrandProfileForm(
  /** @type {BrandProfileFormProps} */
  {
    form,
    setForm,
    onSubmit,
    submitLabel = "Save company profile",
    busy = false,
    error,
  }
) {
  /**
   * @param {keyof BrandProfileFormData} key
   * @param {any} value
   */
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card-flat p-5">
        <h3 className="text-[15px] font-bold text-navy">Company details</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-[13px] font-semibold text-navy">Brand logo</Label>
            <div className="mt-2"><ImageUploadField value={form.logo} onChange={(v) => set("logo", v)} label="Upload logo" /></div>
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Registered company name *</Label>
            <Input required value={form.company_name || ""} onChange={(e) => set("company_name", e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Brand name *</Label>
            <Input required value={form.brand_name || ""} onChange={(e) => set("brand_name", e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Company website</Label>
            <Input value={form.website || ""} onChange={(e) => set("website", e.target.value)} className="mt-1.5 h-11" placeholder="https://" />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Business registration number</Label>
            <Input value={form.registration_number || ""} onChange={(e) => set("registration_number", e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Industry</Label>
            <Select value={form.industry || ""} onValueChange={(v) => set("industry", v)}>
              <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Years in operation</Label>
            <Input type="number" min="0" value={form.years_in_operation ?? ""} onChange={(e) => set("years_in_operation", e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[13px] font-semibold text-navy">Company address</Label>
            <Input value={form.address || ""} onChange={(e) => set("address", e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[13px] font-semibold text-navy">Brand description</Label>
            <Textarea rows={4} value={form.description || ""} onChange={(e) => set("description", e.target.value)} className="mt-1.5" placeholder="What you make, who buys it, and what you expect from partnerships." />
          </div>
        </div>
      </section>

      <section className="card-flat p-5">
        <h3 className="text-[15px] font-bold text-navy">Contact</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-[13px] font-semibold text-navy">Contact name</Label>
            <Input value={form.contact_name || ""} onChange={(e) => set("contact_name", e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Contact email</Label>
            <Input type="email" value={form.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Contact phone</Label>
            <Input value={form.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Company size</Label>
            <Select value={form.company_size || ""} onValueChange={(v) => set("company_size", v)}>
              <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select size" /></SelectTrigger>
              <SelectContent>{["1–10", "11–50", "51–200", "201–1000", "1000+"].map((s) => <SelectItem key={s} value={s}>{s} people</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="card-flat p-5">
        <h3 className="text-[15px] font-bold text-navy">Collaboration preferences</h3>
        <div className="mt-4 space-y-4">
          <div>
            <Label className="text-[13px] font-semibold text-navy">Creator categories you work with</Label>
            <TagPicker className="mt-2" options={CREATOR_CATEGORIES} value={form.preferred_creator_categories || []} onChange={(v) => set("preferred_creator_categories", v)} />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Preferred creator locations</Label>
            <TagPicker className="mt-2" options={LOCATIONS} value={form.preferred_locations || []} onChange={(v) => set("preferred_locations", v)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-[13px] font-semibold text-navy">Typical budget from</Label>
              <Input type="number" min="0" value={form.typical_budget_min ?? ""} onChange={(e) => set("typical_budget_min", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Budget up to</Label>
              <Input type="number" min="0" value={form.typical_budget_max ?? ""} onChange={(e) => set("typical_budget_max", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Currency</Label>
              <Select value={form.currency || "INR"} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{["INR", "USD", "EUR", "GBP", "AED"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">What you need from creators</Label>
            <Textarea rows={3} value={form.collaboration_requirements || ""} onChange={(e) => set("collaboration_requirements", e.target.value)} className="mt-1.5" placeholder="Deliverables, usage rights, approval process, reporting expectations." />
          </div>
        </div>
      </section>

      {error && <p className="text-[13px] text-danger">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={busy} className="h-11 bg-primary px-6 hover:bg-primary/90">{busy ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}