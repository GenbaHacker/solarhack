// ============================================================================
// TASK 40: DenkiHack Validation — Real subcontractor quote comparison
// ============================================================================
// Two real electrical work quotes from ケイテック (2026-05-13 / 2026-05-21)
// DenkiHack_calc must land within ±15% of actual subcontractor totals
//
// A) 福山市民病院 77.6kW / 210V / 高圧 / 陸屋根
//    ケイテック実見積: ¥3,419,300 (材 ¥2,151,800 / 雑 ¥107,500 / 労務 ¥790,000 / 運搬 ¥76,000 / 諸経費 ¥294,000)
//    AC cable: CET60 × 135m
//
// B) 東部市民センター 207.58kW / 210V / 高圧 / 陸屋根
//    ケイテック実見積: ¥8,863,000 (材 ¥6,059,800 / 雑 ¥300,000 / 労務 ¥1,550,000 / 運搬 ¥153,200 / 諸経費 ¥800,000)
//    AC cable: WL1-200 200sq × 300m

import { DenkiHack_calc } from '../denkihack.mjs';

console.log('=== DenkiHack Validation — Real Subcontractor Quotes ===\n');

// ============================================================================
// Inline DENKI_MASTER for test
// ============================================================================
const DENKI_MASTER = {
  pv_cable_5_5:       188,
  mc4_connector:      390,
  iv_5_5:             210,
  iv_14:              520,
  iv_22:              800,
  iv_38:            1_800,
  iv_60:            2_170,
  cvt_60:           6_080,
  cet_60:           8_100,
  wl1_200:          9_600,
  pfd_28:             360,
  pfd_16:             180,
  flex_30:            390,
  flex_50:            500,
  flex_80:            800,
  fp65_buried:        615,
  excavation_h1000: 3_000,
  handhole_600:   220_000,
  handhole_install:200_000,
  air_switch_7_2kv:445_000,
  rack_400_2m:     14_300,
  rack_400_cover:   6_200,
  rack_400_corner:  2_800,
  rack_400_stop:   14_500,
  rack_400_support: 1_200,
  rack_200_2m:      7_500,
  rack_200_cover:   4_600,
  rack_200_corner:  2_100,
  rack_200_stop:    8_500,
  rack_200_support:   900,
  junction_box:    77_000,
  panel_board_hv:  74_000,
  pile_mount:      11_000,
  survey_marking:     600,
  miscRate:          0.05,
  overheadRate:      0.13,
  laborRateSmall:    0.36,
  laborRateLarge:    0.26,
  transportRateSmall:0.09,
  transportRateLarge:0.025,
};

// ============================================================================
// Project A: 福山市民病院 77.6kW
// ============================================================================
console.log('PROJECT A: 福山市民病院 77.6kW / 210V / 高圧 / 陸屋根\n');

const projA = DenkiHack_calc({
  kw: 77.6,
  voltage: 210,
  stringCount: 4,  // assume typical 4 strings
  distPvToPcs_m: 50,
  distPcsToGrid_m: 135,  // inferred from AC cable: CET60 × 135m
  routing: 'outdoor',
  supply: 'high',
  mountType: 'roof',
});

const projA_actual = 3_419_300;
const projA_delta = (projA.total - projA_actual) / projA_actual;
const projA_deltaPercent = (projA_delta * 100).toFixed(1);
const projA_acCable = projA.acCableName + projA.acCableSize;
const projA_criterion = Math.abs(projA_delta) <= 0.15 ? '✓ PASS' : '✗ FAIL';

console.log(`DenkiHack output:`);
console.log(`  AC cable size: ${projA_acCable} (expected: CET60)`);
console.log(`  材料費:    ¥${projA.materialCost.toLocaleString()}`);
console.log(`  雑材:      ¥${projA.miscCost.toLocaleString()}`);
console.log(`  労務費:    ¥${projA.laborCost.toLocaleString()}`);
console.log(`  運搬費:    ¥${projA.transportCost.toLocaleString()}`);
console.log(`  諸経費:    ¥${projA.overheadCost.toLocaleString()}`);
console.log(`  合計:      ¥${projA.total.toLocaleString()}\n`);

console.log(`ケイテック実見積:`);
console.log(`  材料費:    ¥2,151,800`);
console.log(`  雑材:      ¥107,500`);
console.log(`  労務費:    ¥790,000`);
console.log(`  運搬費:    ¥76,000`);
console.log(`  諸経費:    ¥294,000`);
console.log(`  合計:      ¥${projA_actual.toLocaleString()}\n`);

console.log(`DenkiHack:     ¥${projA.total.toLocaleString()}`);
console.log(`実見積:        ¥${projA_actual.toLocaleString()}`);
console.log(`Delta:         ${projA_deltaPercent > 0 ? '+' : ''}${projA_deltaPercent}%`);
console.log(`Criterion(±15%): ${projA_criterion}\n`);

const testA_pass = Math.abs(projA_delta) <= 0.15;

// ============================================================================
// Project B: 東部市民センター 207.58kW
// ============================================================================
console.log('PROJECT B: 東部市民センター 207.58kW / 210V / 高圧 / 陸屋根\n');

const projB = DenkiHack_calc({
  kw: 207.58,
  voltage: 210,
  stringCount: 5,  // assume typical 5 strings
  distPvToPcs_m: 60,
  distPcsToGrid_m: 300,  // inferred from AC cable: WL1-200 × 300m
  routing: 'outdoor',
  supply: 'high',
  mountType: 'roof',
});

const projB_actual = 8_863_000;
const projB_delta = (projB.total - projB_actual) / projB_actual;
const projB_deltaPercent = (projB_delta * 100).toFixed(1);
const projB_acCable = projB.acCableName + projB.acCableSize;
const projB_criterion = Math.abs(projB_delta) <= 0.15 ? '✓ PASS' : '✗ FAIL';

console.log(`DenkiHack output:`);
console.log(`  AC cable size: ${projB_acCable} (expected: WL1-200)`);
console.log(`  材料費:    ¥${projB.materialCost.toLocaleString()}`);
console.log(`  雑材:      ¥${projB.miscCost.toLocaleString()}`);
console.log(`  労務費:    ¥${projB.laborCost.toLocaleString()}`);
console.log(`  運搬費:    ¥${projB.transportCost.toLocaleString()}`);
console.log(`  諸経費:    ¥${projB.overheadCost.toLocaleString()}`);
console.log(`  合計:      ¥${projB.total.toLocaleString()}\n`);

console.log(`ケイテック実見積:`);
console.log(`  材料費:    ¥6,059,800`);
console.log(`  雑材:      ¥300,000`);
console.log(`  労務費:    ¥1,550,000`);
console.log(`  運搬費:    ¥153,200`);
console.log(`  諸経費:    ¥800,000`);
console.log(`  合計:      ¥${projB_actual.toLocaleString()}\n`);

console.log(`DenkiHack:     ¥${projB.total.toLocaleString()}`);
console.log(`実見積:        ¥${projB_actual.toLocaleString()}`);
console.log(`Delta:         ${projB_deltaPercent > 0 ? '+' : ''}${projB_deltaPercent}%`);
console.log(`Criterion(±15%): ${projB_criterion}\n`);

const testB_pass = Math.abs(projB_delta) <= 0.15;

// ============================================================================
// Summary
// ============================================================================
const allPass = testA_pass && testB_pass ? '✓ BOTH PASS' : '✗ AT LEAST ONE FAIL';
console.log(`\n${allPass}\n`);

if (!testA_pass) {
  console.log(`✗ PROJECT A FAIL: AC cable size mismatch or cost outside ±15%\n`);
}

if (!testB_pass) {
  console.log(`✗ PROJECT B FAIL: AC cable size mismatch or cost outside ±15%\n`);
}

// ============================================================================
// Debug: AC cable size verification (engineering rule)
// ============================================================================
console.log('=== AC Cable Size Engineering Verification ===\n');

function calcAcCableSize(kwTotal, voltage, distMeters) {
  const I = (kwTotal * 1000) / (Math.sqrt(3) * voltage);
  const e_max = 0.02 * voltage;
  const A_min = (30.8 * distMeters * I) / (1000 * e_max);
  const sizes = [5.5, 8, 14, 22, 38, 60, 100, 150, 200, 250, 325];
  const selected = sizes.find(a => a >= A_min);
  return {
    I_A: I.toFixed(1),
    A_min_sq: A_min.toFixed(1),
    A_selected_sq: selected,
    volt_drop_percent: ((30.8 * distMeters * I) / (1000 * selected) / voltage * 100).toFixed(2),
  };
}

const calcA = calcAcCableSize(77.6, 210, 135);
console.log(`Project A: 77.6kW / 210V / 135m`);
console.log(`  Current: ${calcA.I_A}A`);
console.log(`  Minimum area: ${calcA.A_min_sq}sq`);
console.log(`  Selected: ${calcA.A_selected_sq}sq (expected: 60sq)`);
console.log(`  Voltage drop: ${calcA.volt_drop_percent}% (limit: 2%)\n`);

const calcB = calcAcCableSize(207.58, 210, 300);
console.log(`Project B: 207.58kW / 210V / 300m`);
console.log(`  Current: ${calcB.I_A}A`);
console.log(`  Minimum area: ${calcB.A_min_sq}sq`);
console.log(`  Selected: ${calcB.A_selected_sq}sq (expected: 200sq)`);
console.log(`  Voltage drop: ${calcB.volt_drop_percent}% (limit: 2%)\n`);
