# AGENTS.md

## Project Overview
Static HTML landing page for McDegens ($MCDGN) - a McDonald's-inspired Solana memecoin. Neo-brutalist design with Tailwind CSS and inline SVG logo.

## Build/Test Commands
- No build process required - static HTML
- Preview: Open index.html in browser or use a local server: `python3 -m http.server 8000`

## Architecture
- Single-page application: index.html
- Tailwind CSS via CDN
- Inter font from Google Fonts
- Inline SVG for stylized 'M' logo

## Code Style & Conventions
- **Framework**: Tailwind CSS utility classes
- **Font Stack**: 'Inter' (weights 400, 500, 700, 900) from Google Fonts
- **Colors**: Red-600 background, Yellow-400 accents, Black borders, White content boxes
- **Design Language**: Neo-brutalist - thick black borders, hard shadows (e.g., shadow-[8px_8px_0px_#000])
- **Animations**: Translate on hover for button interaction (hover:translate-x-1 hover:translate-y-1)
- **Responsive**: Tailwind breakpoints (md: prefix for tablet/desktop)
- **Typography**: Font-black for headings, font-bold/font-medium for body, uppercase for CTAs
- **Naming**: Standard Tailwind utility classes
