// ============================================================================
// ACCEPTANCE TESTS — SolarHack Run 11 (Structural Merge)
// ============================================================================
// These are manual browser console tests. Run in order.
// Copy each block into the browser console and verify the output.

console.log('=== ACCEPTANCE TESTS — Run 11 ===\n');

// ============================================================================
// TEST (a): On load, before any estimate
// ============================================================================
console.log('TEST (a): On load state\n');

const printBtnOnLoad = document.getElementById('print-button')?.disabled;
const secEstimateDisplay = getComputedStyle(document.getElementById('sec-estimate')).display;

console.log(`  print-button.disabled: ${printBtnOnLoad} (expect true)`);
console.log(`  sec-estimate display: "${secEstimateDisplay}" (expect NOT "none")`);
console.log(`  Result: ${printBtnOnLoad === true && secEstimateDisplay !== 'none' ? '✓ PASS' : '✗ FAIL'}\n`);

// ============================================================================
// TEST (b): After selection and estimate
// ============================================================================
console.log('TEST (b): After selecting panels and PCS\n');
console.log('MANUAL: Select 長州 CS-415K54H × 980枚 / HUAWEI SUN2000-50KTL-JPM0');
console.log('Then run this code:\n');

console.log(`
const testB = () => {
  const pcsUnits = V2_SPEC.pcsUnits;
  const costTotalText = document.getElementById('est-cost-total')?.textContent || '—';
  const marginText = document.getElementById('est-gross-margin')?.textContent || '—';
  const marginHeight = document.getElementById('est-gross-margin')?.getBoundingClientRect().height || 0;
  const unitsDisplay = document.getElementById('est-pcs-units-display')?.textContent || '—';

  console.log('  V2_SPEC.pcsUnits:', pcsUnits, '(should be >= 5, actual should be 6)');
  console.log('  est-cost-total:', costTotalText, '(should be numeric, NOT "—")');
  console.log('  est-gross-margin:', marginText, '(should be numeric %, NOT "—")');
  console.log('  est-gross-margin height:', marginHeight, '(should be > 0)');
  console.log('  est-pcs-units-display:', unitsDisplay, '(should show unit count like "6台")');

  const pass = pcsUnits >= 5 &&
               costTotalText !== '—' && !costTotalText.includes('NaN') &&
               marginText !== '—' && marginText.includes('%') &&
               marginHeight > 0;
  console.log('  Result:', pass ? '✓ PASS' : '✗ FAIL');
};

testB();
`);

// ============================================================================
// TEST (c): Loss-making margin gate
// ============================================================================
console.log('\nTEST (c): Loss-making margin (negative margin gate)\n');
console.log('MANUAL: In est-discount field, enter a large discount to make margin negative');
console.log('Then run this code:\n');

console.log(`
const testC = () => {
  const bannerText = document.getElementById('est-margin-banner')?.textContent || '';
  const bannerHeight = document.getElementById('est-margin-banner')?.getBoundingClientRect().height || 0;
  const printDisabled = document.getElementById('print-button')?.disabled;

  console.log('  est-margin-banner text:', bannerText.slice(0,30) + '...');
  console.log('  est-margin-banner height:', bannerHeight, '(should be > 0)');
  console.log('  print-button.disabled:', printDisabled, '(should be true)');

  const pass = bannerText.includes('赤字') && bannerHeight > 0 && printDisabled === true;
  console.log('  Result:', pass ? '✓ PASS' : '✗ FAIL');
};

testC();
`);

// ============================================================================
// TEST (d): Fresh browser (localStorage cleared)
// ============================================================================
console.log('\nTEST (d): Fresh browser safety (localStorage cleared)\n');
console.log('MANUAL: Open DevTools → Storage → Clear all localStorage');
console.log('Reload the page (F5)');
console.log('Select same panels 長州 CS-415K54H × 980枚');
console.log('Then run this code:\n');

console.log(`
const testD = () => {
  const costTotalText = document.getElementById('est-cost-total')?.textContent || '—';
  const hasNaN = costTotalText.includes('NaN');

  console.log('  est-cost-total:', costTotalText);
  console.log('  Contains NaN:', hasNaN, '(should be FALSE)');

  const pass = !hasNaN && costTotalText !== '—';
  console.log('  Result:', pass ? '✓ PASS' : '✗ FAIL (time bomb: COST_MASTER keys are undefined)');
};

testD();
`);

console.log('\n=== RUN TESTS IN ORDER (a) → (b) → (c) → (d) ===\n');
