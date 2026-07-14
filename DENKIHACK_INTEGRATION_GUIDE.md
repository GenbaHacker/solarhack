# DenkiHack Integration Guide (TASK 127)

## File: denkihack.html

When you add solar-material-selector-v4.html as denkihack.html, add the following TWO snippets:

### 1. LOAD-HOOK (at end of <script> before </body>)

Add this after all existing scripts load:

```javascript
// TASK 127-C: Load-hook from SolarHack handoff
(function() {
  const handoffJson = localStorage.getItem('SH2DH_HANDOFF');
  if (!handoffJson) return;

  try {
    const handoff = JSON.parse(handoffJson);
    
    // Check if handoff is fresh (<1h old)
    const age = Date.now() - (handoff.ts || 0);
    if (age > 60 * 60 * 1000) {
      localStorage.removeItem('SH2DH_HANDOFF');
      return;  // Stale
    }

    // Prefill project info
    const projNameEl = document.getElementById('proj-name');
    if (projNameEl) projNameEl.value = handoff.customer;

    const projKwEl = document.getElementById('proj-kw');
    if (projKwEl) projKwEl.value = handoff.dcKw;

    const gridVoltageEl = document.getElementById('grid-voltage');
    if (gridVoltageEl) gridVoltageEl.value = handoff.voltage === 'high' ? 'high' : 'low';

    // Apply panel (use existing apply function if available)
    const panelMakerEl = document.getElementById('panel-maker');
    const panelModelEl = document.getElementById('panel-model');
    if (panelMakerEl && handoff.panelMaker !== '—') {
      panelMakerEl.value = handoff.panelMaker;
      if (typeof C_buildPanelModels === 'function') C_buildPanelModels();
    }
    if (panelModelEl && handoff.panelModel !== '—') {
      panelModelEl.value = handoff.panelModel;
      if (typeof C_applyPanel === 'function') C_applyPanel();
    }

    // Apply PCS
    const pcsMakerEl = document.getElementById('pcs-maker');
    const pcsModelEl = document.getElementById('pcs-model');
    if (pcsMakerEl && handoff.pcsMaker !== '—') {
      pcsMakerEl.value = handoff.pcsMaker;
      if (typeof C_buildPcsModels === 'function') C_buildPcsModels();
    }
    if (pcsModelEl && handoff.pcsModel !== '—') {
      pcsModelEl.value = handoff.pcsModel;
      if (typeof C_applyPcs === 'function') C_applyPcs();
    }

    // Clean up
    localStorage.removeItem('SH2DH_HANDOFF');
  } catch (e) {
    console.error('DenkiHack load-hook error:', e);
  }
})();
```

### 2. WRITE-BACK BUTTON (in estimate section)

Add this button near the estimate total display:

```html
<button onclick="DH_writeBackToSolarHack()" 
        style="width:100%;padding:10px;margin-top:12px;background:#1e3a5f;border:1px solid #3a5a7f;color:#e8f0ff;border-radius:4px;cursor:pointer;font-weight:600">
  原価をSolarHackへ返す
</button>
```

Add this function in the <script> section:

```javascript
// TASK 127-C: Write-back to SolarHack
function DH_writeBackToSolarHack() {
  // Get total estimate cost (adjust selector based on your HTML structure)
  const totalEl = document.querySelector('[id*="total"]');  // Find total element
  if (!totalEl) {
    alert('見積合計が見つかりません');
    return;
  }

  const totalText = totalEl.textContent || totalEl.value || '';
  const total = parseInt(totalText.replace(/[^\d]/g, ''));

  if (!total || total === 0) {
    alert('見積合計が無効です');
    return;
  }

  const result = {
    ts: Date.now(),
    proj: document.getElementById('proj-name')?.value || '—',
    total: total
  };

  localStorage.setItem('DH2SH_RESULT', JSON.stringify(result));
  alert('SolarHackに原価を返しました。SolarHackのウィンドウで詳細見積を確認してください。');
  window.close();
}
```

---

## Integration Flow

1. SolarHack: User clicks 「🔧 DenkiHackで詳細設計を開く」
   → Stores SH2DH_HANDOFF in localStorage
   → Opens denkihack.html

2. DenkiHack: Load-hook runs
   → Reads SH2DH_HANDOFF
   → Prefills project fields (proj-name, proj-kw, grid-voltage, panel, PCS)
   → Removes SH2DH_HANDOFF from localStorage

3. DenkiHack: User builds estimate, then clicks 「原価をSolarHackへ返す」
   → Stores DH2SH_RESULT in localStorage (ts, proj, total)
   → Closes window

4. SolarHack: detail tab
   → V2_renderDetailResults checks DH2SH_RESULT
   → If fresh (<24h), shows as 実査原価B with badge
   → 簡易 fallback path remains intact (no DH2SH_RESULT → use .mjs calc)

---

## Notes

- Adjust `getElementById()` selectors to match v4's actual element IDs
- If v4 has different apply function names, update `C_buildPanelModels`, `C_applyPanel`, etc.
- The 1h / 24h age thresholds prevent stale data from being used
- Source naming (「簡易」/ 「DenkiHack実査」) is automatic in SolarHack

