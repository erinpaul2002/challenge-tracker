# Overlay Configuration Brainstorm

## Appearance & Styling
- Pre-built themes (gaming-inspired) with custom color palettes.
- Selectable fonts (e.g., Google Fonts), sizes, weights, and styles.
- Adjustable overlay size, position on screen, and responsiveness.
- Entrance/exit animations, transition speeds, and optional effects.

## Content & Display
- Filters for challenge selection (all,active, completed,).
- Limit number of visible challenges (e.g., top 5).
- Display formats: text-only, progress bars.
- Customizable text templates (e.g., "Challenge: {title}").

## Behavior & Interactions
- Toggle auto-refresh intervals (5-30 seconds).

## User Experience for Configuration
- "Overlay Settings" page in streamer dashboard with tabs.
- Live preview of changes before saving.
- "Test Overlay" button for simulation.

## Technical Considerations
- Store configs in Supabase (new table with JSON fields).
- Extend API with query params for customization.
- Build config UI with React components (color pickers, sliders).
