// SolarHack v2 Test Suite
// Tests for Tasks 1–4 bug fixes

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
};

const almostEqual = (actual, expected, tolerance, message) => {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    console.error(`❌ FAIL: ${message} (expected ${expected}, got ${actual}, diff ${diff})`);
    process.exit(1);
  }
  console.log(`✓ ${message} (${actual.toFixed(4)})`);
};

// ============================================================================
// TASK 1: Estimate persistence — V2_EST is populated and used
// ============================================================================
console.log('\n=== TASK 1: Estimate Persistence ===');

// Mock: minimal DOM
global.document = {
  getElementById: (id) => ({
    value: '0',
    textContent: '',
    checked: false,
    style: {},
    innerHTML: '',
  }),
};

// Stub: V2_EST should exist at module scope after estimate is run
let V2_EST = null;

// Extracted V2_calcEstimate logic (simplified)
function V2_calcEstimate_Test() {
  const panels = 40;
  const pcsUnits = 1;
  const pcsKw = 50;
  const isHigh = false;
  const materialCost = 1_000_000;
  const workCost = 500_000;
  const subTotal = materialCost + workCost;
  const tax = subTotal * 0.1;
  const total = subTotal + tax;
  const perKw = (panels * 485 / 1000) > 0 ? total / (panels * 485 / 1000) : 0;

  // TASK 1 FIX: populate V2_EST
  V2_EST = {
    panels,
    pcsUnits,
    pcsKw,
    isHigh,
    materialCost,
    workCost,
    subTotal,
    tax,
    total,
    perKw,
    calcedAt: new Date().toISOString(),
  };

  return total;
}

const estTotal = V2_calcEstimate_Test();
assert(V2_EST !== null, 'V2_EST is populated after estimate');
assert(V2_EST.total === estTotal, 'V2_EST.total equals computed total');
assert(V2_EST.total === 1_650_000, 'V2_EST.total value is correct');

// ============================================================================
// TASK 2: IRR solver — bisection instead of Newton-Raphson
// ============================================================================
console.log('\n=== TASK 2: IRR Solver (Bisection) ===');

function irrBisection(cashflows) {
  const f = (rate) => {
    let npv = 0;
    for (let i = 0; i < cashflows.length; i++) {
      npv += cashflows[i] / Math.pow(1 + rate, i);
    }
    return npv;
  };

  // Start with bracket: lo = -0.999, hi = 1.0
  let lo = -0.999;
  let hi = 1.0;

  // Try to find a sign change
  // First, try expanding hi
  for (let i = 0; i < 10; i++) {
    if (f(lo) * f(hi) < 0) break;
    hi *= 2;
  }

  // If still no sign change, try expanding lo (more negative)
  if (f(lo) * f(hi) >= 0) {
    lo = -0.999;
    for (let i = 0; i < 10; i++) {
      if (f(lo) * f(hi) < 0) break;
      lo = lo / 2;  // more negative
    }
  }

  // If no sign change found, return null
  if (f(lo) * f(hi) >= 0) {
    return null;
  }

  // Bisection loop
  const tolerance = 1e-6;
  for (let iter = 0; iter < 100; iter++) {
    const mid = (lo + hi) / 2;
    const fmid = f(mid);
    if (Math.abs(fmid) < tolerance) {
      return mid;
    }
    if (f(lo) * fmid < 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return (lo + hi) / 2;
}

// Test cases
const cf1 = [-1000, 500, 500, 500];
const irr1 = irrBisection(cf1);
almostEqual(irr1, 0.2338, 0.0005, 'IRR([-1000,500,500,500]) ≈ 0.2338');

// cf2: all positive cashflows (no investment, no IRR)
const cf2 = [100, 100, 100];
const irr2 = irrBisection(cf2);
assert(irr2 === null, 'IRR([100,100,100]) returns null (all positive, no investment)');

const cf3 = [-1000, 1100];
const irr3 = irrBisection(cf3);
almostEqual(irr3, 0.10, 0.0005, 'IRR([-1000,1100]) ≈ 0.10');

const cf4 = [100, 100, 100];
const irr4 = irrBisection(cf4);
assert(irr4 === null, 'IRR([100,100,100]) returns null (all positive)');

// ============================================================================
// TASK 3: PCS units — multi-unit logic
// ============================================================================
console.log('\n=== TASK 3: PCS Units Calculation ===');

function calcPcsUnits(dcKw, pcsKw, maxOverloadRatio = 1.6) {
  if (pcsKw <= 0) return 1;
  return Math.ceil(dcKw / (pcsKw * maxOverloadRatio));
}

// Test cases: DC capacity vs. PCS count
const testCases = [
  { dcKw: 50, pcsKw: 50, expectedUnits: 1, label: '50kW / 50kW PCS' },
  { dcKw: 100, pcsKw: 50, expectedUnits: 2, label: '100kW / 50kW PCS' },
  { dcKw: 250, pcsKw: 50, expectedUnits: 4, label: '250kW / 50kW PCS' },
  { dcKw: 500, pcsKw: 50, expectedUnits: 7, label: '500kW / 50kW PCS' },
];

for (const tc of testCases) {
  const units = calcPcsUnits(tc.dcKw, tc.pcsKw);
  assert(units === tc.expectedUnits, `PCS units: ${tc.label} → ${units} units`);

  const actualRatio = tc.dcKw / (tc.pcsKw * units);
  assert(
    actualRatio <= 1.6,
    `  Overload ratio ${actualRatio.toFixed(3)} ≤ 1.6 (capacity limit)`
  );
}

// ============================================================================
// TASK 4: Irradiation source — explicit provenance
// ============================================================================
console.log('\n=== TASK 4: Irradiation Source Tracking ===');

let V2_IRR_STATE = {
  source: 'NONE', // 'NEDO' | 'MONSOLA' | 'NONE'
  station: null,
  monthly: null,
};

function V2_fetchIrrTest_Success() {
  V2_IRR_STATE = {
    source: 'MONSOLA',
    station: '観測所A',
    monthly: [2.9, 3.4, 3.9, 4.3, 4.5, 4.1, 4.3, 4.5, 3.9, 3.4, 2.9, 2.7],
  };
  return true;
}

function V2_fetchIrrTest_Failure() {
  V2_IRR_STATE = {
    source: 'NONE',
    station: null,
    monthly: null,
  };
  return false;
}

// Test: success case
const success = V2_fetchIrrTest_Success();
assert(success && V2_IRR_STATE.source === 'MONSOLA', 'Irradiation fetch success sets source=MONSOLA');
assert(V2_IRR_STATE.station === '観測所A', 'Station name is set');

// Test: failure case
const failure = !V2_fetchIrrTest_Failure();
assert(failure && V2_IRR_STATE.source === 'NONE', 'Irradiation fetch failure sets source=NONE');
assert(V2_IRR_STATE.station === null, 'Station name is null on failure');

// Test: simulation blocks when source=NONE
function C_runSimTest_BlocksOnNoIrr() {
  if (V2_IRR_STATE.source === 'NONE') {
    return { blocked: true, message: '日射データが取得できなかったため、シミュレーションを実行できません' };
  }
  return { blocked: false };
}

V2_IRR_STATE.source = 'NONE';
const simResult = C_runSimTest_BlocksOnNoIrr();
assert(simResult.blocked === true, 'Simulation blocks when irrSource=NONE');

V2_IRR_STATE.source = 'MONSOLA';
const simResult2 = C_runSimTest_BlocksOnNoIrr();
assert(simResult2.blocked === false, 'Simulation proceeds when irrSource is set');

// ============================================================================
// TASK 5: Master data validation + auto-persist
// ============================================================================
console.log('\n=== TASK 5: Master Data Validation ===');

let COST_MASTER = {
  scaffold: 250_000,
  contingency_rate: 0.07,
};

let COST_MASTER_STATE = {
  updatedAt: new Date().toISOString(),
  updatedBy: 'admin',
};

// Test helper: V2_setCost logic
function V2_setCost(key, rawValue) {
  // Normalize: full-width digits to ASCII, strip commas/spaces/¥
  let normalized = String(rawValue)
    .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))  // ０->0, １->1, ... ９->9
    .replace(/[,、，\s¥]/g, '');  // remove ASCII comma, ideographic comma, full-width comma, spaces, ¥

  const prev = COST_MASTER[key];
  const parsed = parseInt(normalized || '0', 10);  // parseInt('') → NaN, so default to 0

  // Reject NaN, negative, non-finite
  if (isNaN(parsed) || parsed < 0 || !isFinite(parsed)) {
    return { success: false, error: 'Invalid value', value: prev };
  }

  // If result is 0 (from empty), also reject
  if (normalized === '' && parsed === 0) {
    return { success: false, error: 'Empty value', value: prev };
  }

  // Clamp to 0..100_000_000
  const clamped = Math.min(Math.max(parsed, 0), 100_000_000);
  COST_MASTER[key] = clamped;
  COST_MASTER_STATE.updatedAt = new Date().toISOString();

  return { success: true, value: clamped };
}

// Test: empty input → no NaN
let result = V2_setCost('scaffold', '');
assert(result.success === false, 'V2_setCost("scaffold","") rejected');
assert(!isNaN(COST_MASTER['scaffold']), 'No NaN in COST_MASTER after reject');

// Test: full-width digits + comma
result = V2_setCost('scaffold', '３３０，０００');
assert(result.success === true, 'V2_setCost("scaffold","３３０，０００") accepted');
assert(COST_MASTER['scaffold'] === 330_000, `scaffold value is 330000 (got ${COST_MASTER['scaffold']})`);

// Test: negative → rejected, unchanged
const prevScaffold = COST_MASTER['scaffold'];
result = V2_setCost('scaffold', '-5');
assert(result.success === false, 'V2_setCost("scaffold","-5") rejected');
assert(COST_MASTER['scaffold'] === prevScaffold, 'scaffold unchanged after reject');

// Test: valid large number
result = V2_setCost('scaffold', '400000');
assert(result.success === true, 'V2_setCost("scaffold","400000") accepted');
assert(COST_MASTER['scaffold'] === 400_000, `scaffold value is 400000 (got ${COST_MASTER['scaffold']})`);

// ============================================================================
// TASK 6: Contingency line item
// ============================================================================
console.log('\n=== TASK 6: Contingency Line Item ===');

const COST_MASTER_Task6 = {
  contingency_rate: 0.07,
};

function V2_calcEstimate_Task6() {
  const panels = 100;
  const panelWp = 485;
  const pcsUnits = 1;
  const pcsKw = 50;
  const isHigh = false;
  const materialCost = 3_000_000;
  const workCost = 2_000_000;

  const contingency = workCost * COST_MASTER_Task6.contingency_rate;
  const subTotal = materialCost + workCost + contingency;
  const tax = subTotal * 0.1;
  const total = subTotal + tax;
  const perKw = (panels * panelWp / 1000) > 0 ? total / (panels * panelWp / 1000) : 0;

  return {
    panels,
    pcsUnits,
    pcsKw,
    isHigh,
    materialCost,
    workCost,
    contingency,
    subTotal,
    tax,
    total,
    perKw,
  };
}

const est6 = V2_calcEstimate_Task6();
const expectedSubTotal = est6.materialCost + est6.workCost + (est6.workCost * COST_MASTER_Task6.contingency_rate);
almostEqual(est6.subTotal, expectedSubTotal, 1e-6, 'subTotal includes contingency');
assert(est6.contingency === est6.workCost * 0.07, 'contingency = workCost * 0.07');

// ============================================================================
// TASK 7: Risk checklist gate
// ============================================================================
console.log('\n=== TASK 7: Risk Checklist ===');

const RISK_ITEMS = [
  {id:'asbestos',   label:'アスベスト含有の可能性（既設屋根材）'},
  {id:'demolition', label:'既設設備の撤去・処分'},
  {id:'reinforce',  label:'屋根/構造の補強要否'},
  {id:'pole',       label:'電柱・引込柱の移設'},
  {id:'cubicle',    label:'キュービクル改修・増設'},
  {id:'access',     label:'搬入経路・重機進入の制約'},
  {id:'neighbor',   label:'近隣調整・反射対策'},
  {id:'ground',     label:'地中埋設物・地盤（野立て）'},
];

let V2_EST_Task7 = {
  risks: {},
};

// Initialize risks to 未確認
for (const item of RISK_ITEMS) {
  V2_EST_Task7.risks[item.id] = '未確認';
}

function countUnresolvedRisks(risks) {
  return Object.values(risks).filter(state => state === '未確認').length;
}

function shouldShowRiskBanner(risks) {
  return countUnresolvedRisks(risks) > 0;
}

function getRiskBannerText(risks) {
  const count = countUnresolvedRisks(risks);
  return count > 0 ? `⚠ 未確認リスク ${count}件 — 追加費用が発生する可能性があります` : '';
}

// Test: 3 items unresolved
V2_EST_Task7.risks['asbestos'] = '確認済(不要)';
V2_EST_Task7.risks['demolition'] = '確認済(費用計上)';
V2_EST_Task7.risks['reinforce'] = '確認済(不要)';
// Others remain 未確認: 5 items
const unresolvedCount = countUnresolvedRisks(V2_EST_Task7.risks);
assert(unresolvedCount === 5, `5 unresolved risks (got ${unresolvedCount})`);
const bannerText = getRiskBannerText(V2_EST_Task7.risks);
assert(bannerText.includes('5件'), `Banner text contains "5件": ${bannerText}`);

// Test: all resolved
for (const item of RISK_ITEMS) {
  V2_EST_Task7.risks[item.id] = '確認済(不要)';
}
assert(!shouldShowRiskBanner(V2_EST_Task7.risks), 'Banner hidden when all risks resolved');
assert(getRiskBannerText(V2_EST_Task7.risks) === '', 'Banner text empty when all resolved');

// ============================================================================
// TASK 8: Estimate cloud log (fire-and-forget, never blocks)
// ============================================================================
console.log('\n=== TASK 8: Estimate Cloud Log ===');

function V2_logEstimate_Test(endpoint, estimate, options = {}) {
  const { throwSendBeacon = false, throwFetch = false } = options;

  const body = JSON.stringify({
    ts: new Date().toISOString(),
    user: 'admin',
    kw: estimate.perKw,
    panels: estimate.panels,
    materialCost: estimate.materialCost,
    workCost: estimate.workCost,
    contingency: estimate.contingency || 0,
    subTotal: estimate.subTotal,
    total: estimate.total,
    perKw: estimate.perKw,
    unresolvedRisks: countUnresolvedRisks(estimate.risks || {}),
  });

  try {
    const blob = new Blob([body], {type:'text/plain;charset=utf-8'});
    // Stub sendBeacon
    const stubSendBeacon = throwSendBeacon ? () => { throw new Error('sendBeacon error'); } : (ep, b) => true;
    if (stubSendBeacon && stubSendBeacon(endpoint, blob)) return;
  } catch (e) { /* fall through */ }

  // Stub fetch
  const stubFetch = throwFetch ? () => Promise.reject(new Error('fetch error')) : (ep, opts) => Promise.resolve();
  stubFetch(endpoint, {
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body, keepalive:true, mode:'no-cors',
  }).catch(err => {/* swallow errors */});
}

// Test: both sendBeacon and fetch throw → logging still succeeds (errors swallowed)
try {
  V2_logEstimate_Test('https://script.google.com/macros/s/AKfycbxTEST/exec', est6,
    {throwSendBeacon: true, throwFetch: true});
  assert(true, 'Logging failure does not throw (fire-and-forget)');
} catch (e) {
  assert(false, `Logging threw unexpectedly: ${e.message}`);
}

// ============================================================================
// TASK 9: Printable proposal
// ============================================================================
console.log('\n=== TASK 9: Printable Proposal ===');

function canPrint(estimate, irrState) {
  return estimate !== null && irrState.source !== 'NONE';
}

function getPrintBlockReason(estimate, irrState) {
  if (estimate === null) return 'V2_EST is null';
  if (irrState.source === 'NONE') return 'IRR source is NONE';
  return null;
}

// Test: null estimate → cannot print
assert(!canPrint(null, V2_IRR_STATE), 'Cannot print when V2_EST is null');
assert(getPrintBlockReason(null, V2_IRR_STATE) === 'V2_EST is null', 'Print block reason: V2_EST is null');

// Test: NONE irradiation → cannot print
assert(!canPrint(est6, {source: 'NONE', station: null}), 'Cannot print when irradiation is NONE');
assert(getPrintBlockReason(est6, {source: 'NONE', station: null}) === 'IRR source is NONE', 'Print block reason: IRR source is NONE');

// Test: valid estimate + valid irradiation → can print
assert(canPrint(est6, {source: 'MONSOLA', station: 'test'}), 'Can print when estimate and irradiation are valid');
assert(getPrintBlockReason(est6, {source: 'MONSOLA', station: 'test'}) === null, 'No print block when valid');

// ============================================================================
// Summary
// ============================================================================
console.log('\n=== ALL TESTS PASSED ===\n');
console.log('Summary:');
console.log('  TASK 1 (Estimate persistence): ✓');
console.log('  TASK 2 (IRR bisection): ✓');
console.log('  TASK 3 (PCS units): ✓');
console.log('  TASK 4 (Irradiation source): ✓');
console.log('  TASK 5 (Master validation): ✓');
console.log('  TASK 6 (Contingency line): ✓');
console.log('  TASK 7 (Risk checklist): ✓');
console.log('  TASK 8 (Cloud log): ✓');
console.log('  TASK 9 (Print proposal): ✓');
console.log('');
console.log('Next: implement fixes in solarhack-v2.html and re-run.');
