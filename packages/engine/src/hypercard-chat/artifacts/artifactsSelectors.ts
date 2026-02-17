import type { ArtifactRecord, ArtifactsState } from './artifactsSlice';

interface ArtifactsStateSlice {
  artifacts: ArtifactsState;
}

export const selectArtifactsById = (state: ArtifactsStateSlice) => state.artifacts.byId;

export const selectArtifactById = (state: ArtifactsStateSlice, artifactId: string): ArtifactRecord | undefined =>
  state.artifacts.byId[artifactId];
