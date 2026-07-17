import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { Product } from '../../../domain/models/Product';
import { ProductComment } from '../../../domain/models/ProductComment';
import { countCommentsInTree } from '../../../utils/commentTreeUtils';
import {
  CommentReplyTarget,
  useProductComments,
} from '../../hooks/useProductComments';
import { CommentInputBar } from './CommentInputBar';
import { CommentItem } from './CommentItem';
import { CommentSkeletonList } from './CommentSkeletonList';
import { CommentsHeader } from './CommentsHeader';
import { EmptyCommentsState } from './EmptyCommentsState';
import { CM_COLORS, cmStyles } from './commentsStyles';

interface Props {
  product: Product | null;
  onDismiss?: () => void;
}

export const CommentsBottomSheet = forwardRef<BottomSheetModal, Props>(
  ({ product, onDismiss }, ref) => {
    const snapPoints = useMemo(() => ['58%', '94%'], []);
    const listRef = useRef<any>(null);
    const [replyTo, setReplyTo] = useState<CommentReplyTarget>(null);

    const {
      comments,
      loading,
      submitting,
      isAuthenticated,
      authUser,
      submitComment,
      toggleLike,
      formatTimeAgo,
      listVersion,
    } = useProductComments(product?.id ?? null);

    const totalCount = useMemo(() => {
      if (comments.length > 0) {
        return countCommentsInTree(comments);
      }
      return product?.commentCount ?? 0;
    }, [comments, product?.commentCount]);

    useEffect(() => {
      if (comments.length > 0) {
        requestAnimationFrame(() => {
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
        });
      }
    }, [comments.length, listVersion]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      [],
    );

    const handleDismiss = useCallback(() => {
      setReplyTo(null);
      onDismiss?.();
    }, [onDismiss]);

    const handleSheetChange = useCallback(
      (index: number) => {
        if (index < 0) {
          handleDismiss();
        }
      },
      [handleDismiss],
    );

    const handleReply = useCallback((commentId: string, username: string) => {
      setReplyTo({ id: commentId, username });
    }, []);

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => (
        <BottomSheetFooter {...props}>
          <CommentInputBar
            user={authUser}
            isAuthenticated={isAuthenticated}
            submitting={submitting}
            onSubmit={submitComment}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
          />
        </BottomSheetFooter>
      ),
      [authUser, isAuthenticated, replyTo, submitComment, submitting],
    );

    const handleClose = useCallback(() => {
      if (ref && typeof ref === 'object' && 'current' in ref) {
        ref.current?.dismiss();
      }
    }, [ref]);

    const renderItem = useCallback(
      ({ item, index }: { item: ProductComment; index: number }) => (
        <CommentItem
          comment={item}
          index={index}
          formatTime={formatTimeAgo}
          onLike={toggleLike}
          onReply={handleReply}
        />
      ),
      [formatTimeAgo, handleReply, toggleLike],
    );

    const listHeader = useMemo(
      () => (
        <View>
          <View style={cmStyles.handleWrap}>
            <View style={cmStyles.handle} />
          </View>
          <CommentsHeader totalCount={totalCount} onClose={handleClose} />
        </View>
      ),
      [handleClose, totalCount],
    );

    const listEmpty = useMemo(() => {
      if (loading) {
        return <CommentSkeletonList />;
      }
      return <EmptyCommentsState />;
    }, [loading]);

    const keyExtractor = useCallback((item: ProductComment) => item.id, []);

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        activeOffsetY={[-12, 12]}
        activeOffsetX={[-9999, 9999]}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleComponent={null}
        footerComponent={renderFooter}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onChange={handleSheetChange}
      >
        <BottomSheetFlatList
          ref={listRef}
          data={comments}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={cmStyles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={Platform.OS === 'android'}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={8}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      </BottomSheetModal>
    );
  },
);

CommentsBottomSheet.displayName = 'CommentsBottomSheet';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: CM_COLORS.sheetBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
