import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { MainContainer } from '../../components/common/mainContainer';
import AstrologerScreenHeader from '../../components/AstrologerScreenHeader';
import { ComboTab } from '../../components/AstrologerCombos';
import PersonalDetailsRequiredModal from '../../components/PersonalDetailsRequiredModal';
import PaidPlanRequiredModal from '../../components/PaidPlanRequiredModal';
import AstrologerPersonalDetailsForm, {
  PersonalDetailsValues,
} from '../../components/AstrologerPersonalDetailsForm';
import { responsiveWidth, fontFamily } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAstrologerClients } from '../../hooks/useAstrologerClients';
import { Api } from '../../types/api';
import UserService from '../../services/user/user.service';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { icons } from '../../assets';
import {
  getAstrologerCurrentTransitSession,
  AstrologerCurrentTransitSession,
} from '../../utils/astrologerCurrentTransitSession';

const GOLD = '#C5A370';
const NAVY = '#223149';

const astrologerContainerStyle = {
  backgroundColor: 'transparent',
  marginBottom: 0,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  overflow: 'visible' as const,
};

const astrologerMainContainerStyle = {
  backgroundColor: 'transparent',
};

type ThemePalette = {
  isDark: boolean;
  cardBg: string;
  statsBg: string;
  iconBoxBg: string;
  textPrimary: string;
  textMuted: string;
  borderColor: string;
  screenBg: string;
  inputBg: string;
  inputBorder: string;
  heroBadgeBg: string;
  heroBadgeBorder: string;
  birthInfoBg: string;
  birthInfoBorder: string;
  clientActionBtnBg: string;
  clientActionBtnBorder: string;
  primaryButtonBg: string;
  secondaryButtonBg: string;
  secondaryButtonBorder: string;
  secondaryButtonText: string;
  accent: string;
  gold: string;
  navy: string;
  white: string;
};

const getThemePalette = (
  theme: string,
  colors: ReturnType<typeof useTheme>['colors'],
): ThemePalette => {
  const isDark = theme === 'dark';
  return {
    isDark,
    cardBg: isDark ? '#2A3F58' : colors.white,
    statsBg: isDark ? '#354D6A' : '#FFF8F0',
    iconBoxBg: isDark ? 'rgba(242, 116, 32, 0.18)' : '#FFF0E6',
    textPrimary: isDark ? colors.themeTextWhite : colors.DarkNavy,
    textMuted: isDark ? '#B8B0A0' : '#8B95A8',
    borderColor: isDark ? 'rgba(238, 229, 202, 0.22)' : colors.Orangeaccentcolor,
    screenBg: isDark ? '#202945' : '#F5F6F8',
    inputBg: isDark ? '#2A3F58' : '#FFFFFF',
    inputBorder: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB',
    heroBadgeBg: isDark ? 'rgba(42, 63, 88, 0.92)' : 'rgba(255,255,255,0.72)',
    heroBadgeBorder: isDark ? 'rgba(238, 229, 202, 0.22)' : 'rgba(34, 49, 73, 0.12)',
    birthInfoBg: isDark ? '#354D6A' : '#F3F5F8',
    birthInfoBorder: isDark ? 'rgba(255,255,255,0.12)' : '#E5E9F0',
    clientActionBtnBg: isDark ? '#2A3F58' : '#FFFFFF',
    clientActionBtnBorder: isDark ? 'rgba(255,255,255,0.15)' : '#D1D9E6',
    primaryButtonBg: isDark ? colors.Orangeaccentcolor : NAVY,
    secondaryButtonBg: isDark ? '#2A3F58' : '#FFFFFF',
    secondaryButtonBorder: isDark ? 'rgba(238, 229, 202, 0.35)' : NAVY,
    secondaryButtonText: isDark ? colors.themeTextWhite : NAVY,
    accent: colors.Orangeaccentcolor,
    gold: GOLD,
    navy: isDark ? colors.themeTextWhite : NAVY,
    white: colors.white,
  };
};

const getOutlinedButtonStyle = (palette: ThemePalette) => ({
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: palette.secondaryButtonBorder,
});

const MONTH_MAP: Record<string, string> = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
};

const formatBirthDate = (birthData?: Api.User.Res.AstrologerClientBirthData) => {
  if (!birthData) {
    return '—';
  }
  if (birthData.full_date) {
    const parts = birthData.full_date.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    }
  }
  const { day, month, year } = birthData;
  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
};

const formatBirthTime = (birthData?: Api.User.Res.AstrologerClientBirthData) => {
  if (!birthData) {
    return '—';
  }
  return `${String(birthData.hour).padStart(2, '0')}:${String(birthData.min).padStart(2, '0')}`;
};

const getBirthDayName = (birthData?: Api.User.Res.AstrologerClientBirthData) => {
  if (!birthData || !birthData.year || !birthData.month || !birthData.day) return '';
  try {
    const d = new Date(Number(birthData.year), Number(birthData.month) - 1, Number(birthData.day));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[d.getDay()] || '';
  } catch (e) {
    return '';
  }
};

const formatBirthTimeWithPeriod = (birthData?: Api.User.Res.AstrologerClientBirthData) => {
  if (!birthData) return { timeStr: '—', tzone: '' };
  const hour = Number(birthData.hour ?? 0);
  const min = Number(birthData.min ?? 0);
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  const timeStr = `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${period}`;
  const tzone =
    birthData.tzone === 5.5 || birthData.tzone === undefined || String(birthData.tzone) === '5.5'
      ? 'IST'
      : `UTC+${birthData.tzone}`;
  return { timeStr, tzone };
};

const formatCreatedDate = (createdAt?: string) => {
  if (!createdAt) {
    return '';
  }
  const datePart = createdAt.split(' - ')[0];
  const [day, monthName, year] = datePart.split('-');
  const month = MONTH_MAP[monthName] || monthName;
  return `Created ${day}-${month}-${year}`;
};

const formatModalBirthDate = (birthData?: Api.User.Res.AstrologerClientBirthData) => {
  if (!birthData) {
    return '—';
  }
  return `${birthData.day}/${birthData.month}/${birthData.year}`;
};

const buildAstrologerClientUpdatePayload = (
  client: Api.User.Res.AstrologerClient,
  personalDetails: PersonalDetailsValues,
  astrologerUserId: string,
) => {
  const clientRecord = client as Api.User.Res.AstrologerClient & Record<string, unknown>;
  const birthData = client.birth_data || ({} as Api.User.Res.AstrologerClientBirthData);
  const notMentioned = 'Not Mentioned';

  const hasPersonalDetails = Boolean(
    personalDetails.whatDoYouDo ||
      personalDetails.maritalStatus ||
      personalDetails.children ||
      personalDetails.currentFuturePlans?.trim() ||
      personalDetails.currentChallenges?.trim() ||
      personalDetails.anyOtherDetails?.trim(),
  );

  return {
    id: client.id,
    userId: astrologerUserId,
    first_name: client.first_name,
    last_name: client.last_name,
    gender: client.gender,
    birthplace: client.birthplace,
    adl_report: clientRecord.adl_report || notMentioned,
    planet_report: clientRecord.planet_report || notMentioned,
    lord_report: clientRecord.lord_report || notMentioned,
    nakshatra_report: clientRecord.nakshatra_report || notMentioned,
    adl_report_send: clientRecord.adl_report_send || notMentioned,
    planet_report_send: clientRecord.planet_report_send || notMentioned,
    lord_report_send: clientRecord.lord_report_send || notMentioned,
    nakshatra_report_send: clientRecord.nakshatra_report_send || notMentioned,
    about_client: personalDetails.anyOtherDetails.trim(),
    what_do_you_do: personalDetails.whatDoYouDo,
    marital_status: personalDetails.maritalStatus,
    children: personalDetails.children,
    current_future_plans: personalDetails.currentFuturePlans.trim(),
    current_challenges: personalDetails.currentChallenges.trim(),
    any_other_details: personalDetails.anyOtherDetails.trim(),
    personalizedDetails: hasPersonalDetails,
    personal_details: hasPersonalDetails,
    birth_data: {
      day: birthData.day,
      month: birthData.month,
      year: birthData.year,
      hour: birthData.hour,
      min: birthData.min,
      lat: birthData.lat,
      lon: birthData.lon,
      tzone: birthData.tzone ?? 5.5,
      full_date:
        birthData.full_date || `${birthData.day}-${birthData.month}-${birthData.year}`,
    },
    full_name:
      client.full_name || `${client.first_name || ''} ${client.last_name || ''}`.trim(),
    created_at: client.created_at,
    day: birthData.day,
    month: birthData.month,
    year: birthData.year,
    hour: birthData.hour,
    min: birthData.min,
    lat: clientRecord.lat ?? birthData.lat ?? '',
    lon: clientRecord.lon ?? birthData.lon ?? '',
    tzone: birthData.tzone ?? 5.5,
    isUpdate: true,
    isTransit: false,
    prediction_type: clientRecord.prediction_type || 'bullet',
  };
};

const getInitials = (client: Api.User.Res.AstrologerClient) => {
  const first = client.first_name?.charAt(0) || '';
  const last = client.last_name?.charAt(0) || '';
  return `${first}${last}`.toUpperCase() || '?';
};

type ClientCardProps = {
  client: Api.User.Res.AstrologerClient;
  palette: ThemePalette;
  isPaidPlan?: boolean;
  onEdit: (client: Api.User.Res.AstrologerClient) => void;
  onChart: (client: Api.User.Res.AstrologerClient) => void;
  onDelete: (client: Api.User.Res.AstrologerClient) => void;
  onChat: (client: Api.User.Res.AstrologerClient) => void;
  onGeneralPredictions?: (client: Api.User.Res.AstrologerClient) => void;
  onPersonalizedPredictions?: (client: Api.User.Res.AstrologerClient) => void;
  onShowPersonalDetailsRequired?: () => void;
  onShowPaidPlanRequired?: () => void;
  onBuyReport: (client: Api.User.Res.AstrologerClient) => void;
  onHowItWorks: () => void;
};

const ClientCard = ({
  client,
  palette,
  isPaidPlan = false,
  onEdit,
  onChart,
  onDelete,
  onChat,
  onGeneralPredictions,
  onPersonalizedPredictions,
  onShowPersonalDetailsRequired,
  onShowPaidPlanRequired,
  onBuyReport,
  onHowItWorks,
}: ClientCardProps) => {
  const clientRecord = client as Api.User.Res.AstrologerClient & Record<string, unknown>;
  const isPersonalized = Boolean(
    clientRecord.personal_details ??
    clientRecord.personalizedDetails ??
    clientRecord.personalized_details ??
    clientRecord.is_personalized ??
    false,
  );
  const isLocked = !isPaidPlan || !isPersonalized;

  const clientName =
    client.full_name ||
    `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
    'Unknown Client';

  const dayName = getBirthDayName(client.birth_data);
  const { timeStr, tzone } = formatBirthTimeWithPeriod(client.birth_data);

  return (
    <View
      style={[
        styles.clientCard,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.isDark ? palette.borderColor : '#E2E8F0',
        },
      ]}
    >
      {/* Top Identity Row */}
      <View style={styles.clientCardTopRow}>
        <View style={styles.clientIdentityRow}>
          <View
            style={[
              styles.clientAvatar,
              {
                backgroundColor: '#0B1B3D',
                borderColor: palette.gold,
              },
            ]}
          >
            <Text style={styles.clientAvatarText}>{getInitials(client)}</Text>
          </View>
          <View style={styles.clientNameBlock}>
            <Text style={[styles.clientName, { color: palette.textPrimary }]}>
              {clientName}
            </Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationPin}>📍</Text>
              <Text
                style={[styles.locationText, { color: palette.textMuted }]}
                numberOfLines={1}
              >
                {client.birthplace || 'Location not specified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons: Edit & Delete */}
        <View style={styles.clientActionIcons}>
          <TouchableOpacity
            style={[
              styles.clientActionBtn,
              {
                backgroundColor: palette.clientActionBtnBg,
                borderColor: palette.clientActionBtnBorder,
              },
            ]}
            onPress={() => onEdit(client)}
            activeOpacity={0.85}
          >
            <Image
              source={require('../../assets/icons/edit-painel.png')}
              style={[styles.clientActionIcon, { tintColor: palette.textPrimary }]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.clientActionBtn,
              {
                backgroundColor: palette.clientActionBtnBg,
                borderColor: palette.clientActionBtnBorder,
              },
            ]}
            onPress={() => onDelete(client)}
            activeOpacity={0.85}
          >
            <Image
              source={require('../../assets/icons/trash.png')}
              style={[styles.clientActionIcon, { tintColor: '#EF4444' }]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Birth Info Row (2 side-by-side cards) */}
      <View style={styles.birthInfoRow}>
        {/* Birth Date Box */}
        <View
          style={[
            styles.birthInfoBox,
            {
              backgroundColor: palette.isDark ? '#1E293B' : '#F4F7FB',
              borderColor: palette.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.birthInfoIconWrapDate}>
            <Image
              source={require('../../assets/icons/date-pikar.png')}
              style={styles.birthInfoIconImgDate}
              resizeMode="contain"
            />
          </View>
          <View style={styles.birthInfoCol}>
            <Text style={[styles.birthInfoLabel, { color: palette.textMuted }]}>
              BIRTH DATE
            </Text>
            <Text style={[styles.birthInfoValue, { color: palette.textPrimary }]}>
              {formatBirthDate(client.birth_data)}
            </Text>
            {dayName ? (
              <Text style={[styles.birthInfoSub, { color: palette.textMuted }]}>
                {dayName}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Birth Time Box */}
        <View
          style={[
            styles.birthInfoBox,
            {
              backgroundColor: palette.isDark ? '#2D2418' : '#FAF8F3',
              borderColor: palette.isDark ? 'rgba(245,158,11,0.2)' : '#F3EEDB',
            },
          ]}
        >
          <View style={styles.birthInfoIconWrapTime}>
            <Image
              source={require('../../assets/icons/time_piker.png')}
              style={styles.birthInfoIconImgTime}
              resizeMode="contain"
            />
          </View>
          <View style={styles.birthInfoCol}>
            <Text style={[styles.birthInfoLabel, { color: palette.textMuted }]}>
              BIRTH TIME
            </Text>
            <Text style={[styles.birthInfoValue, { color: palette.textPrimary }]}>
              {timeStr}
            </Text>
            {tzone ? (
              <Text style={[styles.birthInfoSub, { color: palette.textMuted }]}>
                {tzone}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Choose Prediction Mode Section */}
      <View
        style={[
          styles.predictionModeSection,
          {
            backgroundColor: palette.isDark ? '#1C2738' : '#FFFFFF',
            borderColor: palette.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.predictionModeHeaderRow}>
          <Text
            style={[
              styles.predictionModeHeaderTitle,
              { color: palette.textPrimary },
            ]}
          >
            Choose Prediction Mode
          </Text>
          <TouchableOpacity
            style={styles.howItWorksBtn}
            onPress={onHowItWorks}
            activeOpacity={0.7}
          >
            <Text style={styles.howItWorksIcon}>ⓘ</Text>
            <Text style={styles.howItWorksText}>How it works</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.predictionModeCardsRow}>
          {/* General Predictions Card */}
          <TouchableOpacity
            style={[
              styles.modeCard,
              {
                backgroundColor: palette.isDark ? '#182233' : '#F8FAFD',
                borderColor: palette.isDark ? 'rgba(99,102,241,0.3)' : '#E2E8F0',
              },
            ]}
            onPress={() =>
              onGeneralPredictions
                ? onGeneralPredictions(client)
                : onChart(client)
            }
            activeOpacity={0.85}
          >
            <View style={styles.modeIconCircleGeneral}>
              <Text style={styles.modeIconTextGeneral}>🪐</Text>
            </View>
            <Text
              style={[
                styles.modeCardTitle,
                { color: palette.textPrimary },
              ]}
            >
              General Predictions
            </Text>
            <Text
              style={[
                styles.modeCardDesc,
                { color: palette.textMuted },
              ]}
            >
              Based on your birth chart and current planetary positions. No personal details considered.
            </Text>
            <Text style={styles.modeCardLinkGeneral}>
              View predictions →
            </Text>
          </TouchableOpacity>

          {/* Personalized Predictions Card */}
          <TouchableOpacity
            style={[
              styles.modeCard,
              styles.modeCardPersonalized,
              {
                backgroundColor: palette.isDark ? '#2B2214' : '#FFFDF5',
                borderColor: palette.isDark ? '#D97706' : '#F6D8A8',
              },
            ]}
            onPress={() => {
              if (!isPaidPlan) {
                onShowPaidPlanRequired?.();
              } else if (!isPersonalized) {
                onShowPersonalDetailsRequired?.();
              } else if (onPersonalizedPredictions) {
                onPersonalizedPredictions(client);
              } else {
                onChart(client);
              }
            }}
            activeOpacity={0.85}
          >
            {isLocked ? (
              <View style={styles.lockBadgeWrap}>
                <Text style={styles.lockBadgeIcon}>🔒</Text>
              </View>
            ) : null}
            <View style={styles.modeIconCirclePersonalized}>
              <Text style={styles.modeIconTextPersonalized}>👤</Text>
            </View>
            <Text
              style={[
                styles.modeCardTitlePersonalized,
                { color: palette.isDark ? '#FCD34D' : '#92400E' },
              ]}
            >
              Personalized Predictions
            </Text>
            <Text
              style={[
                styles.modeCardDescPersonalized,
                { color: palette.isDark ? '#FDE68A' : '#A16207' },
              ]}
            >
              Tailored using the personal details, current situation, plans and concerns you share with us.
            </Text>
            <Text
              style={[
                styles.modeCardLinkPersonalized,
                { color: palette.isDark ? '#FBBF24' : '#B45309' },
              ]}
            >
              View predictions →
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ask Questions Button (Outlined) */}
      <TouchableOpacity
        style={[
          styles.askQuestionsButton,
          {
            borderColor: palette.isDark ? '#C5A370' : '#0B1B3D',
          },
        ]}
        onPress={() => onChat(client)}
        activeOpacity={0.85}
      >
        <Image
          source={require('../../assets/icons/Chat-active.png')}
          style={[
            styles.askQuestionsIcon,
            { tintColor: palette.isDark ? '#C5A370' : '#0B1B3D' },
          ]}
        />
        <Text
          style={[
            styles.askQuestionsText,
            { color: palette.isDark ? '#C5A370' : '#0B1B3D' },
          ]}
        >
          Ask Questions
        </Text>
      </TouchableOpacity>

      {/* Created Date */}
      {client.created_at ? (
        <View style={styles.createdDateRow}>
          <Image
            source={require('../../assets/icons/date-pikar.png')}
            style={styles.createdDateIcon}
          />
          <Text style={[styles.createdDateText, { color: palette.textMuted }]}>
            {formatCreatedDate(client.created_at)}
          </Text>
        </View>
      ) : null}

      {/* Buy Report Button (Golden Amber) */}
      <TouchableOpacity
        style={styles.buyReportButton}
        onPress={() => onBuyReport(client)}
        activeOpacity={0.85}
      >
        <Image
          source={require('../../assets/icons/document.png')}
          style={styles.buyReportIcon}
        />
        <Text style={styles.buyReportText}>Buy Report</Text>
      </TouchableOpacity>
    </View>
  );
};

const AstrologerMyClientsScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, theme } = useTheme();
  const user = useSelector((state: RootState) => state.app.user);
  const { clients, userDetails, loading, refreshClients } = useAstrologerClients();
  const userService = React.useMemo(() => new UserService(), []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] =
    useState<Api.User.Res.AstrologerClient | null>(null);
  const [aboutClient, setAboutClient] = useState('');
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] =
    useState<Api.User.Res.AstrologerClient | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [transitSession, setTransitSession] =
    useState<AstrologerCurrentTransitSession | null>(null);

  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showPersonalDetailsRequiredModal, setShowPersonalDetailsRequiredModal] =
    useState(false);
  const [showPaidPlanRequiredModal, setShowPaidPlanRequiredModal] =
    useState(false);
  const [personalDetailsForm, setPersonalDetailsForm] =
    useState<PersonalDetailsValues>({
      whatDoYouDo: '',
      maritalStatus: '',
      children: '',
      currentFuturePlans: '',
      currentChallenges: '',
      anyOtherDetails: '',
    });

  const astrologerUserId = String(user?._id || '');
  const astrologerUser = (userDetails || user) as Record<string, unknown> | undefined;

  const isPaidPlan = useMemo(() => {
    const currentPlan = String(
      astrologerUser?.current_plan ||
        astrologerUser?.plan_name ||
        astrologerUser?.plan ||
        user?.plan ||
        '',
    )
      .toLowerCase()
      .trim();

    const isFree =
      !currentPlan ||
      currentPlan === 'free' ||
      currentPlan === 'basic' ||
      currentPlan.includes('free');

    const isSubActive =
      astrologerUser?.is_paid === true ||
      astrologerUser?.plan_status === 'active' ||
      astrologerUser?.is_subscribed === true ||
      (!isFree && Boolean(currentPlan));

    return Boolean(isSubActive && !isFree);
  }, [astrologerUser, user]);

  const handleViewPlans = useCallback(() => {
    setShowPaidPlanRequiredModal(false);
    const rootNavigation = navigation.getParent()?.getParent();
    if (rootNavigation?.navigate) {
      rootNavigation.navigate('AstrologerHome', {
        screen: 'PlanTab',
        params: { screen: 'AstrologerPlanScreen' },
      });
      return;
    }
    navigation.navigate('AstrologerPlanScreen');
  }, [navigation]);

  const navigateFromRoot = useCallback(
    (screen: string, params?: Record<string, unknown>) => {
      const rootNavigation = navigation.getParent()?.getParent();
      if (rootNavigation?.navigate) {
        rootNavigation.navigate(screen, params);
        return;
      }
      navigation.navigate(screen, params);
    },
    [navigation],
  );

  const handleBuyReport = useCallback(
    (client: Api.User.Res.AstrologerClient) => {
      const parentNav = navigation.getParent();
      if (parentNav?.navigate) {
        parentNav.navigate('ReportTab', {
          screen: 'ReportScreen',
          params: { userId: client.id },
        });
        return;
      }
      navigateFromRoot('ReportScreen', { userId: client.id });
    },
    [navigation, navigateFromRoot],
  );

  useFocusEffect(
    React.useCallback(() => {
      refreshClients();
      let isActive = true;

      getAstrologerCurrentTransitSession(astrologerUserId).then(session => {
        if (isActive) {
          setTransitSession(session);
        }
      });

      return () => {
        isActive = false;
      };
    }, [refreshClients, astrologerUserId]),
  );

  const totalClients =
    Number(astrologerUser?.astrologer_current_members) || clients.length || 0;

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return clients;
    }
    return clients.filter(client => {
      const name = (client.full_name || `${client.first_name} ${client.last_name}`).toLowerCase();
      const place = (client.birthplace || '').toLowerCase();
      return name.includes(query) || place.includes(query);
    });
  }, [clients, searchQuery]);

  const handleEdit = useCallback((client: Api.User.Res.AstrologerClient) => {
    const clientRecord = client as Api.User.Res.AstrologerClient & Record<string, unknown>;
    setSelectedClient(client);
    setAboutClient(client.about_client || '');
    setPersonalDetailsForm({
      whatDoYouDo: String(
        clientRecord.what_do_you_do || clientRecord.whatDoYouDo || '',
      ),
      maritalStatus: String(
        clientRecord.marital_status || clientRecord.maritalStatus || '',
      ),
      children: String(clientRecord.children || ''),
      currentFuturePlans: String(
        clientRecord.current_future_plans || clientRecord.currentFuturePlans || '',
      ),
      currentChallenges: String(
        clientRecord.current_challenges || clientRecord.currentChallenges || '',
      ),
      anyOtherDetails: String(
        clientRecord.any_other_details || client.about_client || '',
      ),
    });
    setShowEditModal(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedClient(null);
    setAboutClient('');
    setPersonalDetailsForm({
      whatDoYouDo: '',
      maritalStatus: '',
      children: '',
      currentFuturePlans: '',
      currentChallenges: '',
      anyOtherDetails: '',
    });
  }, []);

  const handleSaveClientChanges = useCallback(async () => {
    if (!selectedClient) {
      return;
    }

    const astrologerUserId = String(astrologerUser?._id || user?._id || '');
    if (!astrologerUserId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User ID not found.',
      });
      return;
    }

    try {
      setIsUpdatingClient(true);
      const payload = buildAstrologerClientUpdatePayload(
        selectedClient,
        personalDetailsForm,
        astrologerUserId,
      );
      const response = await userService.updateAstrologerClient(
        selectedClient.id,
        payload,
      );

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: response.message || 'Member info updated successfully',
      });
      handleCloseEditModal();
      refreshClients();
    } catch (error: unknown) {
      const err = error as { message?: string };
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: err.message || 'Failed to update client.',
      });
    } finally {
      setIsUpdatingClient(false);
    }
  }, [
    selectedClient,
    aboutClient,
    astrologerUser?._id,
    user?._id,
    userService,
    handleCloseEditModal,
    refreshClients,
  ]);

  const handleChart = useCallback(
    (client: Api.User.Res.AstrologerClient) => {
      const clientName =
        client.full_name ||
        `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
        'Client';
      navigateFromRoot('AstrologerClientChartScreen', {
        clientId: client.id,
        clientName,
        clients,
      });
    },
    [clients, navigateFromRoot],
  );

  const handleDelete = useCallback((client: Api.User.Res.AstrologerClient) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    if (isDeletingClient) {
      return;
    }
    setShowDeleteModal(false);
    setClientToDelete(null);
  }, [isDeletingClient]);

  const handleConfirmDelete = useCallback(async () => {
    if (!clientToDelete) {
      return;
    }

    const adminId = String(astrologerUser?._id || user?._id || '');
    if (!adminId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User ID not found.',
      });
      return;
    }

    try {
      setIsDeletingClient(true);
      const response = await userService.deleteMember(adminId, clientToDelete.id);
      setShowDeleteModal(false);
      setClientToDelete(null);
      refreshClients();
      Toast.show({
        type: 'success',
        text1: 'Chart Deleted',
        text2: response?.message || 'User deleted successfully',
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: err.message || 'Failed to delete chart',
      });
    } finally {
      setIsDeletingClient(false);
    }
  }, [
    astrologerUser?._id,
    clientToDelete,
    refreshClients,
    user?._id,
    userService,
  ]);

  const handleChat = useCallback(
    (client: Api.User.Res.AstrologerClient) => {
      const clientName =
        client.full_name ||
        `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
        'Client';
      navigateFromRoot('AstrologerClientChatScreen', {
        clientId: client.id,
        clientName,
        clients,
      });
    },
    [clients, navigateFromRoot],
  );

  const handleGeneralPredictions = useCallback(
    (client: Api.User.Res.AstrologerClient) => {
      const clientName =
        client.full_name ||
        `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
        'Client';
      navigateFromRoot('AstrologerClientChatScreen', {
        clientId: client.id,
        clientName,
        clients,
        initialView: 'combos',
        predictionMode: 'general',
      });
    },
    [clients, navigateFromRoot],
  );

  const handlePersonalizedPredictions = useCallback(
    (client: Api.User.Res.AstrologerClient) => {
      const clientName =
        client.full_name ||
        `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
        'Client';
      navigateFromRoot('AstrologerClientChatScreen', {
        clientId: client.id,
        clientName,
        clients,
        initialView: 'personalized',
        predictionMode: 'personalized',
      });
    },
    [clients, navigateFromRoot],
  );

  const handleComboShortcut = useCallback(
    (client: Api.User.Res.AstrologerClient, comboTab: ComboTab) => {
      const clientName =
        client.full_name ||
        `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
        'Client';
      navigateFromRoot('AstrologerClientChatScreen', {
        clientId: client.id,
        clientName,
        clients,
        initialView: 'combos',
        initialComboTab: comboTab,
      });
    },
    [clients, navigateFromRoot],
  );

  const handleDignityAnalysis = useCallback(
    (client: Api.User.Res.AstrologerClient) => {
      const clientName =
        client.full_name ||
        `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
        'Client';
      navigateFromRoot('AstrologerDignityAnalysisScreen', {
        clientId: client.id,
        clientName,
      });
    },
    [navigateFromRoot],
  );

  const handleCreateClient = useCallback(() => {
    const rootNavigation = navigation.getParent()?.getParent();
    if (rootNavigation?.navigate) {
      rootNavigation.navigate('AstrologerCreateClientScreen', {
        fromYourCharts: true,
      });
      return;
    }
    navigation.navigate('AstrologerCreateClientScreen', {
      fromYourCharts: true,
    });
  }, [navigation]);

  const navigateToTransitScreen = useCallback(
    (screenName: string, params?: Record<string, unknown>) => {
      const rootNavigation = navigation.getParent()?.getParent();
      if (rootNavigation?.navigate) {
        rootNavigation.navigate(screenName, params);
        return;
      }
      navigation.navigate(screenName, params);
    },
    [navigation],
  );

  const handleCurrentTransitChart = useCallback(() => {
    navigateToTransitScreen('AstrologerCurrentTransitScreen');
  }, [navigateToTransitScreen]);

  const handleViewTransit = useCallback(() => {
    if (!transitSession?.chartData) {
      handleCurrentTransitChart();
      return;
    }

    navigateToTransitScreen('AstrologerCurrentTransitResultScreen', {
      chartData: transitSession.chartData,
    });
  }, [transitSession, handleCurrentTransitChart, navigateToTransitScreen]);

  const palette = useMemo(() => getThemePalette(theme, colors), [theme, colors]);

  if (loading && !clients.length) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
      >
        <AstrologerScreenHeader title="Your Charts" />
        <MainContainer
          containerStyle={astrologerMainContainerStyle}
          subContainerStyle={astrologerContainerStyle}
        >
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('../../assets/lottie/loader-Animation-1.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          </View>
        </MainContainer>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : -84}
    >
        <AstrologerScreenHeader title="Your Charts" />
        <MainContainer
          containerStyle={astrologerMainContainerStyle}
          subContainerStyle={astrologerContainerStyle}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refreshClients}
                tintColor={palette.isDark ? colors.themeTextWhite : colors.DarkNavy}
                colors={[palette.accent]}
              />
            }
          >
          <View style={styles.contentPadding}>
            {/* <View style={styles.yourClientsHeader}>
              <View style={[styles.yourClientsMarker, { backgroundColor: palette.gold }]} />
              <Text style={[styles.yourClientsTitle, { color: palette.textPrimary }]}>
                Your Charts
              </Text>
            </View> */}

            <View style={styles.primaryActionRow}>
              <TouchableOpacity
                style={[
                  styles.primaryActionButton,
                  styles.primaryActionButtonHalf,
                  getOutlinedButtonStyle(palette),
                  { width: '50%', maxWidth: '50%'},
                ]}
                onPress={handleCreateClient}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryActionIcon, { color: palette.secondaryButtonText }]}>
                  ⊕
                </Text>
                <Text
                  style={[
                    styles.primaryActionText,
                    styles.primaryActionTextCompact,
                    { color: palette.secondaryButtonText },
                  ]}
                >
                  Create Chart
                </Text>
              </TouchableOpacity>

              {transitSession?.chartData ? (
                <TouchableOpacity
                  style={[
                    styles.primaryActionButton,
                    styles.primaryActionButtonHalf,
                    getOutlinedButtonStyle(palette),
                  ]}
                  onPress={handleViewTransit}
                  activeOpacity={0.85}
                >
                  <Image
                    source={require('../../assets/icons/time_piker.png')}
                    style={[
                      styles.transitActionIcon,
                      { tintColor: palette.secondaryButtonText },
                    ]}
                  />
                  <Text
                    style={[
                      styles.primaryActionText,
                      styles.primaryActionTextCompact,
                      { color: palette.secondaryButtonText },
                    ]}
                  >
                    View Transit
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.primaryActionButton,
                    styles.primaryActionButtonHalf,
                    getOutlinedButtonStyle(palette),
                  ]}
                  onPress={handleCurrentTransitChart}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.primaryActionIcon, { color: palette.secondaryButtonText }]}>
                    ⊕
                  </Text>
                  <Text
                    style={[
                      styles.primaryActionText,
                      styles.primaryActionTextCompact,
                      { color: palette.secondaryButtonText },
                    ]}
                  >
                    Transit Chart
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.inputBorder,
                },
              ]}
            >
              <Text style={[styles.searchIcon, { color: palette.textMuted }]}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: palette.textPrimary }]}
                placeholder="Search Charts"
                placeholderTextColor={palette.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {filteredClients.length ? (
              filteredClients.map(client => (
                <ClientCard
                  key={client.id}
                  client={client}
                  palette={palette}
                  isPaidPlan={isPaidPlan}
                  onEdit={handleEdit}
                  onChart={handleChart}
                  onDelete={handleDelete}
                  onChat={handleChat}
                  onGeneralPredictions={handleGeneralPredictions}
                  onPersonalizedPredictions={handlePersonalizedPredictions}
                  onShowPersonalDetailsRequired={() =>
                    setShowPersonalDetailsRequiredModal(true)
                  }
                  onShowPaidPlanRequired={() =>
                    setShowPaidPlanRequiredModal(true)
                  }
                  onBuyReport={handleBuyReport}
                  onHowItWorks={() => setShowHowItWorksModal(true)}
                />
              ))
            ) : (
              <View
                style={[
                  styles.emptyStateCard,
                  {
                    backgroundColor: palette.cardBg,
                    borderColor: palette.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.emptyStateTitle, { color: palette.textPrimary }]}>
                  {searchQuery ? 'No charts found' : 'No charts yet'}
                </Text>
                <Text style={[styles.emptyStateText, { color: palette.textMuted }]}>
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'Your assigned charts will appear here.'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </MainContainer>

      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseEditModal}
      >
        <View style={styles.editModalOverlay}>
          <View
            style={[
              styles.editModalContainer,
              {
                backgroundColor: palette.isDark ? palette.cardBg : palette.white,
                borderColor: palette.inputBorder,
              },
            ]}
          >
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalHeaderTitle}>Edit Chart</Text>
              <TouchableOpacity
                onPress={handleCloseEditModal}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Image source={icons.Icclose} style={styles.editModalCloseIcon} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.editModalScroll}
              contentContainerStyle={styles.editModalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {selectedClient ? (
                <>
                  <View
                    style={[
                      styles.editBirthDetailsBox,
                      {
                        backgroundColor: palette.isDark ? palette.statsBg : '#EEF4FB',
                        borderColor: palette.isDark
                          ? palette.borderColor
                          : '#D6E4F5',
                      },
                    ]}
                  >
                    <EditDetailRow
                      label="NAME"
                      value={
                        selectedClient.full_name ||
                        `${selectedClient.first_name || ''} ${
                          selectedClient.last_name || ''
                        }`.trim() ||
                        '—'
                      }
                      textPrimary={palette.textPrimary}
                      textMuted={palette.textMuted}
                    />
                    <EditDetailRow
                      label="GENDER"
                      value={selectedClient.gender || '—'}
                      textPrimary={palette.textPrimary}
                      textMuted={palette.textMuted}
                    />
                    <EditDetailRow
                      label="BIRTH DATE"
                      value={formatModalBirthDate(selectedClient.birth_data)}
                      textPrimary={palette.textPrimary}
                      textMuted={palette.textMuted}
                    />
                    <EditDetailRow
                      label="BIRTH TIME"
                      value={formatBirthTime(selectedClient.birth_data)}
                      textPrimary={palette.textPrimary}
                      textMuted={palette.textMuted}
                    />
                    <EditDetailRow
                      label="LOCATION"
                      value={selectedClient.birthplace || '—'}
                      textPrimary={palette.textPrimary}
                      textMuted={palette.textMuted}
                    />
                  </View>

                  <AstrologerPersonalDetailsForm
                    values={personalDetailsForm}
                    onChange={(field, val) =>
                      setPersonalDetailsForm(prev => ({ ...prev, [field]: val }))
                    }
                    palette={palette}
                  />
                </>
              ) : null}
            </ScrollView>

            <View
              style={[
                styles.editModalFooter,
                { borderTopColor: palette.inputBorder },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.editModalCancelButton,
                  getOutlinedButtonStyle(palette),
                ]}
                onPress={handleCloseEditModal}
                disabled={isUpdatingClient}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.editModalCancelText,
                    { color: palette.secondaryButtonText },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editModalSaveButton, { backgroundColor: palette.gold }]}
                onPress={handleSaveClientChanges}
                disabled={isUpdatingClient}
                activeOpacity={0.85}
              >
                {isUpdatingClient ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.editModalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Client Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDeleteModal}
      >
        <View style={styles.deleteModalOverlay}>
          <View
            style={[
              styles.deleteModalContainer,
              { backgroundColor: palette.isDark ? palette.cardBg : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.deleteModalTitle, { color: palette.textPrimary }]}>
              Delete Chart
            </Text>
            <Text
              style={[
                styles.deleteModalMessage,
                { color: palette.textMuted },
              ]}
            >
              {clientToDelete
                ? `Are you sure you want to delete ${
                    clientToDelete.full_name ||
                    `${clientToDelete.first_name || ''} ${clientToDelete.last_name || ''}`.trim() ||
                    'this chart'
                  }?`
                : 'Are you sure you want to delete this chart?'}
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[
                  styles.deleteModalNoButton,
                  {
                    borderColor: palette.isDark ? '#6B7280' : NAVY,
                  },
                ]}
                onPress={handleCloseDeleteModal}
                disabled={isDeletingClient}
              >
                <Text
                  style={[
                    styles.deleteModalNoText,
                    { color: palette.textPrimary },
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteModalYesButton,
                  { backgroundColor: '#DC2626' },
                ]}
                onPress={handleConfirmDelete}
                disabled={isDeletingClient}
              >
                {isDeletingClient ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteModalYesText}>Yes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* How it works Info Modal */}
      <Modal
        visible={showHowItWorksModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHowItWorksModal(false)}
      >
        <TouchableOpacity
          style={styles.infoModalOverlay}
          activeOpacity={1}
          onPress={() => setShowHowItWorksModal(false)}
        >
          <View
            style={[
              styles.infoModalContainer,
              { backgroundColor: palette.isDark ? palette.cardBg : '#FFFFFF' },
            ]}
          >
            <Text
              style={[
                styles.infoModalMainTitle,
                { color: palette.textPrimary },
              ]}
            >
              How Prediction Modes Work
            </Text>

            <View style={styles.infoModalBody}>
              {/* General Predictions Card */}
              <View
                style={[
                  styles.infoModeCard,
                  {
                    backgroundColor: palette.isDark ? '#182233' : '#F9FBFE',
                    borderColor: palette.isDark ? 'rgba(255,255,255,0.1)' : '#E5EDF7',
                  },
                ]}
              >
                <View style={styles.infoModeIconCircleGeneral}>
                  <Text style={styles.infoModeIconText}>🪐</Text>
                </View>
                <View style={styles.infoModeContent}>
                  <Text style={[styles.infoModeCardTitle, { color: palette.textPrimary }]}>
                    General Predictions
                  </Text>
                  <Text style={[styles.infoModeCardDesc, { color: palette.textMuted }]}>
                    Uses the birth chart and current planet positions only. No personal details are used.
                  </Text>
                </View>
              </View>

              {/* Personalized Predictions Card */}
              <View
                style={[
                  styles.infoModeCard,
                  {
                    backgroundColor: palette.isDark ? '#231F17' : '#FDFCF9',
                    borderColor: palette.isDark ? 'rgba(217,119,6,0.3)' : '#F7E7CE',
                    marginTop: 10,
                  },
                ]}
              >
                <View style={styles.infoModeIconCirclePersonalized}>
                  <Text style={styles.infoModeIconText}>👤</Text>
                </View>
                <View style={styles.infoModeContent}>
                  <Text style={[styles.infoModeCardTitle, { color: palette.textPrimary }]}>
                    Personalized Predictions
                  </Text>
                  <Text style={[styles.infoModeCardDesc, { color: palette.textMuted }]}>
                    Uses the same chart, plus the personal details saved for this profile: current situation, plans and concerns.
                  </Text>
                </View>
              </View>

              {/* Locked Notice Banner */}
              <View
                style={[
                  styles.infoLockedBanner,
                  {
                    backgroundColor: palette.isDark ? '#2E2B3E' : '#F1EFF8',
                    borderColor: palette.isDark ? 'rgba(255,255,255,0.08)' : '#E6E2F2',
                    marginTop: 10,
                  },
                ]}
              >
                <View style={styles.infoLockedIconCircle}>
                  <Text style={styles.infoLockedIconText}>🔒</Text>
                </View>
                <Text style={[styles.infoLockedText, { color: palette.textPrimary }]}>
                  <Text style={{ fontFamily: fontFamily.bold }}>Personalized is locked. </Text>
                  It needs an active paid plan and this profile's personal details.
                </Text>
              </View>

              {/* Got it button */}
              <View style={styles.infoModalBtnWrap}>
                <TouchableOpacity
                  style={[styles.infoModalGotItBtn, { backgroundColor: NAVY }]}
                  onPress={() => setShowHowItWorksModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.infoModalGotItBtnText}>Got it</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Personal Details Required Modal */}
      <PersonalDetailsRequiredModal
        visible={showPersonalDetailsRequiredModal}
        onClose={() => setShowPersonalDetailsRequiredModal(false)}
        isDark={palette.isDark}
      />

      {/* Paid Plan Required Modal */}
      <PaidPlanRequiredModal
        visible={showPaidPlanRequiredModal}
        onClose={() => setShowPaidPlanRequiredModal(false)}
        onViewPlans={handleViewPlans}
        isDark={palette.isDark}
      />
    </KeyboardAvoidingView>
  );
};

type EditDetailRowProps = {
  label: string;
  value: string;
  textPrimary: string;
  textMuted: string;
};

const EditDetailRow = ({ label, value, textPrimary, textMuted }: EditDetailRowProps) => (
  <View style={styles.editDetailRow}>
    <Text style={[styles.editDetailLabel, { color: textMuted }]}>{label}</Text>
    <Text style={[styles.editDetailValue, { color: textPrimary }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'android' ? 100 : 120,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  contentPadding: {
    paddingHorizontal: responsiveWidth('4'),
    paddingTop: responsiveWidth('5'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 264,
    height: 264,
  },
  totalClientsBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: responsiveWidth('3'),
    paddingVertical: responsiveWidth('2'),
    minWidth: responsiveWidth('24'),
  },
  totalClientsLabel: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    marginBottom: 4,
  },
  totalClientsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  totalClientsCount: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
  },
  totalClientsIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalClientsIconText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  yourClientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveWidth('3'),
    gap: 10,
  },
  yourClientsMarker: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
  yourClientsTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: responsiveWidth('3'),
    marginBottom: responsiveWidth('3'),
    minHeight: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: responsiveWidth('2'),
    paddingHorizontal: responsiveWidth('1'),
    gap: 6,
  },
  primaryActionRow: {
    flexDirection: 'row',
    gap: responsiveWidth('2.5'),
    marginBottom: responsiveWidth('3'),
  },
  primaryActionButtonHalf: {
    flex: 1,
  },
  primaryActionButtonSpacing: {
    marginTop: responsiveWidth('2.5'),
    marginBottom: responsiveWidth('4'),
  },
  primaryActionIcon: {
    fontSize: 16,
    fontFamily: fontFamily.medium,
  },
  transitActionIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
  },
  primaryActionText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
  },
  primaryActionTextCompact: {
    fontSize: 12,
    textAlign: 'center',
    flexShrink: 1,
  },
  clientCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: responsiveWidth('3.5'),
    marginBottom: responsiveWidth('3.5'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  clientCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: responsiveWidth('3'),
  },
  clientIdentityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: responsiveWidth('2'),
  },
  clientAvatar: {
    width: responsiveWidth('12'),
    height: responsiveWidth('12'),
    borderRadius: responsiveWidth('6'),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveWidth('2.5'),
  },
  clientAvatarText: {
    color: '#F6EFD9',
    fontSize: 14,
    fontFamily: fontFamily.bold,
  },
  clientNameBlock: {
    flex: 1,
    paddingTop: 2,
  },
  clientName: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationPin: {
    fontSize: 11,
    marginRight: 4,
    marginTop: 1,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    lineHeight: 16,
  },
  clientActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clientActionBtn: {
    width: responsiveWidth('8'),
    height: responsiveWidth('8'),
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientActionIcon: {
    width: responsiveWidth('4.5'),
    height: responsiveWidth('4.5'),
    resizeMode: 'contain',
  },
  birthInfoRow: {
    flexDirection: 'row',
    gap: responsiveWidth('2'),
    marginBottom: responsiveWidth('2.5'),
  },
  birthInfoBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: responsiveWidth('2'),
    paddingHorizontal: responsiveWidth('2.2'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  birthInfoIconWrapDate: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  birthInfoIconImgDate: {
    width: 17,
    height: 17,
    tintColor: '#6366F1',
  },
  birthInfoIconWrapTime: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  birthInfoIconImgTime: {
    width: 17,
    height: 17,
    tintColor: '#D97706',
  },
  birthInfoCol: {
    flex: 1,
  },
  birthInfoLabel: {
    fontSize: 9,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  birthInfoValue: {
    fontSize: 13.5,
    fontFamily: fontFamily.bold,
    lineHeight: 17,
  },
  birthInfoSub: {
    fontSize: 10.5,
    fontFamily: fontFamily.regular,
    marginTop: 1,
  },
  predictionModeSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: responsiveWidth('2.5'),
    marginTop: responsiveWidth('0.5'),
    marginBottom: responsiveWidth('2.5'),
  },
  predictionModeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsiveWidth('2'),
  },
  predictionModeHeaderTitle: {
    fontSize: 13.5,
    fontFamily: fontFamily.bold,
  },
  howItWorksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  howItWorksIcon: {
    fontSize: 13,
    color: '#3B82F6',
  },
  howItWorksText: {
    fontSize: 12,
    color: '#3B82F6',
    fontFamily: fontFamily.medium,
  },
  predictionModeCardsRow: {
    flexDirection: 'row',
    gap: responsiveWidth('2'),
  },
  modeCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: responsiveWidth('2'),
    alignItems: 'center',
    position: 'relative',
    minHeight: 165,
  },
  modeCardPersonalized: {
    borderWidth: 1.2,
  },
  modeIconCircleGeneral: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modeIconTextGeneral: {
    fontSize: 16,
  },
  modeIconCirclePersonalized: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modeIconTextPersonalized: {
    fontSize: 16,
  },
  lockBadgeWrap: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  lockBadgeIcon: {
    fontSize: 9,
  },
  modeCardTitle: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    marginBottom: 3,
  },
  modeCardTitlePersonalized: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    marginBottom: 3,
  },
  modeCardDesc: {
    fontSize: 9.5,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 13.5,
    flex: 1,
  },
  modeCardDescPersonalized: {
    fontSize: 9.5,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 13.5,
    flex: 1,
  },
  modeCardLinkGeneral: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#4F46E5',
    marginTop: 6,
  },
  modeCardLinkPersonalized: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#B45309',
    marginTop: 6,
  },
  askQuestionsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#0B1B3D',
    borderRadius: 10,
    paddingVertical: responsiveWidth('2.8'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: responsiveWidth('1.5'),
  },
  askQuestionsIcon: {
    width: 15,
    height: 15,
    resizeMode: 'contain',
    tintColor: '#0B1B3D',
  },
  askQuestionsText: {
    color: '#0B1B3D',
    fontSize: 14,
    fontFamily: fontFamily.bold,
  },
  createdDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: responsiveWidth('2'),
    paddingHorizontal: 2,
  },
  createdDateIcon: {
    width: 13,
    height: 13,
    resizeMode: 'contain',
    tintColor: '#94A3B8',
  },
  createdDateText: {
    fontSize: 11.5,
    fontFamily: fontFamily.regular,
  },
  buyReportButton: {
    backgroundColor: '#D4A85B',
    borderRadius: 10,
    paddingVertical: responsiveWidth('2.8'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buyReportIcon: {
    width: 15,
    height: 15,
    resizeMode: 'contain',
    tintColor: '#0B1B3D',
  },
  buyReportText: {
    color: '#0B1B3D',
    fontSize: 14,
    fontFamily: fontFamily.bold,
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('6'),
  },
  infoModalContainer: {
    width: '100%',
    borderRadius: 20,
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  infoModalMainTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoModalBody: {
    width: '100%',
  },
  infoModeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  infoModeIconCircleGeneral: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModeIconCirclePersonalized: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModeIconText: {
    fontSize: 18,
  },
  infoModeContent: {
    flex: 1,
  },
  infoModeCardTitle: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    marginBottom: 3,
  },
  infoModeCardDesc: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    lineHeight: 17,
  },
  infoLockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  infoLockedIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLockedIconText: {
    fontSize: 13,
  },
  infoLockedText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: fontFamily.regular,
    lineHeight: 16,
  },
  infoModalBtnWrap: {
    alignItems: 'center',
    marginTop: 18,
  },
  infoModalGotItBtn: {
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalGotItBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  emptyStateCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: responsiveWidth('6'),
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('4'),
  },
  editModalContainer: {
    width: '100%',
    maxHeight: '88%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  editModalHeader: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth('3.5'),
    paddingVertical: responsiveWidth('2.8'),
  },
  editModalHeaderTitle: {
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  editModalCloseIcon: {
    width: 22,
    height: 22,
    tintColor: '#FFFFFF',
    resizeMode: 'contain',
  },
  editModalScroll: {
    flexShrink: 1,
  },
  editModalScrollContent: {
    padding: responsiveWidth('3'),
  },
  editBirthDetailsBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: responsiveWidth('3'),
    paddingVertical: responsiveWidth('2.2'),
    marginBottom: responsiveWidth('2.5'),
  },
  editDetailRow: {
    marginBottom: responsiveWidth('1.2'),
  },
  editDetailLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    marginBottom: 1,
  },
  editDetailValue: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  editPersonalDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsiveWidth('1.5'),
  },
  editPersonalDetailsTitle: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
  },
  editPersonalDetailsIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  editAboutClientLabel: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    marginBottom: responsiveWidth('1.2'),
  },
  editAboutClientInput: {
    minHeight: responsiveWidth('22'),
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: responsiveWidth('2.5'),
    paddingVertical: responsiveWidth('2'),
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  editModalFooter: {
    flexDirection: 'row',
    gap: responsiveWidth('2.5'),
    paddingHorizontal: responsiveWidth('3'),
    paddingVertical: responsiveWidth('3'),
    borderTopWidth: 1,
  },
  editModalCancelButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: responsiveWidth('2.8'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModalCancelText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  editModalSaveButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: responsiveWidth('2.8'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModalSaveText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('6'),
  },
  deleteModalContainer: {
    width: '100%',
    borderRadius: 18,
    paddingHorizontal: responsiveWidth('5'),
    paddingVertical: responsiveWidth('6'),
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    color: NAVY,
    textAlign: 'center',
    marginBottom: responsiveWidth('3'),
  },
  deleteModalMessage: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: NAVY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: responsiveWidth('5'),
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalYesButton: {
    flex: 1,
    backgroundColor: NAVY,
    borderRadius: 999,
    paddingVertical: responsiveWidth('3.2'),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  deleteModalYesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
  },
  deleteModalNoButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: NAVY,
    paddingVertical: responsiveWidth('3.2'),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: 'transparent',
  },
  deleteModalNoText: {
    color: NAVY,
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
  },
});

export default AstrologerMyClientsScreen;
