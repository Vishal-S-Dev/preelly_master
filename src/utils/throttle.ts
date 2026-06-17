export const throttle = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number,
): ((...args: Args) => void) => {
  let last = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Args) => {
    const now = Date.now();
    const remaining = waitMs - (now - last);

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      last = now;
      fn(...args);
      return;
    }

    if (!timeout) {
      timeout = setTimeout(() => {
        last = Date.now();
        timeout = null;
        fn(...args);
      }, remaining);
    }
  };
};
