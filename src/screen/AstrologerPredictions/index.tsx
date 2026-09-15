import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { MainContainer } from '../../components/common/mainContainer';
import AstrologerChatMemberHeader from '../../components/AstrologerChatMemberHeader';
import AstrologerCombos, { ComboTab } from '../../components/AstrologerCombos';
import AstrologerScreenHeader from '../../components/AstrologerScreenHeader';
import PaidPlanRequiredModal from '../../components/PaidPlanRequiredModal';
import PersonalDetailsRequiredModal from '../../components/PersonalDetailsRequiredModal';
import { icons } from '../../assets';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import UserService from '../../services/user/user.service';
import { RootState } from '../../state/store';
import { Api } from '../../types/api';
import { hasAstrologerPersonalDetails } from '../../utils/astrologerPersonalDetails';
import { isAstrologerPaidPlan } from '../../utils/astrologerPaidPlan';

const NAVY = '#1A3673';
const GOLD = '#C5A370';

type PredictionMode = 'general' | 'personalized';

type RootStackParamList = {
  AstrologerPredictionsScreen: {
    clientId: string;
    clientName?: string;
    predictionMode?: PredictionMode;
    initialComboTab?: ComboTab;
    clients?: Api.User.Res.AstrologerClient[];
  };
  AstrologerClientChartScreen: {
    clientId: string;
    clientName: string;
    clients?: Api.User.Res.AstrologerClient[];
  };
  AstrologerCurrentTransitResultScreen: {
    chartData: Record<string, unknown>;
  };
  PlanTab: undefined;
};

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

const getClientDisplayName = (client?: Api.User.Res.AstrologerClient): string => {
  if (!client) return 'Unknown Client';
  return (
    client.full_name ||
    `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
    'Client'
  );
};

const getClientInitials = (client?: Api.User.Res.AstrologerClient): string => {
  if (!client) return '?';
  const first = client.first_name?.charAt(0) || '';
  const last = client.last_name?.charAt(0) || '';
  return `${first}${last}`.toUpperCase() || '?';
};

const AstrologerPredictionsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, 'AstrologerPredictionsScreen'>>();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const user = useSelector((state: RootState) => state.app.user);
  const userService = useMemo(() => new UserService(), []);

  const routeClientId = route.params?.clientId || '';
  const routeClientName = route.params?.clientName || 'Client';

  const [activeClientId, setActiveClientId] = useState(routeClientId);
  const [activeClientName, setActiveClientName] = useState(routeClientName);
  const [sidebarClients, setSidebarClients] = useState<Api.User.Res.AstrologerClient[]>(
    route.params?.clients || [],
  );
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  const [activeMode, setActiveMode] = useState<PredictionMode>(
    route.params?.predictionMode || 'general',
  );
  const [memberDetails, setMemberDetails] =
    useState<Api.User.Res.AstrologerMemberDetailsResponse | null>(null);
  const [memberDetailsLoading, setMemberDetailsLoading] = useState(true);

  const [showPaidPlanRequiredModal, setShowPaidPlanRequiredModal] =
    useState(false);
  const [showPersonalDetailsRequiredModal, setShowPersonalDetailsRequiredModal] =
    useState(false);
  const [tabsStuck, setTabsStuck] = useState(false);
  const memberHeaderHeightRef = useRef(0);

  // Load clients list for sidebar if not passed
  useEffect(() => {
    let isMounted = true;
    const loadClients = async () => {
      try {
        const userId = user?._id;
        if (!userId) return;
        const response = await userService.getAstrologerClients(userId, 0, 50);
        if (isMounted && response.status && response.data) {
          setSidebarClients(response.data.data || []);
        }
      } catch {
        // Handled silently
      }
    };
    if (!sidebarClients.length) {
      loadClients();
    }
    return () => {
      isMounted = false;
    };
  }, [sidebarClients.length, user?._id, userService]);

  const activeClient = useMemo(
    () =>
      sidebarClients.find(c => String(c.id) === String(activeClientId)) ||
      (route.params as any)?.client,
    [sidebarClients, activeClientId, route.params],
  );

  const loadMemberDetails = useCallback(
    async (clientIdToLoad: string) => {
      if (!clientIdToLoad) {
        setMemberDetails(null);
        setMemberDetailsLoading(false);
        return;
      }

      setMemberDetailsLoading(true);
      try {
        const response = await userService.getAstrologerMemberDetails(clientIdToLoad);
        if (response) {
          setMemberDetails(response);
          const name =
            `${response.birth_details?.first_name || ''} ${response.birth_details?.last_name || ''}`.trim();
          if (name) {
            setActiveClientName(name);
          }
        }
      } catch (err) {
        console.log('Error loading member details:', err);
      } finally {
        setMemberDetailsLoading(false);
      }

      try {
        const planRes = await userService.getAstrologerPlanDetails();
        if (planRes?.data) {
          const planData = planRes.data as {
            is_paid_plan?: boolean;
            has_active_plan?: boolean;
          };
          setIsPaidPlan(
            Boolean(planData.is_paid_plan || planData.has_active_plan),
          );
        }
      } catch {
        // Handled silently
      }
    },
    [userService],
  );

  useEffect(() => {
    loadMemberDetails(activeClientId);
  }, [activeClientId, loadMemberDetails]);

  const closeSidebar = () => {
    setShowSidebar(false);
    setSidebarSearch('');
  };

  const handleBackPress = useCallback(() => {
    if (showSidebar) {
      closeSidebar();
      return;
    }
    navigation.goBack();
  }, [showSidebar, navigation]);

  useEffect(() => {
    const onHardwareBackPress = () => {
      if (showSidebar) {
        closeSidebar();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBackPress,
    );
    return () => subscription.remove();
  }, [showSidebar]);

  const handleSelectClient = (client: Api.User.Res.AstrologerClient) => {
    setActiveClientId(client.id);
    setActiveClientName(getClientDisplayName(client));
    setShowSidebar(false);
    setSidebarSearch('');
  };

  const filteredSidebarClients = useMemo(() => {
    const query = sidebarSearch.trim().toLowerCase();
    if (!query) {
      return sidebarClients;
    }
    return sidebarClients.filter(client => {
      const name = getClientDisplayName(client).toLowerCase();
      return name.includes(query);
    });
  }, [sidebarClients, sidebarSearch]);

  const isPaidPlan = useMemo(() => {
    if ((route.params as any)?.isPaidPlan !== undefined) {
      return Boolean((route.params as any).isPaidPlan);
    }
    return isAstrologerPaidPlan(user);
  }, [user, route.params]);

  const isPersonalizedActive = useMemo(() => {
    return (
      hasAstrologerPersonalDetails(memberDetails) ||
      hasAstrologerPersonalDetails(memberDetails?.birth_details) ||
      hasAstrologerPersonalDetails(activeClient)
    );
  }, [memberDetails, activeClient]);

  const mahadashaPeriod = useMemo(() => {
    const md = memberDetails?.dasha_result?.Mahadasha;
    if (!md) return null;
    const entries = Object.entries(md);
    if (!entries.length) return null;
    const [planet, dates] = entries[0];
    const from = dates?.[0] || '';
    const to = dates?.[1] || '';
    return {
      planet,
      from,
      to,
      dateRange: from && to ? `${from} to ${to}` : from || to || '',
    };
  }, [memberDetails?.dasha_result?.Mahadasha]);

  const antardashaPeriod = useMemo(() => {
    const ad = memberDetails?.dasha_result?.Antardasha;
    if (!ad) return null;
    const entries = Object.entries(ad);
    if (!entries.length) return null;
    const [planet, dates] = entries[0];
    const from = dates?.[0] || '';
    const to = dates?.[1] || '';
    return {
      planet,
      from,
      to,
      dateRange: from && to ? `${from} to ${to}` : from || to || '',
    };
  }, [memberDetails?.dasha_result?.Antardasha]);

  const handleSelectMode = (mode: PredictionMode) => {
    if (mode === 'personalized') {
      if (!isPaidPlan) {
        setShowPaidPlanRequiredModal(true);
        return;
      }
      if (!isPersonalizedActive) {
        setShowPersonalDetailsRequiredModal(true);
        return;
      }
    }
    setActiveMode(mode);
  };

  const handleOpenCharts = () => {
    if (!activeClientId) return;
    navigation.navigate('AstrologerClientChartScreen', {
      clientId: activeClientId,
      clientName: activeClientName,
      clients: sidebarClients,
    });
  };

  const handleCheckTransitCombo = async () => {
    try {
      const bData = memberDetails?.birth_details?.birth_data;
      const payload = {
        day: Number(bData?.day || new Date().getDate()),
        month: Number(bData?.month || new Date().getMonth() + 1),
        year: Number(bData?.year || new Date().getFullYear()),
        hour: Number(bData?.hour || 12),
        min: Number(bData?.min || 0),
        birthplace: String(
          memberDetails?.birth_details?.birthplace || 'Surat, Gujarat, India',
        ),
        lat: Number(memberDetails?.birth_details?.lat || 21.1702),
        lon: Number(memberDetails?.birth_details?.lon || 72.8311),
        tzone: Number(bData?.tzone || 5.5),
      };
      const response = await userService.createAstrologerCurrentTransit(payload);
      if (response?.data) {
        navigation.navigate('AstrologerCurrentTransitResultScreen', {
          chartData: response.data,
        });
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      Toast.show({
        type: 'error',
        text1: 'Transit Error',
        text2: error.message || 'Failed to load transit data.',
      });
    }
  };

  const palette = useMemo(
    () => ({
      screenBg: isDark ? '#0B132B' : '#F4F7FB',
      headerBg: isDark ? '#111D38' : '#FFFFFF',
      headerBorder: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
      textPrimary: isDark ? '#FFFFFF' : '#0B1B3D',
      textMuted: isDark ? '#94A3B8' : '#64748B',
      tabContainerBg: isDark ? '#132144' : '#FFFFFF',
      tabContainerBorder: isDark ? 'rgba(255,255,255,0.12)' : '#DDE5F0',
      tabActiveBg: NAVY,
      tabActiveText: '#FFFFFF',
      tabInactiveBg: 'transparent',
      tabInactiveBorder: isDark ? 'rgba(255,255,255,0.2)' : '#1A3673',
      tabInactiveText: isDark ? '#E2E8F0' : '#1A3673',
      sidebarBg: isDark ? '#0F172A' : '#FFFFFF',
      sidebarBorder: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
      sidebarInputBg: isDark ? '#1E293B' : '#F8FAFC',
      sidebarBtnBg: isDark ? '#1E293B' : '#F1F5F9',
      sidebarSelectedBg: isDark ? '#1E293B' : '#F8FAFC',
      sidebarAvatarBg: isDark ? '#1E293B' : '#F1F5F9',
      sidebarAvatarText: isDark ? '#94A3B8' : '#64748B',
    }),
    [isDark],
  );

  const renderModeTabs = () => (
    <View
      style={[
        styles.modeTabsOuterContainer,
        {
          backgroundColor: palette.tabContainerBg,
          borderColor: palette.tabContainerBorder,
        },
      ]}
    >
      <View style={styles.modeTabsRow}>
        <TouchableOpacity
          style={[
            styles.modeTabPill,
            activeMode === 'general'
              ? [styles.modeTabPillActive, { backgroundColor: palette.tabActiveBg }]
              : [styles.modeTabPillInactive, { borderColor: palette.tabInactiveBorder }],
          ]}
          onPress={() => handleSelectMode('general')}
          activeOpacity={0.85}
        >
          <Text style={styles.modeTabEmoji}>🪐</Text>
          <Text
            style={[
              styles.modeTabText,
              activeMode === 'general'
                ? [styles.modeTabTextActive, { color: palette.tabActiveText }]
                : [styles.modeTabTextInactive, { color: palette.tabInactiveText }],
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            General Predictions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeTabPill,
            activeMode === 'personalized'
              ? [styles.modeTabPillActive, { backgroundColor: palette.tabActiveBg }]
              : [styles.modeTabPillInactive, { borderColor: palette.tabInactiveBorder }],
          ]}
          onPress={() => handleSelectMode('personalized')}
          activeOpacity={0.85}
        >
          <Text style={styles.modeTabEmoji}>
            {!isPaidPlan || !isPersonalizedActive ? '🔒' : '👤'}
          </Text>
          <Text
            style={[
              styles.modeTabText,
              activeMode === 'personalized'
                ? [styles.modeTabTextActive, { color: palette.tabActiveText }]
                : [styles.modeTabTextInactive, { color: palette.tabInactiveText }],
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            Personalized Predictions
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
    >
      <AstrologerScreenHeader
        title="Predictions"
        showBack
        onBack={handleBackPress}
      />

      <MainContainer
        containerStyle={astrologerMainContainerStyle}
        subContainerStyle={astrologerContainerStyle}
      >
        <View style={styles.predictionsBody}>
          {tabsStuck ? (
            <View
              pointerEvents="auto"
              style={[
                styles.stuckTabsOverlay,
                { backgroundColor: palette.screenBg },
              ]}
            >
              {renderModeTabs()}
            </View>
          ) : null}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            scrollEventThrottle={16}
            onScroll={event => {
              const offsetY = event.nativeEvent.contentOffset.y;
              const headerHeight = memberHeaderHeightRef.current;
              const shouldStick =
                headerHeight > 8 && offsetY >= headerHeight - 2;
              setTabsStuck(prev => (prev === shouldStick ? prev : shouldStick));
            }}
          >
            <View
              onLayout={event => {
                memberHeaderHeightRef.current = event.nativeEvent.layout.height;
              }}
            >
              <AstrologerChatMemberHeader
                loading={memberDetailsLoading}
                memberDetails={memberDetails}
                fallbackName={activeClientName}
                fallbackBirthData={activeClient?.birth_data}
                isDark={isDark}
                borderColor={palette.headerBorder}
                backgroundColor={palette.headerBg}
                onOpenCharts={handleOpenCharts}
                onCheckTransitCombo={handleCheckTransitCombo}
              />
            </View>

            <View style={styles.stickyTabsWrap} pointerEvents="box-none">
              {renderModeTabs()}
            </View>

            <View style={styles.combosSectionWrap}>
            {activeClientId ? (
              <AstrologerCombos
                key={`${activeClientId}-${activeMode}`}
                clientId={activeClientId}
                cardBg={palette.headerBg}
                cardBorder={palette.headerBorder}
                textPrimary={palette.textPrimary}
                textMuted={palette.textMuted}
                mode={activeMode}
                onModeChange={setActiveMode}
                initialTab={
                  activeMode === 'personalized'
                    ? route.params?.initialComboTab || 'next_week'
                    : route.params?.initialComboTab || 'antar_dasha'
                }
                useParentScroll
                mahadasha={mahadashaPeriod}
                antardasha={antardashaPeriod}
              />
            ) : (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: palette.headerBg,
                    borderColor: palette.headerBorder,
                  },
                ]}
              >
                <Text style={[styles.emptyText, { color: palette.textMuted }]}>
                  No client selected
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        </View>
      </MainContainer>

      {/* Sidebar Modal to switch client charts */}
      <Modal visible={showSidebar} animationType="slide" onRequestClose={closeSidebar}>
        <View
          style={[
            styles.sidebarPanel,
            {
              backgroundColor: palette.sidebarBg,
            },
          ]}
        >
          <View style={styles.sidebarHeader}>
            <Text style={[styles.sidebarTitle, { color: palette.textPrimary }]}>
              Charts
            </Text>
            <TouchableOpacity
              style={[styles.sidebarCloseBtn, { borderColor: palette.sidebarBorder }]}
              onPress={closeSidebar}
              activeOpacity={0.7}
            >
              <Image
                source={icons.Icclose}
                style={[styles.sidebarCloseIcon, { tintColor: palette.textPrimary }]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarSearchRow}>
            <TouchableOpacity
              style={[
                styles.sidebarBackBtn,
                {
                  borderColor: palette.sidebarBorder,
                  backgroundColor: palette.sidebarBtnBg,
                },
              ]}
              onPress={closeSidebar}
              activeOpacity={0.7}
            >
              <Image
                source={require('../../assets/icons/back.png')}
                style={[styles.sidebarBackIcon, { tintColor: palette.textPrimary }]}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.sidebarSearchInputWrap,
                {
                  borderColor: palette.sidebarBorder,
                  backgroundColor: palette.sidebarInputBg,
                },
              ]}
            >
              <Text style={[styles.sidebarSearchIcon, { color: palette.textMuted }]}>🔍</Text>
              <TextInput
                style={[styles.sidebarSearchInput, { color: palette.textPrimary }]}
                placeholder="Search Chart..."
                placeholderTextColor={palette.textMuted}
                value={sidebarSearch}
                onChangeText={setSidebarSearch}
              />
            </View>
          </View>

          <Text style={[styles.sidebarSectionLabel, { color: palette.textMuted }]}>CHARTS</Text>

          <ScrollView
            style={styles.sidebarClientList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredSidebarClients.length ? (
              filteredSidebarClients.map(client => {
                const isSelected = client.id === activeClientId;
                const initials = getClientInitials(client);
                const name = getClientDisplayName(client);

                return (
                  <TouchableOpacity
                    key={client.id}
                    style={[
                      styles.sidebarClientItem,
                      isSelected && [
                        styles.sidebarClientItemSelected,
                        {
                          borderColor: GOLD,
                          backgroundColor: palette.sidebarSelectedBg,
                        },
                      ],
                    ]}
                    onPress={() => handleSelectClient(client)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.sidebarClientAvatar,
                        {
                          backgroundColor: isSelected ? GOLD : palette.sidebarAvatarBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sidebarClientAvatarText,
                          { color: isSelected ? NAVY : palette.sidebarAvatarText },
                        ]}
                      >
                        {initials}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.sidebarClientName,
                        { color: palette.textPrimary },
                        isSelected && styles.sidebarClientNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={[styles.sidebarEmptyText, { color: palette.textMuted }]}>
                No charts found
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modals */}
      <PersonalDetailsRequiredModal
        visible={showPersonalDetailsRequiredModal}
        onClose={() => setShowPersonalDetailsRequiredModal(false)}
      />

      <PaidPlanRequiredModal
        visible={showPaidPlanRequiredModal}
        onClose={() => setShowPaidPlanRequiredModal(false)}
        onUpgrade={() => {
          setShowPaidPlanRequiredModal(false);
          navigation.navigate('PlanTab');
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  predictionsBody: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: responsiveWidth('12'),
  },
  stickyTabsWrap: {
    paddingHorizontal: responsiveWidth('3.5'),
    paddingTop: responsiveWidth('2'),
    paddingBottom: responsiveWidth('2'),
  },
  stuckTabsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 8,
    paddingHorizontal: responsiveWidth('3.5'),
    paddingTop: responsiveWidth('2'),
    paddingBottom: responsiveWidth('2'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  modeTabsOuterContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: responsiveWidth('1.5'),
  },
  modeTabsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  modeTabPill: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 4,
  },
  modeTabPillActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  modeTabPillInactive: {
    borderWidth: 1.2,
    backgroundColor: 'transparent',
  },
  modeTabEmoji: {
    fontSize: 13,
    lineHeight: 16,
  },
  modeTabText: {
    flexShrink: 1,
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  modeTabTextInactive: {},
  combosSectionWrap: {
    flex: 1,
    paddingHorizontal: responsiveWidth('2'),
    marginTop: responsiveWidth('1'),
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: responsiveWidth('4'),
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
  },
  sidebarPanel: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 60,
    paddingHorizontal: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sidebarTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
  },
  sidebarCloseBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  sidebarCloseIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  sidebarSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sidebarBackBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  sidebarBackIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  sidebarSearchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  sidebarSearchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  sidebarSearchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    paddingVertical: 0,
  },
  sidebarSectionLabel: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    letterSpacing: 1,
    marginBottom: 10,
  },
  sidebarClientList: {
    flex: 1,
  },
  sidebarClientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  sidebarClientItemSelected: {
    borderWidth: 1,
  },
  sidebarClientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sidebarClientAvatarText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
  },
  sidebarClientName: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    flex: 1,
  },
  sidebarClientNameSelected: {
    fontFamily: fontFamily.bold,
  },
  sidebarEmptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
});

export default AstrologerPredictionsScreen;
