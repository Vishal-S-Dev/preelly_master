const pad2 = (n: number) => String(n).padStart(2, '0');

/** Formats seconds as HH:MM:SS (e.g. 00:01:30). */
export const formatVideoTime = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  }
  return `${pad2(minutes)}:${pad2(seconds)}`;
};

/** Formats seconds with centiseconds (e.g. 01:23.45 or 00:01:23.45). */
export const formatVideoTimePrecise = (totalSeconds: number): string => {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = Math.floor(safe % 60);
  const centiseconds = Math.floor((safe % 1) * 100);
  const fractional = `.${pad2(centiseconds)}`;
  if (hours > 0) {
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}${fractional}`;
  }
  return `${pad2(minutes)}:${pad2(seconds)}${fractional}`;
};
