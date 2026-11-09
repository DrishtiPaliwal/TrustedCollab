import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatusPill from "@/components/common/StatusPill";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Inbox, Loader2, Send, X } from "lucide-react";
import { formatDate, formatMoney, logAudit, notifyUser, toItems } from "@/lib/helpers";
import { useToast } from "@/components/ui/use-toast";

/** @typedef {"pending" | "accepted" | "declined" | "withdrawn"} RequestStatus */
/**
 * @typedef {Object} CollaborationRequest
 * @property {string} id
 * @property {RequestStatus} status
 * @property {string} [campaign_title]
 * @property {string} [from_type]
 * @property {string} [from_user_id]
 * @property {string} [to_user_id]
 * @property {string} [from_name]
 * @property {string} [to_name]
 * @property {string} [collaboration_type]
 * @property {string} [product_name]
 * @property {string} [message]
 * @property {number | string} [proposed_budget]
 * @property {string} [start_date]
 * @property {string} [created_date]
 */

/** @param {unknown} value @returns {value is RequestStatus} */
const isRequestStatus = (value) =>
  value === "pending" || value === "accepted" || value === "declined" || value === "withdrawn";

export default function Requests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("received");
  const [requests, setRequests] = useState(/** @type {CollaborationRequest[]} */ ([]));
  const [busy, setBusy] = useState(true);
  const [acting, setActing] = useState(/** @type {string | null} */ (null));

  const load = async () => {
    if (!user?.id) return;
    setBusy(true);
    const query = tab === "received" ? { to_user_id: user.id } : { from_user_id: user.id };
    const res = await base44.entities.CollaborationRequest.filter(query, { sort: "-created_date", limit: 50 });
    const items = /** @type {CollaborationRequest[]} */ (toItems(res));
    setRequests(items.filter((request) => isRequestStatus(request.status)));
    setBusy(false);
  };

  useEffect(() => { load(); }, [user?.id, tab]);

  /** @param {CollaborationRequest} request @param {RequestStatus} status */
  const respond = async (request, status) => {
    setActing(request.id);
    try {
      await base44.entities.CollaborationRequest.update(request.id, {
        status,
        responded_at: new Date().toISOString(),
      });

      if (status === "accepted") {
        const brandIsSender = request.from_type === "brand";
        await base44.entities.Campaign.create({
          title: request.campaign_title,
          product_name: request.product_name,
          brand_user_id: brandIsSender ? request.from_user_id : request.to_user_id,
          brand_name: brandIsSender ? request.from_name : request.to_name,
          creator_user_id: brandIsSender ? request.to_user_id : request.from_user_id,
          creator_name: brandIsSender ? request.to_name : request.from_name,
          budget: request.proposed_budget,
          creator_fee: request.proposed_budget,
          start_date: request.start_date,
          objective: request.collaboration_type,
          attribution_method: "Platform analytics",
          status: "active",
          creator_confirmed: !brandIsSender,
          brand_confirmed: brandIsSender,
        });
      }

      const otherUser = request.from_user_id === user.id ? request.to_user_id : request.from_user_id;
      await notifyUser(otherUser, {
        title: status === "accepted" ? "Request accepted" : status === "declined" ? "Request declined" : "Request withdrawn",
        body: `“${request.campaign_title}” was ${status}.`,
        type: "request",
      });
      await logAudit(user, `collaboration_request.${status}`, "CollaborationRequest", request.id, request.campaign_title);
      toast({ title: `Request ${status}`, description: status === "accepted" ? "A campaign record was created for both of you." : request.campaign_title });
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Could not update the request", description: message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Collaboration requests"
        title="Requests"
        description="Every request is logged with both parties, the proposed budget and the message sent."
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-11 bg-muted p-1">
          <TabsTrigger value="received" className="min-h-[36px] px-4 text-[13px] data-[state=active]:bg-background data-[state=active]:text-navy"><Inbox className="mr-1.5 h-4 w-4" /> Received</TabsTrigger>
          <TabsTrigger value="sent" className="min-h-[36px] px-4 text-[13px] data-[state=active]:bg-background data-[state=active]:text-navy"><Send className="mr-1.5 h-4 w-4" /> Sent</TabsTrigger>
        </TabsList>
      </Tabs>

      {busy ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={tab === "received" ? "No requests received" : "No requests sent"}
          description={tab === "received" ? "When a brand or creator sends you a request it appears here." : "Find a partner in the marketplace and send your first request."}
          action={<Button asChild className="h-11 bg-primary hover:bg-primary/90"><Link to="/marketplace">Open marketplace</Link></Button>}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <SectionCard key={r.id} bodyClassName="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-[16px] font-bold text-navy">{r.campaign_title}</h3>
                    <StatusPill status={r.status === "accepted" ? "verified" : r.status === "declined" || r.status === "withdrawn" ? "rejected" : "pending"} label={r.status} />
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {tab === "received" ? `From ${r.from_name}` : `To ${r.to_name}`}
                    {r.collaboration_type ? ` · ${r.collaboration_type}` : ""}
                    {r.product_name ? ` · ${r.product_name}` : ""}
                  </p>
                  {r.message && <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">{r.message}</p>}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted-foreground">
                    <span>Proposed budget <strong className="font-semibold text-navy">{r.proposed_budget ? formatMoney(r.proposed_budget) : "Not stated"}</strong></span>
                    <span>Start <strong className="font-semibold text-navy">{formatDate(r.start_date)}</strong></span>
                    <span>Sent <strong className="font-semibold text-navy">{formatDate(r.created_date)}</strong></span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {tab === "received" && r.status === "pending" && (
                    <>
                      <Button onClick={() => respond(r, "accepted")} disabled={acting === r.id} className="h-10 bg-primary hover:bg-primary/90">
                        {acting === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1.5 h-4 w-4" /> Accept</>}
                      </Button>
                      <Button variant="outline" onClick={() => respond(r, "declined")} disabled={acting === r.id} className="h-10 text-muted-foreground">
                        <X className="mr-1.5 h-4 w-4" /> Decline
                      </Button>
                    </>
                  )}
                  {tab === "sent" && r.status === "pending" && (
                    <Button variant="outline" onClick={() => respond(r, "withdrawn")} disabled={acting === r.id} className="h-10 text-muted-foreground">
                      {acting === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw"}
                    </Button>
                  )}
                  {r.status === "accepted" && (
                    <Button asChild variant="outline" className="h-10"><Link to="/campaigns">View campaign</Link></Button>
                  )}
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}