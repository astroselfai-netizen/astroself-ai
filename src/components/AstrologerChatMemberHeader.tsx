import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fontFamily, responsiveWidth } from '../constant/theme';
import { Api } from '../types/api';

const NAVY = '#1A3673';
const GOLD = '#C5A370';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

type DashaVariant = 'md' | 'ad' | 'pd';

type DashaPillData = {
  label: string;
  planet: string;
  dateRange: string;
  variant: DashaVariant;
};

type AstrologerChatMemberHeaderProps = {
  loading?: boolean;
  memberDetails: Api.User.Res.AstrologerMemberDetailsResponse | null;
  fallbackName?: string;
  isDark?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  onOpenSidebar: () => void;
  onOpenCharts: () => void;
  onCheckTransitCombo: () => void;
};

const parseDashaEntry = (
  dashaObj?: Record<string, string[]>,
): { planet: string; dateRange: string } | null => {
  if (!dashaObj) {
    return null;
  }

  const entries = Object.entries(dashaObj);
  if (entries.length === 0) {
    return null;
  }

  const [planet, ranges] = entries[0];
  const rawRange = ranges?.[0] || '';
  const dateRange = rawRange
    .replace(/\s+to\s+/i, ' → ')
    .replace(/\s*->\s*/g, ' → ');

  return { planet, dateRange };
};

const formatBirthInfo = (birthData?: Api.User.Res.AstrologerClientBirthData) => {
  if (!birthData) {
    return '';
  }

  const monthLabel = MONTH_LABELS[birthData.month - 1] || String(birthData.month);
  const hour = String(birthData.hour).padStart(2, '0');
  const min = String(birthData.min).padStart(2, '0');

  return `${birthData.day} ${monthLabel} ${birthData.year}, ${hour}:${min}`;
};

const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return `${first}${last}`.toUpperCase() || '?';
};

const DashaPill = ({
  label,
  planet,
  dateRange,
  variant,
  isDark,
}: DashaPillData & { isDark?: boolean }) => {
  const labelStyle =
    variant === 'md'
      ? styles.dashaLabelMd
      : variant === 'ad'
        ? styles.dashaLabelAd
        : styles.dashaLabelPd;
  const labelTextStyle =
    variant === 'md'
      ? styles.dashaLabelTextMd
      : variant === 'ad'
        ? styles.dashaLabelTextAd
        : styles.dashaLabelTextPd;

  return (
    <View
      style={[
        styles.dashaCard,
        variant === 'md' ? styles.dashaCardMd : styles.dashaCardDefault,
        isDark && styles.dashaCardDark,
      ]}
    >
      <View style={labelStyle}>
        <Text style={labelTextStyle}>{label}</Text>
      </View>
      <View style={styles.dashaTextWrap}>
        <Text style={[styles.dashaPlanet, isDark && styles.dashaPlanetDark]} numberOfLines={1}>
          {planet}
        </Text>
        <Text style={[styles.dashaDate, isDark && styles.dashaDateDark]} numberOfLines={1}>
          {dateRange}
        </Text>
      </View>
    </View>
  );
};

const AstrologerChatMemberHeader = ({
  loading = false,
  memberDetails,
  fallbackName = 'Client',
  isDark = false,
  borderColor = '#E5E7EB',
  backgroundColor = '#FFFFFF',
  onOpenSidebar,
  onOpenCharts,
  onCheckTransitCombo,
}: AstrologerChatMemberHeaderProps) => {
  const birthDetails = memberDetails?.birth_details;
  const displayName =
    `${birthDetails?.first_name || ''} ${birthDetails?.last_name || ''}`.trim() ||
    fallbackName;
  const birthInfo = formatBirthInfo(birthDetails?.birth_data);
  const initials = getInitials(birthDetails?.first_name, birthDetails?.last_name);

  const dashaPills = useMemo<DashaPillData[]>(() => {
    const dashaResult = memberDetails?.dasha_result;
    const pills: DashaPillData[] = [];

    const md = parseDashaEntry(dashaResult?.Mahadasha);
    if (md) {
      pills.push({ label: 'MD', variant: 'md', ...md });
    }

    const ad = parseDashaEntry(dashaResult?.Antardasha);
    if (ad) {
      pills.push({ label: 'AD', variant: 'ad', ...ad });
    }

    const pd = parseDashaEntry(dashaResult?.Pratyantardasha);
    if (pd) {
      pills.push({ label: 'PD', variant: 'pd', ...pd });
    }

    return pills;
  }, [memberDetails?.dasha_result]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.menuBtn, { borderColor }]}
          onPress={onOpenSidebar}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuIcon, isDark && styles.menuIconDark]}>☰</Text>
        </TouchableOpacity>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.profileTextWrap}>
          <Text
            style={[styles.clientName, isDark && styles.clientNameDark]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          {birthInfo ? (
            <Text
              style={[styles.birthInfo, isDark && styles.birthInfoDark]}
              numberOfLines={1}
            >
              {birthInfo}
            </Text>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={GOLD} />
        </View>
      ) : dashaPills.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dashaRow}
          style={styles.dashaScroll}
        >
          {dashaPills.map(pill => (
            <DashaPill key={pill.label} {...pill} isDark={isDark} />
          ))}
        </ScrollView>
      ) : null}

      {/* <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.chartsBtn}
          onPress={onOpenCharts}
          activeOpacity={0.85}
        >
          <Image
            source={require('../assets/icons/home/Chart.png')}
            style={styles.chartsBtnIcon}
          />
          <Text style={styles.chartsBtnText}>Charts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.transitComboBtn, isDark && styles.transitComboBtnDark]}
          onPress={onCheckTransitCombo}
          activeOpacity={0.85}
        >
          <Text style={styles.transitComboIcon}>★</Text>
          <Text style={styles.transitComboText}>Check Transit Combo</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingHorizontal: responsiveWidth('3'),
    paddingTop: responsiveWidth('2.5'),
    paddingBottom: responsiveWidth('3'),
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 16,
    color: NAVY,
    lineHeight: 18,
  },
  menuIconDark: {
    color: '#FFFFFF',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: GOLD,
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  profileTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  clientName: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: NAVY,
  },
  clientNameDark: {
    color: '#FFFFFF',
  },
  birthInfo: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#6B7280',
  },
  birthInfoDark: {
    color: '#B8B0A0',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAVY,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 5,
  },
  chartsBtnIcon: {
    width: 14,
    height: 14,
    tintColor: '#FFFFFF',
    resizeMode: 'contain',
  },
  chartsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  transitComboBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    backgroundColor: '#FFFFFF',
  },
  transitComboBtnDark: {
    backgroundColor: 'transparent',
  },
  transitComboIcon: {
    color: GOLD,
    fontSize: 11,
  },
  transitComboText: {
    color: GOLD,
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
  },
  loadingRow: {
    paddingVertical: 6,
    alignItems: 'flex-start',
  },
  dashaScroll: {
    flexGrow: 0,
  },
  dashaRow: {
    alignItems: 'center',
    gap: 8,
    paddingRight: responsiveWidth('4'),
  },
  dashaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    height: 38,
    gap: 6,
    maxWidth: responsiveWidth('72'),
  },
  dashaCardMd: {
    borderColor: GOLD,
    backgroundColor: '#FFFBF5',
  },
  dashaCardDefault: {
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  dashaCardDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  dashaLabelMd: {
    backgroundColor: GOLD,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  dashaLabelAd: {
    backgroundColor: NAVY,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  dashaLabelPd: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  dashaLabelTextMd: {
    color: NAVY,
    fontSize: 10,
    fontFamily: fontFamily.bold,
  },
  dashaLabelTextAd: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fontFamily.bold,
  },
  dashaLabelTextPd: {
    color: NAVY,
    fontSize: 10,
    fontFamily: fontFamily.bold,
  },
  dashaTextWrap: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  dashaPlanet: {
    color: NAVY,
    fontSize: 13,
    fontFamily: fontFamily.bold,
    flexShrink: 0,
  },
  dashaPlanetDark: {
    color: '#FFFFFF',
  },
  dashaDate: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: fontFamily.regular,
    flexShrink: 1,
  },
  dashaDateDark: {
    color: '#B8B0A0',
  },
});

export default AstrologerChatMemberHeader;
