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

  const faqData = [
    {
      id: 'faq1',
      question: 'What is this platform really about?',
      answer: 'A self-help, AI-driven astrology system that turns your chart into daily guidance. For each house, our AI highlights your Strengths, gives Advice, suggests Tasks, and flags Watch-outs—so you know what to lean into, what to practice, and what to avoid.'
    },
    {
      id: 'faq2',
      question: 'How do I get started?',
      answer: 'Create a free account, enter your birth details (date, time, place), and your dashboard appears instantly with your chart and insights.'
    },
    {
      id: 'faq3',
      question: 'What do I get in the free first access?',
      answer: 'Your birth chart (Janma Kundali) • 100 snapshot predictions • A personality overview • Current Antardasha & Transit view • The four-pillar lens (Strengths / Advice / Tasks / Watch-outs) to start using right away.'
    },
    {
      id: 'faq4',
      question: 'Why should I log in frequently?',
      answer: 'Because this is meant as ongoing self-work. Use the Tasks like daily affirmations and check the Watch-outs to course-correct. Your Antardasha & Transit guidance evolves—so frequent logins keep you aligned.'
    },
    {
      id: 'faq5',
      question: 'How do plans and upgrades work after the free access?',
      answer: 'You can subscribe to a plan to keep receiving fresh Antardasha & Transit updates every 15 days on your dashboard, along with evolving guidance under the four pillars. Think of it as a bi-weekly tune-up for your decision-making.'
    },
    {
      id: 'faq6',
      question: 'What exactly updates every 15 days?',
      answer: 'Your Antardasha interpretation and Transit effects—and the associated Advice/Tasks/Watch-outs—are refreshed on a 15-day cycle so your guidance reflects the current planetary climate.'
    },
    {
      id: 'faq7',
      question: 'What\'s the difference between the subscription plan and paid reports?',
      answer: '• Subscription Plan: Ongoing, every-15-day updates on your dashboard (Antardasha, Transits, and the four pillars). Best for continuous guidance.\n• Paid Reports (one-time): Individually priced, deeper, document-style analyses that are generated and mailed to you based on your details. Best for comprehensive reference.'
    },
    {
      id: 'faq8',
      question: 'Which detailed reports can I purchase?',
      answer: '• Lord-Based Analysis Report – How each house lord drives life areas\n• Planet-Based Analysis Report – How every planet expresses across your 12 houses\n• Nakshatra Analysis Report – Planets through Nakshatras & Padas for depth and tone\n• Antardasha Analysis Report – What your current period signifies and how to navigate it\nAll paid reports include the four-pillar view (Strengths, Advice, Tasks, Watch-outs) and are mailed to you after purchase.'
    },
    {
      id: 'faq9',
      question: 'How do I buy these detailed reports?',
      answer: 'Go to Generate Reports in your dashboard, select a report, pay the individual price, and our AI will prepare and mail the report to you.'
    },
    {
      id: 'faq10',
      question: 'Do the paid reports include my personal context?',
      answer: 'Yes—if you share personal details, the AI weaves them into the analysis to produce hyper-personalized guidance.'
    },
    {
      id: 'faq11',
      question: 'Can I create charts for family and friends?',
      answer: 'Yes. You can purchase additional reports for others or choose a plan that supports multiple profiles. Each person\'s dashboard shows their own 15-day Transit/Antardasha updates.'
    },
    {
      id: 'faq12',
      question: 'What makes this AI different from typical astrology?',
      answer: 'We don\'t stop at prediction. We deliver actionable self-help: Strengths to lean on • Advice that\'s practical • Tasks to build habits • Watch-outs to avoid common missteps—updated with the sky every 15 days.'
    },
    {
      id: 'faq13',
      question: 'How often should I check my dashboard?',
      answer: 'Ideally daily (for Tasks/affirmations). At minimum, every 15 days to catch the fresh Antardasha/Transit cycle.'
    },
    {
      id: 'faq14',
      question: 'Is my data safe?',
      answer: 'Yes. We use strict encryption and privacy practices. Your data is never shared with third parties.'
    },
    {
      id: 'faq15',
      question: 'Quick summary—what do I choose?',
      answer: '• Want continuous guidance? → Subscribe (15-day updates on dashboard).\n• Want a deep, keep-forever document? → Buy individually priced reports (mailed to you).\n• Want both? → Subscribe for updates + add paid reports whenever you need depth.'
    }
  ];

  const renderArrowIcon = (isExpanded: boolean) => (
    <Image 
      source={require('../../assets/icons/Dropdown.png')} 
      style={[
        styles.arrowIcon,
        {
          tintColor: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
        },
        { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }
      ]} 
    />
  );

  return (
    // <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
    <MainContainer>
      {/* Header */}
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

      {/* Main Content Card */}
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* <View
          style={[
            styles.contentCard,
            {
              backgroundColor:
                theme === 'dark'
                  ? colors.cardBackground
                  : colors.surfaceOpacity,
            },
          ]}
        > */}
        {/* FAQ Section */}
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
               borderTopRightRadius: isExpanded ? 8: 8,
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
                     <Text
                       style={[
                         styles.faqAnswer,
                         {
                           color:
                             theme === 'dark'
                               ? colors.themeTextWhite
                               : colors.DarkNavy,
                         },
                       ]}
                     >
                       {faq.answer}
                     </Text>
                   </View>
                 )}
               </View>
             );
           })}
        </View>
        {/* </View> */}
      </ScrollView>
    </MainContainer>
    // </View>
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
    // position: 'absolute',
    left: responsiveWidth('2'),
    // padding: 8,
    // top: Platform.OS === 'android' ? responsiveWidth('11.5%') : responsiveWidth('1.5%'),
    // zIndex: 1,
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
    // boxShadow: '3px 3px 3px 0px rgba(0, 0, 0, 0.35)',
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
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(1.5),
    minHeight: responsiveHeight(5),

    // borderRadius: 12,
    // borderWidth: 0.2,
  },
  faqContent: {
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(2),
    borderTopWidth: 0.2,

    // borderTopColor: 'rgba(73, 108, 168, 0.3)',
    // borderBottomLeftRadius: 12,
    // borderBottomRightRadius: 12,
    // borderWidth: 0.2,
  },
  arrowIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
});

  export default FaqsScreen;
