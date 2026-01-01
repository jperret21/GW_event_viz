// Global data storage
let allEventsData = null;

// Load and visualize gravitational wave data
async function loadData() {
    try {
        const response = await fetch('./data/gw_events.json');
        
        if (!response.ok) throw new Error('Failed to load data');
        
        const data = await response.json();
        allEventsData = data; // Store globally
        
        // Populate catalog filter
        populateCatalogFilter(data.events);
        
        // Display all events initially
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
        
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('massPlot').innerHTML = 
            '<div class="loading">Failed to load data. Please refresh the page.</div>';
    }
}

function populateCatalogFilter(events) {
    // Extract unique catalogs from catalog field
    const catalogs = [...new Set(events.map(e => e.catalog))].filter(c => c && c !== 'unknown').sort();
    
    const select = document.getElementById('catalogFilter');
    
    // Add catalog options
    catalogs.forEach(catalog => {
        const option = document.createElement('option');
        option.value = catalog;
        option.textContent = catalog;
        select.appendChild(option);
    });
    
    // Add event listener
    select.addEventListener('change', (e) => {
        const selectedCatalog = e.target.value;
        if (selectedCatalog === 'all') {
            displayEvents(allEventsData.events);
        } else {
            const filtered = allEventsData.events.filter(event => event.catalog === selectedCatalog);
            displayEvents(filtered);
        }
    });
}

function displayEvents(events) {
    updateStats(events);
    createPlot(events);
    updateFilterInfo(events.length, allEventsData.event_count);
    
    // Create additional plots
    createMassHistograms(events);
    createSpinPlot(events);
    createTimelinePlot(events);
}

function updateFilterInfo(displayed, total) {
    const info = document.getElementById('filterInfo');
    if (displayed === total) {
        info.textContent = `Showing all ${total} events`;
    } else {
        info.textContent = `Showing ${displayed} of ${total} events`;
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

// Create mass distribution histograms
function createMassHistograms(events) {
    const m1_values = events.map(e => e.m1);
    const m2_values = events.map(e => e.m2);
    const mtotal_values = events.map(e => e.m1 + e.m2);
    
    const traces = [
        {
            x: m1_values,
            type: 'histogram',
            name: 'M₁ (Primary)',
            opacity: 0.7,
            marker: { color: '#0066cc' },
            xbins: { size: 5 }
        },
        {
            x: m2_values,
            type: 'histogram',
            name: 'M₂ (Secondary)',
            opacity: 0.7,
            marker: { color: '#ff8c42' },
            xbins: { size: 5 }
        },
        {
            x: mtotal_values,
            type: 'histogram',
            name: 'M_total',
            opacity: 0.7,
            marker: { color: '#2ecc71' },
            xbins: { size: 5 }
        }
    ];
    
    const layout = {
        xaxis: {
            title: 'Mass (M☉)',
            gridcolor: '#e0e0e0',
            tickfont: { color: '#666' }
        },
        yaxis: {
            title: 'Count',
            gridcolor: '#e0e0e0',
            tickfont: { color: '#666' }
        },
        barmode: 'overlay',
        plot_bgcolor: '#ffffff',
        paper_bgcolor: '#ffffff',
        showlegend: true,
        legend: {
            x: 0.7,
            y: 0.98,
            bgcolor: 'rgba(255,255,255,0.9)',
            bordercolor: '#ccc',
            borderwidth: 1
        },
        margin: { l: 50, r: 30, t: 30, b: 50 }
    };
    
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };
    
    Plotly.newPlot('massHistogram', traces, layout, config);
}

// Create effective spin distribution
function createSpinPlot(events) {
    const eventsWithSpin = events.filter(e => e.chi_eff !== null && e.chi_eff !== undefined);
    
    if (eventsWithSpin.length === 0) {
        document.getElementById('spinPlot').innerHTML = 
            '<div style="text-align:center;padding:2rem;color:#999;">No spin data available for current selection</div>';
        return;
    }
    
    const spinValues = eventsWithSpin.map(e => e.chi_eff);
    
    const trace = {
        x: spinValues,
        type: 'histogram',
        marker: { 
            color: '#9b59b6',
            line: { color: '#8e44ad', width: 1 }
        },
        opacity: 0.75,
        xbins: { size: 0.1 }
    };
    
    const layout = {
        xaxis: {
            title: 'Effective Spin (χₑff)',
            gridcolor: '#e0e0e0',
            tickfont: { color: '#666' },
            zeroline: true,
            zerolinecolor: '#999',
            zerolinewidth: 2
        },
        yaxis: {
            title: 'Count',
            gridcolor: '#e0e0e0',
            tickfont: { color: '#666' }
        },
        plot_bgcolor: '#ffffff',
        paper_bgcolor: '#ffffff',
        showlegend: false,
        margin: { l: 50, r: 30, t: 30, b: 50 },
        annotations: [{
            x: 0,
            y: 0,
            xref: 'x',
            yref: 'paper',
            text: 'Non-spinning',
            showarrow: false,
            font: { size: 10, color: '#999' },
            yshift: -20
        }]
    };
    
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };
    
    Plotly.newPlot('spinPlot', [trace], layout, config);
}

// Create cumulative detections timeline
function createTimelinePlot(events) {
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => {
        return new Date(a.detection_date) - new Date(b.detection_date);
    });
    
    // Create cumulative count
    const dates = [];
    const counts = [];
    const bbhCounts = [];
    const nsbhCounts = [];
    const bnsCounts = [];
    
    let totalCount = 0;
    let bbhCount = 0;
    let nsbhCount = 0;
    let bnsCount = 0;
    
    sortedEvents.forEach(event => {
        if (event.detection_date !== 'Unknown') {
            dates.push(event.detection_date);
            totalCount++;
            counts.push(totalCount);
            
            if (event.source_type === 'BBH') bbhCount++;
            if (event.source_type === 'NSBH') nsbhCount++;
            if (event.source_type === 'BNS') bnsCount++;
            
            bbhCounts.push(bbhCount);
            nsbhCounts.push(nsbhCount);
            bnsCounts.push(bnsCount);
        }
    });
    
    const traces = [
        {
            x: dates,
            y: counts,
            type: 'scatter',
            mode: 'lines',
            name: 'Total',
            line: { color: '#333', width: 3 }
        },
        {
            x: dates,
            y: bbhCounts,
            type: 'scatter',
            mode: 'lines',
            name: 'BBH',
            line: { color: '#9b59b6', width: 2 }
        },
        {
            x: dates,
            y: nsbhCounts,
            type: 'scatter',
            mode: 'lines',
            name: 'NSBH',
            line: { color: '#e67e22', width: 2 }
        },
        {
            x: dates,
            y: bnsCounts,
            type: 'scatter',
            mode: 'lines',
            name: 'BNS',
            line: { color: '#3498db', width: 2 }
        }
    ];
    
    const layout = {
        xaxis: {
            title: 'Detection Date',
            gridcolor: '#e0e0e0',
            tickfont: { color: '#666' }
        },
        yaxis: {
            title: 'Cumulative Detections',
            gridcolor: '#e0e0e0',
            tickfont: { color: '#666' }
        },
        plot_bgcolor: '#ffffff',
        paper_bgcolor: '#ffffff',
        showlegend: true,
        legend: {
            x: 0.02,
            y: 0.98,
            bgcolor: 'rgba(255,255,255,0.9)',
            bordercolor: '#ccc',
            borderwidth: 1
        },
        margin: { l: 50, r: 30, t: 30, b: 50 }
    };
    
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };
    
    Plotly.newPlot('timelinePlot', traces, layout, config);
}

// Load data on page load
loadData();
