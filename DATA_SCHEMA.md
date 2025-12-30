# Data Schema Documentation

## Overview

This document describes the structure of the gravitational wave event data used in the visualization.

## Data Source

All data is fetched from the [GWOSC API](https://gwosc.org/eventapi/) maintained by the LIGO Scientific Collaboration and Virgo Collaboration.

## JSON Structure

### Root Object

```json
{
  "updated": "string (ISO 8601 timestamp)",
  "event_count": "integer",
  "events": ["array of event objects"]
}
```

### Event Object

Each event in the `events` array contains the following fields:

| Field | Type | Unit | Description | Example |
|-------|------|------|-------------|---------|
| `name` | string | - | Official event name from GWOSC | `"GW150914"` |
| `m1` | number | M☉ | Primary (larger) mass | `36.2` |
| `m2` | number | M☉ | Secondary (smaller) mass | `29.1` |
| `snr` | number | - | Signal-to-noise ratio | `23.7` |
| `source_type` | string | - | Classification of source | `"BBH"`, `"NSBH"`, or `"BNS"` |
| `color` | string | - | Hex color for visualization | `"#9b59b6"` |
| `detection_date` | string | - | Date of detection (YYYY-MM-DD) | `"2015-09-14"` |
| `version` | string | - | GWOSC catalog version | `"GWTC-3"` |
| `luminosity_distance` | number / null | Mpc | Distance to source | `440.0` |
| `final_mass` | number / null | M☉ | Mass of merged object | `62.3` |
| `final_spin` | number / null | - | Dimensionless spin (0-1) | `0.689` |
| `gps_time` | number | s | GPS timestamp of detection | `1126259462.4` |

### Field Details

#### Source Types

- **BBH** (Binary Black Hole): Both objects have mass > 3 M☉
- **NSBH** (Neutron Star - Black Hole): One NS (< 3 M☉), one BH (> 3 M☉)
- **BNS** (Binary Neutron Star): Both objects have mass < 3 M☉

Note: The 3 M☉ threshold is approximate. Actual classification may use more sophisticated methods.

#### Mass Convention

By convention, `m1 ≥ m2` always. The primary mass is the larger of the two component masses.

#### SNR (Signal-to-Noise Ratio)

- Higher SNR indicates stronger, more confident detection
- Typical range: 8-50
- Threshold for detection: typically SNR > 8

#### GPS Time

GPS time is measured in seconds since the GPS epoch (January 6, 1980, 00:00:00 UTC). This is the standard time format used in gravitational wave astronomy.

Conversion to Unix timestamp:
```python
unix_time = gps_time + 315964800  # GPS epoch offset
```

#### Null Values

Some fields may be `null` for certain events:
- `luminosity_distance`: Not always well-constrained
- `final_mass`: May not be calculated for all events
- `final_spin`: Not applicable for BNS mergers (uncertain remnant)

## Data Processing

### Source Classification Logic

```python
NS_THRESHOLD = 3.0  # Solar masses

if m2 < NS_THRESHOLD and m1 < NS_THRESHOLD:
    source_type = "BNS"
elif m2 < NS_THRESHOLD and m1 > NS_THRESHOLD:
    source_type = "NSBH"
else:
    source_type = "BBH"
```

### Mass Calculation

When direct mass measurements are unavailable, masses can be estimated from chirp mass (Mc) and mass ratio (q):

```python
# q = m2/m1, where q ≤ 1
m1 = Mc * ((1 + q) ** 1.2) / (q ** 0.6)
m2 = m1 * q
```

### Color Scheme

- BBH: `#9b59b6` (Purple) - Most massive systems
- NSBH: `#e67e22` (Orange) - Mixed systems
- BNS: `#3498db` (Blue) - Lightest systems

## Example Event

```json
{
  "name": "GW150914",
  "m1": 36.2,
  "m2": 29.1,
  "snr": 23.7,
  "source_type": "BBH",
  "color": "#9b59b6",
  "detection_date": "2015-09-14",
  "version": "GWTC-3",
  "luminosity_distance": 440.0,
  "final_mass": 62.3,
  "final_spin": 0.689,
  "gps_time": 1126259462.4
}
```

This was the first direct detection of gravitational waves, announced on February 11, 2016.

## GWOSC Parameters

The following GWOSC parameters are extracted:

| GWOSC Parameter | Our Field |
|-----------------|-----------|
| `m1_source.median` | `m1` |
| `m2_source.median` | `m2` |
| `network_matched_filter_snr.median` | `snr` |
| `luminosity_distance.median` | `luminosity_distance` |
| `final_mass_source.median` | `final_mass` |
| `final_spin.median` | `final_spin` |
| `GPS` | `gps_time` |

Additional available parameters in GWOSC (not currently used):
- `chi_eff`: Effective spin
- `redshift`: Cosmological redshift
- `mass_ratio`: q = m2/m1
- `chirp_mass_source`: Chirp mass
- Sky localization parameters
- Detector-specific SNRs

## Data Quality

### Completeness
- All events include: name, m1, m2, snr, source_type, detection_date
- Optional fields may be null for some events

### Accuracy
- Values are median estimates from posterior distributions
- Uncertainties are not included (available in GWOSC)
- For precise analysis, refer to original GWOSC data

### Update Frequency
- GWOSC releases new catalogs periodically (GWTC-1, GWTC-2, GWTC-3, etc.)
- Our data updates daily to capture any catalog updates
- Major catalog releases may add many events at once

## Using the Data

### Python
```python
import json

with open('data/gw_events.json', 'r') as f:
    data = json.load(f)

events = data['events']
for event in events:
    print(f"{event['name']}: {event['m1']} + {event['m2']} M☉")
```

### JavaScript
```javascript
fetch('data/gw_events.json')
    .then(response => response.json())
    .then(data => {
        const events = data.events;
        events.forEach(event => {
            console.log(`${event.name}: ${event.m1} + ${event.m2} M☉`);
        });
    });
```

## References

- [GWOSC Event Documentation](https://gwosc.org/eventapi/html/allevents/)
- [GWTC-3 Catalog Paper](https://arxiv.org/abs/2111.03606)
- [LIGO/Virgo Parameter Estimation Guide](https://dcc.ligo.org/)

## Questions?

For questions about:
- **Data structure**: Open an issue in this repository
- **Physical interpretation**: Consult GWOSC documentation
- **Scientific accuracy**: Refer to original GWOSC publications
