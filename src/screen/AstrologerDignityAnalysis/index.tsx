import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import { SvgXml } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { MainContainer } from '../../components/common/mainContainer';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import UserService from '../../services/user/user.service';
import { Api } from '../../types/api';

const NAVY = '#1A3673';
const CHART_SIZE = responsiveWidth('78');
const SCREEN_WIDTH = Dimensions.get('window').width;

type RootStackParamList = {
  AstrologerDignityAnalysisScreen: {
    clientId: string;
    clientName: string;
  };
};

type DashaPill = {
  label: string;
  planet: string;
  start: string;
  end: string;
  backgroundColor: string;
};

type DivisionKey = 'd1' | 'd9' | 'd10';

type DivisionCard = {
  key: DivisionKey;
  title: string;
  chartSvg: string;
  dignity: Api.User.Res.AstrologerDignityPlanet[];
};

type SummaryItem = Api.User.Res.AstrologerDignitySummaryItem;

const titleMap: Record<DivisionKey, string> = {
  d1: 'Lagna-chart',
  d9: 'Navamsa-Chart',
  d10: 'Dasamsa-Chart',
};

const SPECIAL_LABELS: Record<string, string> = {
  exalted: 'Exalted',
  debilitated: 'Debilitated',
  house_lord_dignity: 'House Lord Dignity',
  trine_from_sign: 'Trine From Sign',
  in_own_house: 'In Own House',
  natural_benefic: 'Natural Benefic',
  natural_malefic: 'Natural Malefic',
  yogakaraka: 'Yogakaraka',
  yogkarka: 'Yogakaraka',
  digbal: 'Digbal',
  marankarak: 'Marankarak',
  paap_kartari_yog: 'Paap Kartari Yog',
  Paap_Kartari_Yog: 'Paap Kartari Yog',
  in_fierce_nakshatras: 'In Fierce Nakshatras',
  conjunct_with_friend_planet: 'Conjunct With Friend Planet',
  trine_with_friend_planet: 'Trine With Friend Planet',
  conjunct_with_benefic_planets: 'Conjunct With Benefic Planets',
  trine_with_benefic_planets: 'Trine With Benefic Planets',
  conjunct_with_malefic_planets: 'Conjunct With Malefic Planets',
  trine_with_malefic_planets: 'Trine With Malefic Planets',
  planet_is_functional_malefic: 'Planet Is Functional Malefic',
  malefic_or_surrounded_by_6_8_12_lord: 'Malefic Or Surrounded By 6 8 12 Lord',
  malefic_planet_sitting_in_10th_from_that_planet:
    'Malefic Planet Sitting In 10th From That Planet',
  malefic_planet_sitting_in_2nd_from_that_planet:
    'Malefic Planet Sitting In 2nd From That Planet',
  getting_3rd_aspect_of_Saturn: 'Getting 3rd Aspect Of Saturn',
  getting_4th_aspect_of_Mars: 'Getting 4th Aspect Of Mars',
  getting_8th_aspect_of_Mars: 'Getting 8th Aspect Of Mars',
  planet_in_sagittarius: 'Planet In Sagittarius',
  nakshatra_whose_lord_is_friend: 'Nakshatra Whose Lord Is Friend',
};

const toTitleCase = (value: string) =>
  value.replace(/\b\w/g, char => char.toUpperCase());

const getValueLabel = (value: string) => {
  if (SPECIAL_LABELS[value]) {
    return SPECIAL_LABELS[value];
  }

  return toTitleCase(value.replace(/_/g, ' '))
    .replace(/\bIs\b/g, 'Is')
    .replace(/\bWith\b/g, 'With')
    .replace(/\bFrom\b/g, 'From')
    .replace(/\bIn\b/g, 'In')
    .replace(/\bOf\b/g, 'Of')
    .replace(/\bThat\b/g, 'That')
    .replace(/\bIts\b/g, 'Its')
    .replace(/\bLord\b/g, 'Lord')
    .replace(/\bDispositer\b/g, 'Dispositer')
    .replace(/\bDispositor\b/g, 'Dispositor')
    .replace(/\bLagna\b/g, 'Lagna');
};

const getActiveReasons = (ruleSet?: Api.User.Res.AstrologerDignityRuleSet) =>
  Object.entries(ruleSet || {})
    .filter(([, value]) => String(value).toLowerCase() === 'yes')
    .filter(([key]) => key.toLowerCase() !== 'planet')
    .map(([key]) => getValueLabel(key));

const getCountForKey = (
  rules: Api.User.Res.AstrologerDignityRuleGroup[] | undefined,
  key: string,
) => {
  const [divisionPrefix = '', ruleSuffix = ''] = key.split('_');
  const apiCountKey = `${divisionPrefix.toUpperCase()}_${ruleSuffix}_count`;
  const exactCountKey = `${key}_count`;
  const upperCountKey = `${key.toUpperCase()}_count`;
  const rule = rules?.find(
    item =>
      Object.prototype.hasOwnProperty.call(item, apiCountKey) ||
      Object.prototype.hasOwnProperty.call(item, exactCountKey) ||
      Object.prototype.hasOwnProperty.call(item, upperCountKey),
  );
  const value =
    (rule?.[apiCountKey as keyof Api.User.Res.AstrologerDignityRuleGroup] as
      | number
      | string
      | undefined) ??
    (rule?.[exactCountKey as keyof Api.User.Res.AstrologerDignityRuleGroup] as
      | number
      | string
      | undefined) ??
    (rule?.[upperCountKey as keyof Api.User.Res.AstrologerDignityRuleGroup] as
      | number
      | string
      | undefined);
  return typeof value === 'number' ? value : Number(value || 0);
};

const getRulesForKey = (
  rules: Api.User.Res.AstrologerDignityRuleGroup[] | undefined,
  key: string,
) => {
  const [divisionPrefix = '', ruleSuffix = ''] = key.split('_');
  const apiRuleKey = `${divisionPrefix.toUpperCase()}_${ruleSuffix}`;
  const exactKey = key;
  const upperKey = key.toUpperCase();
  const rule = rules?.find(
    item =>
      Object.prototype.hasOwnProperty.call(item, apiRuleKey) ||
      Object.prototype.hasOwnProperty.call(item, exactKey) ||
      Object.prototype.hasOwnProperty.call(item, upperKey),
  );
  return (
    (rule?.[apiRuleKey as keyof Api.User.Res.AstrologerDignityRuleGroup] as
      | Api.User.Res.AstrologerDignityRuleSet
      | undefined) ||
    (rule?.[exactKey as keyof Api.User.Res.AstrologerDignityRuleGroup] as
      | Api.User.Res.AstrologerDignityRuleSet
      | undefined) ||
    (rule?.[upperKey as keyof Api.User.Res.AstrologerDignityRuleGroup] as
      | Api.User.Res.AstrologerDignityRuleSet
      | undefined) ||
    {}
  );
};

const formatBirthDate = (birthData?: Api.User.Res.AstrologerClientBirthData) => {
  if (!birthData) {
    return '--';
  }
  return `${String(birthData.day).padStart(2, '0')}-${String(birthData.month).padStart(2, '0')}-${birthData.year}`;
};

const formatBirthTime = (birthData?: Api.User.Res.AstrologerClientBirthData) => {
  if (!birthData) {
    return '--';
  }
  return `${String(birthData.hour).padStart(2, '0')}:${String(birthData.min).padStart(2, '0')}`;
};

const parseRangeValue = (value?: string) => {
  const clean = String(value || '').trim();
  if (!clean) {
    return { start: '--', end: '--' };
  }

  const [startPart, endPart] = clean.split(/\s+to\s+/i);
  return {
    start: startPart?.trim().split(/\s+/)[0] || '--',
    end: endPart?.trim().split(/\s+/)[0] || '--',
  };
};

const parseDashaEntry = (
  label: string,
  dashaObj?: Record<string, string[]>,
  backgroundColor = '#F7F1E8',
): DashaPill | null => {
  if (!dashaObj) {
    return null;
  }

  const entry = Object.entries(dashaObj)[0];
  if (!entry) {
    return null;
  }

  const [planet, range] = entry;
  const { start, end } = parseRangeValue(range?.[0]);
  return { label, planet, start, end, backgroundColor };
};

const PLANET_SHORT_NAMES: Record<string, string> = {
  sun: 'Su',
  moon: 'Mo',
  mars: 'Ma',
  mercury: 'Me',
  jupiter: 'Ju',
  venus: 'Ve',
  saturn: 'Sa',
  rahu: 'Ra',
  ketu: 'Ke',
  ascendant: 'As',
  lagna: 'As',
};

const getPlanetShortName = (planetName?: string) => {
  const normalized = (planetName || '').trim().toLowerCase();
  if (!normalized) {
    return '--';
  }

  return PLANET_SHORT_NAMES[normalized] || planetName!.slice(0, 2);
};

const getPlanetLabel = (planet: SummaryItem) => {
  const shortName = getPlanetShortName(planet.name);
  const isRetro = planet.isRetro === true || planet.isRetro === 'true';
  return `${shortName}${isRetro ? '(R)' : ''}`;
};

const SUMMARY_COLUMNS = [
  { key: 'planet', label: 'Planet', width: 80 },
  { key: 'house', label: 'House', width: 65 },
  { key: 'sign', label: 'Sign', width: 100 },
  { key: 'degree', label: 'Degree', width: 85 },
  { key: 'nakshatra', label: 'Nakshatra', width: 150 },
  { key: 'd1_dignity', label: 'Dignity-D1', width: 105 },
  { key: 'd9_sign', label: 'D9 Sign', width: 90 },
  { key: 'd9_dignity', label: 'D9 Dignity', width: 105 },
  { key: 'd10_sign', label: 'D10 Sign', width: 90 },
  { key: 'd10_dignity', label: 'D10 Dignity', width: 110 },
] as const;

const getSummaryCellValue = (item: SummaryItem, key: (typeof SUMMARY_COLUMNS)[number]['key']) => {
  switch (key) {
    case 'planet':
      return getPlanetLabel(item);
    case 'house':
      return String(item.house ?? '--');
    case 'sign':
      return String(item.sign ?? '--');
    case 'degree':
      return item.normDegree.toFixed(3);
    case 'nakshatra':
      return `${item.nakshatra}-${item.nakshatra_pad}`;
    case 'd1_dignity':
      return String(item.d1_dignity ?? '--');
    case 'd9_sign':
      return String(item.d9_sign ?? '--');
    case 'd9_dignity':
      return String(item.d9_dignity ?? '--');
    case 'd10_sign':
      return String(item.d10_sign ?? '--');
    case 'd10_dignity':
      return String(item.d10_dignity ?? '--');
    default:
      return '--';
  }
};

const getCardWidth = () => {
  if (SCREEN_WIDTH >= 1180) {
    return '32%';
  }
  if (SCREEN_WIDTH >= 820) {
    return '48.5%';
  }
  return '100%';
};

const AstrologerDignityAnalysisScreen = () => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, 'AstrologerDignityAnalysisScreen'>>();
  const route =
    useRoute<RouteProp<RootStackParamList, 'AstrologerDignityAnalysisScreen'>>();
  const userService = useMemo(() => new UserService(), []);

  const clientId = route.params?.clientId || '';
  const fallbackClientName = route.params?.clientName || 'Client';

  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [memberDetails, setMemberDetails] =
    useState<Api.User.Res.AstrologerMemberDetailsResponse | null>(null);
  const [summaryItems, setSummaryItems] = useState<SummaryItem[]>([]);
  const [divisionCards, setDivisionCards] = useState<DivisionCard[]>([]);

  const loadData = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [memberResponse, dignityResponse] = await Promise.all([
        userService.getAstrologerMemberDetails(clientId),
        userService.getAstrologerDignityChart(clientId),
      ]);

      setMemberDetails(memberResponse);

      const dignityPayload = dignityResponse.data || [];
      const d1Data = dignityPayload.find(item => item.d1_data)?.d1_data;
      const d1Chart = dignityPayload.find(item => item.d1_chart)?.d1_chart || '';
      const d9Data = dignityPayload.find(item => item.d9_data)?.d9_data;
      const d9Chart = dignityPayload.find(item => item.d9_chart)?.d9_chart || '';
      const d10Data = dignityPayload.find(item => item.d10_data)?.d10_data;
      const d10Chart = dignityPayload.find(item => item.d10_chart)?.d10_chart || '';
      const summary = dignityPayload.find(item => item.summary)?.summary || [];

      setSummaryItems(summary);
      setDivisionCards([
        {
          key: 'd1',
          title: titleMap.d1,
          chartSvg: d1Chart,
          dignity: d1Data?.dignity || [],
        },
        {
          key: 'd9',
          title: titleMap.d9,
          chartSvg: d9Chart,
          dignity: d9Data?.dignity || [],
        },
        {
          key: 'd10',
          title: titleMap.d10,
          chartSvg: d10Chart,
          dignity: d10Data?.dignity || [],
        },
      ]);
    } catch (error: unknown) {
      const err = error as { message?: string };
      Toast.show({
        type: 'error',
        text1: 'Failed to load dignity analysis',
        text2: err.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, userService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const headerName = useMemo(() => {
    const birthDetails = memberDetails?.birth_details;
    return (
      `${birthDetails?.first_name || ''} ${birthDetails?.last_name || ''}`.trim() ||
      fallbackClientName
    );
  }, [fallbackClientName, memberDetails?.birth_details]);

  const dashaPills = useMemo(() => {
    const dashaResult = memberDetails?.dasha_result;
    return [
      parseDashaEntry('MD', dashaResult?.Mahadasha, '#FFF7E8'),
      parseDashaEntry('AD', dashaResult?.Antardasha, '#EDF7DD'),
      parseDashaEntry('PD', dashaResult?.Pratyantardasha, '#E7EDF9'),
    ].filter(Boolean) as DashaPill[];
  }, [memberDetails?.dasha_result]);

  const toggleExpanded = useCallback((key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  if (loading) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
      >
        <MainContainer safeBottom>
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={NAVY} />
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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Image source={require('../../assets/icons/back.png')} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Dignity Analysis</Text>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              <Text style={styles.profileName}>{headerName}</Text>
              <Text style={styles.profileBirthDate}>
                BirthDate: {formatBirthDate(memberDetails?.birth_details?.birth_data)}
              </Text>
            </View>
            <View style={styles.profileMetaRow}>
              <Text style={styles.profileMetaText}>
                {memberDetails?.birth_details?.birthplace || '--'}
              </Text>
              <Text style={styles.profileMetaText}>
                Time: {formatBirthTime(memberDetails?.birth_details?.birth_data)}
              </Text>
            </View>

            <View style={styles.dashaWrap}>
              {dashaPills.map(item => (
                <View key={item.label} style={[styles.dashaPill, { backgroundColor: item.backgroundColor }]}>
                  <Text style={styles.dashaLabel}>{item.label}:</Text>
                  <Text style={styles.dashaPlanet}>{item.planet}</Text>
                  <Text style={styles.dashaDate}>From: {item.start}</Text>
                  <Text style={styles.dashaDate}>To: {item.end}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setShowSummary(prev => !prev)}
              activeOpacity={0.8}
            >
              <Text style={styles.sectionTitle}>Summary</Text>
              <Image
                source={require('../../assets/icons/Dropdown.png')}
                style={[
                  styles.sectionToggleIcon,
                  showSummary && styles.sectionToggleIconExpanded,
                ]}
              />
            </TouchableOpacity>

            {showSummary ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.summaryHeaderRow}>
                    {SUMMARY_COLUMNS.map(column => (
                      <Text
                        key={column.key}
                        style={[styles.summaryHeaderCell, { width: column.width }]}
                      >
                        {column.label}
                      </Text>
                    ))}
                  </View>

                  {summaryItems.map((item, index) => (
                    <View
                      key={`${item.name}-${index}`}
                      style={[styles.summaryRow, index % 2 === 1 && styles.summaryRowAlt]}
                    >
                      {SUMMARY_COLUMNS.map(column => (
                        <Text
                          key={`${item.name}-${column.key}-${index}`}
                          style={[styles.summaryCell, { width: column.width }]}
                        >
                          {getSummaryCellValue(item, column.key)}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : null}
          </View>

          <View style={styles.cardsGrid}>
            {divisionCards.map(card => (
              <View key={card.key} style={[styles.chartCard, { width: getCardWidth() }]}>
                <Text style={styles.chartTitle}>{card.title}</Text>
                <View style={styles.chartSvgWrap}>
                  {card.chartSvg ? (
                    <SvgXml
                      xml={card.chartSvg}
                      width={CHART_SIZE}
                      height={CHART_SIZE}
                      preserveAspectRatio="xMidYMid meet"
                      viewBox="0 0 350 350"
                    />
                  ) : (
                    <Text style={styles.emptyState}>Chart unavailable</Text>
                  )}
                </View>

                <View style={styles.planetList}>
                  {card.dignity.map((planet, index) => {
                    const positiveKey = `${card.key}_positive`;
                    const negativeKey = `${card.key}_negative`;
                    const supporting = getActiveReasons(getRulesForKey(planet.rules, positiveKey));
                    const challenging = getActiveReasons(getRulesForKey(planet.rules, negativeKey));
                    const positiveCount = getCountForKey(planet.rules, positiveKey);
                    const negativeCount = getCountForKey(planet.rules, negativeKey);
                    const itemKey = `${card.key}-${planet.planet}-${index}`;
                    const isExpanded = Boolean(expandedItems[itemKey]);

                    return (
                      <View key={itemKey} style={styles.planetCard}>
                        <TouchableOpacity
                          style={[styles.planetHead, isExpanded && styles.planetHeadExpanded]}
                          onPress={() => toggleExpanded(itemKey)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.planetMetaRow}>
                            <Text style={[styles.planetMetaText, styles.planetName]}>
                              {planet.planet}
                            </Text>
                            <Text style={styles.planetMetaText}>
                              Lord:{' '}
                              {(planet.ruling_house || []).length
                                ? (planet.ruling_house || []).join(', ')
                                : 'N/A'}
                            </Text>
                            <Text style={styles.planetMetaText}>
                              House: {planet.sitting_in_house ?? planet.sitting_house ?? '--'}
                            </Text>
                            <Text style={styles.planetMetaText}>P: {positiveCount}</Text>
                            <Text style={styles.planetMetaText}>N: {negativeCount}</Text>
                            <View style={styles.planetToggleCircle}>
                              <Image
                                source={require('../../assets/icons/Dropdown.png')}
                                style={[
                                  styles.planetToggleIcon,
                                  isExpanded && styles.planetToggleIconExpanded,
                                ]}
                              />
                            </View>
                          </View>
                        </TouchableOpacity>

                        {isExpanded ? (
                          <View style={styles.expandedBody}>
                            <View style={styles.reasonCol}>
                              <Text style={styles.reasonHeading}>Supporting</Text>
                              {supporting.length ? (
                                supporting.map(reason => (
                                  <Text key={reason} style={styles.reasonText}>
                                    - {reason}
                                  </Text>
                                ))
                              ) : (
                                <Text style={styles.reasonText}>- No supporting factors</Text>
                              )}
                            </View>

                            <View style={styles.reasonCol}>
                              <Text style={styles.reasonHeading}>Challenging</Text>
                              {challenging.length ? (
                                challenging.map(reason => (
                                  <Text key={reason} style={styles.reasonText}>
                                    - {reason}
                                  </Text>
                                ))
                              ) : (
                                <Text style={styles.reasonText}>- No challenging factors</Text>
                              )}
                            </View>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </MainContainer>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: responsiveWidth('3'),
    paddingTop: Platform.OS === 'ios' ? 48 : 48,
    paddingBottom: responsiveWidth('10'),
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 38,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#D7DEEA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: 0,
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    tintColor: NAVY,
  },
  screenTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    color: NAVY,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E9F0',
    padding: 16,
    gap: 10,
  },
  profileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  profileName: {
    flex: 1,
    minWidth: 160,
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: '#27364B',
  },
  profileBirthDate: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    color: '#27364B',
  },
  profileMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  profileMetaText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: '#4A5568',
  },
  dashaWrap: {
    gap: 10,
  },
  dashaPill: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6DFD3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dashaLabel: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: NAVY,
  },
  dashaPlanet: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#374151',
  },
  dashaDate: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#5B6472',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E9F0',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    // backgroundColor: '#FBF7ED',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: '#27364B',
  },
  sectionToggleIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: NAVY,
  },
  sectionToggleIconExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  sectionToggle: {
    fontSize: 20,
    color: NAVY,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    gap: 10,
    paddingHorizontal: 10,
  },
  summaryHeaderCell: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E9F0',
    gap: 10,
    paddingHorizontal: 10,
  },
  summaryRowAlt: {
    backgroundColor: '#FAFBFD',
  },
  summaryCell: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#27364B',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E9F0',
    padding: 14,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    color: '#27364B',
    marginBottom: 12,
  },
  chartSvgWrap: {
    minHeight: CHART_SIZE + 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyState: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: fontFamily.regular,
  },
  planetList: {
    gap: 10,
  },
  planetCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  planetHead: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  planetHeadExpanded: {
    backgroundColor: '#FBF5E8',
  },
  planetName: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: '#26364C',
  },
  planetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 14,
  },
  planetMetaText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: '#243B6B',
  },
  planetToggleCircle: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    // borderRadius: 14,
    // borderWidth: 2,
    borderColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetToggleIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: NAVY,
  },
  planetToggleIconExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  expandedBody: {
    flexDirection: SCREEN_WIDTH >= 520 ? 'row' : 'column',
    backgroundColor: '#EAF1FB',
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  reasonCol: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 8,
  },
  reasonHeading: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: NAVY,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.regular,
    color: '#667085',
  },
});

export default AstrologerDignityAnalysisScreen;
