## Description
This PR addresses the **Schema Double-Management** technical debt between the Frontend and Backend.

Previously, custom shape definitions (Props, Migrations) were duplicated across `apps/web/src/Wired*.tsx` and `apps/sync-server/src/customShapes.ts`. This was prone to regressions whenever a new shape or property was added, causing `INVALID_RECORD` sync crashes on the backend.

### Changes
1. **Created `packages/tldraw-schema` (SSOT)**: Extracted all custom shape properties and migrations into a single, shared monorepo package.
2. **Web App Refactoring**: Updated all `Wired*.tsx` shape utilities in the frontend to import their properties directly from `@sonagi-draw/schema`.
3. **Sync Server Refactoring**: Updated `rooms.ts` to source the custom schemas from `@sonagi-draw/schema` instead of a standalone generated file.
4. **Workspace Config**: Registered the new package in `package.json` for both apps as `workspace:*`.

This solidifies the architecture, paving the way for safer component development!
