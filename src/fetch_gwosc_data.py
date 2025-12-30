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


def fetch_gwosc_events():
    """
    Fetch gravitational wave events from GWOSC API.
    
    Returns:
        dict: Dictionary of events from GWOSC
    """
    print("Fetching gravitational wave events from GWOSC...")
    
    # GWOSC API endpoint for event catalog
    url = "https://gwosc.org/eventapi/json/allevents/"
    
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


def get_nested_value(d, *keys):
    """
    Safely get nested dictionary values.
    
    Args:
        d: Dictionary to search
        *keys: Sequence of keys to traverse
    
    Returns:
        Value if found, None otherwise
    """
    for key in keys:
        if isinstance(d, dict):
            d = d.get(key)
        else:
            return None
    return d


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
        
        # Try multiple possible structures for parameters
        params = event_data.get('parameters', {})
        
        # Method 1: Direct mass values with 'best' or 'median'
        m1_median = (
            get_nested_value(params, 'mass_1_source', 'best') or
            get_nested_value(params, 'mass_1_source', 'median') or
            get_nested_value(params, 'mass1_source', 'best') or
            get_nested_value(params, 'mass1_source', 'median') or
            get_nested_value(params, 'm1_source', 'best') or
            get_nested_value(params, 'm1_source', 'median')
        )
        
        m2_median = (
            get_nested_value(params, 'mass_2_source', 'best') or
            get_nested_value(params, 'mass_2_source', 'median') or
            get_nested_value(params, 'mass2_source', 'best') or
            get_nested_value(params, 'mass2_source', 'median') or
            get_nested_value(params, 'm2_source', 'best') or
            get_nested_value(params, 'm2_source', 'median')
        )
        
        # Method 2: Try detector frame masses
        if m1_median is None:
            m1_median = (
                get_nested_value(params, 'mass_1', 'best') or
                get_nested_value(params, 'mass_1', 'median') or
                get_nested_value(params, 'mass1', 'best') or
                get_nested_value(params, 'mass1', 'median')
            )
        
        if m2_median is None:
            m2_median = (
                get_nested_value(params, 'mass_2', 'best') or
                get_nested_value(params, 'mass_2', 'median') or
                get_nested_value(params, 'mass2', 'best') or
                get_nested_value(params, 'mass2', 'median')
            )
        
        # Method 3: Calculate from chirp mass and mass ratio
        if m1_median is None or m2_median is None:
            chirp_mass = (
                get_nested_value(params, 'chirp_mass_source', 'best') or
                get_nested_value(params, 'chirp_mass_source', 'median') or
                get_nested_value(params, 'chirp_mass', 'best') or
                get_nested_value(params, 'chirp_mass', 'median')
            )
            
            mass_ratio = (
                get_nested_value(params, 'mass_ratio', 'best') or
                get_nested_value(params, 'mass_ratio', 'median') or
                get_nested_value(params, 'q', 'best') or
                get_nested_value(params, 'q', 'median')
            )
            
            if chirp_mass and mass_ratio and mass_ratio > 0 and mass_ratio <= 1:
                # q = m2/m1, where q <= 1
                # Mc = (m1*m2)^(3/5) / (m1+m2)^(1/5)
                # Solve for m1 and m2
                q = mass_ratio
                m1_median = chirp_mass * ((1 + q) ** (1/5)) * (q ** (-3/5))
                m2_median = m1_median * q
        
        # Skip events without mass data
        if m1_median is None or m2_median is None:
            continue
        
        # Ensure m1 >= m2 (convention)
        if m1_median < m2_median:
            m1_median, m2_median = m2_median, m1_median
        
        # Get SNR (signal-to-noise ratio)
        snr = (
            get_nested_value(params, 'network_matched_filter_snr', 'best') or
            get_nested_value(params, 'network_matched_filter_snr', 'median') or
            get_nested_value(params, 'snr', 'best') or
            get_nested_value(params, 'snr', 'median') or
            10
        )
        
        # Get luminosity distance
        luminosity_distance = (
            get_nested_value(params, 'luminosity_distance', 'best') or
            get_nested_value(params, 'luminosity_distance', 'median')
        )
        
        # Get final mass and spin
        final_mass = (
            get_nested_value(params, 'final_mass_source', 'best') or
            get_nested_value(params, 'final_mass_source', 'median') or
            get_nested_value(params, 'final_mass', 'best') or
            get_nested_value(params, 'final_mass', 'median')
        )
        
        final_spin = (
            get_nested_value(params, 'final_spin', 'best') or
            get_nested_value(params, 'final_spin', 'median') or
            get_nested_value(params, 'chi_final', 'best') or
            get_nested_value(params, 'chi_final', 'median')
        )
        
        # Determine source type based on masses
        # Typical thresholds: NS < 3 M☉, BH > 3 M☉
        NS_THRESHOLD = 3.0
        
        if m2_median < NS_THRESHOLD and m1_median < NS_THRESHOLD:
            source_type = "BNS"  # Binary Neutron Star
            color = "#3498db"  # Blue
        elif m2_median < NS_THRESHOLD and m1_median > NS_THRESHOLD:
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
        
        # Get event version
        version = event_data.get('version', 'unknown')
        
        # Compile event info
        event_info = {
            'name': event_name,
            'm1': round(float(m1_median), 2),
            'm2': round(float(m2_median), 2),
            'snr': round(float(snr), 1),
            'source_type': source_type,
            'color': color,
            'detection_date': detection_date,
            'version': version,
            'luminosity_distance': round(float(luminosity_distance), 1) if luminosity_distance else None,
            'final_mass': round(float(final_mass), 2) if final_mass else None,
            'final_spin': round(float(final_spin), 3) if final_spin else None,
            'gps_time': gps_time
        }
        
        processed_events.append(event_info)
    
    # Sort by detection date (most recent first)
    processed_events.sort(key=lambda x: x['gps_time'], reverse=True)
    
    print(f"\nProcessed {len(processed_events)} events with complete mass data")
    print(f"  - BBH: {sum(1 for e in processed_events if e['source_type'] == 'BBH')}")
    print(f"  - NSBH: {sum(1 for e in processed_events if e['source_type'] == 'NSBH')}")
    print(f"  - BNS: {sum(1 for e in processed_events if e['source_type'] == 'BNS')}")
    
    return processed_events


def save_data(events, output_path):
    """
    Save processed events to JSON file.
    
    Parameters:
        events (list): Processed event data
        output_path (str): Path to output JSON file
    """
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    data = {
        'updated': datetime.utcnow().isoformat() + 'Z',
        'event_count': len(events),
        'events': events
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\nData saved to {output_file}")
    print(f"Total events: {len(events)}")


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
    output_path = "data/gw_events.json"
    save_data(processed_events, output_path)
    
    print("=" * 60)
    print("Data fetch completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
