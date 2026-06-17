import { Platform } from 'react-native';

/**
 * iOS reel audio: react-native-video sets AVAudioSession to `.playback`, so audio
 * plays through the speaker even when the hardware silent switch is on.
 * Android is unaffected (no props applied).
 */
export const REEL_IOS_VIDEO_AUDIO_PROPS =
  Platform.OS === 'ios' ? ({ ignoreSilentSwitch: 'ignore' as const }) : {};
