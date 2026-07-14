import React, { useCallback, useMemo, useState } from 'react';
import {
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
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { MainContainer } from '../../components/common/mainContainer';
import ChartsScreen from '../../components/ChartsScreen/ChartsScreen';
import DashaScreen from '../../components/DashaScreen/DashaScreen';
import TransitEditModal, { TransitEditPayload } from '../../components/TransitEditModal';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import UserService from '../../services/user/user.service';
import { RootState } from '../../state/store';
import { saveAstrologerCurrentTransitSession } from '../../utils/astrologerCurrentTransitSession';
import { getCurrentTransitDashaOverview } from '../../utils/currentTransitDashaOverview';

const NAVY = '#1A3673';

type TransitBirthplace = {
  place?: string;
  day?: number;
  month?: number;
  year?: number;
  hour?: number;
  min?: number;
  lat?: number;
  lon?: number;
  tzone?: number;
};

type RootStackParamList = {
  AstrologerCurrentTransitResultScreen: {
    chartData: Record<string, unknown>;
  };
};

const AstrologerCurrentTransitResultScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, 'AstrologerCurrentTransitResultScreen'>>();
  const { theme, colors } = useTheme();
  const user = useSelector((state: RootState) => state.app.user);
  const astrologerUserId = String(user?._id || '');
  const userService = useMemo(() => new UserService(), []);

  const [chartData, setChartData] = useState<Record<string, unknown>>(
    route.params?.chartData || {},
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const birthplace = (
    chartData.date_place as Array<{ birthplace?: TransitBirthplace }> | undefined
  )?.[0]?.birthplace;

  const placeLabel = String(birthplace?.place || '');
  const dateLabel = birthplace
    ? `${birthplace.day}/${birthplace.month}/${birthplace.year} ${String(birthplace.hour).padStart(2, '0')}:${String(birthplace.min).padStart(2, '0')}`
    : '';

  const dashaOverview = useMemo(
    () =>
      getCurrentTransitDashaOverview(
        chartData.all_dasha as Parameters<typeof getCurrentTransitDashaOverview>[0],
      ),
    [chartData.all_dasha],
  );

  const planetsPositions =
    (chartData.Current_tansit_planets_positions as never) ||
    (chartData.planets_positions as never);

  const handleTransitEditSave = useCallback(
    async (payload: TransitEditPayload) => {
      setIsUpdating(true);
      try {
        const response = await userService.createAstrologerCurrentTransit(payload);
        if (response?.data) {
          setChartData(response.data);
          if (astrologerUserId) {
            await saveAstrologerCurrentTransitSession(astrologerUserId, response.data);
          }
          setShowEditModal(false);
          Toast.show({
            type: 'success',
            text1: 'Transit Updated',
            text2: 'Chart has been updated successfully.',
          });
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: err.message || 'Please try again.',
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [astrologerUserId, userService],
  );

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
          <View style={styles.headerWrap}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Image
                source={require('../../assets/icons/back.png')}
                style={[
                  styles.backIcon,
                  {
                    tintColor:
                      theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  },
                ]}
              />
            </TouchableOpacity>
            <View style={styles.backIconWrap}>
              <Text
                style={[
                  styles.topBarText,
                  {
                    color:
                      theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  },
                ]}
              >
                Current Transit
              </Text>
            </View>
          </View>

          {(placeLabel || dateLabel) && (
            <View style={styles.metaRow}>
              {placeLabel ? (
                <Text style={[styles.metaText, { color: colors.DarkNavy }]}>
                  {placeLabel}
                </Text>
              ) : null}
              {dateLabel ? (
                <Text style={[styles.metaSubText, { color: colors.DarkNavy }]}>
                  {dateLabel}
                </Text>
              ) : null}
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: NAVY }]}
              onPress={() => setShowEditModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.updateButtonText}>Update Transit Chart</Text>
            </TouchableOpacity>
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
              D1: String(chartData.D1 || chartData.Current_tansit || ''),
              D9: String(chartData.D9 || ''),
              D10: String(chartData.D10 || ''),
              D60: String(chartData.D60 || ''),
              planets_positions: planetsPositions,
            }}
          />

          <View style={styles.dashaSection}>
            <DashaScreen
              dashaDetails={chartData.all_dasha as never}
              planets_icon={chartData.planets_icon as never}
              hideCurrentDashaOverview
            />
          </View>
        </ScrollView>
      </MainContainer>

      <TransitEditModal
        visible={showEditModal}
        saving={isUpdating}
        initialDay={birthplace?.day ?? new Date().getDate()}
        initialMonth={birthplace?.month ?? new Date().getMonth() + 1}
        initialYear={birthplace?.year ?? new Date().getFullYear()}
        initialHour={birthplace?.hour ?? new Date().getHours()}
        initialMin={birthplace?.min ?? new Date().getMinutes()}
        initialPlace={placeLabel}
        initialLat={birthplace?.lat ?? 28.6139298}
        initialLon={birthplace?.lon ?? 77.2088282}
        initialTzone={birthplace?.tzone ?? 5.5}
        onClose={() => setShowEditModal(false)}
        onSave={handleTransitEditSave}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: responsiveWidth('10%'),
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
    marginBottom: 10,
    position: 'relative',
  },
  backBtn: { padding: 8, marginRight: 16 },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
  },
  topBarText: {
    fontSize: 22,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  backIconWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  metaSubText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    opacity: 0.8,
  },
  actionRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  updateButton: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
  },
  dashaOverviewRow: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
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
});

export default AstrologerCurrentTransitResultScreen;
