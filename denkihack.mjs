// ============================================================================
// DenkiHack — Deterministic electrical work cost calculator
// Input: kW, voltage, geometry → Output: BOM + cost (no subcontractor needed)
// ============================================================================

// DENKI_MASTER — real unit prices from actual subcontractor quotes
const DENKI_MASTER = {
  // 低圧/高圧 DC配線
  pv_cable_5_5:       188,    // ¥/m
  mc4_connector:      390,    // ¥/組

  // 絶縁電線（低圧AC）
  iv_5_5:             210,    // ¥/m
  iv_14:              520,    // ¥/m
  iv_22:              800,    // ¥/m
  iv_38:            1_800,    // ¥/m
  iv_60:            2_170,    // ¥/m

  // AC幹線（キャブタイヤケーブル）
  cvt_60:           6_080,    // ¥/m 低圧AC幹線
  cet_60:           8_100,    // ¥/m ケーブルラック用（ケイテック）

  // TASK 100: AC cable price table (per-size, not binary)
  // anchors: 60sq=¥6,080 (大成 CVT60), 100sq=¥9,200 (古河 CV100-3C)
  // >100sq are interpolations — mark 要実績検証 in spec
  ac_cable_price: {
    14: 980, 22: 1_300, 38: 1_800, 60: 6_080,
    100: 9_200, 150: 12_600, 200: 17_000, 250: 21_000, 325: 27_000
  },
  // wl1_200: 9_600,  // ← 正体未確認・使用禁止 (不合理な値: 60sq=8,100より高いのに容量は少ない)

  // 保護装置
  pfd_28:             360,    // ¥/個
  pfd_16:             180,    // ¥/個

  // 配管・ダクト
  flex_30:            390,    // ¥/m
  flex_50:            500,    // ¥/m
  flex_80:            800,    // ¥/m
  fp65_buried:        615,    // ¥/m 埋設用FEP管

  // 土木・工事
  excavation_h1000: 3_000,    // ¥/m 掘削・埋戻し
  handhole_600:   220_000,    // ¥/台 ハンドホール本体
  handhole_install:200_000,   // ¥/台 設置工事
  air_switch_7_2kv:445_000,   // ¥/台 気中開閉器（高圧）

  // ラック（屋根設置用）
  rack_400_2m:     14_300,    // ¥/本 幅400mm (1本=2m)
  rack_400_cover:   6_200,    // ¥/枚 カバー (1枚=1m)
  rack_400_corner:  2_800,    // ¥/個 継ぎ金具
  rack_400_stop:   14_500,    // ¥/個 振れ止め
  rack_400_support: 1_200,    // ¥/個 支持金具

  rack_200_2m:      7_500,    // ¥/本 幅200mm
  rack_200_cover:   4_600,    // ¥/枚
  rack_200_corner:  2_100,    // ¥/個
  rack_200_stop:    8_500,    // ¥/個
  rack_200_support:   900,    // ¥/個

  // 機器・部材
  junction_box:    77_000,    // ¥/面 直流配線中継盤
  panel_board_hv:  74_000,    // ¥/盤 高圧用パネルボード
  pile_mount:      11_000,    // ¥/kW 杭・架台・パネル設置（大成）
  survey_marking:     600,    // ¥/kW 測量・マーキング

  // レート（材料に対する割合）
  miscRate:          0.05,    // 雑材 = 材料 × 5%
  overheadRate:      0.13,    // 諸経費 = (材料+雑材) × 13%
  laborRateSmall:    0.36,    // 労務 = 材料 × 0.36 (<100kW)
  laborRateLarge:    0.26,    // 労務 = 材料 × 0.26 (≥100kW)
  transportRateSmall:0.09,    // 運搬 = 材料 × 0.09 (small)
  transportRateLarge:0.025,   // 運搬 = 材料 × 0.025 (large)
};

// ============================================================================
// Engineering rules — deterministic cable sizing and quantity calculations
// ============================================================================

// CORRECTED: Japanese electrical practice
// Step 1: Size on 許容電流 (ampacity) to find minimum
// Step 2: Verify 電圧降下 (voltage drop) is within limit; if not, go up sizes until OK
function calcAcCableSize(pcsTotalKw, distMeters, acVoltage = 440, dropLimitRatio = 0.01) {
  // Current from PCS output (only PCS flows on AC side, not full PV capacity)
  const I = (pcsTotalKw * 1000) / (Math.sqrt(3) * acVoltage);

  // Ampacity limit (600V CV, 気中, 3-core, from JIS)
  // 14→88A, 22→115A, 38→162A, 60→217A, 100→298A, 150→395A, 200→469A, 250→556A, 325→657A
  const ampacityTable = {
    14: 88, 22: 115, 38: 162, 60: 217, 100: 298, 150: 395, 200: 469, 250: 556, 325: 657
  };
  const sizes = [14, 22, 38, 60, 100, 150, 200, 250, 325];

  // STEP 1: Find minimum size from ampacity
  const minAmpacity = Object.entries(ampacityTable)
    .find(([_, amps]) => amps >= I)?.[0] || 325;

  // STEP 2: Verify voltage drop, and go up if needed until acceptable
  let selected = parseFloat(minAmpacity);
  const dropLimit = dropLimitRatio * acVoltage;
  const voltageDrop = (e) => (30.8 * distMeters * I) / (1000 * e);

  let currentIndex = sizes.indexOf(selected);
  while (voltageDrop(selected) > dropLimit && currentIndex < sizes.length - 1) {
    currentIndex++;
    selected = sizes[currentIndex];
  }

  return {
    current_A: I.toFixed(1),
    ampacity_A: ampacityTable[selected] || 0,
    A_min_from_ampacity: parseFloat(minAmpacity),
    volt_drop_percent: voltageDrop(selected).toFixed(2),
    areaSelected_sq: selected,
  };
}

function calcRackRequired(distPvToPcs_m, distPcsToGrid_m) {
  const totalLen_m = distPvToPcs_m + distPcsToGrid_m;
  return {
    rackCount_2m:    Math.ceil(totalLen_m / 2),
    coverCount_1m:   Math.ceil(totalLen_m / 1),
    cornerCount:     Math.ceil(totalLen_m / 2),  // 継ぎ金具
    stopCount:       Math.ceil(totalLen_m / 3),  // 振れ止め
    supportCount:    Math.ceil(totalLen_m / 2),  // 支持
  };
}

function calcConduitLength(distPcsToGrid_m, routing) {
  // routing factor: outdoor=1.0, indoor=0.6 (shared duct), buried=1.3 (with fittings)
  const factor = { outdoor: 1.0, indoor: 0.6, buried: 1.3 }[routing] || 1.0;
  return distPcsToGrid_m * factor;
}

function calcRackWidth(cableAreaTotal_mm2) {
  // TASK 102: Calibrated threshold so 207kW→400, 77.6kW→200
  // Width 400 if cross-section > 6000mm², else 200
  return cableAreaTotal_mm2 > 6000 ? 400 : 200;
}

// ============================================================================
// DenkiHack_calc(params) — Main calculation function
// ============================================================================

export function DenkiHack_calc(params) {
  const {
    kw = 0,               // PV capacity (for labor rates only)
    pcsKwTotal = 0,       // PCS output capacity (for AC cable sizing) ← CORRECTED
    acVoltage = 440,      // AC voltage: 440V primary (PCS→transformer) ← CORRECTED
    stringCount = 1,
    panelCount = 0,
    distPvToPcs_m = 50,
    distPcsToGrid_m = 100,
    routing = 'outdoor',
    supply = 'low',       // 'low' or 'high'
    mountType = 'roof',   // 'roof' or 'ground'
    dropLimitRatio = 0.0105,  // 1.05% voltage drop limit (ケイテック practice, editable)
  } = params;

  const bom = [];
  let materialCost = 0;

  // =========================================================================
  // 1. DC Wiring (PV → PCS)
  // =========================================================================
  const dcCableLen_m = stringCount * distPvToPcs_m * 2;  // round trip
  const dcCableQty = dcCableLen_m;
  const dcCableCost = dcCableQty * DENKI_MASTER.pv_cable_5_5;
  bom.push({
    cat: 'DC配線',
    name: 'PVケーブル 5.5sq',
    spec: `${stringCount}回線 × ${distPvToPcs_m}m × 2`,
    qty: dcCableQty,
    unit: 'm',
    unitPrice: DENKI_MASTER.pv_cable_5_5,
    amount: dcCableCost,
  });
  materialCost += dcCableCost;

  // MC4 connectors (2 per string)
  const mc4Qty = stringCount * 2;
  const mc4Cost = mc4Qty * DENKI_MASTER.mc4_connector;
  bom.push({
    cat: 'DC配線',
    name: 'MC4コネクタ',
    spec: '組',
    qty: mc4Qty,
    unit: '組',
    unitPrice: DENKI_MASTER.mc4_connector,
    amount: mc4Cost,
  });
  materialCost += mc4Cost;

  // =========================================================================
  // 2. AC Wiring (PCS → Grid) — CORRECTED: use PCS output capacity on 440V primary
  // =========================================================================
  const acCableCalc = calcAcCableSize(pcsKwTotal, distPcsToGrid_m, acVoltage, dropLimitRatio);
  const acCableSize = acCableCalc.areaSelected_sq;

  // TASK 100: Use per-size price table instead of binary logic
  const acCableUnitPrice = DENKI_MASTER.ac_cable_price[acCableSize] || DENKI_MASTER.ac_cable_price[325];
  const needsVerification = acCableSize > 100;  // >100sq is interpolation, needs real quote
  const acCableName = acCableSize <= 60 ? `CET${acCableSize}` : `CVT${acCableSize}`;
  const specNote = needsVerification ? ` ⚠ 要実績検証` : '';

  const acCableQty = distPcsToGrid_m;
  const acCableCost = acCableQty * acCableUnitPrice;
  bom.push({
    cat: 'AC幹線',
    name: acCableName,
    spec: `${acCableSize}sq × ${distPcsToGrid_m}m (圧損 ${acCableCalc.volt_drop_percent}%)${specNote}`,
    qty: acCableQty,
    unit: 'm',
    unitPrice: acCableUnitPrice,
    amount: acCableCost,
  });
  materialCost += acCableCost;

  // =========================================================================
  // 3. Cable Rack (if mounting on roof)
  // =========================================================================
  let rackCost = 0;
  if (mountType === 'roof') {
    const rackCalc = calcRackRequired(distPvToPcs_m, distPcsToGrid_m);
    // TASK 102: Consider ALL cables (DC + AC), not just AC
    const dcArea = stringCount * 5.5 * 2;  // DC cable area (mm²)
    const acArea = acCableSize * 3.5;      // AC cable area (mm²)
    const totalArea = dcArea + acArea;
    const rackWidth = calcRackWidth(totalArea);

    const rackType = rackWidth === 400 ? '400' : '200';
    const rackPrice = rackWidth === 400 ? DENKI_MASTER.rack_400_2m : DENKI_MASTER.rack_200_2m;
    const coverPrice = rackWidth === 400 ? DENKI_MASTER.rack_400_cover : DENKI_MASTER.rack_200_cover;
    const cornerPrice = rackWidth === 400 ? DENKI_MASTER.rack_400_corner : DENKI_MASTER.rack_200_corner;
    const stopPrice = rackWidth === 400 ? DENKI_MASTER.rack_400_stop : DENKI_MASTER.rack_200_stop;
    const supportPrice = rackWidth === 400 ? DENKI_MASTER.rack_400_support : DENKI_MASTER.rack_200_support;

    const rackCost1 = rackCalc.rackCount_2m * rackPrice;
    const coverCost = rackCalc.coverCount_1m * coverPrice;
    const cornerCost = rackCalc.cornerCount * cornerPrice;
    const stopCost = rackCalc.stopCount * stopPrice;
    const supportCost = rackCalc.supportCount * supportPrice;

    bom.push({
      cat: 'ケーブルラック',
      name: `ラック ${rackType}mm`,
      spec: `${rackCalc.rackCount_2m}本 × 2m`,
      qty: rackCalc.rackCount_2m,
      unit: '本',
      unitPrice: rackPrice,
      amount: rackCost1,
    });
    bom.push({
      cat: 'ケーブルラック',
      name: 'カバー',
      spec: `${rackCalc.coverCount_1m}枚 × 1m`,
      qty: rackCalc.coverCount_1m,
      unit: '枚',
      unitPrice: coverPrice,
      amount: coverCost,
    });
    bom.push({
      cat: 'ケーブルラック',
      name: '継ぎ金具',
      qty: rackCalc.cornerCount,
      unit: '個',
      unitPrice: cornerPrice,
      amount: cornerCost,
    });
    bom.push({
      cat: 'ケーブルラック',
      name: '振れ止め',
      qty: rackCalc.stopCount,
      unit: '個',
      unitPrice: stopPrice,
      amount: stopCost,
    });
    bom.push({
      cat: 'ケーブルラック',
      name: '支持金具',
      qty: rackCalc.supportCount,
      unit: '個',
      unitPrice: supportPrice,
      amount: supportCost,
    });

    rackCost = rackCost1 + coverCost + cornerCost + stopCost + supportCost;
    materialCost += rackCost;
  }

  // =========================================================================
  // 4. Conduit (ground routing only)
  // =========================================================================
  if (routing === 'buried') {
    const conduitLen = calcConduitLength(distPcsToGrid_m, routing);
    const conduitCost = conduitLen * DENKI_MASTER.fp65_buried;
    bom.push({
      cat: '埋設',
      name: 'FEP管 φ65',
      qty: conduitLen,
      unit: 'm',
      unitPrice: DENKI_MASTER.fp65_buried,
      amount: conduitCost,
    });
    materialCost += conduitCost;

    const excavCost = conduitLen * DENKI_MASTER.excavation_h1000;
    bom.push({
      cat: '埋設',
      name: '掘削・埋戻し',
      qty: conduitLen,
      unit: 'm',
      unitPrice: DENKI_MASTER.excavation_h1000,
      amount: excavCost,
    });
    materialCost += excavCost;
  }

  // =========================================================================
  // 5. Protection devices (voltage-dependent)
  // =========================================================================
  if (supply === 'high') {
    // 高圧：気中開閉器
    const switchCost = 1 * DENKI_MASTER.air_switch_7_2kv;
    bom.push({
      cat: '保護',
      name: '気中開閉器 7.2kV',
      qty: 1,
      unit: '台',
      unitPrice: DENKI_MASTER.air_switch_7_2kv,
      amount: switchCost,
    });
    materialCost += switchCost;
  }

  // =========================================================================
  // 6. Miscellaneous, overhead, labor, transport
  // =========================================================================
  const miscCost = materialCost * DENKI_MASTER.miscRate;
  bom.push({
    cat: '雑材',
    name: '雑材',
    spec: `${(DENKI_MASTER.miscRate * 100).toFixed(0)}%`,
    qty: 1,
    unit: '一式',
    unitPrice: miscCost,
    amount: miscCost,
  });

  const subtotal = materialCost + miscCost;

  const overheadCost = subtotal * DENKI_MASTER.overheadRate;
  bom.push({
    cat: '諸経費',
    name: '諸経費',
    spec: `${(DENKI_MASTER.overheadRate * 100).toFixed(0)}%`,
    qty: 1,
    unit: '一式',
    unitPrice: overheadCost,
    amount: overheadCost,
  });

  const laborRate = kw >= 100 ? DENKI_MASTER.laborRateLarge : DENKI_MASTER.laborRateSmall;
  const laborCost = materialCost * laborRate;
  bom.push({
    cat: '労務',
    name: '電気工事労務費',
    spec: `${(laborRate * 100).toFixed(0)}% (${kw >= 100 ? 'large' : 'small'} project)`,
    qty: 1,
    unit: '一式',
    unitPrice: laborCost,
    amount: laborCost,
  });

  const transportRate = kw >= 100 ? DENKI_MASTER.transportRateLarge : DENKI_MASTER.transportRateSmall;
  const transportCost = materialCost * transportRate;
  bom.push({
    cat: '運搬',
    name: '運搬費',
    spec: `${(transportRate * 100).toFixed(1)}%`,
    qty: 1,
    unit: '一式',
    unitPrice: transportCost,
    amount: transportCost,
  });

  // =========================================================================
  // Summary
  // =========================================================================
  const total = materialCost + miscCost + overheadCost + laborCost + transportCost;

  return {
    bom,
    materialCost: Math.round(materialCost),
    miscCost: Math.round(miscCost),
    overheadCost: Math.round(overheadCost),
    laborCost: Math.round(laborCost),
    transportCost: Math.round(transportCost),
    total: Math.round(total),
    acCableSize,
    acCableName,
    confidence: 'rough',  // Flag: fitted to only 2 data points
    inputs: params,
    debug: {
      acCableCalc,
    },
  };
}
