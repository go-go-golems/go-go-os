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


## 2026-02-19

Step 2: Moved TimelineChatWindow/Hypercard widget stories from inventory into engine package and added TimelineChatRuntimeWindow contract stories (commit f183e9f).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/HypercardTimelineWidget.stories.tsx — Package-owned timeline widget panel stories
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/TimelineChatRuntimeWindow.stories.tsx — Runtime seam contract stories
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/TimelineChatWindow.stories.tsx — Package-owned TimelineChatWindow story moved from inventory


## 2026-02-19

Step 3: Ran HC-56 validation gates (storybook taxonomy, typechecks, targeted vitest, grep ownership checks), updated deletion-policy sections in the implementation plan, and checked off all remaining tasks.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-56-CHATWINDOW-MAIN-PACKAGE-CUTOVER--extract-chatwindow-from-inventory-into-reusable-main-package-pinocchio-aligned-hard-cutover/design/01-chatwindow-main-package-hard-cutover-implementation-plan.md — Updated story ownership and deletion list
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-56-CHATWINDOW-MAIN-PACKAGE-CUTOVER--extract-chatwindow-from-inventory-into-reusable-main-package-pinocchio-aligned-hard-cutover/tasks.md — All open tasks closed

