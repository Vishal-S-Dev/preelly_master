import React, { createContext, useContext } from 'react';

const ReelPlaybackContext = createContext(true);

export const ReelPlaybackProvider = ReelPlaybackContext.Provider;

export const useIsReelPlaybackAllowed = (): boolean =>
  useContext(ReelPlaybackContext);
