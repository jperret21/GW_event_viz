// Global data storage
let allEventsData = null;
let allEventsList = []; // All events including alternate versions

// Load and visualize gravitational wave data
async function loadData() {
    console.log('loadData called');
    console.log('Plotly available:', typeof Plotly !== 'undefined');
    try {
        console.log('Fetching data...');
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
    console.log('displayEvents called with', events.length, 'events');
    updateStats(events);
    console.log('Creating scatter plot...');
    createPlot(events);
    console.log('Creating mass distribution plot...');
    createMassDistributionPlot(events);
    console.log('Creating final mass plot...');
    createFinalMassPlot(events);
    updateFilterInfo(events.length, allEventsData.event_count);
    console.log('All plots created');
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

// Helper function to format value with confidence intervals
function formatWithCI(value, lower, upper, unit = '') {
    if (value === null || value === undefined) return 'N/A';

    // If no confidence intervals available
    if (lower === null || upper === null || lower === undefined || upper === undefined) {
        return `${value}${unit ? ' ' + unit : ''}`;
    }

    // Format as value^{+upper}_{lower}
    return `${value}<sup>+${upper}</sup><sub>${lower}</sub>${unit ? ' ' + unit : ''}`;
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

    // Display primary parameters with confidence intervals
    const parameters = [
        { label: 'Event Name', value: event.name },
        { label: 'Detection Date', value: event.detection_date },
        { label: 'Source Type', value: event.source_type },
        { label: 'Primary Mass (M₁)', value: formatWithCI(event.m1, event.m1_lower, event.m1_upper, 'M☉') },
        { label: 'Secondary Mass (M₂)', value: formatWithCI(event.m2, event.m2_lower, event.m2_upper, 'M☉') },
        { label: 'SNR', value: event.snr || 'N/A' },
        { label: 'Total Mass', value: formatWithCI(event.total_mass_source, event.total_mass_source_lower, event.total_mass_source_upper, 'M☉') },
        { label: 'Chirp Mass', value: formatWithCI(event.chirp_mass_source, event.chirp_mass_source_lower, event.chirp_mass_source_upper, 'M☉') },
        { label: 'Distance', value: formatWithCI(event.luminosity_distance, event.luminosity_distance_lower, event.luminosity_distance_upper, 'Mpc') },
        { label: 'Redshift', value: formatWithCI(event.redshift, event.redshift_lower, event.redshift_upper) },
        { label: 'Effective Spin (χₑff)', value: formatWithCI(event.chi_eff, event.chi_eff_lower, event.chi_eff_upper) },
        { label: 'Final Mass', value: formatWithCI(event.final_mass_source, event.final_mass_source_lower, event.final_mass_source_upper, 'M☉') },
        { label: 'Final Spin', value: formatWithCI(event.final_spin, event.final_spin_lower, event.final_spin_upper) },
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

        // Create version selector tabs
        const versionTabs = allVersions.map((version, index) => {
            const isPrimary = version.catalog === event.catalog;
            return `
                <button class="version-tab ${isPrimary ? 'active' : ''}"
                        onclick="switchEventVersion(${index})"
                        data-version-index="${index}">
                    ${version.catalog} ${isPrimary ? '★' : ''}
                </button>
            `;
        }).join('');

        versionsList.innerHTML = `
            <div class="version-tabs">
                ${versionTabs}
            </div>
            <div class="version-content-container">
                ${allVersions.map((version, index) => {
                    const isPrimary = version.catalog === event.catalog;
                    return `
                        <div class="version-content ${isPrimary ? 'active' : ''}" data-version-index="${index}">
                            <div class="version-card ${isPrimary ? 'is-primary' : ''}">
                                <div class="version-header">
                                    <div class="version-catalog">${version.catalog}</div>
                                    ${isPrimary ? '<span class="version-badge">Primary</span>' : ''}
                                </div>
                                <div class="version-params-detailed">
                                    <div class="version-param"><strong>Primary Mass (M₁):</strong> ${formatWithCI(version.m1, version.m1_lower, version.m1_upper, 'M☉')}</div>
                                    <div class="version-param"><strong>Secondary Mass (M₂):</strong> ${formatWithCI(version.m2, version.m2_lower, version.m2_upper, 'M☉')}</div>
                                    ${version.total_mass_source ? `<div class="version-param"><strong>Total Mass:</strong> ${formatWithCI(version.total_mass_source, version.total_mass_source_lower, version.total_mass_source_upper, 'M☉')}</div>` : ''}
                                    ${version.chirp_mass_source ? `<div class="version-param"><strong>Chirp Mass:</strong> ${formatWithCI(version.chirp_mass_source, version.chirp_mass_source_lower, version.chirp_mass_source_upper, 'M☉')}</div>` : ''}
                                    ${version.luminosity_distance ? `<div class="version-param"><strong>Luminosity Distance:</strong> ${formatWithCI(version.luminosity_distance, version.luminosity_distance_lower, version.luminosity_distance_upper, 'Mpc')}</div>` : ''}
                                    ${version.redshift !== null && version.redshift !== undefined ? `<div class="version-param"><strong>Redshift:</strong> ${formatWithCI(version.redshift, version.redshift_lower, version.redshift_upper)}</div>` : ''}
                                    ${version.chi_eff !== null ? `<div class="version-param"><strong>Effective Spin (χₑff):</strong> ${formatWithCI(version.chi_eff, version.chi_eff_lower, version.chi_eff_upper)}</div>` : ''}
                                    ${version.final_mass_source ? `<div class="version-param"><strong>Final Mass:</strong> ${formatWithCI(version.final_mass_source, version.final_mass_source_lower, version.final_mass_source_upper, 'M☉')}</div>` : ''}
                                    ${version.final_spin !== null ? `<div class="version-param"><strong>Final Spin:</strong> ${formatWithCI(version.final_spin, version.final_spin_lower, version.final_spin_upper)}</div>` : ''}
                                    ${version.snr ? `<div class="version-param"><strong>SNR:</strong> ${version.snr}</div>` : ''}
                                    ${version.far ? `<div class="version-param"><strong>FAR:</strong> ${version.far}</div>` : ''}
                                    ${version.p_astro !== null ? `<div class="version-param"><strong>P(astro):</strong> ${version.p_astro}</div>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
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

// Switch between event versions
function switchEventVersion(index) {
    // Update active tab
    document.querySelectorAll('.version-tab').forEach((tab, i) => {
        if (i === index) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Update active content
    document.querySelectorAll('.version-content').forEach((content, i) => {
        if (i === index) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Gaussian kernel for KDE
function gaussianKernel(x, xi, bandwidth) {
    const u = (x - xi) / bandwidth;
    return Math.exp(-0.5 * u * u) / (bandwidth * Math.sqrt(2 * Math.PI));
}

// Calculate KDE for a dataset
function calculateKDE(data, xValues, bandwidth) {
    const n = data.length;
    return xValues.map(x => {
        const density = data.reduce((sum, xi) => sum + gaussianKernel(x, xi, bandwidth), 0) / n;
        return density;
    });
}

// Silverman's rule of thumb for bandwidth selection
function silvermanBandwidth(data) {
    const n = data.length;
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const sigma = Math.min(
        Math.sqrt(data.reduce((sum, x) => sum + Math.pow(x - data.reduce((s, v) => s + v, 0) / n, 2), 0) / n),
        iqr / 1.34
    );
    return 1.06 * sigma * Math.pow(n, -1/5);
}

// Bootstrap resampling to generate confidence intervals
function bootstrapKDE(data, xValues, bandwidth, nBootstrap = 100) {
    const n = data.length;
    const bootstrapDensities = [];

    for (let b = 0; b < nBootstrap; b++) {
        // Resample with replacement
        const resample = [];
        for (let i = 0; i < n; i++) {
            resample.push(data[Math.floor(Math.random() * n)]);
        }

        // Calculate KDE for this bootstrap sample
        const density = calculateKDE(resample, xValues, bandwidth);
        bootstrapDensities.push(density);
    }

    // Calculate percentiles at each x value
    const lower = [];
    const upper = [];

    for (let i = 0; i < xValues.length; i++) {
        const values = bootstrapDensities.map(d => d[i]).sort((a, b) => a - b);
        lower.push(values[Math.floor(nBootstrap * 0.05)]); // 5th percentile (lower 90% CI)
        upper.push(values[Math.floor(nBootstrap * 0.95)]); // 95th percentile (upper 90% CI)
    }

    return { lower, upper };
}

// Create mass distribution plot with KDE
function createMassDistributionPlot(events) {
    // Extract mass data
    const m1Data = events.map(e => e.m1);
    const m2Data = events.map(e => e.m2);
    const allMasses = [...m1Data, ...m2Data];

    // Determine x range
    const minMass = Math.min(...allMasses);
    const maxMass = Math.max(...allMasses);
    const xValues = [];
    const nPoints = 300;
    for (let i = 0; i <= nPoints; i++) {
        xValues.push(minMass + (maxMass - minMass) * i / nPoints);
    }

    // Calculate bandwidth using Silverman's rule
    const bandwidth1 = silvermanBandwidth(m1Data);
    const bandwidth2 = silvermanBandwidth(m2Data);

    // Calculate KDE for both M1 and M2
    const kde1 = calculateKDE(m1Data, xValues, bandwidth1);
    const kde2 = calculateKDE(m2Data, xValues, bandwidth2);

    // Calculate confidence intervals via bootstrap (fewer samples for performance)
    const ci1 = bootstrapKDE(m1Data, xValues, bandwidth1, 50);
    const ci2 = bootstrapKDE(m2Data, xValues, bandwidth2, 50);

    // Create traces
    const traces = [];

    // M1 confidence interval (shaded area)
    traces.push({
        x: [...xValues, ...xValues.slice().reverse()],
        y: [...ci1.upper, ...ci1.lower.slice().reverse()],
        fill: 'toself',
        fillcolor: 'rgba(231, 76, 60, 0.15)',
        line: { color: 'transparent' },
        name: 'M₁ 90% CI',
        type: 'scatter',
        mode: 'lines',
        showlegend: true,
        hoverinfo: 'skip'
    });

    // M2 confidence interval (shaded area)
    traces.push({
        x: [...xValues, ...xValues.slice().reverse()],
        y: [...ci2.upper, ...ci2.lower.slice().reverse()],
        fill: 'toself',
        fillcolor: 'rgba(52, 152, 219, 0.15)',
        line: { color: 'transparent' },
        name: 'M₂ 90% CI',
        type: 'scatter',
        mode: 'lines',
        showlegend: true,
        hoverinfo: 'skip'
    });

    // M1 KDE line
    traces.push({
        x: xValues,
        y: kde1,
        mode: 'lines',
        name: 'Primary Mass (M₁)',
        line: {
            color: '#e74c3c',
            width: 3
        },
        type: 'scatter',
        hovertemplate: 'Mass: %{x:.1f} M☉<br>Density: %{y:.3f}<extra></extra>'
    });

    // M2 KDE line
    traces.push({
        x: xValues,
        y: kde2,
        mode: 'lines',
        name: 'Secondary Mass (M₂)',
        line: {
            color: '#3498db',
            width: 3
        },
        type: 'scatter',
        hovertemplate: 'Mass: %{x:.1f} M☉<br>Density: %{y:.3f}<extra></extra>'
    });

    // Layout
    const layout = {
        xaxis: {
            title: {
                text: 'Component Mass (M☉)',
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
            zeroline: false,
            range: [Math.max(0, minMass - 5), maxMass + 5]
        },
        yaxis: {
            title: {
                text: 'Probability Density',
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
            zeroline: true,
            rangemode: 'tozero'
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
            x: 0.98,
            y: 0.98,
            xanchor: 'right',
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
            filename: 'gw_mass_distribution',
            height: 600,
            width: 1200,
            scale: 2
        }
    };

    // Create plot
    Plotly.newPlot('massDistPlot', traces, layout, config);
}

// Create final mass distribution plot with mass gap analysis
function createFinalMassPlot(events) {
    // Extract final mass data
    const finalMasses = events
        .map(e => e.final_mass_source)
        .filter(m => m !== null && m !== undefined && !isNaN(m));

    if (finalMasses.length === 0) {
        console.log('No final mass data available');
        return;
    }

    // KDE parameters
    const minMass = 0;
    const maxMass = Math.max(...finalMasses) + 5;
    const numPoints = 500;
    const xValues = Array.from({ length: numPoints }, (_, i) => minMass + (maxMass - minMass) * i / (numPoints - 1));

    // Calculate bandwidth using Silverman's rule
    const bandwidth = silvermanBandwidth(finalMasses);

    // Calculate KDE
    const kde = calculateKDE(finalMasses, xValues, bandwidth);

    // Bootstrap for 90% confidence intervals
    const ci = bootstrapKDE(finalMasses, xValues, bandwidth, 50);

    // Create traces
    const traces = [];

    // Confidence interval (shaded area)
    traces.push({
        x: [...xValues, ...xValues.slice().reverse()],
        y: [...ci.upper, ...ci.lower.slice().reverse()],
        name: '90% CI',
        fill: 'toself',
        fillcolor: 'rgba(155, 89, 182, 0.2)',
        line: { color: 'transparent' },
        type: 'scatter',
        mode: 'lines',
        showlegend: true,
        hoverinfo: 'skip'
    });

    // KDE line
    traces.push({
        x: xValues,
        y: kde,
        mode: 'lines',
        name: 'Final Mass Distribution',
        line: {
            color: '#9b59b6',
            width: 3
        },
        type: 'scatter',
        hovertemplate: 'Mass: %{x:.1f} M☉<br>Density: %{y:.3f}<extra></extra>'
    });

    const maxDensity = Math.max(...kde) * 1.1;

    // Add shaded regions to highlight mass zones
    // Neutron Star region (0-2.5 M☉)
    traces.push({
        x: [0, 2.5, 2.5, 0, 0],
        y: [0, 0, maxDensity, maxDensity, 0],
        fill: 'toself',
        fillcolor: 'rgba(52, 152, 219, 0.08)',
        line: { color: 'transparent' },
        name: 'Neutron Stars',
        type: 'scatter',
        mode: 'lines',
        showlegend: true,
        hoverinfo: 'skip'
    });

    // Mass Gap region (2.5-5 M☉) - highlighted
    traces.push({
        x: [2.5, 5, 5, 2.5, 2.5],
        y: [0, 0, maxDensity, maxDensity, 0],
        fill: 'toself',
        fillcolor: 'rgba(255, 193, 7, 0.15)',
        line: { color: 'transparent' },
        name: 'Mass Gap',
        type: 'scatter',
        mode: 'lines',
        showlegend: true,
        hoverinfo: 'skip'
    });

    // Black Hole region (5+ M☉)
    traces.push({
        x: [5, maxMass, maxMass, 5, 5],
        y: [0, 0, maxDensity, maxDensity, 0],
        fill: 'toself',
        fillcolor: 'rgba(155, 89, 182, 0.08)',
        line: { color: 'transparent' },
        name: 'Black Holes',
        type: 'scatter',
        mode: 'lines',
        showlegend: true,
        hoverinfo: 'skip'
    });

    // Boundary lines
    traces.push({
        x: [2.5, 2.5],
        y: [0, maxDensity],
        mode: 'lines',
        name: 'NS/Gap Boundary',
        line: {
            color: '#3498db',
            width: 2,
            dash: 'dot'
        },
        showlegend: false,
        hovertemplate: 'NS/Mass Gap: 2.5 M☉<extra></extra>'
    });

    traces.push({
        x: [5, 5],
        y: [0, maxDensity],
        mode: 'lines',
        name: 'Gap/BH Boundary',
        line: {
            color: '#9b59b6',
            width: 2,
            dash: 'dot'
        },
        showlegend: false,
        hovertemplate: 'Mass Gap/BH: 5 M☉<extra></extra>'
    });

    // Layout
    const layout = {
        xaxis: {
            title: {
                text: 'Final Mass (M☉)',
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
            zeroline: false,
            range: [minMass, maxMass]
        },
        yaxis: {
            title: {
                text: 'Probability Density',
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
            zeroline: true
        },
        showlegend: true,
        legend: {
            x: 0.98,
            y: 0.98,
            xanchor: 'right',
            yanchor: 'top',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            bordercolor: '#ccc',
            borderwidth: 1
        },
        hovermode: 'x unified',
        plot_bgcolor: '#fff',
        paper_bgcolor: '#fff',
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
            filename: 'gw_final_mass_distribution',
            height: 600,
            width: 1200,
            scale: 2
        }
    };

    // Create plot
    Plotly.newPlot('finalMassPlot', traces, layout, config);
}

// Load data on page load
loadData();
