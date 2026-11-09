import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";

const ALL = "all";

/** @typedef {{ q?: string, sort?: string, category?: string, location?: string, budget?: string, experience?: string, followers?: string, engagement?: string }} FilterState */

/**
 * @param {{ mode: string, filters: FilterState, setFilters: import("react").Dispatch<import("react").SetStateAction<FilterState>>, options: { categories: string[], locations: string[] }, resultCount: number }} props
 */
export default function MarketplaceFilters({ mode, filters, setFilters, options, resultCount }) {
  /** @param {keyof FilterState} key @param {string} value */
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const activeCount = Object.entries(filters).filter(([k, v]) => v && v !== ALL && k !== "q" && k !== "sort").length;

  const reset = () =>
    setFilters({ q: filters.q, sort: "recommended", category: ALL, location: ALL, budget: ALL, experience: ALL, followers: ALL, engagement: ALL });

  return (
    <div className="card-flat p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.q || ""}
            onChange={(e) => set("q", e.target.value)}
            placeholder={mode === "brand" ? "Creator name, niche or skill" : "Brand name, industry or product"}
            className="h-11 pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filters.sort || "recommended"} onValueChange={(v) => set("sort", v)}>
            <SelectTrigger className="h-11 w-full sm:w-[190px]">
              <SlidersHorizontal className="mr-1.5 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Newest first</SelectItem>
              {mode === "brand" ? (
                <>
                  <SelectItem value="followers">Largest audience</SelectItem>
                  <SelectItem value="engagement">Highest engagement</SelectItem>
                  <SelectItem value="experience">Most experienced</SelectItem>
                </>
              ) : (
                <SelectItem value="budget">Highest budget</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select value={filters.category || ALL} onValueChange={(v) => set("category", v)}>
          <SelectTrigger className="h-10"><SelectValue placeholder={mode === "brand" ? "Niche" : "Industry"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{mode === "brand" ? "All niches" : "All industries"}</SelectItem>
            {options.categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.location || ALL} onValueChange={(v) => set("location", v)}>
          <SelectTrigger className="h-10"><SelectValue placeholder="Location" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any location</SelectItem>
            {options.locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>

        {mode === "brand" ? (
          <>
            <Select value={filters.followers || ALL} onValueChange={(v) => set("followers", v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Audience" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any audience size</SelectItem>
                <SelectItem value="10000">10K+ followers</SelectItem>
                <SelectItem value="50000">50K+ followers</SelectItem>
                <SelectItem value="100000">100K+ followers</SelectItem>
                <SelectItem value="500000">500K+ followers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.engagement || ALL} onValueChange={(v) => set("engagement", v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Engagement" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any engagement</SelectItem>
                <SelectItem value="2">2% and above</SelectItem>
                <SelectItem value="4">4% and above</SelectItem>
                <SelectItem value="6">6% and above</SelectItem>
              </SelectContent>
            </Select>
          </>
        ) : (
          <>
            <Select value={filters.budget || ALL} onValueChange={(v) => set("budget", v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Budget" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any budget</SelectItem>
                <SelectItem value="25000">25K+ per collaboration</SelectItem>
                <SelectItem value="100000">100K+ per collaboration</SelectItem>
                <SelectItem value="500000">500K+ per collaboration</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.experience || ALL} onValueChange={(v) => set("experience", v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Company age" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any age</SelectItem>
                <SelectItem value="3">3+ years operating</SelectItem>
                <SelectItem value="5">5+ years operating</SelectItem>
                <SelectItem value="10">10+ years operating</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          {resultCount} {mode === "brand" ? "creator" : "brand"}{resultCount === 1 ? "" : "s"} found
          {activeCount > 0 ? ` · ${activeCount} filter${activeCount === 1 ? "" : "s"} applied` : ""}
        </p>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-8 text-[13px] text-muted-foreground">
            <X className="mr-1 h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}