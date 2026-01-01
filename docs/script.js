/**
 * GW Event Visualization
 * Robust, fail-soft version
 * Author: Jules Perret
 */

// ===============================
// Global data storage
// ===============================
let allEventsData = null;

// ===============================
// Init
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

// ===============================
// Data loading
// ===============================
async function loadData() {
    try {
        const response = await fetch('./data/gw_events.json');
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.events)) {
            throw new Error('Invalid data format');
        }

        allEventsData = data;

        populateCatalogFilter(data.events);
        displayEvents(data.events);
        updateLastUpdate(data.updated);

    } catch (error) {
        console.error('Error loading GW data:', error);
        const plot = document.getElementById('massPlot');
        if (plot) {
            plot.innerHTML =
                '<div class="loading">Failed to load data.</div>';
        }
    }
}

// ===============================
// Header info
// ===============================
function updateLastUpdate(updated) {
    const el = document.getElementById('lastUpdate');
    if (!el || !updated) return;

    const date = new Date(updated);
    el.textContent =
        date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        }) + ' UTC';
}

// ===============================
// Catalog filter (optional)
// ===============================
function populateCatalogFilter(events) {
    const select = document.getElementById('catalogFilter');
    if (!select) return;

    const catalogs = [...new Set(events.map(e => e.catalog))]
        .filter(c => c && c !== 'unknown')
        .sort();

    catalogs.forEach(catalog => {
        const option = document.createElement('option');
        option.value = catalog;
        option.textContent = catalog;
        select.appendChild(option);
    });

    select.addEventListener('change', e => {
        const value = e.target.value;
        displayEvents(
            value === 'all'
                ? allEventsData.events
                : allEventsData.events.filter(ev => ev.catalog === value)
        );
    });
}

// ===============================
// Main display
// ===============================
function displayEvents(events) {
    updateStats(events);
    updateFilterInfo(events.length, allEventsData.events.length);

    createPlot(events);
    createMassHistograms(events);
    createSpinPlot(events);
    createTimelinePlot(events);
}

// ===============================
// Stats cards
// ===============================
function updateStats(events) {
    setText('totalEvents', events.length);
    setText('bbhCount', events.filter(e => e.source_type === 'BBH').length);
    setText('nsbhCount', events.filter(e => e.source_type === 'NSBH').length);
    setText('bnsCount', events.filter(e => e.source_type === 'BNS').length);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ===============================
// Filter info (optional)
// ===============================
function updateFilterInfo(displayed, total) {
    const info = document.getElementById('filterInfo');
    if (!info) return;

    info.textContent =
        displayed === total
            ? `Showing all ${total} events`
            : `Showing ${displayed} of ${total} events`;
}

// ===============================
// Main mass plot
// ===============================
function createPlot(events) {
    const container = document.getElementById('massPlot');
    if (!container) return;

    const traces = [];

    const groups = {
        BBH: { label: 'BBH (Binary Black Hole)', color: '#9b59b6' },
        NSBH: { label: 'NSBH (NS-BH)', color: '#e67e22' },
        BNS: { label: 'BNS (Binary NS)', color: '#3498db' }
    };

    Object.keys(groups).forEach(type => {
        const subset = events.filter(e => e.source_type === type);
        if (subset.length > 0) {
            traces.push(createTrace(subset, groups[type].label, groups[type].color));
        }
    });

    const layout = {
        xaxis: { title: 'Primary Mass M₁ (M☉)', gridcolor: '#e0e0e0' },
        yaxis: { title: 'Secondary Mass M₂ (M☉)', gridcolor: '#e0e0e0' },
        plot_bgcolor: '#ffffff',
        paper_bgcolor: '#ffffff',
        hovermode: 'closest',
        margin: { l: 60, r: 30, t: 30, b: 60 },
        legend: {
            x: 0.02,
            y: 0.98,
            bgcolor: 'rgba(255,255,255,0.9)',
            bordercolor: '#ccc',
            borderwidth: 1
        }
    };

    Plotly.newPlot(container, traces, layout, {
        responsive: true,
        displaylogo: false
    });
}

function createTrace(events, name, color) {
    return {
        x: events.map(e => e.m1),
        y: events.map(e => e.m2),
        mode: 'markers',
        type: 'scatter',
        name,
        marker: {
            size: events.map(e => Math.max(8, Math.min(25, e.snr || 10))),
            color,
            opacity: 0.7,
            line: { color, width: 1 }
        },
        text: events.map(e =>
            `<b>${e.name}</b><br>
             M₁: ${e.m1} M☉<br>
             M₂: ${e.m2} M☉<br>
             SNR: ${e.snr ?? 'N/A'}<br>
             Type: ${e.source_type}<br>
             Date: ${e.detection_date}`
        ),
        hovertemplate: '%{text}<extra></extra>'
    };
}

// ===============================
// Mass histograms
// ===============================
function createMassHistograms(events) {
    const container = document.getElementById('massHistogram');
    if (!container) return;

    const traces = [
        { x: events.map(e => e.m1), type: 'histogram', name: 'M₁' },
        { x: events.map(e => e.m2), type: 'histogram', name: 'M₂' },
        { x: events.map(e => e.m1 + e.m2), type: 'histogram', name: 'M_total' }
    ];

    Plotly.newPlot(container, traces, {
        barmode: 'overlay',
        plot_bgcolor: '#fff',
        paper_bgcolor: '#fff'
    }, { responsive: true });
}

// ===============================
// Spin plot
// ===============================
function createSpinPlot(events) {
    const container = document.getElementById('spinPlot');
    if (!container) return;

    const values = events
        .map(e => e.chi_eff)
        .filter(v => v !== null && v !== undefined);

    if (values.length === 0) {
        container.innerHTML =
            '<div style="text-align:center;padding:2rem;color:#999;">No spin data</div>';
        return;
    }

    Plotly.newPlot(container, [{
        x: values,
        type: 'histogram'
    }], {
        xaxis: { title: 'χₑff' },
        plot_bgcolor: '#fff',
        paper_bgcolor: '#fff'
    }, { responsive: true });
}

// ===============================
// Timeline
// ===============================
function createTimelinePlot(events) {
    const container = document.getElementById('timelinePlot');
    if (!container) return;

    const sorted = [...events]
        .filter(e => e.detection_date && e.detection_date !== 'Unknown')
        .sort((a, b) => new Date(a.detection_date) - new Date(b.detection_date));

    let count = 0;
    const dates = [];
    const totals = [];

    sorted.forEach(e => {
        dates.push(e.detection_date);
        totals.push(++count);
    });

    Plotly.newPlot(container, [{
        x: dates,
        y: totals,
        type: 'scatter',
        mode: 'lines',
        name: 'Cumulative detections'
    }], {
        xaxis: { title: 'Date' },
        yaxis: { title: 'Cumulative detections' },
        plot_bgcolor: '#fff',
        paper_bgcolor: '#fff'
    }, { responsive: true });
}
