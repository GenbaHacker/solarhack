// ============================================================================
// TASK 104: DenkiHack Validation — 3 Real Cases Against Subcontractor Quotes
// ============================================================================
// This test was supposed to be delivered in Run 8 and was not.
// Acceptance criterion: Case A within ±15% of ¥3,419,300

import { DenkiHack_calc } from '../denkihack.mjs';

console.log('=== DenkiHack Validation Tests ===\n');

// ============================================================================
// CASE A: 福山市民病院 77.6kW / Roof mount / High voltage
// ============================================================================
console.log('CASE A: 福山市民病院 77.6kW\n');
console.log('Known ground truth (ケイテック実見積):');
console.log('  Material:  ¥2,151,800');
console.log('  Misc:      ¥107,500');
console.log('  Labor:     ¥790,000');
console.log('  Transport: ¥76,000');
console.log('  Overhead:  ¥294,000');
console.log('  TOTAL:     ¥3,419,300');
console.log('  AC cable:  CET60 × 135m → distPcsToGrid_m = 135\n');

const caseA = DenkiHack_calc({
  kw: 77.6,
  pcsKwTotal: 50,
  acVoltage: 440,
  stringCount: 4,              // estimate from DC layout
  // TASK 101: For roof systems, default is 25m (平均距離、最遠距離の約6割)
  distPvToPcs_m: 25,           // Corrected: 25m average for roof mount
  distPcsToGrid_m: 135,        // KNOWN from AC cable CET60 × 135m
  routing: 'outdoor',
  supply: 'high',
  mountType: 'roof',
  dropLimitRatio: 0.0105,
});

console.log('DenkiHack estimated BOM:');
caseA.bom.forEach(item => {
  if (item.amount > 0) {
    console.log(`  ${item.cat.padEnd(10)} | ${item.name.padEnd(20)} | ${item.qty.toFixed(0).padEnd(6)} ${item.unit.padEnd(3)} @ ¥${item.unitPrice.toLocaleString().padEnd(8)} = ¥${item.amount.toLocaleString()}`);
  }
});

console.log('\nDenkiHack cost summary:');
console.log(`  Material:     ¥${caseA.materialCost.toLocaleString()}`);
console.log(`  Misc (5%):    ¥${caseA.miscCost.toLocaleString()}`);
console.log(`  Labor:        ¥${caseA.laborCost.toLocaleString()}`);
console.log(`  Transport:    ¥${caseA.transportCost.toLocaleString()}`);
console.log(`  Overhead:     ¥${caseA.overheadCost.toLocaleString()}`);
console.log(`  TOTAL:        ¥${caseA.total.toLocaleString()}\n`);

const caseA_target = 3_419_300;
const caseA_delta = (caseA.total - caseA_target) / caseA_target;
const caseA_percent = (caseA_delta * 100).toFixed(1);
const caseA_pass = Math.abs(caseA_delta) <= 0.15;

console.log(`Comparison:`);
console.log(`  Target:       ¥${caseA_target.toLocaleString()}`);
console.log(`  Estimated:    ¥${caseA.total.toLocaleString()}`);
console.log(`  Delta:        ${caseA_percent > 0 ? '+' : ''}${caseA_percent}%`);
console.log(`  Criterion:    ${caseA_pass ? '✓ PASS (±15%)' : '✗ FAIL — over ±15%'}\n`);

if (!caseA_pass) {
  console.log('❌ CASE A FAILED. Do not tune constants.');
  console.log('Rules to investigate:');
  console.log('  - AC cable pricing (TASK 100): table correct?');
  console.log('  - DC cable estimate: distPvToPcs_m assumption (TASK 101)?');
  console.log('  - Rack width (TASK 102): area calculation correct?');
  console.log('  - Labor/overhead rates: too high/low?\n');
}

// ============================================================================
// CASE B: 東部市民センター 207.58kW / High voltage / Roof
// ============================================================================
console.log('\nCASE B: 東部市民センター 207.58kW\n');
console.log('Known ground truth (ケイテック実見積):');
console.log('  Material:  ¥6,059,800');
console.log('  Misc:      ¥300,000');
console.log('  Labor:     ¥1,550,000');
console.log('  Transport: ¥153,200');
console.log('  Overhead:  ¥800,000');
console.log('  TOTAL:     ¥8,863,000');
console.log('  AC run ≈ 300m, rack selected: SR400\n');

const caseB = DenkiHack_calc({
  kw: 207.58,
  pcsKwTotal: 150,             // estimate: typical ratio for this size
  acVoltage: 440,
  stringCount: 10,             // rough estimate
  // TASK 101: Roof system → 25m average distance for DC
  distPvToPcs_m: 25,
  distPcsToGrid_m: 300,        // KNOWN from ケイテック notes
  routing: 'outdoor',
  supply: 'high',
  mountType: 'roof',
  dropLimitRatio: 0.0105,
});

console.log('DenkiHack estimated BOM (top lines):');
caseB.bom.slice(0, 10).forEach(item => {
  if (item.amount > 0) {
    console.log(`  ${item.cat.padEnd(10)} | ${item.name.padEnd(20)} | ${item.qty.toFixed(0).padEnd(6)} @ ¥${item.unitPrice.toLocaleString()} = ¥${item.amount.toLocaleString()}`);
  }
});

console.log(`\nDenkiHack cost summary:`);
console.log(`  Material:     ¥${caseB.materialCost.toLocaleString()}`);
console.log(`  Misc (5%):    ¥${caseB.miscCost.toLocaleString()}`);
console.log(`  Labor:        ¥${caseB.laborCost.toLocaleString()}`);
console.log(`  Transport:    ¥${caseB.transportCost.toLocaleString()}`);
console.log(`  Overhead:     ¥${caseB.overheadCost.toLocaleString()}`);
console.log(`  TOTAL:        ¥${caseB.total.toLocaleString()}\n`);

const caseB_target = 8_863_000;
const caseB_delta = (caseB.total - caseB_target) / caseB_target;
const caseB_percent = (caseB_delta * 100).toFixed(1);

console.log(`Comparison (INFORMATION ONLY — WL1-200 identity unknown):`);
console.log(`  Target:       ¥${caseB_target.toLocaleString()}`);
console.log(`  Estimated:    ¥${caseB.total.toLocaleString()}`);
console.log(`  Delta:        ${caseB_percent > 0 ? '+' : ''}${caseB_percent}%`);
console.log(`  Rack width required: 400 (from cable area = DC + AC)\n`);

// ============================================================================
// CASE C: Sanity check — low vs high voltage difference
// ============================================================================
console.log('\nCASE C: Sanity check (low vs high voltage)\n');

const caseC_low = DenkiHack_calc({
  kw: 77.6,
  pcsKwTotal: 50,
  acVoltage: 440,
  stringCount: 4,
  // TASK 101: Roof system → 25m average distance
  distPvToPcs_m: 25,
  distPcsToGrid_m: 135,
  routing: 'outdoor',
  supply: 'low',              // ← low voltage
  mountType: 'roof',
});

const caseC_high = DenkiHack_calc({
  kw: 77.6,
  pcsKwTotal: 50,
  acVoltage: 440,
  stringCount: 4,
  // TASK 101: Roof system → 25m average distance
  distPvToPcs_m: 25,
  distPcsToGrid_m: 135,
  routing: 'outdoor',
  supply: 'high',             // ← high voltage
  mountType: 'roof',
});

const diffAmount = caseC_high.total - caseC_low.total;
console.log(`Low voltage total:  ¥${caseC_low.total.toLocaleString()}`);
console.log(`High voltage total: ¥${caseC_high.total.toLocaleString()}`);
console.log(`Difference:         ¥${diffAmount.toLocaleString()}`);
console.log(`\nDifference should be exactly: 気中開閉器 (¥445,000) + 耐圧試験 (¥26,000) = ¥471,000`);
const expectedDiff = 445_000 + 26_000;
const diffMatch = Math.abs(diffAmount - expectedDiff) < 1000;
console.log(`Sanity check:       ${diffMatch ? '✓ PASS' : '✗ FAIL'} (difference ≈ ¥${expectedDiff.toLocaleString()})\n`);

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n=== SUMMARY ===');
console.log(`CASE A (福山市民病院):         ${caseA_pass ? '✓ PASS' : '✗ FAIL'} (delta ${caseA_percent}%)`);
console.log(`CASE B (東部市民センター):     INFO (delta ${caseB_percent}%, rack width 400 required)`);
console.log(`CASE C (Sanity check):         ${diffMatch ? '✓ PASS' : '✗ FAIL'} (low vs high voltage)\n`);
