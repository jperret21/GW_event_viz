#!/bin/bash

# Gravitational Wave Events Visualization - Setup Script
# This script helps initialize the project on GitHub

set -e

echo "=============================================="
echo "GW Events Visualization - Setup Script"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

echo -e "${BLUE}Step 1: Repository Setup${NC}"
echo "Please enter your GitHub username:"
read -r GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GitHub username cannot be empty"
    exit 1
fi

REPO_NAME="gw-events-viz"
echo ""
echo "Repository will be created as: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""

# Update README with username
echo -e "${BLUE}Step 2: Updating README with your username${NC}"
sed -i.bak "s/yourusername/$GITHUB_USERNAME/g" README.md
rm README.md.bak 2>/dev/null || true
echo -e "${GREEN}✓ README updated${NC}"

# Initialize git repository
echo ""
echo -e "${BLUE}Step 3: Initializing Git repository${NC}"
if [ ! -d .git ]; then
    git init
    echo -e "${GREEN}✓ Git repository initialized${NC}"
else
    echo -e "${YELLOW}⚠ Git repository already exists${NC}"
fi

# Create initial commit
echo ""
echo -e "${BLUE}Step 4: Creating initial commit${NC}"
git add .
git commit -m "Initial commit: Gravitational Wave Events Visualization" 2>/dev/null || echo -e "${YELLOW}⚠ No changes to commit${NC}"

# Set main branch
git branch -M main 2>/dev/null || true
echo -e "${GREEN}✓ Set main branch${NC}"

# Add remote
echo ""
echo -e "${BLUE}Step 5: Adding GitHub remote${NC}"
REMOTE_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"
echo -e "${GREEN}✓ Remote added: $REMOTE_URL${NC}"

echo ""
echo "=============================================="
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "=============================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Create the repository on GitHub:"
echo "   - Go to: https://github.com/new"
echo "   - Repository name: $REPO_NAME"
echo "   - Make it PUBLIC (required for GitHub Pages)"
echo "   - Don't initialize with README"
echo "   - Click 'Create repository'"
echo ""
echo "2. Push your code:"
echo "   git push -u origin main"
echo ""
echo "3. Enable GitHub Pages:"
echo "   - Go to: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/pages"
echo "   - Source: Branch 'main', folder '/docs'"
echo "   - Click 'Save'"
echo ""
echo "4. Your site will be live at:"
echo "   https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
echo ""
echo "5. Test data fetch locally (optional):"
echo "   pip install -r requirements.txt"
echo "   python src/fetch_gwosc_data.py"
echo ""
echo "For detailed instructions, see QUICKSTART.md"
echo ""
