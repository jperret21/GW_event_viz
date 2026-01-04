// Global data storage
let allEventsData = null;
let allEventsList = []; // All events including alternate versions

// Load and visualize gravitational wave data
async function loadData() {
    try {
        const response = await fetch('./data/gw_events.json');

        if (!response.ok) throw new Error('Failed to load data');

        const data = await response.json();
        allEventsData = data; // Store globally
        allEventsList = data.all_events || data.events; // Store all versions

        // Populate catalog filter
        populateCatalogFilter(data.events);

        // Display unique events by default
        displayEvents(data.events);

        // Update last update time
        const updateDate = new Date(data.updated);
        document.getElementById('lastUpdate').textContent =
            updateDate.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC'
            }) + ' UTC';

        // Setup close button for detail panel
        document.getElementById('closeDetailPanel').addEventListener('click', closeDetailPanel);

    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('massPlot').innerHTML =
            '<div class="loading">Failed to load data. Please refresh the page.</div>';
    }
}

function populateCatalogFilter(events) {
    // Define catalog order and display names
    const catalogInfo = {
        'all': { display: 'All Catalogs (Unique Events)', priority: 0 },
        'GWTC-4.0': { display: 'GWTC-4.0 (O4 Run)', priority: 1 },
        'GWTC-3-confident': { display: 'GWTC-3 Confident (O3 Run)', priority: 2 },
        'GWTC-2.1-confident': { display: 'GWTC-2.1 Confident (O2 Run)', priority: 3 },
        'GWTC-1-confident': { display: 'GWTC-1 Confident (O1 Run)', priority: 4 },
        'O4_Discovery_Papers': { display: 'O4 Discovery Papers (Preliminary)', priority: 5 },
    };

    // Extract unique catalogs and sort by priority
    const uniqueCatalogs = [...new Set(allEventsList.map(e => e.catalog))].filter(c => c && c !== 'unknown');
    const sortedCatalogs = uniqueCatalogs
        .filter(c => catalogInfo[c]) // Only include known catalogs
        .sort((a, b) => catalogInfo[a].priority - catalogInfo[b].priority);

    const select = document.getElementById('catalogFilter');

    // Clear existing options except "All Events"
    select.innerHTML = '<option value="all">All Catalogs (Unique Events)</option>';

    // Add catalog options
    sortedCatalogs.forEach(catalog => {
        const option = document.createElement('option');
        option.value = catalog;
        option.textContent = catalogInfo[catalog].display;
        select.appendChild(option);
    });

    // Add event listener
    select.addEventListener('change', (e) => {
        const selectedCatalog = e.target.value;
        if (selectedCatalog === 'all') {
            displayEvents(allEventsData.events); // Show unique events
        } else {
            const filtered = allEventsList.filter(event => event.catalog === selectedCatalog);
            displayEvents(filtered);
        }
    });
}

function displayEvents(events) {
    updateStats(events);
    createPlot(events);
    updateFilterInfo(events.length, allEventsData.event_count);
}

function updateFilterInfo(displayed, total) {
    const info = document.getElementById('filterInfo');
    const uniqueCount = allEventsData.unique_events || total;
    if (displayed === uniqueCount) {
        info.textContent = `Showing all ${uniqueCount} unique events`;
    } else {
        info.textContent = `Showing ${displayed} of ${uniqueCount} events`;
    }
}

function updateStats(events) {
    const totalCount = events.length;
    const bbhCount = events.filter(e => e.source_type === 'BBH').length;
    const nsbhCount = events.filter(e => e.source_type === 'NSBH').length;
    const bnsCount = events.filter(e => e.source_type === 'BNS').length;
    
    document.getElementById('totalEvents').textContent = totalCount;
    document.getElementById('bbhCount').textContent = bbhCount;
    document.getElementById('nsbhCount').textContent = nsbhCount;
    document.getElementById('bnsCount').textContent = bnsCount;
}

function createPlot(events) {
    // Group events by source type
    const bbhEvents = events.filter(e => e.source_type === 'BBH');
    const nsbhEvents = events.filter(e => e.source_type === 'NSBH');
    const bnsEvents = events.filter(e => e.source_type === 'BNS');
    
    // Create traces for each source type
    const traces = [];
    
    if (bbhEvents.length > 0) {
        traces.push(createTrace(bbhEvents, 'BBH (Binary Black Hole)', '#9b59b6'));
    }
    
    if (nsbhEvents.length > 0) {
        traces.push(createTrace(nsbhEvents, 'NSBH (NS-BH)', '#e67e22'));
    }
    
    if (bnsEvents.length > 0) {
        traces.push(createTrace(bnsEvents, 'BNS (Binary NS)', '#3498db'));
    }
    
    // Layout configuration - clean academic style
    const layout = {
        xaxis: {
            title: {
                text: 'Primary Mass M₁ (M☉)',
                font: { 
                    family: 'Arial, sans-serif',
                    size: 14,
                    color: '#333'
                }
            },
            gridcolor: '#e0e0e0',
            tickfont: { color: '#666' },
            showline: true,
            linecolor: '#ccc',
            zeroline: false
        },
        yaxis: {
            title: {
                text: 'Secondary Mass M₂ (M☉)',
                font: { 
                    family: 'Arial, sans-serif',
                    size: 14,
                    color: '#333'
                }
            },
            gridcolor: '#e0e0e0',
            tickfont: { color: '#666' },
            showline: true,
            linecolor: '#ccc',
            zeroline: false
        },
        plot_bgcolor: '#ffffff',
        paper_bgcolor: '#ffffff',
        hovermode: 'closest',
        showlegend: true,
        legend: {
            font: { 
                family: 'Arial, sans-serif',
                color: '#333'
            },
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            bordercolor: '#ccc',
            borderwidth: 1,
            x: 0.02,
            y: 0.98,
            xanchor: 'left',
            yanchor: 'top'
        },
        margin: { l: 60, r: 30, t: 30, b: 60 },
        autosize: true
    };
    
    // Configuration
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        toImageButtonOptions: {
            format: 'png',
            filename: 'gw_events_mass_plot',
            height: 1000,
            width: 1400,
            scale: 2
        }
    };

    // Create plot
    Plotly.newPlot('massPlot', traces, layout, config);

    // Add click event listener
    document.getElementById('massPlot').on('plotly_click', function(data) {
        const pointIndex = data.points[0].pointIndex;
        const curveNumber = data.points[0].curveNumber;

        // Determine which event was clicked based on trace and index
        let clickedEvent;
        if (curveNumber === 0 && bbhEvents.length > 0) {
            clickedEvent = bbhEvents[pointIndex];
        } else if ((curveNumber === 1 && nsbhEvents.length > 0) || (curveNumber === 0 && bbhEvents.length === 0)) {
            clickedEvent = nsbhEvents[pointIndex];
        } else {
            clickedEvent = bnsEvents[pointIndex];
        }

        showEventDetails(clickedEvent);
    });
}

function createTrace(events, name, color) {
    return {
        x: events.map(e => e.m1),
        y: events.map(e => e.m2),
        mode: 'markers',
        type: 'scatter',
        name: name,
        marker: {
            size: events.map(e => Math.max(8, Math.min(25, e.snr || 10))),
            color: color,
            opacity: 0.7,
            line: {
                color: color,
                width: 1.5
            },
            symbol: 'circle'
        },
        text: events.map(e => 
            `<b>${e.name}</b><br>` +
            `M₁: ${e.m1} M☉<br>` +
            `M₂: ${e.m2} M☉<br>` +
            `SNR: ${e.snr || 'N/A'}<br>` +
            `Type: ${e.source_type}<br>` +
            `Date: ${e.detection_date}` +
            (e.luminosity_distance ? `<br>Distance: ${e.luminosity_distance} Mpc` : '') +
            (e.final_mass_source ? `<br>Final Mass: ${e.final_mass_source} M☉` : '') +
            (e.final_spin ? `<br>Final Spin: ${e.final_spin}` : '')
        ),
        hovertemplate: '%{text}<extra></extra>',
        hoverlabel: {
            bgcolor: '#ffffff',
            bordercolor: color,
            font: {
                family: 'Arial, sans-serif',
                size: 12,
                color: '#333'
            }
        }
    };
}

// Show event details panel
function showEventDetails(event) {
    const panel = document.getElementById('eventDetailPanel');
    const eventName = document.getElementById('detailEventName');
    const primaryParams = document.getElementById('primaryParameters');
    const versionsSection = document.getElementById('versionsSection');
    const versionsList = document.getElementById('versionsList');

    // Set event name
    eventName.textContent = event.name;

    // Display primary parameters
    const parameters = [
        { label: 'Event Name', value: event.name },
        { label: 'Detection Date', value: event.detection_date },
        { label: 'Source Type', value: event.source_type },
        { label: 'Primary Mass (M₁)', value: `${event.m1} M☉` },
        { label: 'Secondary Mass (M₂)', value: `${event.m2} M☉` },
        { label: 'SNR', value: event.snr || 'N/A' },
        { label: 'Total Mass', value: event.total_mass_source ? `${event.total_mass_source} M☉` : 'N/A' },
        { label: 'Chirp Mass', value: event.chirp_mass_source ? `${event.chirp_mass_source} M☉` : 'N/A' },
        { label: 'Distance', value: event.luminosity_distance ? `${event.luminosity_distance} Mpc` : 'N/A' },
        { label: 'Redshift', value: event.redshift || 'N/A' },
        { label: 'Effective Spin (χₑff)', value: event.chi_eff !== null ? event.chi_eff : 'N/A' },
        { label: 'Final Mass', value: event.final_mass_source ? `${event.final_mass_source} M☉` : 'N/A' },
        { label: 'Final Spin', value: event.final_spin !== null ? event.final_spin : 'N/A' },
        { label: 'Primary Catalog', value: event.catalog },
    ];

    primaryParams.innerHTML = parameters.map(p => `
        <div class="parameter-item">
            <div class="parameter-label">${p.label}</div>
            <div class="parameter-value">${p.value}</div>
        </div>
    `).join('');

    // Find all versions of this event
    const allVersions = allEventsList.filter(e => e.name === event.name);

    if (allVersions.length > 1) {
        versionsSection.style.display = 'block';
        versionsList.innerHTML = allVersions.map(version => {
            const isPrimary = version.catalog === event.catalog;
            return `
                <div class="version-card ${isPrimary ? 'is-primary' : ''}">
                    <div class="version-header">
                        <div class="version-catalog">${version.catalog}</div>
                        ${isPrimary ? '<span class="version-badge">Primary</span>' : ''}
                    </div>
                    <div class="version-params">
                        <div class="version-param"><strong>M₁:</strong> ${version.m1} M☉</div>
                        <div class="version-param"><strong>M₂:</strong> ${version.m2} M☉</div>
                        ${version.total_mass_source ? `<div class="version-param"><strong>Total:</strong> ${version.total_mass_source} M☉</div>` : ''}
                        ${version.luminosity_distance ? `<div class="version-param"><strong>Distance:</strong> ${version.luminosity_distance} Mpc</div>` : ''}
                        ${version.chi_eff !== null ? `<div class="version-param"><strong>χₑff:</strong> ${version.chi_eff}</div>` : ''}
                        ${version.final_mass_source ? `<div class="version-param"><strong>Final Mass:</strong> ${version.final_mass_source} M☉</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        versionsSection.style.display = 'none';
    }

    // Show panel and scroll to it
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Close event details panel
function closeDetailPanel() {
    document.getElementById('eventDetailPanel').style.display = 'none';
}

// Load data on page load
loadData();
