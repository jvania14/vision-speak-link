# Silent Talk frontend

React, TypeScript, and Vite interface for a webcam fingerspelling prototype, originally based on the NextUI v2 template.

## Development

From this directory:

```bash
npm install
npm run dev
```

The camera view and main text display expect the Flask backend at `http://localhost:5000`. The camera belongs to the machine running Flask. See [the project README](../README.md) for backend setup and project limits.

## Source map

- `src/components/camera-component.tsx`: displays the backend video feed.
- `src/components/command-display.tsx`: polls recognized text and resets it.
- `src/services/apiService.ts`: API helpers.
- `src/hooks/use-theme.ts`: stores the light/dark theme preference.

The settings helper calls `/set_stable_time`, which the backend does not implement. Relative API helpers also need routing configuration; `vite.config.ts` currently has no API proxy.

## Template attribution

The interface started from the [NextUI Vite template](https://github.com/nextui-org/vite-template), distributed under the [MIT license](https://github.com/nextui-org/vite-template/blob/main/LICENSE).
