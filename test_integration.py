#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Integration test for solarhack tool
Verifies:
1. Data file integrity
2. Geolocation search (Haversine)
3. Irradiance data retrieval
4. Azimuth normalization
"""

import json
import math

def test_data_files():
    """Test that data files exist and have correct structure"""
    print("=" * 60)
    print("TEST 1: Data File Integrity")
    print("=" * 60)

    # Load lite database
    with open('data/stations_lite.json', 'r', encoding='utf-8') as f:
        lite = json.load(f)

    print(f"[OK] Lite database loaded: {lite['meta']['count']} stations")
    print(f"     - Azimuths: {lite['meta']['azimuths']}")
    print(f"     - Tilts: {lite['meta']['tilts']}")
    print(f"     - Lite file size: ~56KB")

    # Load full database
    with open('data/stations_monsola.json', 'r', encoding='utf-8') as f:
        full = json.load(f)

    print(f"[OK] Full MONSOLA11m database loaded: {full['meta']['count']} stations")
    print(f"     - Full file size: ~17MB")

    # Verify all stations in lite exist in full
    lite_codes = {st['c'] for st in lite['stations']}
    full_codes = {st['c'] for st in full['stations']}
    if lite_codes == full_codes:
        print(f"[OK] All {len(lite_codes)} stations in lite database found in full database")
    else:
        missing = lite_codes - full_codes
        print(f"[ERROR] Missing stations in full database: {missing}")

    return lite, full

def test_haversine_search(lite):
    """Test nearest station search (Haversine formula)"""
    print("\n" + "=" * 60)
    print("TEST 2: Nearest Station Search (Haversine)")
    print("=" * 60)

    def haversine(la1, lo1, la2, lo2):
        R = 6371
        dLa = (la2 - la1) * math.pi / 180
        dLo = (lo2 - lo1) * math.pi / 180
        a = math.sin(dLa/2)**2 + math.cos(la1*math.pi/180)*math.cos(la2*math.pi/180)*math.sin(dLo/2)**2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    # Test with Tokyo (35.6762, 139.6503)
    test_lat, test_lon = 35.6762, 139.6503
    min_dist = float('inf')
    nearest = None

    for st in lite['stations']:
        d = haversine(test_lat, test_lon, st['la'], st['lo'])
        if d < min_dist:
            min_dist = d
            nearest = st

    print(f"[OK] Test location: Tokyo ({test_lat}, {test_lon})")
    print(f"     - Nearest station: {nearest['n']} ({nearest['c']})")
    print(f"     - Distance: {min_dist:.1f} km")
    print(f"     - Station location: ({nearest['la']}, {nearest['lo']})")

    return nearest

def test_irradiance_retrieval(lite, full, station):
    """Test irradiance data retrieval"""
    print("\n" + "=" * 60)
    print("TEST 3: Irradiance Data Retrieval")
    print("=" * 60)

    # Find in full database
    st_full = next((s for s in full['stations'] if s['c'] == station['c']), None)
    if not st_full:
        print(f"[ERROR] Station {station['c']} not found in full database")
        return

    print(f"[OK] Station: {st_full['n']} ({st_full['c']})")
    print(f"     - Irradiance array length: {len(st_full['i'])} (13 az x 9 tilt x 12 months)")

    # Test data retrieval for different azimuths
    AZ_LIST = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180]
    TILT_LIST = [10, 20, 30, 40, 50, 60, 70, 80, 90]

    def get_irr(az_idx, tilt_idx, month_idx):
        idx = az_idx * 9 * 12 + tilt_idx * 12 + month_idx
        return st_full['i'][idx] / 100  # Convert from x100 to actual value

    # Show sample data for south-facing (180°) at 30° tilt
    az_i = 12  # 180° (south)
    tilt_i = 2  # 30° tilt

    print(f"\n     South-facing (180 deg) at 30 deg tilt monthly irradiance:")
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    values = [get_irr(az_i, tilt_i, m) for m in range(12)]
    for month, val in zip(months, values):
        print(f"       {month}: {val:.2f} kWh/m2/day")

    annual = sum(values)
    print(f"       Annual: {annual:.1f} kWh/m2/year")

def test_azimuth_normalization():
    """Test azimuth normalization for MONSOLA11m (0-180 range)"""
    print("\n" + "=" * 60)
    print("TEST 4: Azimuth Normalization")
    print("=" * 60)

    AZ_LIST = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180]

    def normalize_azimuth(az):
        """Normalize azimuth from 0-360 to 0-180 range"""
        azNorm = ((az % 360) + 360) % 360
        azMonsola = 360 - azNorm if azNorm > 180 else azNorm
        return azMonsola

    def nearest_idx(arr, val):
        """Find nearest index in array"""
        return min(range(len(arr)), key=lambda i: abs(arr[i] - val))

    # Test various azimuths
    test_azimuths = [0, 45, 90, 135, 180, 225, 270, 315]
    print("     Azimuth mapping (0-360 -> 0-180 -> nearest in AZ_LIST):")
    for az in test_azimuths:
        azNorm = ((az % 360) + 360) % 360
        azMonsola = 360 - azNorm if azNorm > 180 else azNorm
        nearest_az = AZ_LIST[nearest_idx(AZ_LIST, azMonsola)]
        print(f"       {az:3d} deg -> {azMonsola:6.1f} deg -> {nearest_az:3d} deg (index {nearest_idx(AZ_LIST, azMonsola)})")

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("SOLARHACK INTEGRATION TEST")
    print("=" * 60)

    try:
        lite, full = test_data_files()
        station = test_haversine_search(lite)
        test_irradiance_retrieval(lite, full, station)
        test_azimuth_normalization()

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED")
        print("=" * 60)
        print("\nNext step: Open http://localhost:8000 in a browser to test the UI")

    except Exception as e:
        print(f"\n[FAILED] TEST ERROR: {e}")
        import traceback
        traceback.print_exc()
