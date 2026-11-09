import { base44 } from "@/api/base44Client";

/**
 * @typedef {Record<string, any>} AnyObject
 */

/**
 * @typedef {Array<any> | { items?: any[] } | null | undefined} QueryResult
 */

/** @param {QueryResult} res */
export const toItems = (res) => (Array.isArray(res) ? res : res?.items || []);

/**
 * @param {string} entityName
 * @param {AnyObject | null | undefined} query
 */
export async function fetchOne(entityName, query) {
  const safeQuery = query || {};
  const res = await base44.entities[entityName].filter(safeQuery, { limit: 1 });
  return toItems(res)[0] || null;
}

/** @param {unknown} v */
export const hasValue = (v) => {
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "number") return Number.isFinite(v) && v > 0;
  if (typeof v === "boolean") return v;
  return v !== undefined && v !== null && String(v).trim() !== "";
};

/**
 * @param {AnyObject | null | undefined} obj
 * @param {string[]} fields
 */
export const computeCompletion = (obj, fields) => {
  if (!obj) return 0;
  const filled = fields.filter((f) => hasValue(obj[f])).length;
  return Math.round((filled / fields.length) * 100);
};

/**
 * @param {number | string | null | undefined} n
 */
export const formatNumber = (n) => {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return num.toLocaleString("en-IN");
};

/**
 * @param {number | string | null | undefined} n
 * @param {string} [currency="INR"]
 */
export const formatMoney = (n, currency = "INR") => {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  const symbol = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "AED " }[currency] || `${currency} `;
  return `${symbol}${num.toLocaleString("en-IN")}`;
};

/**
 * @param {string | Date | null | undefined} d
 */
export const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/**
 * @param {string | Date | null | undefined} d
 */
export const formatDateTime = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

/**
 * @param {number | string | null | undefined} revenue
 * @param {number | string | null | undefined} cost
 * @returns {number | null}
 */
export const calcRoi = (revenue, cost) => {
  const r = Number(revenue);
  const c = Number(cost);
  if (!c || Number.isNaN(r) || Number.isNaN(c) || r === 0) return null;
  return Math.round(((r - c) / c) * 1000) / 10;
};

/**
 * @param {{ id?: string, full_name?: string, email?: string, role?: string, account_type?: string } | null | undefined} user
 * @param {string} action
 * @param {string} entityType
 * @param {string | number | null | undefined} entityId
 * @param {AnyObject | unknown} [details]
 */
export async function logAudit(user, action, entityType, entityId, details) {
  try {
    await base44.entities.AuditLog.create({
      actor_user_id: user?.id,
      actor_name: user?.full_name || user?.email || "Unknown",
      actor_role: user?.role === "admin" ? "admin" : user?.account_type || "user",
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    });
  } catch {
    // audit failures must never block the user action
  }
}

/**
 * @param {{ user_id?: string } | null | undefined} record
 */
export const isSample = (record) => String(record?.user_id || "").startsWith("sample-");

/**
 * @param {AnyObject | null | undefined} obj
 */
export const stripMeta = (obj) => {
  const { id, created_by, created_by_id, created_date, updated_date, ...rest } = obj || {};
  return rest;
};

/**
 * @param {string | null | undefined} userId
 * @param {{ title: string, body: string, type?: string, link?: string }} options
 */
export async function notifyUser(userId, { title, body, type = "system", link = "/requests" }) {
  if (!userId) return;
  try {
    await base44.entities.Notification.create({ user_id: userId, title, body, type, link });
  } catch {
    // notification delivery is best-effort
  }
}