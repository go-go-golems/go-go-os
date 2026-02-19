# Changelog

## 2026-02-19

- Initial workspace created
- Added HC-56 ticket metadata and key links for HC-53/HC-54 + pinocchio reference corpus
- Added hard-cut task sequence for reusable ChatWindow extraction with no backward migration path
- Added detailed design implementation plan:
  - `design/01-chatwindow-main-package-hard-cutover-implementation-plan.md`
- Rewrote implementation plan as a deep technical specification (6+ pages):
  - concrete API contracts and pseudocode
  - file-level migration sequence and commit plan
  - test matrix, storybook contract requirements, and grep-based no-legacy gates
- Added pinocchio ChatWindow creation references and `cmd/web-chat` source references:
  - tutorials `02`, `03`, `05`
  - `wsManager.ts`, SEM registry/mapper, ChatWidget/Timeline, renderer and props registries

## 2026-02-19

Step 1: Added shared TimelineChatRuntimeWindow boundary, switched inventory chat to host-only integration, and enabled adapter execution during upsert-only projection filtering (commit 09dee0a).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Inventory host cutover
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx — Shared runtime composition boundary
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts — Run adapters even when projection is filtered

