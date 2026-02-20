import { registerDefaultSemHandlers } from '../sem/semRegistry';
import { registerHypercardTimelineModule } from '../../hypercard/timeline/registerHypercardTimeline';

let modulesRegistered = false;

export function ensureChatModulesRegistered() {
  if (modulesRegistered) {
    return;
  }

  registerDefaultSemHandlers();
  registerHypercardTimelineModule();
  modulesRegistered = true;
}

export function resetChatModulesRegistrationForTest() {
  modulesRegistered = false;
}
