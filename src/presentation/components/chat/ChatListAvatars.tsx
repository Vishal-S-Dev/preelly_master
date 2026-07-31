import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AVATAR_SIZE = 60;
const OVERLAP_SIZE = 28;
const DIRECT_SIZE = AVATAR_SIZE;
const PRODUCT_SIZE = AVATAR_SIZE;
const GROUP_CONTAINER = AVATAR_SIZE;
const GROUP_FACE = 42;

/** Direct avatar status pip */
const DOT_DIRECT = 14;
/** Smaller pip for product-overlap / group faces */
const DOT_OVERLAP = 12;
const DOT_STROKE = 2.5;

type DotTone = 'green' | 'red' | 'none';

interface DotProps {
  tone: DotTone;
  size?: number;
  style?: object;
}

const StatusDot = memo<DotProps>(({ tone, size = DOT_DIRECT, style }) => {
  if (tone === 'none') {
    return null;
  }
  return (
    <View
      pointerEvents="none"
      style={[
        styles.statusDot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: DOT_STROKE,
        },
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
    <StatusDot tone={dot} size={DOT_DIRECT} style={styles.directDot} />
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
        <StatusDot tone={dot} size={DOT_OVERLAP} style={styles.overlapDot} />
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
        <StatusDot tone={dot} size={DOT_OVERLAP} style={styles.groupDot} />
      </View>
    );
  },
);

GroupChatAvatar.displayName = 'GroupChatAvatar';

const styles = StyleSheet.create({
  directWrap: {
    position: 'relative',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  directAvatar: {
    backgroundColor: '#E5E7EB',
  },
  /** Bottom-right of the large contact avatar */
  directDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  productVisual: {
    position: 'relative',
    width: PRODUCT_SIZE,
    height: PRODUCT_SIZE,
    marginRight: 14,
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
    right: -3,
    bottom: -3,
    width: OVERLAP_SIZE,
    height: OVERLAP_SIZE,
    overflow: 'visible',
    zIndex: 2,
  },
  overlapAvatar: {
    width: OVERLAP_SIZE,
    height: OVERLAP_SIZE,
    borderRadius: OVERLAP_SIZE / 2,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#E5E7EB',
  },
  /** Bottom-right of the small overlapping contact avatar */
  overlapDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    zIndex: 3,
  },
  groupWrap: {
    width: GROUP_CONTAINER,
    height: GROUP_CONTAINER,
    marginRight: 14,
    position: 'relative',
    overflow: 'visible',
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
    position: 'absolute',
    right: -1,
    bottom: -1,
    zIndex: 4,
  },
  statusDot: {
    position: 'absolute',
    borderColor: '#FFFFFF',
    backgroundColor: '#22C55E',
  },
  /** Online / Active now */
  dotGreen: {
    backgroundColor: '#22C55E',
  },
  /** Unread / needs attention (offline) */
  dotRed: {
    backgroundColor: '#EF4444',
  },
});
