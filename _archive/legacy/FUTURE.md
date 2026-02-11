# Pipe: Future Roadmap

This list tracks the planned evolution of Pipe, focusing on maintaining simplicity while expanding accessibility.

## 1. Chrome Extension (Priority)
- **Feature**: A "one-click" extension that pipes the current URL or highlighted text directly to the active page.
- **Workflow**: 
    - Right-click context menu "Send to Pipe".
    - Browser toolbar button for quick URL capture.
    - Configuration for personal API key.

## 2. Multi-Page / Dynamic Routing
- **Feature**: Allow users to share pipes by creating sub-paths.
- **Example**: `ends.at/work`, `ends.at/grocery`, `ends.at/memes`.
- **Implementation**: Hono wildcard routing and dynamic page name extraction.

## 3. Keyboard-First Archive
- **Feature**: A way to clear the "sink" without hunting for individual deletes.
- **Implementation**: `Ctrl + Shift + Backspace` to clear the current page after a confirmation prompt.

## 4. Search & Filter
- **Feature**: Fast, local search across all entries.
- **Implementation**: A simple, hidden search bar that appears with `/` and filters the DOM in real-time.

## 5. Private / Auth Pipes
- **Feature**: Password protection for specific pipes.
- **Implementation**: Supabase Auth or a simple shared-secret middleware for specific routes.

## 6. Offline Support (PWA)
- **Feature**: Cache entries locally when the connection is dropped.
- **Implementation**: Service Worker to allow viewing and drafting notes while on a plane or in a tunnel, syncing back to Supabase once online.

---
*Keep it light. Keep it fast. Don't add buttons.*
