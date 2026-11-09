import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import TagPicker from "@/components/common/TagPicker";
import ImageUploadField from "@/components/common/ImageUploadField";
import { CREATOR_CATEGORIES, INDUSTRIES, LANGUAGES, LOCATIONS, COLLAB_TYPES } from "@/lib/constants";

/**
 * @param {{
 *   form: Record<string, any>,
 *   setForm: (updater: (current: Record<string, any>) => Record<string, any>) => void,
 *   onSubmit: import("react").FormEventHandler<HTMLFormElement>,
 *   submitLabel?: string,
 *   busy: boolean,
 *   error?: import("react").ReactNode,
 *   compact?: boolean
 * }} props
 */
export default function CreatorProfileForm({ form, setForm, onSubmit, submitLabel = "Save profile", busy, error, compact = false }) {
  /** @param {string} key @param {any} value */
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-4" : "space-y-6"}>
      <section className="card-flat p-5">
        <h3 className="text-[15px] font-bold text-navy">Basics</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-[13px] font-semibold text-navy">Profile photograph</Label>
            <div className="mt-2"><ImageUploadField value={form.profile_photo} onChange={(v) => set("profile_photo", v)} shape="circle" label="Upload photo" /></div>
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Full name *</Label>
            <Input required value={form.full_name || ""} onChange={(e) => set("full_name", e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Location</Label>
            <Select value={form.location || ""} onValueChange={(v) => set("location", v)}>
              <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select city" /></SelectTrigger>
              <SelectContent>{LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
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
            <Label className="text-[13px] font-semibold text-navy">Website</Label>
            <Input value={form.website || ""} onChange={(e) => set("website", e.target.value)} className="mt-1.5 h-11" placeholder="https://" />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Years of experience</Label>
            <Input type="number" min="0" value={form.years_experience ?? ""} onChange={(e) => set("years_experience", e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[13px] font-semibold text-navy">Professional biography</Label>
            <Textarea rows={4} value={form.bio || ""} onChange={(e) => set("bio", e.target.value)} className="mt-1.5" placeholder="What you create, who watches, and the kind of partnerships that work." />
          </div>
        </div>
      </section>

      <section className="card-flat p-5">
        <h3 className="text-[15px] font-bold text-navy">Content & expertise</h3>
        <div className="mt-4 space-y-4">
          <div>
            <Label className="text-[13px] font-semibold text-navy">Content categories</Label>
            <TagPicker className="mt-2" options={CREATOR_CATEGORIES} value={form.categories || []} onChange={(v) => set("categories", v)} />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Niches</Label>
            <TagPicker className="mt-2" options={["Skincare", "Clean beauty", "Sustainable fashion", "Budget tech", "Home workouts", "Plant-based food", "Personal finance", "Parenting", "Travel gear"]} value={form.niches || []} onChange={(v) => set("niches", v)} />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Skills</Label>
            <TagPicker className="mt-2" options={["Short-form video", "Long-form review", "Photography", "Live streaming", "Copywriting", "Voiceover", "Editing", "Public speaking"]} value={form.skills || []} onChange={(v) => set("skills", v)} />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Languages</Label>
            <TagPicker className="mt-2" options={LANGUAGES} value={form.languages || []} onChange={(v) => set("languages", v)} />
          </div>
        </div>
      </section>

      <section className="card-flat p-5">
        <h3 className="text-[15px] font-bold text-navy">Collaboration preferences</h3>
        <div className="mt-4 space-y-4">
          <div>
            <Label className="text-[13px] font-semibold text-navy">Preferred collaboration types</Label>
            <TagPicker className="mt-2" options={COLLAB_TYPES} value={form.collaboration_types || []} onChange={(v) => set("collaboration_types", v)} />
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Preferred industries</Label>
            <TagPicker className="mt-2" options={INDUSTRIES} value={form.preferred_industries || []} onChange={(v) => set("preferred_industries", v)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-[13px] font-semibold text-navy">Fee from</Label>
              <Input type="number" min="0" value={form.expected_fee_min ?? ""} onChange={(e) => set("expected_fee_min", e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Fee up to</Label>
              <Input type="number" min="0" value={form.expected_fee_max ?? ""} onChange={(e) => set("expected_fee_max", e.target.value)} className="mt-1.5 h-11" />
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
            <Label className="text-[13px] font-semibold text-navy">Availability</Label>
            <Select value={form.availability || "open"} onValueChange={(v) => set("availability", v)}>
              <SelectTrigger className="mt-1.5 h-11 sm:w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open to collaborations</SelectItem>
                <SelectItem value="limited">Limited availability</SelectItem>
                <SelectItem value="closed">Not taking new work</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="card-flat p-5">
        <h3 className="text-[15px] font-bold text-navy">Audience</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">Shared only as a summary. Nothing here is treated as verified until checked.</p>
        <div className="mt-4 space-y-4">
          <div>
            <Label className="text-[13px] font-semibold text-navy">Audience geography</Label>
            <TagPicker className="mt-2" options={LOCATIONS} value={form.audience_geography || []} onChange={(v) => set("audience_geography", v)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-[13px] font-semibold text-navy">Age range</Label>
              <Select value={form.audience_age_range || ""} onValueChange={(v) => set("audience_age_range", v)}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  {["13–17", "18–24", "25–34", "35–44", "45+"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] font-semibold text-navy">Gender split</Label>
              <Input value={form.audience_gender_split || ""} onChange={(e) => set("audience_gender_split", e.target.value)} className="mt-1.5 h-11" placeholder="Female 68% · Male 30% · Other 2%" />
            </div>
          </div>
          <div>
            <Label className="text-[13px] font-semibold text-navy">Audience interests</Label>
            <TagPicker className="mt-2" options={["Skincare routines", "Sustainable living", "Fitness", "Budget travel", "Gadgets", "Home cooking", "Investing"]} value={form.audience_interests || []} onChange={(v) => set("audience_interests", v)} />
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