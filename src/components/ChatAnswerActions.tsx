import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { fontFamily } from '../constant/theme';
import { copyChatAnswer, shareChatAnswer } from '../utils/astrologerChatShare';

type ChatAnswerActionsProps = {
  text: string;
  color: string;
  borderColor: string;
  backgroundColor: string;
};

const copyIcon = (color: string) => `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="9" y="9" width="13" height="13" rx="2.2" stroke="${color}" stroke-width="1.8"/>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
</svg>
`;

const shareIcon = (color: string) => `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 4v11" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M8.2 7.5 12 3.8l3.8 3.7" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 13v6.2A1.8 1.8 0 0 0 6.8 21h10.4a1.8 1.8 0 0 0 1.8-1.8V13" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
</svg>
`;

const ChatAnswerActions = ({
  text,
  color,
  borderColor,
  backgroundColor,
}: ChatAnswerActionsProps) => {
  const handleCopy = useCallback(async () => {
    const value = text.trim();
    if (!value) {
      Toast.show({ type: 'error', text1: 'Nothing to copy' });
      return;
    }

    try {
      await copyChatAnswer(value);
      Toast.show({ type: 'success', text1: 'Copied' });
    } catch {
      try {
        await shareChatAnswer(value);
      } catch {
        Toast.show({ type: 'error', text1: 'Unable to copy' });
      }
    }
  }, [text]);

  const handleShare = useCallback(async () => {
    const value = text.trim();
    if (!value) {
      Toast.show({ type: 'error', text1: 'Nothing to share' });
      return;
    }

    try {
      await shareChatAnswer(value);
    } catch {
      Toast.show({ type: 'error', text1: 'Unable to share' });
    }
  }, [text]);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.chip, { borderColor, backgroundColor }]}
        onPress={handleCopy}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Copy answer"
      >
        <SvgXml xml={copyIcon(color)} width={15} height={15} />
        <Text style={[styles.label, { color }]}>Copy</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.chip, { borderColor, backgroundColor }]}
        onPress={handleShare}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Share answer"
      >
        <SvgXml xml={shareIcon(color)} width={15} height={15} />
        <Text style={[styles.label, { color }]}>Share</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 40,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    lineHeight: 16,
  },
});

export default ChatAnswerActions;
