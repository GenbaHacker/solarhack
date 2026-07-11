const C_PANEL_DB = {
  longi:[
    {model:'LR7-54HVH-475M', wp:475, w:1800, h:1134, voc:40.18, vmp:33.16, isc:15.03, imp:14.33, tvoc:-0.200},
    {model:'LR7-54HVH-480M', wp:480, w:1800, h:1134, voc:40.29, vmp:33.28, isc:15.13, imp:14.43, tvoc:-0.200},
    {model:'LR7-54HVH-485M', wp:485, w:1800, h:1134, voc:40.40, vmp:33.40, isc:15.23, imp:14.53, tvoc:-0.200},
    {model:'LR7-54HVH-490M', wp:490, w:1800, h:1134, voc:40.52, vmp:33.51, isc:15.33, imp:14.63, tvoc:-0.200},
    {model:'LR5-54HTH-435M', wp:435, w:2094, h:1038, voc:47.00, vmp:39.60, isc:11.68, imp:10.86, tvoc:-0.270},
  ],
  jinko:[
    {model:'JKM480N-60HL4-V',  wp:480, w:2056, h:1134, voc:41.10, vmp:34.80, isc:14.10, imp:13.80, tvoc:-0.180},
    {model:'JKM490N-60HL4-V',  wp:490, w:2056, h:1134, voc:41.40, vmp:35.00, isc:14.25, imp:14.00, tvoc:-0.180},
    {model:'JKM585N-72HL4-V',  wp:585, w:2465, h:1134, voc:49.80, vmp:42.00, isc:14.02, imp:13.92, tvoc:-0.180},
  ],
  canadian:[
    {model:'CS6.2-54TM-505', wp:505, w:2108, h:1048, voc:42.70, vmp:35.60, isc:14.26, imp:14.18, tvoc:-0.270},
    {model:'CS6.2-54TM-510', wp:510, w:2108, h:1048, voc:42.90, vmp:35.80, isc:14.34, imp:14.24, tvoc:-0.270},
    {model:'CS6.2-54TM-520', wp:520, w:2108, h:1048, voc:43.30, vmp:36.10, isc:14.50, imp:14.40, tvoc:-0.270},
  ],
  huawei:[
    {model:'SUN-415P-60L', wp:415, w:1722, h:1134, voc:37.90, vmp:31.80, isc:13.83, imp:13.05, tvoc:-0.290},
  ],
  yingli:[
    {model:'YL595CF66i/2', wp:595, w:2274, h:1134, voc:50.60, vmp:42.50, isc:14.10, imp:14.00, tvoc:-0.280},
    {model:'YL600CF66i/2', wp:600, w:2274, h:1134, voc:50.80, vmp:42.70, isc:14.20, imp:14.10, tvoc:-0.280},
  ],
  das:[
    {model:'DAS-DH144NA-JP-585', wp:585, w:2465, h:1134, voc:49.90, vmp:42.10, isc:14.08, imp:13.90, tvoc:-0.260},
  ],
  other:[
    {model:'カスタム', wp:485, w:1800, h:1134, voc:40.40, vmp:33.40, isc:15.23, imp:14.53, tvoc:-0.200},
  ],
};

const C_PCS_DB = {
  huawei:[
    {model:'SUN2000-4.95KTL-JPL1', kw:4.95,  vmax:600,  mpptMin:90,  mpptMax:560,  imaxPerMppt:16, mppt:4},
    {model:'SUN2000-20KTL-M3',     kw:20,    vmax:1100, mpptMin:200, mpptMax:1000, imaxPerMppt:14.5,mppt:6},
    {model:'SUN2000-33KTL-NH',     kw:33.3,  vmax:1100, mpptMin:200, mpptMax:1000, imaxPerMppt:22, mppt:5},
    {model:'SUN2000-40KTL-NH',     kw:40,    vmax:1100, mpptMin:200, mpptMax:1000, imaxPerMppt:22, mppt:5},
    {model:'SUN2000-50KTL-JPM0',   kw:50,    vmax:1100, mpptMin:200, mpptMax:1000, imaxPerMppt:26, mppt:8},
    {model:'SUN2000-50KTL-NHM3',   kw:50,    vmax:1100, mpptMin:200, mpptMax:1000, imaxPerMppt:30, mppt:8},
    {model:'SUN2000-111KTL-NHM0',  kw:111.1, vmax:1500, mpptMin:200, mpptMax:1300, imaxPerMppt:26, mppt:12},
    {model:'SUN2000-125KTL-JPH0',  kw:125,   vmax:1500, mpptMin:200, mpptMax:1300, imaxPerMppt:26, mppt:12},
  ],
  yasukawa:[
    {model:'CEPT-P3AA2025B（標準型）',  kw:25, vmax:1000, mpptMin:200, mpptMax:900, imaxPerMppt:25, mppt:4},
    {model:'CEPT-P3AB2025B（多機能型）',kw:25, vmax:1000, mpptMin:200, mpptMax:900, imaxPerMppt:25, mppt:4},
  ],
  omron:[
    {model:'KPW-A55-2PJ4', kw:5.5, vmax:600, mpptMin:100, mpptMax:550, imaxPerMppt:25, mppt:2},
    {model:'KPW-A55-2J4',  kw:5.5, vmax:600, mpptMin:100, mpptMax:550, imaxPerMppt:25, mppt:2},
  ],
  sungrow:[
    {model:'SG49.5CX-JP（10年）', kw:49.5, vmax:1100, mpptMin:200, mpptMax:1000, imaxPerMppt:30, mppt:12},
    {model:'SG100CX-JP（10年）',  kw:100,  vmax:1100, mpptMin:200, mpptMax:1000, imaxPerMppt:26, mppt:12},
    {model:'SG125HX-JP（10年）',  kw:125,  vmax:1500, mpptMin:200, mpptMax:1300, imaxPerMppt:26, mppt:16},
  ],
  solaredge:[
    {model:'SE17.5K-JPI（12年）', kw:17.5, vmax:1000, mpptMin:200, mpptMax:850, imaxPerMppt:30, mppt:2},
    {model:'SE33.3K-JPI（12年）', kw:33.3, vmax:1000, mpptMin:200, mpptMax:850, imaxPerMppt:30, mppt:2},
  ],
  panasonic:[
    {model:'VBPC255GM2', kw:5.5, vmax:600, mpptMin:100, mpptMax:550, imaxPerMppt:25, mppt:2},
    {model:'VBPC244GM2', kw:4.4, vmax:600, mpptMin:100, mpptMax:550, imaxPerMppt:25, mppt:2},
  ],
};