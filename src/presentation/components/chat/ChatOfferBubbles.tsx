import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/MaterialCommunityIcons';
import { THREAD_UI } from '../../screens/chat/chatThreadStyles';
import type { PreellyRequestStatus } from '../../../utils/chatOfferUtils';

const Row: React.FC<{ isSelf: boolean; children: React.ReactNode; avatarUri: string }> = ({
  isSelf,
  children,
  avatarUri,
}) => (
  <View style={[styles.msgRow, isSelf ? styles.msgRowSelf : styles.msgRowOther]}>
    {!isSelf ? <Image source={{ uri: avatarUri }} style={styles.msgAvatar} /> : null}
    {children}
    {isSelf ? <Image source={{ uri: avatarUri }} style={styles.msgAvatar} /> : null}
  </View>
);

export const YouOfferedBubble: React.FC<{ amountLabel: string; selfAvatar: string }> = ({
  amountLabel,
  selfAvatar,
}) => (
  <Row isSelf avatarUri={selfAvatar}>
    <View style={styles.youOfferedBubble}>
      <Text style={styles.youOfferedText}>You offered</Text>
      <Text style={styles.youOfferedAmount}>AED {amountLabel}</Text>
    </View>
  </Row>
);

type IncomingOfferBubbleProps = {
  amountLabel: string;
  otherAvatar: string;
  senderName: string;
  locked: boolean;
  busy?: boolean;
  onAccept: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
  onCounter: (amount: number) => void | Promise<void>;
};

export const IncomingOfferBubble: React.FC<IncomingOfferBubbleProps> = ({
  amountLabel,
  otherAvatar,
  senderName,
  locked,
  busy = false,
  onAccept,
  onReject,
  onCounter,
}) => {
  const [counter, setCounter] = useState('');
  const [done, setDone] = useState<'accepted' | 'rejected' | 'countered' | null>(null);
  const [localBusy, setLocalBusy] = useState(false);

  useEffect(() => {
    setDone(null);
    setCounter('');
  }, [amountLabel]);

  const run = useCallback(async (fn: () => void | Promise<void>) => {
    try {
      setLocalBusy(true);
      await fn();
    } finally {
      setLocalBusy(false);
    }
  }, []);

  const submitCounter = useCallback(() => {
    const val = Number(String(counter).replace(/[^0-9.]/g, ''));
    if (!val || val <= 0) {
      return;
    }
    void run(async () => {
      await onCounter(val);
      setDone('countered');
    });
  }, [counter, onCounter, run]);

  const disabled = locked || busy || localBusy || Boolean(done);

  return (
    <Row isSelf={false} avatarUri={otherAvatar}>
      <View style={[styles.offerCard, locked || done ? styles.offerCardLocked : null]}>
        <Text style={styles.offerTitle}>Offer For Your Ad</Text>
        <Image source={{ uri: otherAvatar }} style={styles.offerSenderAvatar} />
        <Text style={styles.offerSenderName} numberOfLines={1}>
          {senderName || 'Buyer'}
        </Text>
        <Text style={styles.offerBody}>
          You have got an offer of{' '}
          <Text style={styles.offerCurrency}>AED</Text>{' '}
          <Text style={styles.offerAmount}>{amountLabel}</Text>
        </Text>

        {done === 'accepted' ? (
          <Text style={styles.statusAccepted}>You accepted this offer</Text>
        ) : done === 'rejected' ? (
          <Text style={styles.statusRejected}>You rejected this offer</Text>
        ) : done === 'countered' ? (
          <Text style={styles.statusCountered}>Counter offer sent</Text>
        ) : locked ? (
          <Text style={styles.statusLocked}>This offer is closed</Text>
        ) : (
          <View style={styles.offerActions}>
            <TextInput
              value={counter}
              onChangeText={setCounter}
              placeholder="Enter your counter offer"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={styles.counterInput}
              editable={!disabled}
            />
            <Pressable
              style={[styles.acceptBtn, disabled ? styles.btnDisabled : null]}
              disabled={disabled}
              onPress={() =>
                void run(async () => {
                  await onAccept();
                  setDone('accepted');
                })
              }>
              {localBusy ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.acceptBtnText}>Accept</Text>
              )}
            </Pressable>
            <View style={styles.rejectCounterRow}>
              <Pressable
                style={[styles.rejectBtn, disabled ? styles.btnDisabled : null]}
                disabled={disabled}
                onPress={() =>
                  void run(async () => {
                    await onReject();
                    setDone('rejected');
                  })
                }>
                <Text style={styles.rejectBtnText}>Reject</Text>
              </Pressable>
              <Pressable
                style={[styles.counterBtn, disabled ? styles.btnDisabled : null]}
                disabled={disabled}
                onPress={submitCounter}>
                <Text style={styles.counterBtnText}>Send Counter offer</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Row>
  );
};

export const OfferAcceptedBubble: React.FC<{
  text: string;
  isSelf: boolean;
  otherAvatar: string;
  selfAvatar: string;
  showProceed?: boolean;
  onProceed?: () => void;
}> = ({ text, isSelf, otherAvatar, selfAvatar, showProceed, onProceed }) => (
  <Row isSelf={isSelf} avatarUri={isSelf ? selfAvatar : otherAvatar}>
    <View style={styles.acceptCard}>
      <Text style={styles.acceptText}>{text}</Text>
      {showProceed ? (
        <Pressable style={styles.proceedBtn} onPress={onProceed}>
          <Text style={styles.proceedBtnText}>Proceed to cart</Text>
        </Pressable>
      ) : null}
    </View>
  </Row>
);

export const OfferRejectedBubble: React.FC<{
  isSelf: boolean;
  otherAvatar: string;
  selfAvatar: string;
}> = ({ isSelf, otherAvatar, selfAvatar }) => (
  <Row isSelf={isSelf} avatarUri={isSelf ? selfAvatar : otherAvatar}>
    <View style={styles.rejectCard}>
      <Text style={styles.rejectCardText}>❌ Offer rejected</Text>
    </View>
  </Row>
);

type PreellyRequestBubbleProps = {
  conditions: string[];
  comment: string;
  isSelf: boolean;
  otherAvatar: string;
  selfAvatar: string;
  status: PreellyRequestStatus | null;
  onApprove?: () => void | Promise<void>;
  onReject?: () => void | Promise<void>;
  onProceed?: () => void;
  onNewCondition?: () => void;
  onProceedPlain?: () => void;
};

export const PreellyRequestBubble: React.FC<PreellyRequestBubbleProps> = ({
  conditions,
  comment,
  isSelf,
  otherAvatar,
  selfAvatar,
  status,
  onApprove,
  onReject,
  onProceed,
  onNewCondition,
  onProceedPlain,
}) => {
  const [busy, setBusy] = useState(false);

  return (
    <Row isSelf={isSelf} avatarUri={isSelf ? selfAvatar : otherAvatar}>
      <View style={styles.preellyCard}>
        <View style={styles.preellyHeader}>
          <Text style={styles.preellyTitle}>Preelly Inspection Conditions</Text>
        </View>
        <View style={styles.preellyBody}>
          <View style={styles.chipWrap}>
            {conditions.map(c => (
              <View key={c} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
                <View style={styles.chipCheck}>
                  <Feather name="check" size={10} color="#FFF" />
                </View>
              </View>
            ))}
          </View>
          {comment ? (
            <Text style={styles.preellyComment}>
              <Text style={styles.preellyCommentLabel}>Comment: </Text>
              {comment}
            </Text>
          ) : null}

          {isSelf ? (
            status === 'approved' ? (
              <View style={styles.preellyOutcome}>
                <Text style={styles.statusAccepted}>
                  Approved — these conditions are locked for the Preelly inspection.
                </Text>
                <Pressable style={styles.proceedBtn} onPress={onProceed}>
                  <Text style={styles.proceedBtnText}>Proceed to cart</Text>
                </Pressable>
              </View>
            ) : status === 'rejected' ? (
              <View style={styles.preellyOutcome}>
                <Text style={styles.statusRejected}>Seller rejected these conditions.</Text>
                <View style={styles.rejectCounterRow}>
                  <Pressable style={styles.newConditionBtn} onPress={onNewCondition}>
                    <Text style={styles.newConditionText}>New Condition</Text>
                  </Pressable>
                  <Pressable style={styles.proceedBtnFlex} onPress={onProceedPlain}>
                    <Text style={styles.proceedBtnText}>Proceed to cart</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Text style={styles.waitingText}>
                Your selected inspection conditions are awaiting seller approval. Once approved,
                they will be locked for the Preelly inspection.
              </Text>
            )
          ) : status === 'approved' ? (
            <Text style={styles.statusAccepted}>You approved these conditions</Text>
          ) : status === 'rejected' ? (
            <Text style={styles.statusRejected}>You rejected these conditions</Text>
          ) : (
            <View style={styles.rejectCounterRow}>
              <Pressable
                style={[styles.acceptBtn, busy ? styles.btnDisabled : null]}
                disabled={busy}
                onPress={() => {
                  void (async () => {
                    try {
                      setBusy(true);
                      await onApprove?.();
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}>
                <Text style={styles.acceptBtnText}>Approve</Text>
              </Pressable>
              <Pressable
                style={[styles.preellyRejectBtn, busy ? styles.btnDisabled : null]}
                disabled={busy}
                onPress={() => {
                  void (async () => {
                    try {
                      setBusy(true);
                      await onReject?.();
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}>
                <Text style={styles.preellyRejectText}>Reject</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Row>
  );
};

export const PreellyResponseBubble: React.FC<{
  approved: boolean;
  text: string;
  isSelf: boolean;
  otherAvatar: string;
  selfAvatar: string;
}> = ({ approved, text, isSelf, otherAvatar, selfAvatar }) => (
  <Row isSelf={isSelf} avatarUri={isSelf ? selfAvatar : otherAvatar}>
    <View style={[styles.preellyRespCard, approved ? styles.preellyRespApproved : styles.preellyRespRejected]}>
      <Text style={[styles.preellyRespText, approved ? styles.statusAccepted : styles.statusRejected]}>
        {text}
      </Text>
    </View>
  </Row>
);

const styles = StyleSheet.create({
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    gap: 8,
  },
  msgRowSelf: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  youOfferedBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
  },
  youOfferedText: {
    fontSize: 14,
    color: '#374151',
  },
  youOfferedAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6D28D9',
  },
  offerCard: {
    width: 300,
    maxWidth: '92%',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  offerCardLocked: {
    opacity: 0.65,
  },
  offerTitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  offerSenderAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: 'center',
    marginTop: 14,
    backgroundColor: '#E5E7EB',
  },
  offerSenderName: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  offerBody: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  offerCurrency: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  offerAmount: {
    color: '#2563EB',
    fontSize: 18,
    fontWeight: '800',
  },
  offerActions: {
    marginTop: 12,
    gap: 8,
  },
  counterInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  acceptBtn: {
    borderRadius: 999,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  acceptBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rejectCounterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    flex: 0.85,
    borderRadius: 999,
    backgroundColor: '#EDE9FE',
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#6D28D9',
    fontSize: 14,
    fontWeight: '700',
  },
  counterBtn: {
    flex: 1.15,
    borderRadius: 999,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    alignItems: 'center',
  },
  counterBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.55,
  },
  statusAccepted: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
  },
  statusRejected: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  statusCountered: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  statusLocked: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  acceptCard: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803D',
  },
  proceedBtn: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: THREAD_UI.primary,
    paddingVertical: 10,
    alignItems: 'center',
  },
  proceedBtnFlex: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: THREAD_UI.primary,
    paddingVertical: 10,
    alignItems: 'center',
  },
  proceedBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rejectCard: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  rejectCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  preellyCard: {
    width: 320,
    maxWidth: '92%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  preellyHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  preellyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  preellyBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    color: '#334155',
  },
  chipCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preellyComment: {
    marginTop: 12,
    fontSize: 12,
    color: '#64748B',
  },
  preellyCommentLabel: {
    fontWeight: '700',
    color: '#475569',
  },
  preellyOutcome: {
    marginTop: 4,
  },
  waitingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#D97706',
    lineHeight: 18,
  },
  newConditionBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THREAD_UI.primary,
    paddingVertical: 10,
    alignItems: 'center',
  },
  newConditionText: {
    color: THREAD_UI.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  preellyRejectBtn: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#EDE9FE',
    paddingVertical: 12,
    alignItems: 'center',
  },
  preellyRejectText: {
    color: '#6D28D9',
    fontSize: 14,
    fontWeight: '700',
  },
  preellyRespCard: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  preellyRespApproved: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  preellyRespRejected: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  preellyRespText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
