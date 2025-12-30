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
        list: List of event dictionaries with relevant parameters
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
        # Extract parameters (with fallbacks for missing data)
        params = event_data.get('parameters', {})
        
        # Get mass parameters (in solar masses)
        m1_median = params.get('m1_source', {}).get('median')
        m2_median = params.get('m2_source', {}).get('median')
        
        # Get chirp mass as fallback
        chirp_mass = params.get('chirp_mass_source', {}).get('median')
        
        # Get mass ratio if available
        mass_ratio = params.get('mass_ratio', {}).get('median')
        
        # Calculate approximate masses from chirp mass if direct masses unavailable
        if m1_median is None and chirp_mass and mass_ratio:
            # Approximate calculation
            q = mass_ratio  # q = m2/m1, where q <= 1
            m1_median = chirp_mass * ((1 + q) ** 1.2) / (q ** 0.6)
            m2_median = m1_median * q
        
        # Skip events without mass data
        if m1_median is None or m2_median is None:
            print(f"Skipping {event_name}: insufficient mass data")
            continue
        
        # Ensure m1 >= m2 (convention)
        if m1_median < m2_median:
            m1_median, m2_median = m2_median, m1_median
        
        # Get SNR (signal-to-noise ratio)
        snr = params.get('network_matched_filter_snr', {}).get('median', 10)
        
        # Get luminosity distance
        luminosity_distance = params.get('luminosity_distance', {}).get('median')
        
        # Get final mass and spin
        final_mass = params.get('final_mass_source', {}).get('median')
        final_spin = params.get('final_spin', {}).get('median')
        
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
        detection_date = datetime.utcfromtimestamp(unix_time).strftime('%Y-%m-%d')
        
        # Get event version
        version = event_data.get('version', 'unknown')
        
        # Compile event info
        event_info = {
            'name': event_name,
            'm1': round(m1_median, 2),
            'm2': round(m2_median, 2),
            'snr': round(snr, 1),
            'source_type': source_type,
            'color': color,
            'detection_date': detection_date,
            'version': version,
            'luminosity_distance': round(luminosity_distance, 1) if luminosity_distance else None,
            'final_mass': round(final_mass, 2) if final_mass else None,
            'final_spin': round(final_spin, 3) if final_spin else None,
            'gps_time': gps_time
        }
        
        processed_events.append(event_info)
    
    # Sort by detection date (most recent first)
    processed_events.sort(key=lambda x: x['gps_time'], reverse=True)
    
    print(f"Processed {len(processed_events)} events with complete mass data")
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
    
    print(f"Data saved to {output_file}")
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
        print("No events with valid mass data. Exiting.")
        return
    
    # Save to JSON
    output_path = "data/gw_events.json"
    save_data(processed_events, output_path)
    
    print("=" * 60)
    print("Data fetch completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
