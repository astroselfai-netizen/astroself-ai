import React, { useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainContainer } from '../../components/common/mainContainer';
import {
  fontFamily,
  responsiveHeight,
  responsiveWidth,
} from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';

type RootStackParamList = {
  Login: undefined;
  SettingsScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type GuideBlock =
  | { type: 'text'; value: string }
  | { type: 'heading'; value: string }
  | { type: 'list'; items: string[]; bullet?: 'check' | 'star' | 'dot' | 'cross' }
  | { type: 'chips'; items: string[] }
  | { type: 'pair'; leftTitle: string; leftItems: string[]; rightTitle: string; rightItems: string[] };

type GuideItem = {
  id: string;
  title: string;
  blocks: GuideBlock[];
};

const guideData: GuideItem[] = [
  {
    id: 'guide1',
    title: 'How to get the best results from Astrodha',
    blocks: [
      {
        type: 'text',
        value:
          "Astrodha is not a generic AI chatbot, and it is not built to replace an astrologer's judgment. It is a technical astrology research engine — it finds the combinations, you interpret them.",
      },
    ],
  },
  {
    id: 'guide2',
    title: 'Astrodha finds the combinations. The astrologer interprets them.',
    blocks: [
      { type: 'heading', value: 'What Astrodha Does' },
      {
        type: 'text',
        value:
          'Astrodha automates the technical research — it identifies and tracks the structures that matter:',
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'Active houses, planets & dignities',
          'Natal, transit & dasha combinations',
          'Start, end & duration of every combination',
          'Future activations up to 48 months ahead',
        ],
      },
      { type: 'heading', value: 'What the Astrologer Does' },
      {
        type: 'text',
        value:
          'Interpretation and prediction always belong to the astrologer. Astrodha never decides the outcome:',
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'Which houses are relevant to the question',
          'Which combinations matter & which rules apply',
          'Whether combinations support or deny an event',
          'The strongest timing window & final prediction',
        ],
      },
      {
        type: 'text',
        value:
          'Astrodha does not decide whether a combination indicates marriage, childbirth, career growth, promotion, wealth, foreign settlement, relocation, separation or business success. Those rules and interpretations belong to the astrologer.',
      },
    ],
  },
  {
    id: 'guide3',
    title: 'A complete technical picture, automated',
    blocks: [
      {
        type: 'text',
        value: 'For every chart, Astrodha continuously identifies:',
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'Active houses',
          'Active planets',
          'Planetary connections',
          'Planetary dignities',
          'Natal chart combinations',
          'Transit combinations',
          'Dasha activations',
          'Future activations',
          'Future transit combinations',
          'Start & end dates',
          'Duration of combinations',
        ],
      },
      {
        type: 'heading',
        value: 'Every chart is evaluated across six perspectives:',
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'D1 (Rashi / birth chart)',
          'D9 (Navamsha)',
          'D10 (Dashamsha)',
          'Lagna (Ascendant)',
          'Moon Lagna (Chandra Lagna)',
          'Dasha Lagna',
        ],
      },
      {
        type: 'text',
        value:
          'For each of these six perspectives, Astrodha projects the analysis up to 48 months into the future.',
      },
    ],
  },
  {
    id: 'guide4',
    title: 'Think of Astrodha as a technical research engine',
    blocks: [
      {
        type: 'text',
        value:
          'Traditional astrology already provides the rules. The real challenge is identifying which combinations exist, which are active, which are approaching, when they begin and end, which planets are involved, and how strong they are.',
      },
      {
        type: 'text',
        value:
          'Astrodha automates exactly this research across D1, D9, D10, the Dasha systems and future transits — so you spend your time on astrology, not bookkeeping.',
      },
    ],
  },
  {
    id: 'guide5',
    title: 'Where Astrodha delivers the most',
    blocks: [
      { type: 'heading', value: '01. Future House Activations' },
      {
        type: 'text',
        value:
          'Identify which houses are active today and which will activate over the next 48 months — evaluated from Lagna, Moon Lagna and Dasha Lagna simultaneously.',
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'Which houses are active today?',
          'When will a specific house activate?',
          'Which houses are simultaneously active?',
          'Activations through Maha, Antar & Pratyantar dasha',
        ],
      },
      { type: 'heading', value: '02. Future Transit Analysis' },
      {
        type: 'text',
        value:
          'See every important transit combination forming over the next 48 months — what is active, what is ending and what is approaching.',
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'Start date, end date & duration',
          'Planets involved',
          'Type of connection',
          'New combinations approaching',
        ],
      },
      { type: 'heading', value: '03. Planet-to-Planet Connections' },
      {
        type: 'text',
        value:
          'Pinpoint exactly when two planets connect and through which technique — with precise timing windows.',
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'Conjunctions, trines & aspects',
          'Sign & nakshatra exchanges',
          'Same dispositor connections',
          'Multiple simultaneous connections',
        ],
      },
      { type: 'heading', value: '04. Planet-to-House Analysis' },
      {
        type: 'text',
        value:
          'Quickly reveal the technical structure behind any question by seeing which planets activate, influence or support a given house.',
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'Which planets activate the 7th house?',
          'Which planets influence the 10th house?',
          'Which planets support the 11th house?',
          'Which planets impact the 4th house?',
        ],
      },
      { type: 'heading', value: '05. Full Planet Analysis' },
      {
        type: 'text',
        value:
          'A complete technical audit of any planet in a single query — sign, house, nakshatra, dignity, ownership and influences across D1, D9 and D10.',
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'Benefic & malefic influences',
          '6th, 8th & 12th house involvement',
          'D1, D9 & D10 positions',
          'Natal connections & future transits',
        ],
      },
      { type: 'heading', value: '06. Planet Dignity Tracking' },
      {
        type: 'text',
        value:
          "Track how a planet's condition evolves — see when each planet becomes stronger, supported or affected over the next 48 months.",
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          "When will Jupiter's dignity change?",
          'When will Saturn become stronger?',
          'When will Venus receive support?',
          'When will Mars be affected by malefics?',
        ],
      },
      { type: 'heading', value: '07. Refreshing for Existing Charts' },
      {
        type: 'text',
        value:
          'When a chart is returned, simply refresh the chart to instantly review what has changed — without recreating anything.',
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'Newly formed transit connections',
          'Combinations that have ended',
          'Combinations currently active',
          'Future combinations approaching',
        ],
      },
    ],
  },
  {
    id: 'guide6',
    title: 'High-value questions to ask Astrodha',
    blocks: [
      { type: 'heading', value: 'House Activations' },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'Which houses are active over the next 48 months?',
          'When will the 7th house become active?',
          'When will the 10th house become active?',
          'Which houses are simultaneously active?',
        ],
      },
      { type: 'heading', value: 'Planet Connections' },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'When will Jupiter connect with Venus?',
          'When will Saturn connect with Mercury?',
          'When will Rahu connect with the 10th lord?',
          'Show all future connections involving Jupiter.',
        ],
      },
      { type: 'heading', value: 'House Lord Connections' },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'When will the 2nd lord connect with the 11th lord?',
          'When will the 4th lord connect with the 12th lord?',
          'When will the 7th lord connect with Jupiter?',
          'When will the 10th lord receive support from Saturn?',
        ],
      },
      { type: 'heading', value: 'Future Combination Research' },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'Show all important combinations involving Venus.',
          'Show all combinations involving the 10th lord.',
          'Show all combinations affecting the 7th house.',
          'Show all combinations involving Jupiter & Saturn.',
        ],
      },
      { type: 'heading', value: 'Dignity Research' },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          "How will Jupiter's dignity evolve over 48 months?",
          'When will Venus become stronger?',
          'When will Saturn become weakened?',
          'Show future dignity changes for all planets.',
        ],
      },
    ],
  },
  {
    id: 'guide7',
    title: 'Ask for combinations, not predictions',
    blocks: [
      {
        type: 'text',
        value:
          'A common mistake is treating Astrodha like a prediction engine. Reframe the question and let the evidence speak.',
      },
      { type: 'heading', value: 'Avoid asking' },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'Will I get married?',
          'Will I become rich?',
          'Will I move abroad?',
          'Will I get promoted?',
        ],
      },
      { type: 'heading', value: 'Instead ask' },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'What 7th-house combinations occur over 48 months?',
          'When does Jupiter connect with the 7th lord?',
          'Which houses are active during this period?',
          'Which planets support the 10th house?',
        ],
      },
    ],
  },
  {
    id: 'guide8',
    title: 'Consultation examples',
    blocks: [
      {
        type: 'text',
        value:
          'Astrodha provides the evidence – you decide whether the rules are satisfied.',
      },
      { type: 'heading', value: 'Marriage' },
      {
        type: 'text',
        value: 'Instead of "When will marriage happen?", ask:',
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'When are the 1st, 7th & 12th houses active?',
          'When does Venus form important connections?',
          'When does Jupiter form important connections?',
          'When does the 7th lord receive support?',
          'Which D9 combinations become active?',
        ],
      },
      { type: 'heading', value: 'Career' },
      {
        type: 'text',
        value: 'Instead of "When will my career improve?", ask:',
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'Which career-related houses are active?',
          'When does the 10th lord receive support?',
          'When does Jupiter connect with Saturn?',
          'When does Saturn connect with the 10th lord?',
          'Which D10 combinations become active?',
        ],
      },
      { type: 'heading', value: 'Wealth' },
      {
        type: 'text',
        value: 'Instead of "When will wealth come?", ask:',
      },
      {
        type: 'list',
        bullet: 'dot',
        items: [
          'When are the 2nd & 11th houses active?',
          'When does the 2nd lord connect with the 11th lord?',
          'When does Jupiter support wealth houses?',
          'Which wealth combinations occur over 48 months?',
          'Which combinations start and end?',
        ],
      },
    ],
  },
  {
    id: 'guide9',
    title: 'Astrodha is not a substitute for astrological judgment',
    blocks: [
      {
        type: 'text',
        value:
          'It is a powerful technical assistant. It helps astrologers discover, organize and track the combinations that matter — across D1, D9, D10, Dasha systems and future transits. The platform automates the research; the astrologer applies the astrology.',
      },
    ],
  },
];

const AstrodhaGuideScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [expandedId, setExpandedId] = useState<string | null>('guide1');

  const textPrimary =
    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy;
  const textMuted = theme === 'dark' ? '#B8B0A0' : '#4B5563';
  const cardBg = theme === 'dark' ? colors.cardBackground : colors.white;
  const borderColor =
    theme === 'dark' ? 'rgba(255,255,255,0.18)' : colors.borderColor;

  const toggleItem = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getBullet = (bullet?: 'check' | 'star' | 'dot' | 'cross') => {
    if (bullet === 'check') {
      return '✓';
    }
    if (bullet === 'star') {
      return '★';
    }
    if (bullet === 'cross') {
      return '✕';
    }
    return '•';
  };

  const renderBlocks = (blocks: GuideBlock[]) =>
    blocks.map((block, index) => {
      if (block.type === 'heading') {
        return (
          <Text
            key={`heading-${index}`}
            style={[styles.blockHeading, { color: textPrimary }]}
          >
            {block.value}
          </Text>
        );
      }

      if (block.type === 'text') {
        return (
          <Text
            key={`text-${index}`}
            style={[styles.blockText, { color: textMuted }]}
          >
            {block.value}
          </Text>
        );
      }

      if (block.type === 'chips') {
        return (
          <View key={`chips-${index}`} style={styles.chipWrap}>
            {block.items.map(item => (
              <View
                key={item}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(26, 54, 115, 0.08)',
                    borderColor,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: textPrimary }]}>
                  ★ {item}
                </Text>
              </View>
            ))}
          </View>
        );
      }

      if (block.type === 'pair') {
        return (
          <View key={`pair-${index}`} style={styles.pairWrap}>
            <View
              style={[
                styles.pairCard,
                {
                  backgroundColor:
                    theme === 'dark'
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'rgba(239, 68, 68, 0.08)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                },
              ]}
            >
              <Text style={[styles.pairTitle, { color: '#DC2626' }]}>
                {block.leftTitle}
              </Text>
              {block.leftItems.map(item => (
                <View key={item} style={styles.listRow}>
                  <Text style={[styles.listBullet, { color: '#DC2626' }]}>✕</Text>
                  <Text style={[styles.listText, { color: textMuted }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.pairCard,
                {
                  backgroundColor:
                    theme === 'dark'
                      ? 'rgba(34, 197, 94, 0.12)'
                      : 'rgba(34, 197, 94, 0.08)',
                  borderColor: 'rgba(34, 197, 94, 0.25)',
                },
              ]}
            >
              <Text style={[styles.pairTitle, { color: '#16A34A' }]}>
                {block.rightTitle}
              </Text>
              {block.rightItems.map(item => (
                <View key={item} style={styles.listRow}>
                  <Text style={[styles.listBullet, { color: '#16A34A' }]}>✓</Text>
                  <Text style={[styles.listText, { color: textMuted }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      }

      const bullet = getBullet(block.bullet);
      return (
        <View key={`list-${index}`} style={styles.listWrap}>
          {block.items.map(item => (
            <View key={item} style={styles.listRow}>
              <Text style={[styles.listBullet, { color: textPrimary }]}>
                {bullet}
              </Text>
              <Text style={[styles.listText, { color: textMuted }]}>{item}</Text>
            </View>
          ))}
        </View>
      );
    });

  return (
    <MainContainer safeBottom>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/icons/back.png')}
            style={[
              styles.backIcon,
              {
                tintColor:
                  theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
              },
            ]}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            Astrodha Guide
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Astrodha Guide</Text>
          <Text style={styles.heroSubtitle}>
            How to get the best results from Astrodha
          </Text>
        </View>

        <View style={styles.section}>
          {guideData.map(item => {
            const isExpanded = expandedId === item.id;
            return (
              <View
                key={item.id}
                style={[
                  styles.accordionItem,
                  {
                    backgroundColor: cardBg,
                    borderColor,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.accordionTitle, { color: textPrimary }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.accordionToggle, { color: textPrimary }]}>
                    {isExpanded ? '−' : '+'}
                  </Text>
                </TouchableOpacity>

                {isExpanded ? (
                  <View
                    style={[
                      styles.accordionBody,
                      {
                        borderTopColor: borderColor,
                      },
                    ]}
                  >
                    {renderBlocks(item.blocks)}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:
      Platform.OS === 'android'
        ? responsiveHeight('0.5%')
        : responsiveWidth('12%'),
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    minHeight: 50,
  },
  backBtn: {
    left: responsiveWidth('2'),
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginRight: responsiveWidth('4'),
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'android' ? 90 : 90,
  },
  heroCard: {
    marginHorizontal: responsiveWidth(4),
    marginTop: responsiveWidth(2),
    marginBottom: responsiveWidth(3),
    borderRadius: 14,
    paddingVertical: 22,
    paddingHorizontal: 18,
    backgroundColor: '#1A2A4A',
    alignItems: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 12,
  },
  accordionItem: {
    marginHorizontal: responsiveWidth(4),
    marginBottom: responsiveHeight(1.2),
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(3.5),
    gap: 12,
  },
  accordionTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    lineHeight: 20,
  },
  accordionToggle: {
    fontSize: 24,
    fontFamily: fontFamily.regular,
    lineHeight: 26,
    width: 24,
    textAlign: 'center',
  },
  accordionBody: {
    borderTopWidth: 1,
    paddingHorizontal: responsiveWidth(4),
    paddingTop: responsiveWidth(3),
    paddingBottom: responsiveWidth(3.5),
  },
  blockHeading: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    marginBottom: 6,
    marginTop: 4,
  },
  blockText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    marginBottom: 10,
  },
  listWrap: {
    marginBottom: 10,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  listBullet: {
    width: 16,
    fontSize: 13,
    lineHeight: 20,
    marginRight: 6,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  pairWrap: {
    gap: 10,
    marginBottom: 8,
  },
  pairCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  pairTitle: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    marginBottom: 8,
  },
});

export default AstrodhaGuideScreen;
