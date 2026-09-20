# Silent Talk frontend

## Build
- Establish a dark, high-contrast healthcare design system with glass surfaces, restrained cyan/teal light, large typography, accessible focus states, and reduced-motion support.
- Create a shared responsive navigation, logo, status indicator, mobile menu, and polished page transitions.
- Build dedicated Home, Patient Mode, Doctor Mode, How It Works, and Accessibility routes.
- Make Patient Mode the primary workspace with a Flask-stream-ready camera, recognition state, five-stage pipeline, editable message composer, speech, reset, healthcare phrases, emergency confirmation, and local communication history.
- Add accessibility preferences for text size, contrast, reduced motion, speech, volume, and appearance, persisted in the browser.

## Integration
- Isolate `/video_feed`, `/get_text`, and `/reset_text` behind one configurable API service using `VITE_API_BASE_URL`, defaulting to `http://127.0.0.1:5000`.
- Poll recognition text without inventing recognition output, and display clear disconnected/waiting states when Flask is unavailable.
- Keep demo values confined to an explicitly labeled landing-page preview; all Patient Mode recognition values come from backend state.

## Validation
- Verify navigation, offline handling, editing, speech controls, clearing, quick phrases, emergency modal, accessibility preferences, and responsive layouts in the running preview.
- Add unique metadata for every content page and check desktop and mobile presentation.

## Technical details
- Use TanStack Router’s existing file-based routing rather than adding a second router.
- Use React 19, Tailwind CSS v4 semantic tokens, Motion for React, Lucide icons, and the existing reusable interface controls.
- Keep communication history in shared frontend state so Patient and Doctor modes use the same data shape and can later move to persistent storage.
