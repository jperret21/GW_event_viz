# Quick Start Guide

## Setup on GitHub

### 1. Create a New Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `gw-events-viz` (or your preferred name)
3. Make it public (required for GitHub Pages)
4. Don't initialize with README (we already have one)

### 2. Push Your Code

```bash
cd gw-events-viz
git init
git add .
git commit -m "Initial commit: GW events visualization"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gw-events-viz.git
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section (left sidebar)
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/docs`
5. Click **Save**
6. Your site will be available at: `https://YOUR_USERNAME.github.io/gw-events-viz/`

### 4. Enable GitHub Actions

1. Go to **Actions** tab in your repository
2. Click "I understand my workflows, go ahead and enable them"
3. The workflow will run automatically:
   - Daily at midnight UTC
   - On every push to main
   - Manually via "Run workflow" button

### 5. First Data Fetch

Option A: **Wait for automatic run** (next midnight UTC)

Option B: **Manual trigger**
1. Go to **Actions** tab
2. Click on "Update Gravitational Wave Data" workflow
3. Click "Run workflow" dropdown
4. Click green "Run workflow" button

### 6. View Your Visualization

After the first data fetch completes:
- Visit: `https://YOUR_USERNAME.github.io/gw-events-viz/`
- The page will display all gravitational wave events
- Data updates automatically every day

## Local Testing

### Test the Python Script

```bash
# Install dependencies
pip install -r requirements.txt

# Fetch data
python src/fetch_gwosc_data.py

# Verify data file was created
cat data/gw_events.json
```

### Test the Visualization

```bash
# Start a local web server
python -m http.server 8000

# Open in browser
# http://localhost:8000/docs/
```

## Customization

### Change Update Frequency

Edit `.github/workflows/update-data.yml`:

```yaml
schedule:
  - cron: '0 0 * * *'  # Daily at midnight
  # - cron: '0 */6 * * *'  # Every 6 hours
  # - cron: '0 0 * * 0'  # Weekly on Sunday
```

### Modify Visualization

Edit `docs/index.html`:
- Change colors in CSS `:root` variables
- Modify plot layout in the `layout` object
- Adjust marker sizes, opacity, etc.

### Filter Events

Edit `src/fetch_gwosc_data.py`:
- Add filters in `extract_event_parameters()`
- Example: only include events with SNR > 15
- Example: only include events from specific runs

## Troubleshooting

### Workflow Not Running

- Check if Actions are enabled in repository settings
- Verify the workflow file is in `.github/workflows/`
- Check Actions tab for error messages

### No Data Displayed

- Verify `data/gw_events.json` exists and has valid JSON
- Check browser console (F12) for errors
- Ensure GitHub Pages is serving from `/docs` folder

### GWOSC API Issues

The script handles API errors gracefully. If GWOSC is down:
- The workflow will fail but not break the site
- Previous data remains available
- Next scheduled run will retry

## Advanced Features

### Add More Event Properties

In `src/fetch_gwosc_data.py`, extract additional parameters:
```python
redshift = params.get('redshift', {}).get('median')
chi_eff = params.get('chi_eff', {}).get('median')
```

### Multiple Plots

Create additional HTML pages for:
- SNR vs Distance
- Mass vs Redshift
- Detection timeline
- Sky localization maps

### Email Notifications

Add to workflow:
```yaml
- name: Send notification
  if: steps.check_changes.outputs.changes == 'true'
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{secrets.MAIL_USERNAME}}
    password: ${{secrets.MAIL_PASSWORD}}
    subject: New GW Events Detected!
    body: Check the latest gravitational wave events
```

## Resources

- [GWOSC Documentation](https://gwosc.org/documentation/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Plotly.js Documentation](https://plotly.com/javascript/)
- [GitHub Pages Guide](https://pages.github.com/)

## Support

For issues or questions:
1. Check the [GWOSC documentation](https://gwosc.org/)
2. Review GitHub Actions logs for errors
3. Open an issue in your repository

---

**Happy visualizing! 🌌**
