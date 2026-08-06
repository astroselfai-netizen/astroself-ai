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
  StatusBar,
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
import { ComboTab } from '../../components/AstrologerCombos';
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
  aboutClient: string,
  astrologerUserId: string,
) => {
  const clientRecord = client as Api.User.Res.AstrologerClient & Record<string, unknown>;
  const birthData = client.birth_data || ({} as Api.User.Res.AstrologerClientBirthData);
  const notMentioned = 'Not Mentioned';

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
    about_client: aboutClient,
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
  onEdit: (client: Api.User.Res.AstrologerClient) => void;
  onChart: (client: Api.User.Res.AstrologerClient) => void;
  onDelete: (client: Api.User.Res.AstrologerClient) => void;
  onChat: (client: Api.User.Res.AstrologerClient) => void;
  onDignityAnalysis: (client: Api.User.Res.AstrologerClient) => void;
  onComboShortcut: (client: Api.User.Res.AstrologerClient, comboTab: ComboTab) => void;
};

const ClientCard = ({
  client,
  palette,
  onEdit,
  onChart,
  onDelete,
  onChat,
  onDignityAnalysis,
  onComboShortcut,
}: ClientCardProps) => {
  const clientName =
    client.full_name ||
    `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
    'Unknown Client';

  const shortcutItems: Array<{
    key: string;
    label: string;
    icon?: string;
    image?: number;
    onPress: () => void;
  }> = [
    {
      key: 'antar_dasha',
      label: 'Antardasha Analysis/Report',
      icon: '⚡',
      onPress: () => onComboShortcut(client, 'antar_dasha'),
    },
    {
      key: 'transit',
      label: 'Generic Predictions',
      icon: '⬡',
      onPress: () => onComboShortcut(client, 'transit'),
    },
    {
      key: 'transit_analysis',
      label: 'Transit Analysis',
      icon: '▦',
      onPress: () => onComboShortcut(client, 'transit_analysis'),
    },
    {
      key: 'charts',
      label: 'Charts and Dashas',
      image: require('../../assets/icons/ZodiacWheel.png'),
      onPress: () => onChart(client),
    },
    {
      key: 'dignity',
      label: 'Dignity Analysis',
      icon: '★',
      onPress: () => onDignityAnalysis(client),
    },
    {
      key: 'combinations',
      label: 'Chart Combinations',
      icon: '◎',
      onPress: () => onComboShortcut(client, 'combinations'),
    },
  ];

  return (
    <View
      style={[
        styles.clientCard,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.isDark
            ? palette.borderColor
            : NAVY,
        },
      ]}
    >
      <View style={styles.clientCardTopRow}>
        <View style={styles.clientIdentityRow}>
          <View
            style={[
              styles.clientAvatar,
              {
                backgroundColor: palette.isDark ? '#1E2F44' : NAVY,
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
              <Text style={[styles.locationPin, { color: palette.textMuted }]}>
                📍
              </Text>
              <Text
                style={[styles.locationText, { color: palette.textMuted }]}
                numberOfLines={2}
              >
                {client.birthplace || 'Location not specified'}
              </Text>
            </View>
          </View>
        </View>

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

      <View style={styles.birthInfoRow}>
        <View
          style={[
            styles.birthInfoBox,
            {
              backgroundColor: palette.birthInfoBg,
              borderColor: palette.birthInfoBorder,
            },
          ]}
        >
          <Text style={[styles.birthInfoLabel, { color: palette.textMuted }]}>
            BIRTH DATE
          </Text>
          <Text style={[styles.birthInfoValue, { color: palette.textPrimary }]}>
            {formatBirthDate(client.birth_data)}
          </Text>
        </View>
        <View
          style={[
            styles.birthInfoBox,
            {
              backgroundColor: palette.birthInfoBg,
              borderColor: palette.birthInfoBorder,
            },
          ]}
        >
          <Text style={[styles.birthInfoLabel, { color: palette.textMuted }]}>
            BIRTH TIME
          </Text>
          <Text style={[styles.birthInfoValue, { color: palette.textPrimary }]}>
            {formatBirthTime(client.birth_data)}
          </Text>
        </View>
      </View>

      {client.created_at ? (
        <Text style={[styles.createdDateText, { color: palette.textMuted }]}>
          {formatCreatedDate(client.created_at)}
        </Text>
      ) : null}

      <View style={styles.comboShortcutsList}>
        {shortcutItems.map(shortcut => (
          <TouchableOpacity
            key={shortcut.key}
            style={styles.comboShortcutRow}
            onPress={shortcut.onPress}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.comboShortcutIconBox,
                {
                  backgroundColor: palette.gold,
                },
              ]}
            >
              {shortcut.image ? (
                <Image
                  source={shortcut.image}
                  style={styles.comboShortcutImageIcon}
                />
              ) : (
                <Text style={styles.comboShortcutIcon}>{shortcut.icon}</Text>
              )}
            </View>
            <Text style={[styles.comboShortcutLabel, { color: palette.textPrimary }]}>
              {shortcut.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.chatButton, getOutlinedButtonStyle(palette)]}
        onPress={() => onChat(client)}
        activeOpacity={0.85}
      >
        <Image
          source={require('../../assets/icons/Chat-inactive.png')}
          style={[styles.chatButtonIcon, { tintColor: palette.secondaryButtonText }]}
        />
        <Text style={[styles.chatButtonText, { color: palette.secondaryButtonText }]}>
          Ask Questions
        </Text>
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

  const astrologerUserId = String(user?._id || '');

  const astrologerUser = (userDetails || user) as Record<string, unknown> | undefined;

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

  console.log('clients', astrologerUser);
  console.log('clients', clients);

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

  const handleEdit = useCallback((client: Api.User.Res.AstrologerClient) => {
    setSelectedClient(client);
    setAboutClient(client.about_client || '');
    setShowEditModal(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedClient(null);
    setAboutClient('');
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
        aboutClient.trim(),
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
      <MainContainer
        containerStyle={astrologerMainContainerStyle}
        subContainerStyle={astrologerContainerStyle}
      >
        <View style={styles.headerBackground}>
          <View style={styles.heroTopRow}>
            <View>
              <Text
                style={[
                  styles.heroTitle,
                  {
                    color: palette.isDark
                      ? palette.textPrimary
                      : colors.Orangeaccentcolor,
                  },
                ]}
              >
                Your Charts
              </Text>
              <View
                style={[
                  styles.heroTitleUnderline,
                  {
                    backgroundColor: palette.isDark
                      ? palette.gold
                      : colors.Orangeaccentcolor,
                  },
                ]}
              />
            </View>

            <Image
              source={require('../../assets/icons/Subtract-dark.png')}
              style={[
                styles.headerLogo,
                {
                  tintColor: palette.isDark
                    ? '#EEE5CA'
                    : colors.Orangeaccentcolor,
                },
              ]}
              resizeMode="contain"
            />
          </View>
        </View>

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
                  onEdit={handleEdit}
                  onChart={handleChart}
                  onDelete={handleDelete}
                  onChat={handleChat}
                  onDignityAnalysis={handleDignityAnalysis}
                  onComboShortcut={handleComboShortcut}
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
              <Text style={styles.editModalHeaderTitle}>Edit Member</Text>
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
                      label="Name"
                      value={
                        selectedClient.full_name ||
                        `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim()
                      }
                      textPrimary={palette.textPrimary}
                      textMuted={palette.textMuted}
                    />
                    <EditDetailRow
                      label="Gender"
                      value={selectedClient.gender || '—'}
                      textPrimary={palette.textPrimary}
                      textMuted={palette.textMuted}
                    />
                    <EditDetailRow
                      label="Birth Date"
                      value={formatModalBirthDate(selectedClient.birth_data)}
                      textPrimary={palette.textPrimary}
                      textMuted={palette.textMuted}
                    />
                    <EditDetailRow
                      label="Birth Time"
                      value={formatBirthTime(selectedClient.birth_data)}
                      textPrimary={palette.textPrimary}
                      textMuted={palette.textMuted}
                    />
                    <EditDetailRow
                      label="Location"
                      value={selectedClient.birthplace || '—'}
                      textPrimary={palette.textPrimary}
                      textMuted={palette.textMuted}
                    />
                  </View>

                  <View style={styles.editPersonalDetailsHeader}>
                    <Text
                      style={[styles.editPersonalDetailsTitle, { color: palette.textPrimary }]}
                    >
                      Personal Details
                    </Text>
                    <Image
                      source={require('../../assets/icons/edit-painel.png')}
                      style={[styles.editPersonalDetailsIcon, { tintColor: palette.textMuted }]}
                    />
                  </View>

                  <Text style={[styles.editAboutClientLabel, { color: palette.textPrimary }]}>
                    About client
                  </Text>
                  <TextInput
                    style={[
                      styles.editAboutClientInput,
                      {
                        backgroundColor: palette.inputBg,
                        borderColor: palette.inputBorder,
                        color: palette.textPrimary,
                      },
                    ]}
                    value={aboutClient}
                    onChangeText={setAboutClient}
                    placeholder="Enter details about the chart..."
                    placeholderTextColor={palette.textMuted}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
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
                style={[styles.editModalCancelButton, getOutlinedButtonStyle(palette)]}
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
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.editModalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDeleteModal}
      >
        <View style={styles.deleteModalOverlay}>
          <LinearGradient
            colors={['#E8F4FC', '#FDF3EA', '#FCE8D8']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.deleteModalContainer}
          >
            <Text style={styles.deleteModalTitle}>Delete Chart & Chart Data?</Text>
            <Text style={styles.deleteModalMessage}>
              All Chart information, charts, and related records will be permanently deleted.
              This action cannot be undone.
            </Text>

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteModalYesButton}
                onPress={handleConfirmDelete}
                disabled={isDeletingClient}
                activeOpacity={0.85}
              >
                {isDeletingClient ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.deleteModalYesText}>Yes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteModalNoButton}
                onPress={handleCloseDeleteModal}
                disabled={isDeletingClient}
                activeOpacity={0.85}
              >
                <Text style={styles.deleteModalNoText}>No</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
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
    paddingTop: responsiveWidth('2'),
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
  headerBackground: {
    width: '100%',
    marginTop:
      Platform.OS === 'android' ? 0 : responsiveWidth('13%'),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    paddingBottom: responsiveWidth('3'),
    paddingHorizontal: responsiveWidth('4'),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
  },
  heroTitleUnderline: {
    width: 42,
    height: 3,
    marginTop: 6,
    borderRadius: 2,
  },
  headerLogo: {
    width: responsiveWidth('30'),
    height: responsiveWidth('8'),
    marginTop: 2,
  },
  headerLogoDark: {
    tintColor: '#EEE5CA',
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
    gap: responsiveWidth('2.5'),
    marginBottom: responsiveWidth('2.5'),
  },
  birthInfoBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: responsiveWidth('2.5'),
    paddingHorizontal: responsiveWidth('3'),
  },
  birthInfoLabel: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  birthInfoValue: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
  },
  createdDateText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    marginBottom: responsiveWidth('2.5'),
  },
  comboShortcutsList: {
    gap: responsiveWidth('1'),
    marginBottom: responsiveWidth('3'),
  },
  comboShortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.2,
    borderRadius: 10,
    paddingVertical: responsiveWidth('2'),
    paddingHorizontal: responsiveWidth('2.5'),
    gap: 12,
  },
  comboShortcutIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboShortcutIcon: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  comboShortcutImageIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  comboShortcutLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: responsiveWidth('2'),
    gap: 8,
  },
  chatButtonIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  chatButtonText: {
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
    maxHeight: responsiveWidth('110'),
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
