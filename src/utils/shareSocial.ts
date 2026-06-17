import { Alert, Linking, Platform, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { SharePayload, SocialSharePlatform } from '../types/share.types';
import { buildShareMessage, buildWebShareUrl } from './shareLinks';

const encode = (value: string) => encodeURIComponent(value);

const openUrl = async (url: string, fallback?: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    if (fallback) {
      await Linking.openURL(fallback);
      return true;
    }
  } catch {
    // fall through
  }
  return false;
};

export const copyShareLink = async (payload: SharePayload): Promise<boolean> => {
  const url = buildWebShareUrl(payload.contentType, payload.contentId);
  Clipboard.setString(url);
  return true;
};

export const shareViaPlatform = async (
  platform: SocialSharePlatform,
  payload: SharePayload,
): Promise<boolean> => {
  const message = buildShareMessage(payload);
  const url = buildWebShareUrl(payload.contentType, payload.contentId);

  switch (platform) {
    case 'copy': {
      await copyShareLink(payload);
      return true;
    }
    case 'whatsapp': {
      const wa = `whatsapp://send?text=${encode(message)}`;
      const ok = await openUrl(wa, `https://wa.me/?text=${encode(message)}`);
      if (!ok) {
        Alert.alert('WhatsApp', 'WhatsApp is not installed on this device.');
      }
      return ok;
    }
    case 'instagram': {
      const ok = await openUrl('instagram://app', 'https://www.instagram.com/');
      if (ok) {
        await Share.share({ message, url: Platform.OS === 'ios' ? url : undefined });
      }
      return ok;
    }
    case 'facebook': {
      return openUrl(
        `fb://facewebmodal/f?href=${encode(`https://www.facebook.com/sharer/sharer.php?u=${url}`)}`,
        `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}`,
      );
    }
    case 'messenger': {
      return openUrl(
        `fb-messenger://share?link=${encode(url)}`,
        `https://www.facebook.com/dialog/send?link=${encode(url)}`,
      );
    }
    case 'telegram': {
      return openUrl(
        `tg://msg?text=${encode(message)}`,
        `https://t.me/share/url?url=${encode(url)}&text=${encode(payload.title)}`,
      );
    }
    case 'x': {
      return openUrl(
        `twitter://post?message=${encode(message)}`,
        `https://twitter.com/intent/tweet?text=${encode(message)}`,
      );
    }
    case 'snapchat': {
      const ok = await openUrl('snapchat://', 'https://www.snapchat.com/');
      if (ok) {
        await Share.share({ message });
      }
      return ok;
    }
    case 'linkedin': {
      return openUrl(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encode(url)}`,
      );
    }
    case 'share':
    case 'more':
    default: {
      await Share.share({
        title: payload.title,
        message: Platform.OS === 'android' ? message : message,
        url: Platform.OS === 'ios' ? url : undefined,
      });
      return true;
    }
  }
};
