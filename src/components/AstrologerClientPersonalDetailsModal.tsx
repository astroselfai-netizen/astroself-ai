import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { icons } from '../assets';
import AstrologerPersonalDetailsForm, {
  PersonalDetailsValues,
} from './AstrologerPersonalDetailsForm';
import { fontFamily, responsiveWidth } from '../constant/theme';
import { Api } from '../types/api';

const NAVY = '#223149';
const GOLD = '#C5A370';

type ClientRecord = Api.User.Res.AstrologerClient & Record<string, unknown>;

type AstrologerClientPersonalDetailsModalProps = {
  visible: boolean;
  client: ClientRecord | null;
  values: PersonalDetailsValues;
  onChange: <K extends keyof PersonalDetailsValues>(
    field: K,
    value: PersonalDetailsValues[K],
  ) => void;
  onSave: () => void;
  onClose: () => void;
  saving?: boolean;
  isDark?: boolean;
};

const pad = (value?: number | string) => String(value ?? '').padStart(2, '0');

const formatBirthDate = (birthData?: Api.User.Res.AstrologerClientBirthData) => {
  if (!birthData?.day || !birthData?.month || !birthData?.year) {
    return '—';
  }
  return `${birthData.day}/${birthData.month}/${birthData.year}`;
};

const formatBirthTime = (birthData?: Api.User.Res.AstrologerClientBirthData) => {
  if (birthData?.hour == null || birthData?.min == null) {
    return '—';
  }
  return `${pad(birthData.hour)}:${pad(birthData.min)}`;
};

const DetailRow = ({
  label,
  value,
  textPrimary,
  textMuted,
}: {
  label: string;
  value: string;
  textPrimary: string;
  textMuted: string;
}) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, { color: textMuted }]}>{label}</Text>
    <Text style={[styles.detailValue, { color: textPrimary }]}>{value}</Text>
  </View>
);

const AstrologerClientPersonalDetailsModal = ({
  visible,
  client,
  values,
  onChange,
  onSave,
  onClose,
  saving = false,
  isDark = false,
}: AstrologerClientPersonalDetailsModalProps) => {
  const textPrimary = isDark ? '#FFFFFF' : NAVY;
  const textMuted = isDark ? '#B8B0A0' : '#8B95A8';
  const cardBg = isDark ? '#2A3F58' : '#FFFFFF';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB';
  const birthBoxBg = isDark ? '#354D6A' : '#EEF4FB';
  const birthBoxBorder = isDark ? 'rgba(255,255,255,0.12)' : '#D6E4F5';

  const palette = {
    isDark,
    textPrimary,
    textMuted,
    gold: GOLD,
    cardBg,
    inputBg: isDark ? '#1C2638' : '#FFFFFF',
    inputBorder,
  };

  const displayName =
    client?.full_name ||
    `${client?.first_name || ''} ${client?.last_name || ''}`.trim() ||
    '—';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: cardBg,
              borderColor: inputBorder,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Chart</Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image source={icons.Icclose} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {client ? (
              <>
                <View
                  style={[
                    styles.birthBox,
                    {
                      backgroundColor: birthBoxBg,
                      borderColor: birthBoxBorder,
                    },
                  ]}
                >
                  <DetailRow
                    label="NAME"
                    value={displayName}
                    textPrimary={textPrimary}
                    textMuted={textMuted}
                  />
                  <DetailRow
                    label="GENDER"
                    value={client.gender || '—'}
                    textPrimary={textPrimary}
                    textMuted={textMuted}
                  />
                  <DetailRow
                    label="BIRTH DATE"
                    value={formatBirthDate(client.birth_data)}
                    textPrimary={textPrimary}
                    textMuted={textMuted}
                  />
                  <DetailRow
                    label="BIRTH TIME"
                    value={formatBirthTime(client.birth_data)}
                    textPrimary={textPrimary}
                    textMuted={textMuted}
                  />
                  <DetailRow
                    label="LOCATION"
                    value={client.birthplace || '—'}
                    textPrimary={textPrimary}
                    textMuted={textMuted}
                  />
                </View>

                <AstrologerPersonalDetailsForm
                  values={values}
                  onChange={onChange}
                  palette={palette as any}
                />
              </>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: inputBorder }]}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: NAVY }]}
              onPress={onClose}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={[styles.cancelText, { color: isDark ? '#FFFFFF' : NAVY }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={onSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('4'),
  },
  container: {
    width: '100%',
    maxHeight: '88%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth('3.5'),
    paddingVertical: responsiveWidth('2.8'),
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  closeIcon: {
    width: 22,
    height: 22,
    tintColor: '#FFFFFF',
    resizeMode: 'contain',
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: responsiveWidth('3'),
  },
  birthBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: responsiveWidth('3'),
    paddingVertical: responsiveWidth('2.2'),
    marginBottom: responsiveWidth('2.5'),
  },
  detailRow: {
    marginBottom: responsiveWidth('1.2'),
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    marginBottom: 1,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  footer: {
    flexDirection: 'row',
    gap: responsiveWidth('2.5'),
    paddingHorizontal: responsiveWidth('3'),
    paddingVertical: responsiveWidth('3'),
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: responsiveWidth('2.8'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cancelText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  saveBtn: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: GOLD,
    paddingVertical: responsiveWidth('2.8'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
});

export default AstrologerClientPersonalDetailsModal;
