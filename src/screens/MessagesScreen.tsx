import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { sendMessage, getMessageHistory } from '../services/messageService';
import { t } from '../i18n/translations';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import type { MessageHistoryItem } from '../types/api';

export default function MessagesScreen() {
  const [messages, setMessages] = useState<MessageHistoryItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const result = await getMessageHistory(50);
      setMessages(result.messages.reverse()); // Oldest first for chat view
    } catch (error: any) {
      Alert.alert('', error.message ?? t('error_generic'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMessages();
    }, [fetchMessages]),
  );

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');

    try {
      const result = await sendMessage(text);

      // Optimistically add to local list
      const newMessage: MessageHistoryItem = {
        messageId: result.messageId,
        direction: 'inbound', // Client's message is "inbound" from operator's perspective
        content: text,
        timestamp: result.timestamp,
        isRead: false,
      };
      setMessages(prev => [...prev, newMessage]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('', error.message ?? t('error_generic'));
      setInputText(text); // Restore on failure
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: MessageHistoryItem }) => {
    const isOutbound = item.direction === 'outbound'; // From operator
    return (
      <View style={[
        styles.messageBubble,
        isOutbound ? styles.bubbleLeft : styles.bubbleRight,
      ]}>
        <Text style={[
          styles.messageText,
          isOutbound ? styles.textLeft : styles.textRight,
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.messageTime,
          isOutbound ? styles.timeLeft : styles.timeRight,
        ]}>
          {new Date(item.timestamp).toLocaleTimeString('sr-Latn', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.messageId}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('messages_empty')}</Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('messages_placeholder')}
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.textOnPrimary} />
          ) : (
            <Text style={styles.sendText}>{t('messages_send')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  messageList: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: SPACING.xs,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },
  textLeft: {
    color: COLORS.textPrimary,
  },
  textRight: {
    color: COLORS.textOnPrimary,
  },
  messageTime: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  timeLeft: {
    color: COLORS.textMuted,
  },
  timeRight: {
    color: COLORS.textOnPrimary,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginLeft: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  sendText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});
