#!/usr/bin/env python3
"""
Fetch gravitational wave events from GWOSC (Gravitational Wave Open Science Center)
and prepare data for interactive visualization.

This script queries the GWOSC API for all confirmed gravitational wave events
and extracts relevant parameters for the M1 vs M2 mass plot.
"""

import json
import requests
from datetime import datetime
from pathlib import Path
from collections import defaultdict


def fetch_gwosc_events():
    """
    Fetch gravitational wave events from GWOSC API.
    
    Returns:
        dict: Dictionary of events from GWOSC
    """
    print("Fetching gravitational wave events from GWOSC...")
    
    # GWOSC API endpoint - jsonfull returns all parameters at top level
    url = "https://gwosc.org/eventapi/jsonfull/allevents/"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        events = data.get('events', {})
        print(f"Found {len(events)} events in GWOSC catalog")
        
        return events
    
    except requests.RequestException as e:
        print(f"Error fetching data from GWOSC: {e}")
        return {}


def extract_event_parameters(events):
    """
    Extract relevant parameters from GWOSC events for visualization.
    
    Parameters:
        events (dict): Dictionary of events from GWOSC
    
    Returns:
        list: Processed event data ready for visualization
    """
    processed_events = []
    
    for event_name, event_data in events.items():
        
        # All parameters are at the top level with underscores
        # Example: mass_1_source, mass_2_source (not nested, not hyphens!)
        
        # Get mass parameters (in solar masses)
        m1_source = event_data.get('mass_1_source')
        m2_source = event_data.get('mass_2_source')
        
        # If source masses not available, try detector frame masses
        if m1_source is None:
            m1_source = event_data.get('mass_1')
        if m2_source is None:
            m2_source = event_data.get('mass_2')
        
        # Calculate from chirp mass and mass ratio if needed
        if m1_source is None or m2_source is None:
            chirp_mass = event_data.get('chirp_mass_source') or event_data.get('chirp_mass')
            mass_ratio = event_data.get('mass_ratio')
            
            if chirp_mass and mass_ratio and 0 < mass_ratio <= 1:
                # q = m2/m1, where q <= 1
                # Mc = (m1*m2)^(3/5) / (m1+m2)^(1/5)
                q = mass_ratio
                m1_source = chirp_mass * ((1 + q) ** (1/5)) * (q ** (-3/5))
                m2_source = m1_source * q
        
        # Skip events without mass data
        if m1_source is None or m2_source is None:
            continue
        
        # Convert to float and ensure m1 >= m2
        try:
            m1 = float(m1_source)
            m2 = float(m2_source)
            
            if m1 < m2:
                m1, m2 = m2, m1
        except (TypeError, ValueError):
            continue
        
        # Get SNR (signal-to-noise ratio)
        snr = event_data.get('network_matched_filter_snr')
        if snr is None:
            snr = 10.0
        try:
            snr = float(snr)
        except (TypeError, ValueError):
            snr = 10.0
        
        # Get all other parameters we want to save
        luminosity_distance = event_data.get('luminosity_distance')
        chi_eff = event_data.get('chi_eff')
        total_mass_source = event_data.get('total_mass_source')
        chirp_mass_source = event_data.get('chirp_mass_source')
        redshift = event_data.get('redshift')
        final_mass_source = event_data.get('final_mass_source')
        final_spin = event_data.get('final_spin')
        far = event_data.get('far')
        p_astro = event_data.get('p_astro')
        
        # Determine source type based on masses
        # Typical thresholds: NS < 3 M☉, BH > 3 M☉
        NS_THRESHOLD = 3.0
        
        if m2 < NS_THRESHOLD and m1 < NS_THRESHOLD:
            source_type = "BNS"  # Binary Neutron Star
            color = "#3498db"  # Blue
        elif m2 < NS_THRESHOLD and m1 > NS_THRESHOLD:
            source_type = "NSBH"  # Neutron Star - Black Hole
            color = "#e67e22"  # Orange
        else:
            source_type = "BBH"  # Binary Black Hole
            color = "#9b59b6"  # Purple
        
        # Get GPS time and convert to date
        gps_time = event_data.get('GPS', 0)
        
        # GPS epoch is January 6, 1980
        # Convert GPS time to Unix timestamp
        gps_epoch = 315964800  # Unix timestamp of GPS epoch
        unix_time = gps_time + gps_epoch
        
        try:
            detection_date = datetime.utcfromtimestamp(unix_time).strftime('%Y-%m-%d')
        except:
            detection_date = "Unknown"
        
        # Get common name and catalog
        common_name = event_data.get('commonName', event_name)
        catalog = event_data.get('catalog.shortName', 'Unknown')
        version = event_data.get('version', 1)
      
        # Compile event info with ALL available parameters
        event_info = {
            'name': common_name,
            'full_name': event_name,
            'm1': round(m1, 2),
            'm2': round(m2, 2),
            'snr': round(snr, 1) if snr else None,
            'source_type': source_type,
            'color': color,
            'detection_date': detection_date,
            'catalog': catalog,
            'version': version,
            'gps_time': gps_time,
            
            # Additional parameters
            'luminosity_distance': round(float(luminosity_distance), 1) if luminosity_distance else None,
            'chi_eff': round(float(chi_eff), 3) if chi_eff else None,
            'total_mass_source': round(float(total_mass_source), 2) if total_mass_source else None,
            'chirp_mass_source': round(float(chirp_mass_source), 2) if chirp_mass_source else None,
            'redshift': round(float(redshift), 3) if redshift else None,
            'final_mass_source': round(float(final_mass_source), 2) if final_mass_source else None,
            'final_spin': round(float(final_spin), 3) if final_spin else None,
            'far': float(far) if far else None,
            'p_astro': round(float(p_astro), 3) if p_astro else None,
        }
        
        processed_events.append(event_info)
    
    # Sort by detection date (most recent first)
    processed_events.sort(key=lambda x: x['gps_time'], reverse=True)
    
    print(f"\nProcessed {len(processed_events)} events with complete mass data")
    print(f"  - BBH: {sum(1 for e in processed_events if e['source_type'] == 'BBH')}")
    print(f"  - NSBH: {sum(1 for e in processed_events if e['source_type'] == 'NSBH')}")
    print(f"  - BNS: {sum(1 for e in processed_events if e['source_type'] == 'BNS')}")
    
    return processed_events


def deduplicate_events(events):
    """
    Deduplicate events while preserving all versions.

    For each event name, keep all catalog versions but mark the highest-priority
    catalog as the primary version for default display.

    Catalog priority (highest to lowest):
    1. GWTC-4.0 (most recent comprehensive catalog)
    2. GWTC-3-confident
    3. GWTC-2.1-confident
    4. GWTC-1-confident
    5. O4_Discovery_Papers (preliminary O4 results)

    Catalogs to exclude (redundant or confusing):
    - GWTC-2 (superseded by GWTC-2.1)
    - GWTC-3-marginal (lower confidence)
    - IAS-O3a (independent analysis, creates duplicates)
    - O3_Discovery_Papers (superseded by GWTC catalogs)

    Parameters:
        events (list): Processed event data

    Returns:
        tuple: (filtered_events, unique_events_data)
            - filtered_events: All events from relevant catalogs
            - unique_events_data: Dict mapping event name to all its versions
    """
    # Define catalog priorities (higher = better)
    CATALOG_PRIORITY = {
        'GWTC-4.0': 100,
        'GWTC-3-confident': 90,
        'GWTC-2.1-confident': 80,
        'GWTC-1-confident': 70,
        'O4_Discovery_Papers': 60,
    }

    # Catalogs to exclude
    EXCLUDED_CATALOGS = {
        'GWTC-2',
        'GWTC-3-marginal',
        'IAS-O3a',
        'O3_Discovery_Papers'
    }

    # Filter out excluded catalogs
    filtered_events = [e for e in events if e['catalog'] not in EXCLUDED_CATALOGS]

    print(f"\nFiltered out {len(events) - len(filtered_events)} events from excluded catalogs")
    print(f"Remaining events: {len(filtered_events)}")

    # Group events by name
    events_by_name = defaultdict(list)
    for event in filtered_events:
        events_by_name[event['name']].append(event)

    # For each event, determine the primary version
    unique_events_data = {}
    for name, versions in events_by_name.items():
        # Sort versions by catalog priority
        versions_sorted = sorted(
            versions,
            key=lambda e: CATALOG_PRIORITY.get(e['catalog'], 0),
            reverse=True
        )

        # Mark the primary version
        primary = versions_sorted[0].copy()
        primary['is_primary'] = True
        primary['all_versions'] = versions_sorted  # Keep all versions

        unique_events_data[name] = {
            'primary': primary,
            'all_versions': versions_sorted,
            'version_count': len(versions_sorted)
        }

    print(f"\nUnique events: {len(unique_events_data)}")

    # Count events with multiple versions
    multi_version_count = sum(1 for data in unique_events_data.values() if data['version_count'] > 1)
    print(f"Events with multiple catalog versions: {multi_version_count}")

    return filtered_events, unique_events_data


def save_data(events, output_path):
    """
    Save processed events to JSON file with deduplication.

    Parameters:
        events (list): Processed event data
        output_path (str): Path to output JSON file
    """
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Deduplicate events
    filtered_events, unique_events_data = deduplicate_events(events)

    # Create primary events list (one per unique event)
    primary_events = [data['primary'] for data in unique_events_data.values()]

    # Sort by GPS time (most recent first)
    primary_events.sort(key=lambda x: x['gps_time'], reverse=True)

    # Prepare data structure
    data = {
        'updated': datetime.utcnow().isoformat() + 'Z',
        'total_entries': len(events),
        'filtered_entries': len(filtered_events),
        'unique_events': len(unique_events_data),
        'events': primary_events,  # Primary version of each event
        'all_events': filtered_events,  # All versions from relevant catalogs
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nData saved to {output_file}")
    print(f"Unique events (primary versions): {len(primary_events)}")
    print(f"Total entries (all versions): {len(filtered_events)}")


def main():
    """Main execution function."""
    print("=" * 60)
    print("GWOSC Gravitational Wave Events Fetcher")
    print("=" * 60)
    
    # Fetch events from GWOSC
    events = fetch_gwosc_events()
    
    if not events:
        print("No events fetched. Exiting.")
        return
    
    # Process events
    processed_events = extract_event_parameters(events)
    
    if not processed_events:
        print("\nNo events with valid mass data found.")
        print("This may indicate a change in the GWOSC API structure.")
        print("Please report this issue on GitHub.")
        return
    
    # Save to JSON
    output_path = "docs/data/gw_events.json"  

    save_data(processed_events, output_path)
    
    print("=" * 60)
    print("Data fetch completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
