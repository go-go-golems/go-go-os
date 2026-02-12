import type { DSLAction } from '../dsl/types';
import { navigate, goBack } from '../features/navigation/navigationSlice';
import { showToast } from '../features/notifications/notificationsSlice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDispatch = (action: any) => any;

export type DomainActionHandler = (
  action: DSLAction,
  dispatch: AnyDispatch,
) => boolean;

export function dispatchDSLAction(
  dispatch: AnyDispatch,
  action: DSLAction,
  domainHandler?: DomainActionHandler,
) {
  switch (action.type) {
    case 'navigate':
      dispatch(navigate({ card: (action as any).card, paramValue: (action as any).paramValue }));
      return;
    case 'back':
      dispatch(goBack());
      return;
    case 'toast':
      dispatch(showToast((action as any).message));
      return;
    default:
      if (domainHandler) {
        const handled = domainHandler(action, dispatch);
        if (!handled) {
          console.warn(`Unhandled DSL action type: ${action.type}`);
        }
      }
  }
}
