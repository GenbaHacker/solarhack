// SolarHack v2 Backtest — Real Cost Estimation vs. Actual Ledger
// Builds estimated cost from COST_MASTER + PANEL_MASTER + PCS_MASTER
// Compares to actual invoiced costs and reports delta

console.log('=== SolarHack Backtest: Cost Estimation Accuracy ===\n');

// ============================================================================
// COST_MASTER (simplified, from solarhack-v2.html)
// ============================================================================
const COST_MASTER = {
  panel_install: 6500,
  pv_cable_50m: 13750,
  ac_cable_50m: 22000,
  conduit_20m: 13750,
  junction_box: 13750,
  earth_d: 8250,
  pcs_install_low: 10000,
  pcs_install_high: 80000,
  panel_board_ind: 30800,
  rpr_ovgr_low: 26400,
  rpr_high: 77000,
  grid_connect_low: 33000,
  grid_connect_high: 77000,
  pre_inspection_low: 330000,
  pre_inspection_high: 616000,
  single_line_low: 33000,
  single_line_high: 77000,
  scaffold: 330000,
  waste_disposal: 8250,
  contingency_rate: 0.07,
  smart_logger_3000a: 78000,
  iso_trans_50kva: 525000,
  monitor_laplas: 700000,
  warranty_per_kw: 5000,
  mount_ground_screw: 12810,
  mount_flatroof_tilt: 36145,
  elec_work_per_kw: 75300,
};

// ============================================================================
// PANEL_MASTER (choshu only, simplified)
// ============================================================================
const PANEL_MASTER = {
  choshu: [
    {model: 'CS-415K54H', wp: 415, cost: 7678},
  ],
};

// ============================================================================
// PCS_MASTER (relevant models only)
// ============================================================================
const PCS_MASTER = {
  huawei: {
    'SUN2000-4.95KTL-JPL1': {kw: 4.95, cost: 98000},
    'SUN2000-20KTL-M3': {kw: 20, cost: 345000},
    'SUN2000-50KTL-JPM0': {kw: 50, cost: 395000},
  },
};

// ============================================================================
// PROJECT A: 林浄水場 406.7kW (野立て)
// ============================================================================
console.log('PROJECT A: 林浄水場 406.7kW (野立て)\n');

const projA = {
  name: '林浄水場',
  dcKw: 406.7,
  isHigh: true,
  roofType: 'ground',  // 野立て

  // Equipment
  panels: 980,
  panelModel: 'CS-415K54H',
  panelCostEach: 7678,
  pcsUnits: [395000, 395000, 395000, 395000, 395000, 395000, 395000, 98000],  // 7×50kW + 1×4.95kW
  smartLogger: 1,
  isoTrans: 7,
  mountType: 'ground',

  // Actual cost from 工事総括表
  actualCost: 79_427_062,
  actualBreakdown: {
    externalWork: 42_580_779,
    materials: 36_846_283,
  },
};

// Estimate from masters
projA.panelCost = projA.panels * projA.panelCostEach;
projA.pcsCost = projA.pcsUnits.reduce((s, c) => s + c, 0);
projA.smartLoggerCost = projA.smartLogger * COST_MASTER.smart_logger_3000a;
projA.isoTransCost = projA.isoTrans * COST_MASTER.iso_trans_50kva;
projA.mountCost = projA.dcKw * COST_MASTER.mount_ground_screw;

// Labor (rough)
const panelInstall = projA.panels * COST_MASTER.panel_install;
const elecWork = COST_MASTER.pv_cable_50m + COST_MASTER.ac_cable_50m + COST_MASTER.conduit_20m + COST_MASTER.junction_box + COST_MASTER.earth_d;
const pcsWork = projA.dcKw * COST_MASTER.pcs_install_high;
const protWork = COST_MASTER.rpr_high;
const appWork = COST_MASTER.grid_connect_high + COST_MASTER.pre_inspection_high + COST_MASTER.single_line_high;
const otherWork = COST_MASTER.scaffold + COST_MASTER.waste_disposal;
const warranty = projA.dcKw * COST_MASTER.warranty_per_kw;

projA.estimatedLabor = panelInstall + elecWork + pcsWork + protWork + appWork + otherWork + warranty;
projA.estimatedTotal = projA.panelCost + projA.pcsCost + projA.smartLoggerCost + projA.isoTransCost + projA.mountCost + projA.estimatedLabor;
projA.delta = (projA.estimatedTotal - projA.actualCost) / projA.actualCost;
projA.deltaPercent = (projA.delta * 100).toFixed(1);

console.log(`Estimated cost breakdown:`);
console.log(`  Panels (980×¥7,678): ¥${projA.panelCost.toLocaleString()}`);
console.log(`  PCS (7×¥395k + 1×¥98k): ¥${projA.pcsCost.toLocaleString()}`);
console.log(`  SmartLogger (1×¥78k): ¥${projA.smartLoggerCost.toLocaleString()}`);
console.log(`  Iso Trans (7×¥525k): ¥${projA.isoTransCost.toLocaleString()}`);
console.log(`  Mount (406.7kW×¥12,810): ¥${projA.mountCost.toLocaleString()}`);
console.log(`  Labor (panel install + elec + PCS + warrant): ¥${projA.estimatedLabor.toLocaleString()}`);
console.log(`  TOTAL ESTIMATED: ¥${projA.estimatedTotal.toLocaleString()}\n`);

console.log(`Actual cost        : ¥${projA.actualCost.toLocaleString()}`);
console.log(`Estimated cost     : ¥${projA.estimatedTotal.toLocaleString()}`);
console.log(`Delta              : ${projA.deltaPercent > 0 ? '+' : ''}${projA.deltaPercent}%`);
console.log(`Criterion (±10%)   : ${Math.abs(projA.delta) <= 0.10 ? '✓ PASS' : '✗ FAIL'}\n`);

// ============================================================================
// PROJECT B: 本庁舎 26.56kW (陸屋根)
// ============================================================================
console.log('PROJECT B: 本庁舎 26.56kW (陸屋根)\n');

const projB = {
  name: '本庁舎',
  dcKw: 26.56,
  isHigh: false,
  roofType: 'flatroof',  // 陸屋根傾斜

  // Equipment
  panels: 64,
  panelModel: 'CS-415K54H',
  panelCostEach: 7678,
  pcsUnits: [345000, 98000],  // 1×20kW + 1×4.95kW
  smartLogger: 1,
  isoTrans: 1,
  mountType: 'flatroof',

  // Actual cost from 工事総括表
  actualCost: 15_654_276,
  actualBreakdown: {
    externalWork: 7_392_600,
    materials: 8_261_676,
  },
};

// Estimate from masters
projB.panelCost = projB.panels * projB.panelCostEach;
projB.pcsCost = projB.pcsUnits.reduce((s, c) => s + c, 0);
projB.smartLoggerCost = projB.smartLogger * COST_MASTER.smart_logger_3000a;
projB.isoTransCost = projB.isoTrans * COST_MASTER.iso_trans_50kva;
projB.mountCost = projB.dcKw * COST_MASTER.mount_flatroof_tilt;

// Labor (rough)
const panelInstallB = projB.panels * COST_MASTER.panel_install;
const pcsWorkB = projB.dcKw * COST_MASTER.pcs_install_low;
const protWorkB = COST_MASTER.panel_board_ind + COST_MASTER.rpr_ovgr_low;
const appWorkB = COST_MASTER.grid_connect_low + COST_MASTER.pre_inspection_low + COST_MASTER.single_line_low;
const warrantyB = projB.dcKw * COST_MASTER.warranty_per_kw;

projB.estimatedLabor = panelInstallB + elecWork + pcsWorkB + protWorkB + appWorkB + otherWork + warrantyB;
projB.estimatedTotal = projB.panelCost + projB.pcsCost + projB.smartLoggerCost + projB.isoTransCost + projB.mountCost + projB.estimatedLabor;
projB.delta = (projB.estimatedTotal - projB.actualCost) / projB.actualCost;
projB.deltaPercent = (projB.delta * 100).toFixed(1);

console.log(`Estimated cost breakdown:`);
console.log(`  Panels (64×¥7,678): ¥${projB.panelCost.toLocaleString()}`);
console.log(`  PCS (1×¥345k + 1×¥98k): ¥${projB.pcsCost.toLocaleString()}`);
console.log(`  SmartLogger (1×¥78k): ¥${projB.smartLoggerCost.toLocaleString()}`);
console.log(`  Iso Trans (1×¥525k): ¥${projB.isoTransCost.toLocaleString()}`);
console.log(`  Mount (26.56kW×¥36,145): ¥${projB.mountCost.toLocaleString()}`);
console.log(`  Labor (panel install + elec + PCS + warrant): ¥${projB.estimatedLabor.toLocaleString()}`);
console.log(`  TOTAL ESTIMATED: ¥${projB.estimatedTotal.toLocaleString()}\n`);

console.log(`Actual cost        : ¥${projB.actualCost.toLocaleString()}`);
console.log(`Estimated cost     : ¥${projB.estimatedTotal.toLocaleString()}`);
console.log(`Delta              : ${projB.deltaPercent > 0 ? '+' : ''}${projB.deltaPercent}%`);
console.log(`Criterion (±10%)   : ${Math.abs(projB.delta) <= 0.10 ? '✓ PASS' : '✗ FAIL'}\n`);

// ============================================================================
// Summary
// ============================================================================
const passFail = (Math.abs(projA.delta) <= 0.10 && Math.abs(projB.delta) <= 0.10) ? '✓ BOTH PASS' : '✗ AT LEAST ONE FAIL';
console.log(`\n${passFail}\n`);

if (Math.abs(projA.delta) > 0.10) {
  console.log('PROJECT A COST ESTIMATION FAILURE');
  console.log('Missing from COST_MASTER:');
  console.log('  - 防草シート (材料 ¥1,870,000 + 施工 ¥6,975,200)');
  console.log('  - 三親電材 部材 (≈¥12,000,000)');
  console.log('  - 他電材: 配管・電線・固定金具');
  console.log('  - 送料 ¥530,000');
  console.log('  - ハンドホール据付 / 建柱 / 架空配線 / PCS基礎');
  console.log('  - elec_work_per_kw (¥75,300) does NOT cover ¥42,580,779 external work\n');
}

if (Math.abs(projB.delta) > 0.10) {
  console.log('PROJECT B COST ESTIMATION FAILURE');
  console.log('Missing from COST_MASTER:');
  console.log('  - Similar gaps as Project A, scaled for smaller size\n');
}
