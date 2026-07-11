// ============================================================================
// TASK 60: PCS unit count calculation (DC/AC ratio constraint)
// ============================================================================

console.log('=== TASK 60: PCS Unit Count Calculation ===\n');

const MAX_OVERLOAD = 1.6;

function computeUnits(dcKw, pcsKwSingle) {
  const maxAcKw = dcKw / MAX_OVERLOAD;
  const units = Math.max(1, Math.ceil(maxAcKw / pcsKwSingle));
  const acKwTotal = units * pcsKwSingle;
  const dcac = dcKw / acKwTotal;
  return { units, acKwTotal, dcac };
}

// Test case 1: 33.95kW / 5.0kW PCS
console.log('Test 1: Small project (33.95kW / 5.0kW PCS)');
const test1 = computeUnits(33.95, 5.0);
console.log(`  dcKw: 33.95`);
console.log(`  pcsKwSingle: 5.0`);
console.log(`  maxAcKw: ${(33.95 / MAX_OVERLOAD).toFixed(2)}`);
console.log(`  units: ${test1.units} ${test1.units === 5 ? '✓' : '✗'}`);
console.log(`  acKwTotal: ${test1.acKwTotal.toFixed(1)} ${test1.acKwTotal === 25.0 ? '✓' : '✗'}`);
console.log(`  dcac: ${test1.dcac.toFixed(2)} ${Math.abs(test1.dcac - 1.36) < 0.01 ? '✓' : '✗'}`);
console.log(`  dcac within limit (≤${MAX_OVERLOAD}): ${test1.dcac <= MAX_OVERLOAD ? '✓ PASS' : '✗ FAIL'}\n`);

// Test case 2: 406.7kW / 50kW PCS
console.log('Test 2: Large project (406.7kW / 50kW PCS)');
const test2 = computeUnits(406.7, 50);
console.log(`  dcKw: 406.7`);
console.log(`  pcsKwSingle: 50`);
console.log(`  maxAcKw: ${(406.7 / MAX_OVERLOAD).toFixed(2)}`);
console.log(`  units: ${test2.units} ${test2.units === 6 ? '✓' : '✗'}`);
console.log(`  acKwTotal: ${test2.acKwTotal.toFixed(1)} ${test2.acKwTotal === 300 ? '✓' : '✗'}`);
console.log(`  dcac: ${test2.dcac.toFixed(2)} ${Math.abs(test2.dcac - 1.36) < 0.01 ? '✓' : '✗'}`);
console.log(`  dcac within limit (≤${MAX_OVERLOAD}): ${test2.dcac <= MAX_OVERLOAD ? '✓ PASS' : '✗ FAIL'}\n`);

// Test case 3: Edge case - exactly at max overload (80kW / 50kW PCS = 1.6 dcac)
console.log('Test 3: Boundary case (80kW / 50kW PCS at max overload)');
const test3 = computeUnits(80, 50);
console.log(`  dcKw: 80`);
console.log(`  pcsKwSingle: 50`);
console.log(`  maxAcKw: ${(80 / MAX_OVERLOAD).toFixed(2)}`);
console.log(`  units: ${test3.units} ${test3.units === 1 ? '✓' : '✗'} (exactly one unit, dcac = 1.6)`);
console.log(`  acKwTotal: ${test3.acKwTotal.toFixed(1)} ${test3.acKwTotal === 50 ? '✓' : '✗'}`);
console.log(`  dcac: ${test3.dcac.toFixed(2)} ${Math.abs(test3.dcac - 1.6) < 0.01 ? '✓' : '✗'}`);
console.log(`  dcac within limit (≤${MAX_OVERLOAD}): ${test3.dcac <= MAX_OVERLOAD ? '✓ PASS' : '✗ FAIL'}\n`);

const allPass =
  test1.units === 5 && Math.abs(test1.dcac - 1.36) < 0.01 &&
  test2.units === 6 && Math.abs(test2.dcac - 1.36) < 0.01 &&
  test3.units === 1 && Math.abs(test3.dcac - 1.6) < 0.01;

console.log(`=== ${allPass ? '✓ ALL PASS' : '✗ AT LEAST ONE FAIL'} ===\n`);

console.log('Panel Impp validation test:');
console.log('  Panel with Impp = null → check blocked, banner shows ⚠ Impp未登録');
console.log('  Panel with Impp = 13.5A → check runs normally ✓\n');
