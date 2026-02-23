import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { chatProfilesSlice } from '../state/profileSlice';

export function useSetProfile() {
  const dispatch = useDispatch();

  return useCallback(
    (profile: string | null, registry?: string | null) => {
      dispatch(
        chatProfilesSlice.actions.setSelectedProfile({
          profile,
          registry: registry ?? undefined,
        })
      );
    },
    [dispatch]
  );
}
