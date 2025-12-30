# Contributing to GW Events Visualization

Thank you for your interest in contributing to this project! This document provides guidelines for contributing.

## Ways to Contribute

### 1. Report Issues
- Bug reports
- Feature requests
- Documentation improvements
- Data accuracy issues

### 2. Submit Pull Requests
- Bug fixes
- New features
- Documentation updates
- Code optimization

### 3. Improve Visualization
- Better color schemes
- Additional plots
- Enhanced interactivity
- Mobile responsiveness

## Development Setup

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/gw-events-viz.git
cd gw-events-viz
```

3. Create a branch:
```bash
git checkout -b feature/your-feature-name
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Make your changes

6. Test locally:
```bash
# Test data fetch
python src/fetch_gwosc_data.py

# Test visualization
python -m http.server 8000
# Open http://localhost:8000/docs/
```

7. Commit and push:
```bash
git add .
git commit -m "Description of your changes"
git push origin feature/your-feature-name
```

8. Open a Pull Request

## Code Style Guidelines

### Python
- Follow PEP 8 style guide
- Use meaningful variable names
- Add docstrings to functions
- Include error handling

### HTML/CSS/JavaScript
- Use consistent indentation (2 or 4 spaces)
- Add comments for complex logic
- Keep functions small and focused
- Test in multiple browsers

## Adding New Features

### New Event Properties
To display additional properties from GWOSC:

1. Edit `src/fetch_gwosc_data.py`:
```python
# Extract new property
new_param = params.get('new_param', {}).get('median')

# Add to event_info dictionary
event_info = {
    # ... existing fields ...
    'new_param': new_param
}
```

2. Update `docs/index.html` to display it:
```javascript
text: events.map(e => 
    `<b>${e.name}</b><br>` +
    // ... existing fields ...
    `New Param: ${e.new_param}<br>`
)
```

### New Plots
To add new visualizations:

1. Create a new section in `docs/index.html`
2. Add a new div for the plot
3. Create a new plotting function
4. Call it from `loadData()`

Example for a Distance vs SNR plot:
```javascript
function createDistancePlot(events) {
    // Similar structure to createPlot()
    // Use luminosity_distance and snr fields
}
```

## Testing

Before submitting a PR, please test:

1. **Data fetch**: Run the Python script successfully
2. **Visualization**: All plots render correctly
3. **Hover info**: Event details display properly
4. **Responsive**: Works on mobile devices
5. **Browser compatibility**: Test in Chrome, Firefox, Safari

## Documentation

Please update documentation for:
- New features added
- Changed functionality
- New dependencies
- Modified configuration

## Questions?

Feel free to open an issue for:
- Feature discussions
- Implementation questions
- Technical guidance
- General inquiries

## Code of Conduct

- Be respectful and professional
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the project

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Acknowledgments

All gravitational wave data is provided by GWOSC and the LIGO/Virgo/KAGRA collaborations. Please respect their work and cite appropriately in scientific publications.

---

Thank you for contributing! 🌌
