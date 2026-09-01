import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';
import { MainContainer } from '../../components/common/mainContainer';
import ChartsScreen from '../../components/ChartsScreen/ChartsScreen';
import DashaScreen, {
  AstrologerDashaSelection,
} from '../../components/DashaScreen/DashaScreen';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import UserService from '../../services/user/user.service';
import { getCurrentTransitDashaOverview } from '../../utils/currentTransitDashaOverview';

const NAVY = '#1A3673';

type RootStackParamList = {
  AstrologerClientChartScreen: {
    clientId: string;
    clientName: string;
    clients?: unknown[];
  };
  AstrologerClientChatScreen: {
    clientId: string;
    clientName: string;
    clients?: unknown[];
  };
  ChatWithPrompts: {
    userId: string;
    cardTitles: string;
    tab: string;
  };
  AstrologerDignityAnalysisScreen: {
    clientId: string;
    clientName: string;
  };
};

const AstrologerClientChartScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AstrologerClientChartScreen'>>();
  const userService = useMemo(() => new UserService(), []);

  const clientId = route.params?.clientId || '';
  const clientName = route.params?.clientName || 'Client';
  const clients = route.params?.clients;

  const [loading, setLoading] = useState(true);
  const [dashaLoading, setDashaLoading] = useState(false);
  const [chartData, setChartData] = useState<Record<string, unknown>>({});

  const loadChartDetails = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await userService.getAstrologerChartDetails(clientId);
      console.log('response--->72', response);
      if (response?.data) {
        setChartData(response.data);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      Toast.show({
        type: 'error',
        text1: 'Failed to load chart',
        text2: err.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, userService]);

  useEffect(() => {
    loadChartDetails();
  }, [loadChartDetails]);

  const dashaOverview = useMemo(
    () =>
      getCurrentTransitDashaOverview(
        chartData.all_dasha as Parameters<typeof getCurrentTransitDashaOverview>[0],
      ),
    [chartData.all_dasha],
  );

  const handleChat = () => {
    navigation.navigate('AstrologerClientChatScreen', {
      clientId,
      clientName,
      clients,
    });
  };

  const handleDignityAnalysis = () => {
    navigation.navigate('AstrologerDignityAnalysisScreen', {
      clientId,
      clientName,
    });
  };

  const handleClientsList = () => {
    navigation.goBack();
  };

  const handleAstrologerDashaRowPress = useCallback(
    async (selection: AstrologerDashaSelection) => {
      if (!clientId) return;

      setDashaLoading(true);
      try {
        const response = await userService.getAstrologerClientDashaDetails({
          user_id: clientId,
          level: selection.level,
          md: selection.md,
          ad: selection.ad,
          pd: selection.pd,
          sd: selection.sd,
        });

        console.log('response--->134', response);

        const responseData = response?.data;
        if (responseData) {
          const nextAllDasha =
            responseData.all_dasha ||
            (responseData.dasha as Record<string, unknown> | undefined);

          setChartData(prev => ({
            ...prev,
            ...(nextAllDasha ? { all_dasha: nextAllDasha } : {}),
            ...(responseData.planets_icon
              ? { planets_icon: responseData.planets_icon }
              : {}),
          }));
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        Toast.show({
          type: 'error',
          text1: 'Failed to load dasha',
          text2: err.message || 'Please try again.',
        });
        throw error;
      } finally {
        setDashaLoading(false);
      }
    },
    [clientId, userService],
  );

  if (loading) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
      >
        <MainContainer safeBottom>
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
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
    >
      <MainContainer safeBottom>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroOverlay}>
              <View style={styles.heroTopRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Image
                    source={require('../../assets/icons/back.png')}
                    style={styles.backIcon}
                  />
                </TouchableOpacity>
                <Text style={styles.heroTitle} numberOfLines={1}>
                  {clientName}
                </Text>
                <View style={styles.backBtnPlaceholder} />
              </View>

              <View style={styles.heroActionsRow}>
                <TouchableOpacity
                  style={[styles.heroActionBtn, styles.chatBtn]}
                  onPress={handleChat}
                  activeOpacity={0.85}
                >
                  <Text style={styles.heroActionText}>💬 Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.heroActionBtn, styles.dignityBtn]}
                  onPress={handleDignityAnalysis}
                  activeOpacity={0.85}
                >
                  <Text style={styles.heroActionText}>★ Dignity analysis</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.heroActionBtn, styles.clientsBtn]}
                  onPress={handleClientsList}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.heroActionText, styles.clientsBtnText]}>
                    👥 Charts List
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {dashaOverview.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dashaOverviewRow}
            >
              {dashaOverview.map(item => (
                <View key={item.key} style={styles.dashaOverviewCard}>
                  <Text style={styles.dashaOverviewLabel}>{item.label}</Text>
                  <Text style={styles.dashaOverviewPlanet}>{item.planet}</Text>
                  <Text style={styles.dashaOverviewRange}>{item.start}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <ChartsScreen
            chartDetails={{
              D1: String(chartData.D1 || ''),
              D9: String(chartData.D9 || ''),
              D10: String(chartData.D10 || ''),
              D60: String(chartData.D60 || ''),
              planets_positions: chartData.planets_positions as never,
            }}
          />

          <View style={styles.dashaSection}>
            {dashaLoading ? (
              <View style={styles.dashaLoadingContainer}>
                <ActivityIndicator size="small" color={NAVY} />
              </View>
            ) : null}
            <DashaScreen
              dashaDetails={chartData.all_dasha as never}
              planets_icon={chartData.planets_icon as never}
              astrologerClientMode
              onAstrologerDashaRowPress={handleAstrologerDashaRowPress}
            />
          </View>
        </ScrollView>
      </MainContainer>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: responsiveWidth('10%'),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: 220,
    height: 220,
  },
  heroHeader: {
    marginTop: Platform.OS === 'ios' ? 50 : 36,
    backgroundColor: 'transparent',
    minHeight: 150,
  },
  heroOverlay: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    tintColor: NAVY,
  },
  heroTitle: {
    flex: 1,
    textAlign: 'center',
    color: NAVY,
    fontSize: 22,
    fontFamily: fontFamily.semiBold,
    paddingHorizontal: 8,
  },
  heroActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  heroActionBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: '30%',
    flexGrow: 1,
    alignItems: 'center',
  },
  chatBtn: {
    backgroundColor: '#2E9E5B',
  },
  dignityBtn: {
    backgroundColor: '#C5A370',
  },
  clientsBtn: {
    backgroundColor: '#FFFFFF',
  },
  heroActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  clientsBtnText: {
    color: NAVY,
  },
  dashaOverviewRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
    marginBottom: 4,
  },
  dashaOverviewCard: {
    minWidth: 150,
    borderRadius: 10,
    backgroundColor: '#F4F7FB',
    borderWidth: 1,
    borderColor: '#D8E2F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dashaOverviewLabel: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: NAVY,
    marginBottom: 4,
  },
  dashaOverviewPlanet: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: NAVY,
    marginBottom: 2,
  },
  dashaOverviewRange: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#5B6B82',
  },
  dashaSection: {
    marginTop: 8,
  },
  dashaLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});

export default AstrologerClientChartScreen;
