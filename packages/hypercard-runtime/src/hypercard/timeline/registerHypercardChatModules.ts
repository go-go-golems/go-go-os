import {
  ensureChatModulesRegistered,
  registerChatRuntimeModule,
  type ChatRuntimeModule,
} from '@hypercard/engine';
import { registerHypercardTimelineModule } from './registerHypercardTimeline';

const hypercardTimelineModule: ChatRuntimeModule = {
  id: 'chat.hypercard-timeline',
  register: registerHypercardTimelineModule,
};

export function registerHypercardTimelineChatModule() {
  registerChatRuntimeModule(hypercardTimelineModule);
}

export function ensureHypercardChatModulesRegistered() {
  registerHypercardTimelineChatModule();
  ensureChatModulesRegistered();
}
