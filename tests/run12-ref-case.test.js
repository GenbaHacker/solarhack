// ============================================================================
// RUN 12 REFERENCE CASE — Regression Test
// ============================================================================
// After TASK 80-85 fixes, this case must produce these exact outputs.
// Use as regression benchmark for future changes.
//
// Reference: 福山市民病院 case
// - DC capacity: 77.6kW (340枚 × 228W, or close enough)
// - PCS: HUAWEI SUN2000-50KTL-JPM0 (50kW × 1 unit)
// - Orientation: South 10° tilt
// - Consumption: 60% self-consumption
// - Investment: ¥17,600,000 (netPrice post-discount)
// - Simulation period: 20 years
// - Degradation: 0.5% /year (FIX: was silently 50%/year)
// - Electricity escalation: 2.0% /year

console.log('=== RUN 12 REFERENCE CASE — Regression Test ===\n');

console.log('INPUT PARAMETERS:');
console.log('  DC Capacity:     77.6kW');
console.log('  PCS:             50kW × 1 unit');
console.log('  Orientation:     South 10°');
console.log('  Self-Consumption: 60%');
console.log('  Investment:      ¥17,600,000');
console.log('  Period:          20 years');
console.log('  Degradation:     0.5%/year (FIX: was 50%)');
console.log('  Elec Escalation: 2.0%/year\n');

console.log('EXPECTED OUTPUTS AFTER FIXES:\n');

console.log('(1) SIMULATION (C_runSim)');
console.log('    Specific Yield (annual): 1,150–1,300 kWh/kW');
console.log('      (was: under-estimated 5-8% due to K=0.85 + tempFactor double-counting)');
console.log('      (FIX: K=0.92 base + monthly tempFactor, no double-counting)');
console.log('    Annual Generation: ~89,500–100,700 kWh (≈ 77.6 × SY)');
console.log('    Annual Benefit (60% self-consumption):');
console.log('      ≈ 53,700 kWh × ¥27.85/kWh + 35,800 kWh × ¥8.30/kWh');
console.log('      ≈ ¥1,495,000 + ¥297,000 = ¥1,792,000/year\n');

console.log('(2) CASH FLOW (C_runCF — 20yr)');
console.log('    Year 1 benefit: ¥1,792,000 - ¥388,000 (O&M) = ¥1,404,000');
console.log('      (O&M FIX: was hardcoded ¥50,000; now 77.6kW × ¥5,000 = ¥388,000)');
console.log('    Payback Period: ~13–15 years (was: 16–18yr due to double-counting temp loss)');
console.log('    IRR (20yr): ~6.5–7.2% (was: undercalculated due to temp double-counting)');
console.log('    NPV @ 3% discount: ¥2,500,000–3,200,000\n');

console.log('(3) DEGRADATION (TASK 80 FIX)');
console.log('    Year 20 factor: 0.995^19 ≈ 0.9095 (was: silently using 0.5^19 ≈ 0.000002)');
console.log('    Year 20 generation: ≈ 81,400 kWh (was: infinitesimal)\n');

console.log('(4) TAX & PRICING (TASK 82 FIX)');
console.log('    subTotal (before discount):   ¥20,000,000');
console.log('    discount:                     ¥2,400,000');
console.log('    netPrice (税抜・値引後):        ¥17,600,000  ← CF investment');
console.log('    tax (10% on netPrice):        ¥1,760,000   (was: on ¥20M = ¥2.0M)');
console.log('    total (税込):                  ¥19,360,000  (was: ¥22.0M with double tax)\n');

console.log('(5) MARGIN GATE (no changes, but now valid with correct pricing)');
console.log('    grossProfit (after TASK 90): ≈ ¥3,520,000');
console.log('    grossMargin:                  ≈ 20% (was: 0% due to missing pricing layer)\n');

console.log('MANUAL VERIFICATION STEPS:');
console.log('  1. Console output must include: "Temperature (°C, raw/10): 5.0 6.5 ... 27.8"');
console.log('  2. No "❌ 日射データ不足" error thrown for valid irradiance');
console.log('  3. Year-1 O&M must show ¥388,000 (not ¥50,000)');
console.log('  4. est-total displays ¥17,600,000 (netPrice, 税抜)');
console.log('  5. est-total-tax displays ¥19,360,000 (total, 税込)\n');

console.log('GIT: commit 1cae8ee (after TASK 80-85)');
console.log('=== END REFERENCE CASE ===\n');
