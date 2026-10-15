/* =====================================================================
 * MedBank — Paystack payments
 * Everything money-related lives here so server.mjs only wires routes:
 *   - PLANS: the one price list (server-side, so a client can't pick its own amount)
 *   - startCheckout(): opens a Paystack transaction for the signed-in student
 *   - verifyReference(): the app's "I just paid" check (doesn't wait for the webhook)
 *   - handleWebhook(): charge / subscription events from Paystack
 *   - isActiveSub() / tierOf(): "is this subscription live right now" and "Basic or Premium"
 *
 * A payment is applied by the SQL function medbank_apply_payment (backend/payments.sql)
 * in one transaction, keyed on the Paystack reference. That makes the webhook and the
 * app's verify call safe to arrive in any order, any number of times: the period is
 * extended exactly once per payment.
 * ===================================================================== */
import crypto from "node:crypto";

const PAYSTACK_API = "https://api.paystack.co";

/* Two paid tiers, each monthly or annual (annual = 12 months at 20% off).
     basic   — unlimited lecture imports (free accounts get 1)
     premium — everything: Snap & solve, Pro-model builds, natural voices, higher daily limits
   Prices in Naira. Override one with PRICE_NGN_BASIC_MONTHLY / _BASIC_ANNUAL / _PREMIUM_MONTHLY /
   _PREMIUM_ANNUAL; make one auto-renew with the matching PAYSTACK_PLAN_* Paystack plan code. */
export const TIERS = ["basic", "premium"];
export const ANNUAL_DISCOUNT = 0.2;
export function loadPlans(env = process.env){
  const price = (k, d) => { const n = Number(env["PRICE_NGN_" + k]); return Number.isFinite(n) && n > 0 ? n : d; };
  const monthly = { basic:price("BASIC_MONTHLY", 4999), premium:price("PREMIUM_MONTHLY", 7999) };
  const plans = {};
  TIERS.forEach(tier => {
    const T = tier.toUpperCase(), label = tier[0].toUpperCase() + tier.slice(1);
    plans[tier + "_monthly"] = { id:tier + "_monthly", tier, interval:"monthly", label:label + " · Monthly", months:1,
      ngn:monthly[tier], planCode:env["PAYSTACK_PLAN_" + T + "_MONTHLY"] || "" };
    plans[tier + "_annual"] = { id:tier + "_annual", tier, interval:"annual", label:label + " · Annual", months:12,
      ngn:price(T + "_ANNUAL", Math.round(monthly[tier] * 12 * (1 - ANNUAL_DISCOUNT))), planCode:env["PAYSTACK_PLAN_" + T + "_ANNUAL"] || "" };
  });
  return plans;
}
/* monthly price per tier — used to convert time left when someone switches tier */
export function tierPrices(plans){ const o = {}; TIERS.forEach(t => { o[t] = plans[t + "_monthly"].ngn; }); return o; }

/* Rows written before tiers existed (plan "monthly", or granted by hand) were all Premium. */
export function tierOf(row){
  if(!row) return null;
  if(row.tier) return row.tier;
  return /^basic/.test(row.plan || "") ? "basic" : "premium";
}

/* Live = status active AND the paid period hasn't ended. A row with no period end
   (granted by hand before expiry existed) stays live until someone sets one. */
export function isActiveSub(row, now = new Date()){
  if(!row || row.status !== "active") return false;
  if(!row.current_period_end) return true;
  return new Date(row.current_period_end) > now;
}

export function verifySignature(rawBody, signature, secret){
  if(!secret || !signature || !rawBody) return false;
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(hash), b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function metaOf(data){
  let m = data && data.metadata;
  if(typeof m === "string"){ try{ m = JSON.parse(m); }catch(_){ m = null; } }
  return (m && typeof m === "object") ? m : {};
}

/* Which plan did this charge pay for? Trust order: our own metadata, then the Paystack
   plan code, then the amount. Never grant more than the amount actually paid covers. */
export function planForCharge(data, plans){
  const amount = Number(data && data.amount) || 0;               // kobo
  const list = Object.values(plans);
  const covers = p => amount >= p.ngn * 100;
  let plan = null;
  const m = metaOf(data);
  if(m.plan && plans[m.plan]) plan = plans[m.plan];
  const code = data && data.plan && (typeof data.plan === "string" ? data.plan : data.plan.plan_code);
  if(!plan && code) plan = list.find(p => p.planCode && p.planCode === code) || null;
  if(plan && covers(plan)) return plan;
  // fall back to the most expensive plan the amount covers (or none)
  return list.filter(covers).sort((a, b) => b.ngn - a.ngn)[0] || null;
}

async function findAccount(db, data){
  const m = metaOf(data);
  if(m.account_id){
    const r = await db.from("accounts").select("id").eq("id", m.account_id).maybeSingle();
    if(r.error) throw new Error("accounts read failed: " + (r.error.message || r.error));
    if(r.data) return r.data.id;
  }
  const email = data && data.customer && data.customer.email;
  if(!email) return null;
  const norm = String(email).trim().toLowerCase();
  let r = await db.from("accounts").select("id").eq("email", email).maybeSingle();
  if(!r.data && !r.error && norm !== email) r = await db.from("accounts").select("id").eq("email", norm).maybeSingle();
  if(r.error) throw new Error("accounts read failed: " + (r.error.message || r.error));
  return r.data ? r.data.id : null;
}

/* Apply one successful charge. Returns { applied, duplicate, sub } or { skipped: reason }.
   Throws on database errors so the webhook answers 500 and Paystack retries. */
export async function applyCharge(db, data, plans, { expectAccount } = {}){
  if(!data || data.status !== "success") return { skipped:"not a successful charge" };
  if(data.currency && data.currency !== "NGN") return { skipped:"currency " + data.currency };
  const account_id = await findAccount(db, data);
  if(!account_id) return { skipped:"no matching account" };
  if(expectAccount && account_id !== expectAccount) return { skipped:"charge belongs to another account" };
  const plan = planForCharge(data, plans);
  if(!plan) return { skipped:"amount " + data.amount + " kobo covers no plan" };
  const customer = data.customer || {};
  const r = await db.rpc("medbank_apply_payment", {
    p_reference: String(data.reference),
    p_account_id: account_id,
    p_plan: plan.id,
    p_months: plan.months,
    p_tier: plan.tier,
    p_tier_prices: tierPrices(plans),
    p_amount_kobo: Number(data.amount) || 0,
    p_customer_code: customer.customer_code || null,
  });
  if(r.error) throw new Error("medbank_apply_payment failed: " + (r.error.message || r.error));
  const row = Array.isArray(r.data) ? r.data[0] : r.data;
  return { applied: !!(row && row.applied), duplicate: !!(row && !row.applied), account_id, plan: plan.id, tier: plan.tier,
           current_period_end: row && row.current_period_end };
}

/* Subscription bookkeeping for recurring plans. Updates only — the row is created by the
   first charge; if it isn't there yet we throw so Paystack retries after the charge lands. */
async function updateSubByAccount(db, data, patch){
  const account_id = await findAccount(db, data);
  if(!account_id) return { skipped:"no matching account" };
  const up = await db.from("subscriptions").update(patch).eq("account_id", account_id).select("account_id");
  if(up.error) throw new Error("subscriptions update failed: " + (up.error.message || up.error));
  if(!up.data || !up.data.length) throw new Error("no subscriptions row yet for " + account_id);
  return { updated:true, account_id };
}

export async function handleEvent(db, event, plans){
  const type = event && event.event, data = (event && event.data) || {};
  switch(type){
    case "charge.success":
      return applyCharge(db, data, plans);
    case "subscription.create":
      return updateSubByAccount(db, data, {
        auto_renew: true,
        paystack_subscription_code: data.subscription_code || null,
        paystack_email_token: data.email_token || null,
        paystack_customer_code: (data.customer && data.customer.customer_code) || null,
        updated_at: new Date().toISOString(),
      });
    case "subscription.not_renew":
    case "subscription.disable":
      // They keep what they paid for; it just won't renew. isActiveSub ends it on the date.
      return updateSubByAccount(db, data, { auto_renew:false, updated_at:new Date().toISOString() });
    case "invoice.payment_failed":
      // No money, no extension: the period runs out on its own. Logged so a renewal failure is visible.
      return { skipped:"renewal payment failed — access ends at current_period_end" };
    default:
      return { skipped:"ignored event " + type };
  }
}

async function paystack(path, { method = "GET", body, secret, fetchImpl = fetch } = {}){
  const r = await fetchImpl(PAYSTACK_API + path, {
    method, headers:{ Authorization:"Bearer " + secret, "Content-Type":"application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if(!r.ok || !j.status) throw Object.assign(new Error(j.message || ("Paystack " + r.status)), { status:r.status });
  return j.data;
}

/* Open a transaction. Amount and plan come from PLANS, never from the client. */
export async function startCheckout({ user, planId, callbackUrl, plans, secret, fetchImpl }){
  const plan = plans[planId];
  if(!plan) throw Object.assign(new Error("unknown plan"), { status:400 });
  if(!user.email) throw Object.assign(new Error("your account has no email address"), { status:400 });
  const body = {
    email: user.email,
    amount: plan.ngn * 100,
    currency: "NGN",
    metadata: { account_id:user.id, plan:plan.id, cancel_action: callbackUrl || undefined },
  };
  if(callbackUrl) body.callback_url = callbackUrl;
  if(plan.planCode) body.plan = plan.planCode;                 // recurring: Paystack renews and sends charge.success each time
  const d = await paystack("/transaction/initialize", { method:"POST", body, secret, fetchImpl });
  return { authorization_url:d.authorization_url, access_code:d.access_code, reference:d.reference, plan:plan.id, tier:plan.tier, amount_ngn:plan.ngn };
}

export async function verifyReference({ db, user, reference, plans, secret, fetchImpl }){
  if(!reference || !/^[\w.=-]{1,100}$/.test(reference)) throw Object.assign(new Error("bad reference"), { status:400 });
  const data = await paystack("/transaction/verify/" + encodeURIComponent(reference), { secret, fetchImpl });
  if(data.status !== "success") return { paid:false, status:data.status };
  const out = await applyCharge(db, data, plans, { expectAccount:user.id });
  if(out.skipped) return { paid:false, status:"not applied", reason:out.skipped };
  return { paid:true, plan:out.plan, tier:out.tier, current_period_end:out.current_period_end };
}
