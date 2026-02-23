import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listProfiles } from './profileApi';
import {
  selectAvailableProfiles,
  selectCurrentProfileSelection,
  selectProfileError,
  selectProfileLoading,
  type ChatStateSlice,
} from '../state/selectors';
import { chatProfilesSlice } from '../state/profileSlice';

type ProfilesStoreState = ChatStateSlice & Record<string, unknown>;

export interface UseProfilesResult {
  profiles: ReturnType<typeof selectAvailableProfiles>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProfiles(
  basePrefix = '',
  registry?: string,
  options: { enabled?: boolean } = {}
): UseProfilesResult {
  const enabled = options.enabled ?? true;
  const dispatch = useDispatch();
  const profiles = useSelector((state: ProfilesStoreState) => selectAvailableProfiles(state));
  const loading = useSelector((state: ProfilesStoreState) => selectProfileLoading(state));
  const error = useSelector((state: ProfilesStoreState) => selectProfileError(state));
  const selected = useSelector((state: ProfilesStoreState) => selectCurrentProfileSelection(state));

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }
    dispatch(chatProfilesSlice.actions.setProfileLoading(true));
    dispatch(chatProfilesSlice.actions.setProfileError(null));
    try {
      const resolvedRegistry = String(registry ?? selected.registry ?? '').trim();
      const nextProfiles = await listProfiles(resolvedRegistry || undefined, { basePrefix });
      dispatch(chatProfilesSlice.actions.setAvailableProfiles(nextProfiles));
      dispatch(chatProfilesSlice.actions.setProfileLoading(false));
      if (!selected.profile) {
        const preferred = nextProfiles.find((item) => item.is_default) ?? nextProfiles[0];
        if (preferred?.slug) {
          dispatch(
            chatProfilesSlice.actions.setSelectedProfile({
              profile: preferred.slug,
              registry: resolvedRegistry || null,
            })
          );
        }
      }
    } catch (err) {
      dispatch(chatProfilesSlice.actions.setProfileLoading(false));
      dispatch(
        chatProfilesSlice.actions.setProfileError(err instanceof Error ? err.message : String(err))
      );
    }
  }, [basePrefix, dispatch, enabled, registry, selected.profile, selected.registry]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  return { profiles, loading, error, refresh };
}
