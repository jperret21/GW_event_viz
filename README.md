# Gravitational Wave Events Visualization

![Update Data](https://github.com/yourusername/gw-events-viz/workflows/Update%20Data/badge.svg)

An interactive visualization of gravitational wave events detected by LIGO, Virgo, and KAGRA observatories. Data is automatically fetched from GWOSC (Gravitational Wave Open Science Center) and updated daily.

## Features

- **Interactive M1 vs M2 plot**: Visualize source masses of detected gravitational wave events
- **Color-coded by source type**: BBH (Binary Black Hole), BNS (Binary Neutron Star), NSBH (Neutron Star-Black Hole)
- **Size-scaled by SNR**: Signal-to-noise ratio represented by marker size
- **Hover information**: Detailed event information on hover
- **Auto-updated**: GitHub Actions fetches new data daily from GWOSC
- **Scientific accuracy**: Data directly from official LIGO/Virgo/KAGRA releases

## Live Demo

🔗 [View Live Visualization](https://yourusername.github.io/gw-events-viz/)

## Data Source

All gravitational wave event data is sourced from the [Gravitational Wave Open Science Center (GWOSC)](https://gwosc.org/), maintained by the LIGO Scientific Collaboration and Virgo Collaboration.

## Project Structure

```
gw-events-viz/
├── .github/
│   └── workflows/
│       └── update-data.yml    # GitHub Action for daily updates
├── data/
│   └── gw_events.json         # Processed GW event data
├── src/
│   └── fetch_gwosc_data.py    # Python script to fetch GWOSC data
├── docs/
│   └── index.html             # Interactive visualization page
└── README.md
```

## How It Works

1. **Daily data fetch**: A GitHub Action runs daily at 00:00 UTC
2. **GWOSC API query**: Python script fetches the latest gravitational wave event catalog
3. **Data processing**: Events are filtered and formatted for visualization
4. **Automatic commit**: New data is committed to the repository
5. **GitHub Pages**: The visualization is automatically updated

## Local Development

### Prerequisites

- Python 3.8+
- pip

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/gw-events-viz.git
cd gw-events-viz

# Install dependencies
pip install -r requirements.txt

# Fetch latest data
python src/fetch_gwosc_data.py

# Serve locally
python -m http.server 8000
# Open http://localhost:8000/docs/
```

## GitHub Actions Setup

The project uses GitHub Actions to automatically update data daily. To set up:

1. Fork this repository
2. Enable GitHub Pages in repository settings (source: `docs` folder)
3. The workflow will run automatically every day at midnight UTC
4. You can also manually trigger the workflow from the Actions tab

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for educational and research purposes.

## Acknowledgments

- Data provided by GWOSC (https://gwosc.org/)
- LIGO Scientific Collaboration
- Virgo Collaboration
- KAGRA Collaboration

## Citation

If you use this visualization in academic work, please cite:

```
LIGO Scientific Collaboration and Virgo Collaboration,
Gravitational Wave Open Science Center (GWOSC), https://gwosc.org/
```

---

**Last updated**: Auto-updated daily via GitHub Actions
