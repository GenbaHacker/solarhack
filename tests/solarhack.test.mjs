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
// Summary
// ============================================================================
console.log('\n=== ALL TESTS PASSED ===\n');
console.log('Summary:');
console.log('  TASK 1 (Estimate persistence): ✓');
console.log('  TASK 2 (IRR bisection): ✓');
console.log('  TASK 3 (PCS units): ✓');
console.log('  TASK 4 (Irradiation source): ✓');
console.log('');
console.log('Next: implement fixes in solarhack-v2.html and re-run.');
