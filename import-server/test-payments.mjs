/* node --test test-payments.mjs — payments.mjs against an in-memory stand-in for Supabase.
   The fake rpc mirrors medbank_apply_payment in backend/payments.sql. */
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { loadPlans, tierOf, isActiveSub, verifySignature, planForCharge, applyCharge, handleEvent, startCheckout, verifyReference } from "./payments.mjs";

const PLANS = loadPlans({ PAYSTACK_PLAN_PREMIUM_MONTHLY:"PLN_month" });
const DAY = 864e5;

function fakeDb({ accounts = [], subs = [] } = {}){
  const t = { accounts:[...accounts], subscriptions:[...subs], payments:[] };
  const db = { t, failRpc:false,
    from(name){
      const rows = t[name]; let filt = [], patch = null;
      const match = () => rows.filter(r => filt.every(([k, v]) => r[k] === v));
      const q = {
        select(){ return q; },
        eq(k, v){ filt.push([k, v]); return q; },
        update(p){ patch = p; return q; },
        async maybeSingle(){ const m = match(); return { data:m[0] || null, error:null }; },
        then(res, rej){
          const m = match(); if(patch) m.forEach(r => Object.assign(r, patch));
          return Promise.resolve({ data:m.map(r => ({ ...r })), error:null }).then(res, rej);
        },
      };
      return q;
    },
    async rpc(fn, a){
      assert.equal(fn, "medbank_apply_payment");
      if(db.failRpc) return { data:null, error:{ message:"connection reset" } };
      const sub = t.subscriptions.find(s => s.account_id === a.p_account_id);
      if(t.payments.some(p => p.reference === a.p_reference)) return { data:[{ applied:false, current_period_end:sub && sub.current_period_end }], error:null };
      const now = Date.now();
      const curEnd = sub && sub.status === "active" && sub.current_period_end ? new Date(sub.current_period_end).getTime() : 0;
      let left = Math.max(0, curEnd - now);
      if(left && tierOf(sub) !== a.p_tier) left *= a.p_tier_prices[tierOf(sub)] / a.p_tier_prices[a.p_tier];
      const end = new Date(now + left); end.setMonth(end.getMonth() + a.p_months);
      t.payments.push({ reference:a.p_reference, account_id:a.p_account_id });
      const patch = { status:"active", plan:a.p_plan, tier:a.p_tier, current_period_end:end.toISOString() };
      if(sub) Object.assign(sub, patch); else t.subscriptions.push({ account_id:a.p_account_id, ...patch });
      return { data:[{ applied:true, current_period_end:end.toISOString() }], error:null };
    },
  };
  return db;
}
const charge = (o = {}) => ({ status:"success", currency:"NGN", reference:"ref1", amount:799900,
  customer:{ email:"Ada@Example.com ", customer_code:"CUS_1" }, metadata:{ account_id:"acc1", plan:"premium_monthly" }, ...o });

test("a payment from a student with no subscriptions row activates them", async () => {
  const db = fakeDb({ accounts:[{ id:"acc1", email:"ada@example.com" }] });
  const out = await handleEvent(db, { event:"charge.success", data:charge() }, PLANS);
  assert.equal(out.applied, true);
  assert.equal(db.t.subscriptions.length, 1);
  assert.ok(isActiveSub(db.t.subscriptions[0]));
});

test("the four plans and their prices", () => {
  const p = Object.fromEntries(Object.values(PLANS).map(x => [x.id, [x.tier, x.months, x.ngn]]));
  assert.deepEqual(p, { basic_monthly:["basic", 1, 4999], basic_annual:["basic", 12, 47990],
                        premium_monthly:["premium", 1, 7999], premium_annual:["premium", 12, 76790] });
});

test("an annual Basic payment records the tier, plan and a year", async () => {
  const db = fakeDb({ accounts:[{ id:"acc1" }] });
  await applyCharge(db, charge({ reference:"b", amount:4799000, metadata:{ account_id:"acc1", plan:"basic_annual" } }), PLANS);
  const s = db.t.subscriptions[0];
  assert.equal(s.plan, "basic_annual"); assert.equal(tierOf(s), "basic");
  const days = (new Date(s.current_period_end) - Date.now()) / DAY;
  assert.ok(days > 364 && days < 367, "about a year, got " + days);
});

test("upgrading Basic to Premium converts the time left at the monthly prices", async () => {
  const end = new Date(Date.now() + 30 * DAY).toISOString();
  const db = fakeDb({ accounts:[{ id:"acc1" }], subs:[{ account_id:"acc1", status:"active", plan:"basic_monthly", tier:"basic", current_period_end:end }] });
  const out = await applyCharge(db, charge({ reference:"up" }), PLANS);
  const days = (new Date(out.current_period_end) - Date.now()) / DAY;
  const credit = 30 * 4999 / 7999;                                   // ~18.7 days of Premium
  assert.ok(days > credit + 27 && days < credit + 32, "credit + a month, got " + days);
  assert.equal(tierOf(db.t.subscriptions[0]), "premium");
});

test("rows from before tiers count as Premium", () => {
  assert.equal(tierOf({ status:"active", plan:"monthly" }), "premium");
  assert.equal(tierOf({ status:"active" }), "premium");
  assert.equal(tierOf({ status:"active", plan:"basic_annual" }), "basic");
});

test("the webhook and the app's verify call can both arrive: counted once", async () => {
  const db = fakeDb({ accounts:[{ id:"acc1" }] });
  const a = await applyCharge(db, charge(), PLANS);
  const b = await applyCharge(db, charge(), PLANS);
  assert.equal(a.applied, true); assert.equal(b.duplicate, true);
  assert.equal(a.current_period_end, b.current_period_end);
});

test("renewing early adds to the remaining time instead of resetting it", async () => {
  const end = new Date(Date.now() + 10 * DAY).toISOString();
  const db = fakeDb({ accounts:[{ id:"acc1" }], subs:[{ account_id:"acc1", status:"active", plan:"monthly", current_period_end:end }] });
  const out = await applyCharge(db, charge({ reference:"renew" }), PLANS);
  const days = (new Date(out.current_period_end) - Date.now()) / DAY;
  assert.ok(days > 37 && days < 42, "10 left + a month, got " + days);
});

test("no metadata: falls back to email (case-insensitive) and to the amount for the plan", async () => {
  const db = fakeDb({ accounts:[{ id:"acc9", email:"ada@example.com" }] });
  const out = await applyCharge(db, charge({ metadata:"", amount:7679000 }), PLANS);
  assert.equal(out.account_id, "acc9"); assert.equal(out.plan, "premium_annual");
  assert.equal(planForCharge({ amount:499900 }, PLANS).id, "basic_monthly");
});

test("a Paystack plan renewal is matched by plan code", () => {
  assert.equal(planForCharge({ amount:799900, plan:{ plan_code:"PLN_month" } }, PLANS).id, "premium_monthly");
});

test("never grants more than the amount paid", () => {
  assert.equal(planForCharge({ amount:799900, metadata:{ plan:"premium_annual" } }, PLANS).id, "premium_monthly");
  assert.equal(planForCharge({ amount:499900, metadata:{ plan:"premium_monthly" } }, PLANS).id, "basic_monthly");
  assert.equal(planForCharge({ amount:100000, metadata:{ plan:"basic_monthly" } }, PLANS), null);
});

test("a database failure throws so the webhook answers 500 and Paystack retries", async () => {
  const db = fakeDb({ accounts:[{ id:"acc1" }] }); db.failRpc = true;
  await assert.rejects(handleEvent(db, { event:"charge.success", data:charge() }, PLANS));
});

test("an unknown payer is skipped, not crashed", async () => {
  const db = fakeDb();
  const out = await handleEvent(db, { event:"charge.success", data:charge({ metadata:{} }) }, PLANS);
  assert.match(out.skipped, /no matching account/);
});

test("cancelling keeps access to the end of the period, then it lapses", async () => {
  const end = new Date(Date.now() + 5 * DAY).toISOString();
  const db = fakeDb({ accounts:[{ id:"acc1" }], subs:[{ account_id:"acc1", status:"active", current_period_end:end, auto_renew:true }] });
  await handleEvent(db, { event:"subscription.disable", data:{ customer:{ email:"x" }, metadata:{ account_id:"acc1" } } }, PLANS);
  const s = db.t.subscriptions[0];
  assert.equal(s.auto_renew, false);
  assert.ok(isActiveSub(s));
  assert.ok(!isActiveSub(s, new Date(Date.now() + 6 * DAY)));
});

test("expiry rules", () => {
  assert.ok(!isActiveSub(null));
  assert.ok(!isActiveSub({ status:"trialing" }));
  assert.ok(isActiveSub({ status:"active" }), "hand-granted rows without a date stay active");
  assert.ok(!isActiveSub({ status:"active", current_period_end:new Date(Date.now() - 1000).toISOString() }));
});

test("signature check", () => {
  const body = Buffer.from('{"event":"charge.success"}');
  const sig = crypto.createHmac("sha512", "sk_test").update(body).digest("hex");
  assert.ok(verifySignature(body, sig, "sk_test"));
  assert.ok(!verifySignature(body, sig, "sk_other"));
  assert.ok(!verifySignature(body, "short", "sk_test"));
  assert.ok(!verifySignature(body, sig, ""));
});

test("checkout charges the server's price, not the client's", async () => {
  let sent;
  const fetchImpl = async (url, init) => { sent = { url, body:JSON.parse(init.body) };
    return { ok:true, json:async () => ({ status:true, data:{ authorization_url:"https://checkout.paystack.com/x", access_code:"ac", reference:"r" } }) }; };
  const out = await startCheckout({ user:{ id:"acc1", email:"a@b.c" }, planId:"basic_annual", callbackUrl:"https://medbank.com.ng/app.html", plans:PLANS, secret:"sk", fetchImpl });
  assert.equal(sent.body.amount, 4799000);
  assert.equal(sent.body.metadata.account_id, "acc1");
  assert.equal(sent.body.plan, undefined);
  assert.equal(out.access_code, "ac");
  await startCheckout({ user:{ id:"acc1", email:"a@b.c" }, planId:"premium_monthly", plans:PLANS, secret:"sk", fetchImpl });
  assert.equal(sent.body.plan, "PLN_month");
  await assert.rejects(startCheckout({ user:{ id:"acc1", email:"a@b.c" }, planId:"semester", plans:PLANS, secret:"sk", fetchImpl }), /unknown plan/);
});

test("verify won't apply someone else's payment to you", async () => {
  const db = fakeDb({ accounts:[{ id:"acc1" }, { id:"acc2" }] });
  const fetchImpl = async () => ({ ok:true, json:async () => ({ status:true, data:charge() }) });
  const mine = await verifyReference({ db, user:{ id:"acc2" }, reference:"ref1", plans:PLANS, secret:"sk", fetchImpl });
  assert.equal(mine.paid, false);
  const theirs = await verifyReference({ db, user:{ id:"acc1" }, reference:"ref1", plans:PLANS, secret:"sk", fetchImpl });
  assert.equal(theirs.paid, true);
  await assert.rejects(verifyReference({ db, user:{ id:"acc1" }, reference:"../x", plans:PLANS, secret:"sk", fetchImpl }), /bad reference/);
});
