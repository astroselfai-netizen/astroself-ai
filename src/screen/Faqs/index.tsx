// PrivacyPolicyScreen.tsx

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import {
  fontFamily,
  responsiveWidth,
  responsiveHeight,
} from '../../constant/theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  ForgotPasswordOtp: undefined;
};

type FaqsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

type FaqBlock =
  | { type: 'text'; value: string }
  | { type: 'list'; items: string[] };

type FaqItem = {
  id: string;
  question: string;
  blocks: FaqBlock[];
};

const faqData: FaqItem[] = [
  {
    id: 'faq1',
    question: 'What is Astrodha?',
    blocks: [
      {
        type: 'text',
        value:
          'Astrodha is an AI-powered astrology research platform that combines traditional Vedic astrology with advanced analysis tools, allowing users to create charts, ask questions, analyze planetary combinations, study dashas, and explore transit activations.',
      },
    ],
  },
  {
    id: 'faq2',
    question: 'Who is Astrodha designed for?',
    blocks: [
      { type: 'text', value: 'Astrodha is designed for:' },
      {
        type: 'list',
        items: [
          'Professional astrologers',
          'Astrology students',
          'Researchers',
          'Serious astrology enthusiasts',
        ],
      },
    ],
  },
  {
    id: 'faq3',
    question: 'Can I use Astrodha without advanced astrology knowledge?',
    blocks: [
      {
        type: 'text',
        value:
          'Yes. You can ask questions in natural language and Astrodha will generate detailed astrological analysis and explanations.',
      },
    ],
  },
  {
    id: 'faq4',
    question: 'What is included in the Free Plan?',
    blocks: [
      { type: 'text', value: 'The Free Plan includes:' },
      {
        type: 'list',
        items: [
          'Create up to 5 charts',
          'Full technical analysis',
          'Detailed Antardasha predictions',
          'D1, D9 and D10 analysis',
          'Transit analysis',
          'Core astrology insights',
        ],
      },
    ],
  },
  {
    id: 'faq5',
    question: 'What is included in the Pro Plan?',
    blocks: [
      { type: 'text', value: 'Everything in Free, plus:' },
      {
        type: 'list',
        items: [
          'Create up to 15 new charts every month',
          'Unlimited questions on active charts',
          'Transit activation analysis',
          'Dasha activation analysis',
          'Active combination search',
          'Lagna, Moon and Dasha Lagna analysis',
        ],
      },
    ],
  },
  {
    id: 'faq6',
    question: 'What is included in the Premium Plan?',
    blocks: [
      { type: 'text', value: 'Everything in Pro, plus:' },
      {
        type: 'list',
        items: [
          'Create up to 50 new charts every month',
          'Unlimited questions on active charts',
          'Advanced timing analysis',
          'Long-term transit research',
          'Deeper combination analysis',
          'Priority processing',
        ],
      },
      {
        type: 'text',
        value:
          'Subscription must remain active to create new charts, ask new questions, generate new analyses and refresh transit combinations.',
      },
      {
        type: 'text',
        value:
          'Previously created charts, analyses and chat history remain accessible even if your subscription expires.',
      },
    ],
  },
  {
    id: 'faq7',
    question: 'How many charts can I create on each plan?',
    blocks: [
      {
        type: 'list',
        items: [
          'Free Plan: Create up to 5 charts',
          'Pro Plan: Create up to 15 new charts every month',
          'Premium Plan: Create up to 50 new charts every month',
        ],
      },
      {
        type: 'text',
        value: 'Existing charts remain accessible even if your subscription expires.',
      },
    ],
  },
  {
    id: 'faq8',
    question: 'What happens when my subscription expires?',
    blocks: [
      { type: 'text', value: 'You can continue viewing:' },
      {
        type: 'list',
        items: [
          'Existing charts',
          'Previous analyses',
          'Chat history',
          'Saved research',
        ],
      },
      { type: 'text', value: 'However, you cannot:' },
      {
        type: 'list',
        items: [
          'Create new charts',
          'Refresh transit combinations',
          'Generate new analyses',
          'Use chat credits',
          'Access subscription features',
        ],
      },
    ],
  },
  {
    id: 'faq9',
    question: 'What does Full Technical Analysis include?',
    blocks: [
      { type: 'text', value: 'Analysis may include:' },
      {
        type: 'list',
        items: [
          'Planetary dignities',
          'House lord connections',
          'D1, D9 and D10 evaluation',
          'Dasha and Antardasha analysis',
          'Transit activations',
          'Combination analysis',
          'Timing indicators',
          'Core Vedic astrology insights',
        ],
      },
    ],
  },
  {
    id: 'faq10',
    question: 'What is Antardasha Analysis?',
    blocks: [
      {
        type: 'text',
        value:
          'Antardasha Analysis provides detailed predictions and interpretations for the active planetary sub-period, including likely events, opportunities, challenges and areas of focus.',
      },
    ],
  },
  {
    id: 'faq11',
    question: 'Will my charts be deleted if my subscription expires?',
    blocks: [
      {
        type: 'text',
        value:
          'No. All charts, analyses and conversations remain available for viewing.',
      },
    ],
  },
  {
    id: 'faq12',
    question: 'Can I access old chat conversations after my subscription expires?',
    blocks: [
      {
        type: 'text',
        value:
          'Yes. All previous chart conversations and analysis history remain accessible.',
      },
    ],
  },
  {
    id: 'faq13',
    question: 'Can I refresh transit combinations after my subscription expires?',
    blocks: [
      {
        type: 'text',
        value: 'No. Refreshing transit combinations requires an active subscription.',
      },
    ],
  },
  {
    id: 'faq14',
    question: 'Can I create new charts after my subscription expires?',
    blocks: [
      {
        type: 'text',
        value: 'No. Creating new charts requires an active subscription.',
      },
    ],
  },
  {
    id: 'faq15',
    question: 'What are chart allocations?',
    blocks: [
      {
        type: 'text',
        value:
          'Chart allocations determine how many new charts can be created under your subscription plan.',
      },
    ],
  },
  {
    id: 'faq16',
    question:
      'What happens to unused chart allocations at the end of the billing cycle?',
    blocks: [
      {
        type: 'text',
        value:
          'Unused chart allocations expire at the end of the billing cycle and do not carry forward.',
      },
    ],
  },
  {
    id: 'faq17',
    question:
      'What happens to unused chat credits at the end of the billing cycle?',
    blocks: [
      {
        type: 'text',
        value:
          'Unused chat credits expire at the end of the billing cycle and do not carry forward.',
      },
    ],
  },
  {
    id: 'faq18',
    question: 'Do unused chart allocations carry forward when I renew?',
    blocks: [
      {
        type: 'text',
        value:
          'No. Each renewal starts with a fresh allocation based on the selected plan.',
      },
    ],
  },
  {
    id: 'faq19',
    question: 'Do unused chat credits carry forward when I renew?',
    blocks: [
      {
        type: 'text',
        value:
          'No. Each renewal starts with a fresh credit allocation based on the selected plan.',
      },
    ],
  },
  {
    id: 'faq20',
    question: 'Can I see my remaining chart allocations and chat credits?',
    blocks: [
      { type: 'text', value: 'Yes. Your dashboard displays:' },
      {
        type: 'list',
        items: [
          'Current plan',
          'Remaining chart allocations',
          'Available chat credits',
          'Usage statistics',
          'Subscription renewal date',
        ],
      },
    ],
  },
  {
    id: 'faq21',
    question: 'Can I upgrade my plan at any time?',
    blocks: [
      { type: 'text', value: 'Yes. You may upgrade your plan at any time.' },
    ],
  },
  {
    id: 'faq22',
    question: 'When does an upgrade become active?',
    blocks: [
      {
        type: 'text',
        value: 'Upgrades become active immediately after successful payment.',
      },
    ],
  },
  {
    id: 'faq23',
    question: 'What happens to unused chart allocations when I upgrade?',
    blocks: [
      {
        type: 'text',
        value:
          'Unused chart allocations from the current plan are forfeited. The new plan starts with a fresh allocation.',
      },
    ],
  },
  {
    id: 'faq24',
    question: 'What happens to unused chat credits when I upgrade?',
    blocks: [
      {
        type: 'text',
        value: 'Unused chat credits from the current plan are forfeited.',
      },
      {
        type: 'text',
        value:
          'The upgraded plan starts with a fresh credit allocation applicable to the new plan.',
      },
    ],
  },
  {
    id: 'faq25',
    question: 'Example of an Upgrade',
    blocks: [
      { type: 'text', value: 'Suppose:' },
      {
        type: 'list',
        items: [
          'Pro Plan includes 15 charts per month',
          'Pro Plan includes 100,000 chat credits',
          'You have used only 5 charts',
          'You have used only 40,000 credits',
        ],
      },
      { type: 'text', value: 'After upgrading:' },
      {
        type: 'list',
        items: [
          'Remaining 10 chart allocations expire',
          'Remaining 60,000 chat credits expire',
          'Premium allocation is applied immediately',
        ],
      },
      {
        type: 'text',
        value: 'You receive the full Premium allocation from the date of upgrade.',
      },
    ],
  },
  {
    id: 'faq26',
    question: 'Will I lose my charts, analyses or chat history when upgrading?',
    blocks: [
      { type: 'text', value: 'No. The following remain unchanged:' },
      {
        type: 'list',
        items: [
          'Charts',
          'Analyses',
          'Conversations',
          'Research history',
          'Saved data',
        ],
      },
    ],
  },
  {
    id: 'faq27',
    question: 'Can I downgrade my plan?',
    blocks: [
      {
        type: 'text',
        value:
          'Yes. You may downgrade from Premium to Pro or from Pro to Free at any time.',
      },
    ],
  },
  {
    id: 'faq28',
    question: 'When does a downgrade take effect?',
    blocks: [
      {
        type: 'text',
        value:
          'Downgrades take effect only at the end of the current billing cycle. You continue to enjoy all benefits of the higher plan until the subscription period ends.',
      },
    ],
  },
  {
    id: 'faq29',
    question: 'Example of a Downgrade',
    blocks: [
      { type: 'text', value: 'Suppose:' },
      {
        type: 'list',
        items: [
          'You are on Premium',
          'Your renewal date is 30 September',
          'You request a downgrade on 10 September',
        ],
      },
      { type: 'text', value: 'Result:' },
      {
        type: 'list',
        items: [
          'Premium benefits continue until 30 September',
          'Pro benefits begin from 1 October',
          'No benefits are removed immediately',
        ],
      },
    ],
  },
  {
    id: 'faq30',
    question: 'What happens to chart allocations during a downgrade?',
    blocks: [
      {
        type: 'text',
        value:
          'You continue using the higher plan allocation until the end of the current billing cycle. The downgraded plan allocation becomes applicable from the next billing cycle.',
      },
    ],
  },
  {
    id: 'faq31',
    question: 'What happens to chat credits during a downgrade?',
    blocks: [
      {
        type: 'text',
        value:
          'You continue using the higher plan credits until the end of the current billing cycle. The downgraded plan credit allocation becomes applicable from the next billing cycle.',
      },
    ],
  },
  {
    id: 'faq32',
    question: 'Do I lose unused chart allocations if I renew early?',
    blocks: [
      {
        type: 'text',
        value:
          'Yes. Unused chart allocations do not carry forward and expire at the end of the billing cycle.',
      },
    ],
  },
  {
    id: 'faq33',
    question: 'Do I lose unused chat credits if I renew early?',
    blocks: [
      {
        type: 'text',
        value:
          'Yes. Unused chat credits do not carry forward and expire at the end of the billing cycle.',
      },
    ],
  },
  {
    id: 'faq34',
    question: 'What happens if I renew after my subscription has expired?',
    blocks: [
      {
        type: 'list',
        items: [
          'Existing charts remain available',
          'Existing chat history remains available',
          'Unused chart allocations are lost',
          'Unused chat credits are lost',
          'The new subscription starts with a fresh allocation',
        ],
      },
    ],
  },
  {
    id: 'faq35',
    question: 'Can I upgrade and downgrade multiple times?',
    blocks: [
      { type: 'text', value: 'Yes.' },
      {
        type: 'list',
        items: [
          'Upgrades take effect immediately',
          'Downgrades take effect at the end of the active billing cycle',
        ],
      },
    ],
  },
  {
    id: 'faq36',
    question: 'Is my data secure?',
    blocks: [
      {
        type: 'text',
        value:
          'Yes. Charts, conversations and analysis data are stored securely and remain private to your account.',
      },
    ],
  },
  {
    id: 'faq37',
    question: 'Can I access Astrodha on multiple devices?',
    blocks: [
      {
        type: 'text',
        value:
          'Yes. You can access your charts, conversations and analyses across supported devices using the same account.',
      },
    ],
  },
];

const FaqsScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<FaqsScreenNavigationProp>();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const toggleExpanded = (faqId: string) => {
    if (expandedFaq === faqId) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(faqId);
    }
  };

  const answerTextColor =
    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy;

  const renderArrowIcon = (isExpanded: boolean) => (
    <Image
      source={require('../../assets/icons/Dropdown.png')}
      style={[
        styles.arrowIcon,
        {
          tintColor: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
        },
        { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] },
      ]}
    />
  );

  const renderFaqBlocks = (blocks: FaqBlock[]) =>
    blocks.map((block, index) => {
      if (block.type === 'text') {
        return (
          <Text
            key={`text-${index}`}
            style={[styles.faqAnswer, { color: answerTextColor }]}
          >
            {block.value}
          </Text>
        );
      }

      return (
        <View key={`list-${index}`} style={styles.listWrap}>
          {block.items.map((item, itemIndex) => (
            <View key={`${index}-${itemIndex}`} style={styles.listRow}>
              <Text style={[styles.listBullet, { color: answerTextColor }]}>
                •
              </Text>
              <Text style={[styles.listText, { color: answerTextColor }]}>
                {item}
              </Text>
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
        translucent={true}
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
          <Text
            style={[
              styles.headerTitle,
              {
                color:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
          >
            FAQ'S
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          {faqData.map(faq => {
            const isExpanded = expandedFaq === faq.id;
            const headerStyle = {
              backgroundColor:
                theme === 'dark' ? colors.cardBackground : colors.white,
              borderColor:
                theme === 'dark' ? colors.themeTextWhite : colors.borderColor,
              borderBottomLeftRadius: isExpanded ? 0 : 8,
              borderBottomRightRadius: isExpanded ? 0 : 8,
              borderTopLeftRadius: isExpanded ? 8 : 8,
              borderTopRightRadius: isExpanded ? 8 : 8,
            };
            return (
              <View
                key={faq.id}
                style={[
                  styles.faqItem,
                  {
                    borderColor:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.borderColor,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.faqHeader, headerStyle]}
                  onPress={() => toggleExpanded(faq.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.faqQuestion,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    {faq.question}
                  </Text>
                  {renderArrowIcon(isExpanded)}
                </TouchableOpacity>

                {isExpanded && (
                  <View
                    style={[
                      styles.faqContent,
                      {
                        backgroundColor:
                          theme === 'dark'
                            ? colors.cardBackground
                            : colors.white,
                        borderTopColor:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.borderColor,
                      },
                    ]}
                  >
                    {renderFaqBlocks(faq.blocks)}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '100%',
    paddingBottom: Platform.OS === 'android' ? 60 : 60,
  },
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
    position: 'relative',
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
    fontSize: 24,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  contentCard: {
    borderRadius: 8,
    marginHorizontal: responsiveWidth('4'),
    marginTop: responsiveWidth('2%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: responsiveWidth('5%'),
    paddingVertical: Platform.OS === 'android' ? 10 : responsiveWidth('1'),
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 12,
    marginTop: responsiveWidth('1%'),
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fontFamily.regular,
    marginBottom: 12,
    lineHeight: 24,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    textAlign: 'left',
  },
  faqItem: {
    marginBottom: responsiveHeight(1.5),
    borderWidth: 0.2,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: responsiveWidth(4),
  },
  faqQuestion: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'left',
    flex: 1,
    marginRight: responsiveWidth(3),
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'left',
    marginBottom: 8,
  },
  listWrap: {
    marginBottom: 8,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingRight: 4,
  },
  listBullet: {
    fontSize: 14,
    lineHeight: 20,
    marginRight: 8,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    lineHeight: 20,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(1.5),
    minHeight: responsiveHeight(5),
  },
  faqContent: {
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(2),
    borderTopWidth: 0.2,
  },
  arrowIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
});

export default FaqsScreen;
