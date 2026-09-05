"""Project Natural Earth country outlines into the game's Scan coordinates.

Usage: python3 scripts/prepare-scan.py /path/to/ne_110m_admin_0_countries.geojson
Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson
Public domain: https://www.naturalearthdata.com/about/terms-of-use/
Only geometry is retained. Game sectors and corporate ownership are independent
of modern political borders. No images or runtime network requests are used.
"""
import json
import sys
from pathlib import Path

source = json.loads(Path(sys.argv[1]).read_text())
sectors = {'North America': 'na', 'South America': 'sa', 'Europe': 'eu',
           'Africa': 'af', 'Asia': 'as', 'Oceania': 'oc'}
rows = []
for feature in source['features']:
    props = feature['properties']
    if props['CONTINENT'] not in sectors:
        continue
    geometry = feature['geometry']
    polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]
    for index, polygon in enumerate(polygons):
        ring = polygon[0]
        sector = sectors[props['CONTINENT']]
        # Russia is in the game's Asian theatre; French Guiana in South America.
        if props['ADM0_A3'] == 'RUS':
            sector = 'as'
        if props['ADM0_A3'] == 'FRA' and sum(p[0] for p in ring) / len(ring) < -20:
            sector = 'sa'
        points = ' '.join(f'{(lon + 180) / .36:.1f},{max(0, min(520, (85 - lat) / .28)):.1f}' for lon, lat in ring)
        key = 'gl' if props['ADM0_A3'] == 'GRL' and index == 0 else props['ADM0_A3'].lower() + '-' + str(index)
        rows.append({'id': key, 'sector': sector, 'pts': points})
# Antarctica is outside the projection's southern limit and remains unsurveyed.
rows.append({'id': 'an', 'sector': 'an', 'pts': '60,508 200,498 400,492 600,496 800,492 950,500 950,518 60,518'})
target = Path(__file__).resolve().parents[1] / 'src/game/scanTerritories.ts'
target.write_text('// Country outlines projected from public-domain Natural Earth 1:110m data.\n'
                  '// Rebuild with scripts/prepare-scan.py; provenance and projection live there.\n'
                  "import type { TerritoryDef } from './atlas'\n\n"
                  'export const SCAN_TERRITORIES: TerritoryDef[] = [\n' +
                  ''.join('  ' + json.dumps(row, separators=(',', ':')) + ',\n' for row in rows) + ']\n')
print(f'{len(rows)} polygons written to {target}')
