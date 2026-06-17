/** In-memory frame URI cache for a single modal session. */
class VideoFrameCache {
  private store = new Map<string, string>();

  private key(videoUri: string, timeSec: number): string {
    return `${videoUri}::${timeSec.toFixed(2)}`;
  }

  get(videoUri: string, timeSec: number): string | undefined {
    return this.store.get(this.key(videoUri, timeSec));
  }

  set(videoUri: string, timeSec: number, uri: string): void {
    this.store.set(this.key(videoUri, timeSec), uri);
  }

  clear(): void {
    this.store.clear();
  }
}

export const videoFrameCache = new VideoFrameCache();
