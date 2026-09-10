import RNFS from 'react-native-fs';
import { Video as VideoCompressor } from 'react-native-compressor';
import { compressVideoForUpload } from '../src/utils/videoCompression';
import { CreatePostMediaFile } from '../src/types/createPost.types';

jest.mock('react-native-fs', () => ({
  stat: jest.fn(),
  exists: jest.fn(),
}));

jest.mock('react-native-compressor', () => ({
  Video: { compress: jest.fn() },
}));

const mockedStat = RNFS.stat as jest.Mock;
const mockedExists = RNFS.exists as jest.Mock;
const mockedCompress = VideoCompressor.compress as jest.Mock;

const ORIGINAL_URI = 'file:///tmp/original.mov';
const COMPRESSED_URI = 'file:///tmp/compressed.mp4';

const makeVideo = (overrides: Partial<CreatePostMediaFile> = {}): CreatePostMediaFile => ({
  uri: ORIGINAL_URI,
  name: 'clip.mov',
  type: 'video/quicktime',
  size: 50 * 1024 * 1024,
  ...overrides,
});

describe('compressVideoForUpload', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('returns a compressed .mp4 file and logs the size before/after when compression shrinks the video', async () => {
    const video = makeVideo();
    mockedStat
      .mockResolvedValueOnce({ size: 50 * 1024 * 1024 }) // original size lookup
      .mockResolvedValueOnce({ size: 12 * 1024 * 1024 }); // compressed size lookup
    mockedCompress.mockResolvedValue(COMPRESSED_URI);
    mockedExists.mockResolvedValue(true);

    const result = await compressVideoForUpload(video);

    expect(mockedCompress).toHaveBeenCalledWith(
      ORIGINAL_URI,
      expect.objectContaining({ compressionMethod: 'auto' }),
    );
    expect(result.uri).toBe(COMPRESSED_URI);
    expect(result.name).toBe('clip.mp4');
    expect(result.type).toBe('video/mp4');

    // Logs the original size, then the compressed size — the whole point of this test.
    const logged = logSpy.mock.calls.map(call => call.join(' ')).join('\n');
    expect(logged).toEqual(expect.stringContaining('original=50.00MB'));
    expect(logged).toEqual(expect.stringContaining('compressed=12.00MB'));
  });

  it('falls back to the original file when the compressor reports no change (e.g. already small)', async () => {
    const video = makeVideo();
    mockedStat.mockResolvedValue({ size: 2 * 1024 * 1024 });
    mockedCompress.mockResolvedValue(ORIGINAL_URI);

    const result = await compressVideoForUpload(video);

    expect(result).toBe(video);
    expect(mockedExists).not.toHaveBeenCalled();
  });

  it('falls back to the original file when the compressed file never actually lands on disk', async () => {
    const video = makeVideo();
    mockedStat.mockResolvedValue({ size: 50 * 1024 * 1024 });
    mockedCompress.mockResolvedValue(COMPRESSED_URI);
    mockedExists.mockResolvedValue(false);

    const result = await compressVideoForUpload(video);

    expect(result).toBe(video);
  });

  it('falls back to the original file when compression throws', async () => {
    const video = makeVideo();
    mockedStat.mockResolvedValue({ size: 50 * 1024 * 1024 });
    mockedCompress.mockRejectedValue(new Error('codec unavailable'));

    const result = await compressVideoForUpload(video);

    expect(result).toBe(video);
  });
});
