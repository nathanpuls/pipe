# Pipe: Project Specification & AI Blueprint

**Project Philosophy**: Radical simplicity. No buttons, no dashboard, no complex UI. Just a live, text-only pipe between devices. If it's not text or the space between text, it doesn't belong.

## 1. Technical Stack (The "Soul" of Pipe)
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (No frameworks).
- **Backend**: Hono (Web standards API) running on Cloudflare Pages Functions.
- **Database**: Supabase (PostgreSQL) for persistence and row-level realtime events.
- **Realtime**: Supabase `postgres_changes` via WebSockets.
- **Dev Workflow**: `concurrently` + `wrangler` + `browser-sync` for silent hot-reloading.

## 2. Style & Design System
- **Typography**: `Inter` (Google Fonts) or system-default Sans-serif. 
- **Scale**: `font-size: 1.15rem`, `line-height: 1.6`.
- **Colors**:
    - Background: `#ffffff` (Pure White).
    - Text: `#1a1a1a` (Near Black).
    - Secondary/Icons: `opacity: 0.4` (Subtle Grey).
- **Layout**: Centered `600px` max-width container, responsive padding (`20px`).
- **Interactions**:
    - No visible buttons except for copy icons on hover.
    - Transitions: 10ms-20ms "snap" feels instant but prevents screen-tearing.

## 3. Database Schema (PostgreSQL)
### Table: `entries`
- `id`: `uuid` (primary key, default: `gen_random_uuid()`)
- `content`: `text` (The actual content)
- `page_name`: `text` (Page identifier, e.g., 'home')
- `created_at`: `timestamptz` (default: `now()`)

*Order Logic: Always `ORDER BY created_at DESC`.*

## 4. API Endpoints
- `GET /entries?page={pageName}`: Retrieves all entries for a specific pipe.
- `POST /api/post`: Accepts `{ pageName, content }`. Treats content as a single block (preserves all newlines).
- `GET /config`: Proxies Supabase credentials to the frontend securely.

## 5. Functional Logic

### A. View Mode
- **Linkification**: Detects URLs, Phone Numbers, and Addresses using regex; makes them clickable.
- **Copy Icon**: Custom SVG (two overlapping rounded squares). The front square is `fill: white` to mask the one behind it, creating a "stacked paper" look.

### B. Edit Mode (The "Giant Textarea")
- **Manual Splitting**: Any content separated by double newlines (`\n\n`) in the textarea is parsed into individual database records upon saving.
- **Prepend Logic**: Entering edit mode (via Space or Click) automatically prepends two newlines to the top and places the cursor at (0,0).
- **Dirty Check**: On exit, if `trimmed_textarea_value === initial_joined_entries`, the save operation is aborted to prevent unnecessary reordering.
- **Focus Guard**: Uses `focus({ preventScroll: true })` and `window.scrollTo(0,0)` to ensure the page doesn't jump when the textarea appears.

### C. Live Injection
- When a new item is inserted via the API while a user is editing, the new content is prepended to the top of the textarea.
- The `selectionStart/End` (cursor) is shifted down by the length of the new text to maintain the user's focus.

## 6. Deployment Environment
- **Redirects**: `/* /index.html 200` to support SPA-style routing (e.g., `ends.at/custom-page`).
- **Wrangler**: Uses `wrangler.toml` for variables and `wrangler pages secret` for sensitive keys.

## 7. Replicator Prompt
"Replicate 'Pipe': a minimalist data-sync tool using Hono, Cloudflare, and Supabase. Maintain a white-label, no-decoration aesthetic. Implement a view-mode that linkifies text and a click-to-edit mode that uses a single giant textarea. Ensure background Shortcut posts inject into the top of the editor live without interrupting the user. The app should feel like a single continuous roll of paper."
