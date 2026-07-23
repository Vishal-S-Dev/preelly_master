import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AVATAR_SIZE = 56;
const OVERLAP_SIZE = 32;
const DIRECT_SIZE = AVATAR_SIZE;
const PRODUCT_SIZE = AVATAR_SIZE;
const GROUP_CONTAINER = AVATAR_SIZE;
const GROUP_FACE = 40;

type DotTone = 'green' | 'red' | 'none';

interface DotProps {
  tone: DotTone;
  style?: object;
}

const StatusDot = memo<DotProps>(({ tone, style }) => {
  if (tone === 'none') {
    return null;
  }
  return (
    <View
      style={[
        styles.statusDot,
        tone === 'green' ? styles.dotGreen : styles.dotRed,
        style,
      ]}
    />
  );
});

StatusDot.displayName = 'StatusDot';

interface DirectProps {
  avatarUri: string;
  dot?: DotTone;
  size?: number;
}

export const DirectChatAvatar = memo<DirectProps>(({ avatarUri, dot = 'none', size = DIRECT_SIZE }) => (
  <View style={[styles.directWrap, { width: size, height: size }]}>
    <Image
      source={{ uri: avatarUri }}
      style={[styles.directAvatar, { width: size, height: size, borderRadius: size / 2 }]}
    />
    <StatusDot tone={dot} style={styles.directDot} />
  </View>
));

DirectChatAvatar.displayName = 'DirectChatAvatar';

interface ProductProps {
  productImageUri: string;
  contactAvatarUri: string;
  dot?: DotTone;
}

export const ProductChatAvatar = memo<ProductProps>(
  ({ productImageUri, contactAvatarUri, dot = 'none' }) => (
    <View style={styles.productVisual}>
      <Image source={{ uri: productImageUri }} style={styles.productCircle} />
      <View style={styles.overlapAvatarWrap}>
        <Image source={{ uri: contactAvatarUri }} style={styles.overlapAvatar} />
        <StatusDot tone={dot} style={styles.overlapDot} />
      </View>
    </View>
  ),
);

ProductChatAvatar.displayName = 'ProductChatAvatar';

interface GroupFaceProps {
  uri?: string;
  name?: string;
  style?: object;
  bordered?: boolean;
}

const GroupFace = memo<GroupFaceProps>(({ uri, name, style, bordered = false }) => {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() ?? '?';
  return (
    <View style={[styles.groupFaceShell, bordered && styles.groupFaceBordered, style]}>
      {uri ? (
        <Image source={{ uri }} style={styles.groupFaceImage} />
      ) : (
        <View style={[styles.groupFaceImage, styles.groupFaceFallback]}>
          <Text style={styles.groupFaceInitial}>{initial}</Text>
        </View>
      )}
    </View>
  );
});

GroupFace.displayName = 'GroupFace';

interface GroupProps {
  /** Back avatar (top-left) */
  backAvatarUri?: string;
  backName?: string;
  /** Front avatar (bottom-right, white stroke) */
  frontAvatarUri?: string;
  frontName?: string;
  dot?: DotTone;
}

/** Instagram-style dual overlapping circles for group / multi-recipient threads. */
export const GroupChatAvatar = memo<GroupProps>(
  ({ backAvatarUri, backName, frontAvatarUri, frontName, dot = 'none' }) => {
    const hasBack = Boolean(backAvatarUri || backName);
    const hasFront = Boolean(frontAvatarUri || frontName);

    return (
      <View style={styles.groupWrap}>
        <View style={styles.groupCluster}>
          {hasBack && hasFront ? (
            <>
              <GroupFace
                uri={backAvatarUri}
                name={backName}
                style={styles.groupFaceBack}
              />
              <GroupFace
                uri={frontAvatarUri}
                name={frontName}
                style={styles.groupFaceFront}
                bordered
              />
            </>
          ) : hasFront || hasBack ? (
            <GroupFace
              uri={frontAvatarUri ?? backAvatarUri}
              name={frontName ?? backName}
              style={styles.groupFaceSingle}
            />
          ) : (
            <View style={styles.groupFallback}>
              <Icon name="account-group-outline" size={26} color="#64748B" />
            </View>
          )}
        </View>
        <StatusDot tone={dot} style={styles.groupDot} />
      </View>
    );
  },
);

GroupChatAvatar.displayName = 'GroupChatAvatar';

const styles = StyleSheet.create({
  directWrap: {
    position: 'relative',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directAvatar: {
    backgroundColor: '#E5E7EB',
  },
  directDot: {
    right: 0,
    bottom: 0,
  },
  productVisual: {
    position: 'relative',
    width: PRODUCT_SIZE,
    height: PRODUCT_SIZE,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  productCircle: {
    width: PRODUCT_SIZE,
    height: PRODUCT_SIZE,
    borderRadius: PRODUCT_SIZE / 2,
    backgroundColor: '#E5E7EB',
  },
  overlapAvatarWrap: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: OVERLAP_SIZE + 6,
    height: OVERLAP_SIZE + 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlapAvatar: {
    width: OVERLAP_SIZE,
    height: OVERLAP_SIZE,
    borderRadius: OVERLAP_SIZE / 2,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#E5E7EB',
  },
  overlapDot: {
    right: 1,
    bottom: 1,
  },
  groupWrap: {
    width: GROUP_CONTAINER,
    height: GROUP_CONTAINER,
    marginRight: 12,
    position: 'relative',
  },
  groupCluster: {
    width: GROUP_CONTAINER,
    height: GROUP_CONTAINER,
    position: 'relative',
  },
  groupFaceShell: {
    position: 'absolute',
    width: GROUP_FACE,
    height: GROUP_FACE,
    borderRadius: GROUP_FACE / 2,
    overflow: 'hidden',
    backgroundColor: '#CBD5E1',
  },
  groupFaceBordered: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  groupFaceImage: {
    width: '100%',
    height: '100%',
  },
  groupFaceFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#94A3B8',
  },
  groupFaceInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  groupFaceBack: {
    top: 1,
    left: 0,
    zIndex: 1,
  },
  groupFaceFront: {
    bottom: 0,
    right: 0,
    zIndex: 2,
  },
  groupFaceSingle: {
    top: (GROUP_CONTAINER - GROUP_FACE) / 2,
    left: (GROUP_CONTAINER - GROUP_FACE) / 2,
  },
  groupFallback: {
    width: GROUP_CONTAINER,
    height: GROUP_CONTAINER,
    borderRadius: GROUP_CONTAINER / 2,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupDot: {
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  statusDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dotGreen: {
    backgroundColor: '#22C55E',
  },
  dotRed: {
    backgroundColor: '#EF4444',
  },
});
