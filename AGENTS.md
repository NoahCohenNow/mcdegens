# AGENTS.md

## Project Overview
Static HTML landing page for $YMN (YOO MY NIGGA) - a Solana-based meme token. Single-file architecture with embedded CSS and inline SVG.

## Build/Test Commands
- No build process required - static HTML
- Preview: Open index.html in browser or use a local server: `python3 -m http.server 8000`

## Architecture
- Single-page application: index.html
- No external dependencies or build tools
- All styles embedded in `<style>` tag
- Inline SVG for cult symbol graphic

## Code Style & Conventions
- **CSS Variables**: Use CSS custom properties in `:root` (--primary, --secondary, --dark, --light, --accent)
- **Font Stack**: 'Bangers', 'Luckiest Guy', 'Permanent Marker' from Google Fonts for headers/CTAs
- **Colors**: Primary #FF5722, Secondary #9C27B0, Dark #1E1E2A, Light #FFF9C4, Accent #4CAF50
- **Animations**: Use `transition: all 0.3s` for hover effects; `transform: rotate()` for playful tilts
- **Spacing**: Sections use 80px vertical padding; cards use 30px internal padding
- **Responsive**: Media query breakpoint at 768px for mobile
- **Effects**: Drop shadows, text shadows, gradients, and clip-path for visual depth
- **Naming**: BEM-like class names (e.g., roadmap-item, roadmap-content, step-card)
