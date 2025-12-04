// ReportScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  ImageBackground,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import {
  fontFamily,
  responsiveWidth,
  responsiveHeight,
} from '../../constant/theme';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
// import { StackNavigationProp } from '@react-navigation/stack';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';
import { useProfileData } from '../../hooks/useProfileData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaymentService from '../../services/payment/payment.service';
import serviceFactory from '../../services/serviceFactory';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';

// Razorpay Configuration
const RAZORPAY_CONFIG = {
  TEST_KEY: 'rzp_test_GIgkz0qhMQzJxv',
  LIVE_KEY: 'rzp_live_t11y7Cds0JWo47',
  PLAN_ID: 'd461266c-574b-4312-994a-ebd2b5cf6dc3',
  IS_TEST_MODE: true, // Set to false for production
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  ForgotPasswordOtp: undefined;
  AddNewMember: undefined;
  ReportScreen: { userId: string };
};

type ReportScreenNavigationProp = RouteProp<RootStackParamList, 'ReportScreen'>;

const ReportScreen = () => {
  const { theme, colors } = useTheme();
  const route = useRoute<ReportScreenNavigationProp>();
  const { userId } = route.params || {};
  const navigation = useNavigation<ReportScreenNavigationProp>();
  const { refreshProfileData, membersData } = useProfileData();
  const paymentService = serviceFactory.get<PaymentService>('PaymentService');
  const [activeTab, setActiveTab] = useState<'available' | 'purchased'>(
    'available',
  );
  const [processingReportId, setProcessingReportId] = useState<string | null>(
    null,
  );

  // Profile member dropdown state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Set selectedMemberId when membersData is loaded and userId exists
  useEffect(() => {
    if (userId) {
      setSelectedMemberId(userId);
    }
  }, [userId]);

  // Show more state for each report
  const [expandedReports, setExpandedReports] = useState<Set<string>>(
    new Set(),
  );

  // Toggle expanded state for reports
  const toggleReportExpanded = (reportId: string) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  // Filter members based on search query
  const filteredMembers =
    membersData?.filter((member: any) =>
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  // Reports data array
  const reportsData = [
    {
      id: 'nakshatra',
      title: 'Nakshatra Report',
      description: 'The Deeper Blueprint Behind Your Birth Star',
      featuresTitel: 'Our Nakshatra Report Covers',
      price: '699',
      features: [
        'Mythological stories and symbolic origins of each Nakshatra',
        'Detailed interpretation of the *Ascendant Nakshatra* and the *placement of its lord*',
        'Analysis of all *planets placed in different Nakshatras* across the chart',
        '*In-depth reading of *planets through Nakshatra Padas* (1st to 4th quarter)',
        'Placement of *house lords in various Nakshatras* and their influence',
        'Why Nakshatra Reading is Important - Many people are born under the same zodiac sign, yet their nature, reactions, and life patterns differ greatly. This is because each sign is divided into smaller energy zones called Nakshatras. Nakshatras reveal the finer traits, instincts, and emotional tendencies that make every individual unique. Studying them helps decode the subtle differences in personality, behavior, and destiny that cannot be understood through signs alone.',
      ],
    },
    {
      id: 'adl',
      title: 'Antardasha Report',
      description: 'Planetary Placements Indicate for You Right Now',
      featuresTitel: 'Our Antardasha Report Covers',
      price: '999',
      features: [
        '*Matters in Focus* – The key areas of life you may need to handle during this Antardasha period.',
        '*Your Strengths* – Core qualities and supportive traits that help you navigate this phase',
        '*Daily Guidance* – Simple, mindful actions you can perform each day to stay balanced and productive.',
        '*Personal Advice* – Practical insights and recommendations to get the best outcomes in career, relationships, finances, and well-being.',
        '*Energies Around You* – The type of emotional, environmental, and social influences you may be surrounded with.',
        '*Antardasha Lord’s Placement* – Analysis of the Antardasha planet’s *position in your chart by house, sign, Nakshatra, and Nakshatra Pada*, revealing how it shapes results.',
        '*Planetary Connections (Yogas)* – How the Antardasha lord interacts, aspects, or forms yogas with other planets influencing your experiences.',
        '*Transit Interaction* – Study of how *Jupiter, Saturn, Rahu, and Ketu* are currently moving over or aspecting the Antardasha lord, intensifying or moderating its effects throughout this period.',
      ],
    },
    {
      id: 'lords-of-destiny',
      title: 'Lords of Destiny',
      description: 'The Structural Framework of Your Chart',
      price: '699',
      featuresTitel: 'Our Lords Report Covers',
      isComingSoon: true,
      features: [
        'Built purely on Ascendant (Lagna) analysis, not Moon Lagna — giving you a clear, structure-based reading of your true life design.',
        'Understand how each house lord directs key areas like career, love, wealth, health, and inner purpose.',
        'Decode the placement of every lord (e.g. 1st lord in 10th house) and how it channels energy across different life domains.',
        'Explore lord conjunctions, exchanges, and circuits, where planetary lords interact or swap realms to shape defining events',
        'Identify repeat patterns in D9 (Navamsa) and D10 (Dashamsa) charts — pinpointing positions that carry higher probability and lasting influence.',
        'Analyze the strength of each lord by house and sign, revealing their natural inclinations and areas of influence.',
        'Recognize when a lord is retrograde or placed 6th, 8th, or 12th from its own house, signaling phases of re-evaluation, refinement, or renewal.',
      ],
    },
    {
      id: 'planets-in-motion',
      title: 'Planets in Motion',
      description: 'The Living Pulse of Your Birth Chart',
      price: '699',
      featuresTitel: 'Our Planet Report Covers',
      isComingSoon: true,
      features: [
        'Based purely on Ascendant (Lagna) analysis, not Moon Lagna — offering a precise reading rooted in your true chart structure.',
        'Understand how every planet channels its influence through the house it occupies, shaping your thoughts, career path, emotions, and relationships.',
        'Decode planetary placements, conjunctions, and exchanges, revealing how different forces blend to create your life’s pattern.',
        'Identify repeat patterns across D9 (Navamsa) and D10 (Dashamsa) charts — such as the same sign, same house, or similar planetary connections, marking themes with higher probability or recurring influence.',
        'See how planets are impacted by Saturn, Rahu, Ketu, and Mars through conjunction or aspect, unveiling the deeper layers of pressure, opportunity, and transformation.',
        'For every house, the report highlights four key elements — Strength, Advice, Tasks to help you manage better, and Things to avoid or think twice before doing — offering clarity with practical direction.',
        'For users who share their personal details and goals, our AI engine generates hyper-personalised predictions, integrating those inputs with your planetary framework for even deeper accuracy and insight.',
      ],
    },
  ];

  // Payment handling function
  const handleReportPayment = async (reportId: string) => {
    try {
      // Check if member is selected
      if (!selectedMemberId) {
        Toast.show({
          type: 'error',
          text1: 'Member Selection Required',
          text2: 'Please select a member before purchasing the report.',
          visibilityTime: 5000,
        });
        return;
      }

      setProcessingReportId(reportId);

      // Get current user data
      const userDataString = await AsyncStorage.getItem('USER_DATA');
      if (!userDataString) {
        throw new Error('User data not found. Please login again.');
      }

      const currentUserData = JSON.parse(userDataString);

      console.log('currentUserData:--->', selectedMemberId);
      const userId = currentUserData._id || currentUserData.user_id;

      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      // Get selected member data
      const selectedMember = membersData?.find(
        (member: any) => member.id === selectedMemberId,
      );
      if (!selectedMember) {
        throw new Error('Selected member not found.');
      }

      // Create user report order
      const reportData = {
        report_type: reportId,
        currency: 'INR',
        receipt: paymentService.generateReceipt(),
        user_id: selectedMemberId,
        notes: {
          action: 'purchase_report',
          report_id: reportId,
          member_id: selectedMemberId,
          member_name: selectedMember.full_name,
          user_name:
            `${currentUserData.first_name || ''} ${
              currentUserData.last_name || ''
            }`.trim() || 'User',
        },
      };

      const orderResponse = await paymentService.createUserReport(reportData);

      // Validate order response
      if (!orderResponse || !orderResponse.order_id || !orderResponse.amount) {
        throw new Error('Invalid order response from server');
      }

      // Razorpay payment options
      const options = {
        description: `Purchase ${
          reportsData.find(r => r.id === reportId)?.title || 'Report'
        } for ${selectedMember.full_name}`,
        currency: 'INR',
        key: RAZORPAY_CONFIG.TEST_KEY,
        amount: orderResponse.amount,
        order_id: orderResponse.order_id,
        name: 'Astroself',
        prefill: {
          email: currentUserData.email || 'user@example.com',
          contact: currentUserData.phone || '9999999999',
          name:
            `${currentUserData.first_name || ''} ${
              currentUserData.last_name || ''
            }`.trim() || 'User',
        },
        theme: { color: '#DF8A5D' },
      };

      // Open Razorpay checkout
      const paymentResponse = await RazorpayCheckout.open(options);

      // Verify payment
      const verifyData = {
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      };

      const verifyResponse = await paymentService.userReportVerify(verifyData);
      console.log('Verify response:', verifyResponse);

      // Check if payment is successful
      const isSuccess =
        verifyResponse.success === true ||
        verifyResponse?.status === 'success' ||
        verifyResponse?.status === true ||
        String(verifyResponse.success) === 'true' ||
        (verifyResponse.message &&
          verifyResponse.message
            .toLowerCase()
            .includes('verified successfully')) ||
        (verifyResponse.message &&
          verifyResponse.message.toLowerCase().includes('payment successful'));

      if (isSuccess) {
        // Payment successful - refresh profile data
        console.log('Payment successful! Refreshing profile data...');
        if (refreshProfileData) {
          await refreshProfileData();
        }

        // Show success message
        Toast.show({
          type: 'success',
          text1: 'Payment Successful',
          text2: `Payment verified successfully. Your report is being generated and will be sent to your email within 24 hours.`,
          visibilityTime: 4000,
          // autoHide: true,
          // topOffset: 60,
        });
      } else {
        // Payment verification failed
        console.log('Payment verification failed:', verifyResponse);
        throw new Error(
          verifyResponse.message || 'Payment verification failed',
        );
      }
    } catch (paymentError: any) {
      let errorMessage = 'Payment failed. Please try again.';
      let alertTitle = 'Payment Failed';

      console.log('Payment error details:', paymentError);

      // Check if this is a Razorpay cancellation error
      if (
        paymentError.code === 0 &&
        paymentError.description === 'Payment processing cancelled by user' &&
        paymentError.details?.error?.reason === 'payment_cancelled'
      ) {
        // User cancelled the payment
        console.log('Payment cancelled by user');
        Toast.show({
          type: 'info',
          text1: 'Payment Cancelled',
          text2: 'Payment processing cancelled by user',
          visibilityTime: 3000,
        });
        return;
      }

      // Check for other Razorpay cancellation patterns
      if (
        paymentError.code === 'PAYMENT_CANCELLED' ||
        paymentError.reason === 'payment_cancelled' ||
        (paymentError.message &&
          paymentError.message.toLowerCase().includes('cancelled')) ||
        (paymentError.description &&
          paymentError.description.toLowerCase().includes('cancelled'))
      ) {
        // User cancelled the payment
        console.log('Payment cancelled by user (alternative pattern)');
        Toast.show({
          type: 'info',
          text1: 'Payment Cancelled',
          text2: 'Payment processing cancelled by user',
          visibilityTime: 3000,
        });
        return;
      }

      // Check for network errors
      if (
        paymentError.message &&
        (paymentError.message.includes('Network Error') ||
          paymentError.message.includes('network') ||
          paymentError.message.includes('timeout'))
      ) {
        errorMessage =
          'Network error. Please check your internet connection and try again.';
        alertTitle = 'Network Error';
      } else if (
        paymentError.message &&
        paymentError.message.includes('User not found')
      ) {
        errorMessage =
          'User not found. Please log out and log in again, then try the payment.';
        alertTitle = 'Authentication Error';
      } else if (
        paymentError.message &&
        paymentError.message.includes('Invalid order response')
      ) {
        errorMessage = 'Server error. Please try again in a few moments.';
        alertTitle = 'Server Error';
      } else if (paymentError.message) {
        errorMessage = paymentError.message;
      }

      console.log('Showing error alert:', alertTitle, errorMessage);
      Toast.show({
        type: 'error',
        text1: alertTitle,
        text2: errorMessage,
        visibilityTime: 5000,
      });
    } finally {
      setProcessingReportId(null);
    }
  };

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Report screen focused, refreshing profile data...');
      if (refreshProfileData) {
        refreshProfileData();
      }
    }, [refreshProfileData]),
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
            Report
          </Text>
        </View>
      </View>

      {/* Profile member dropdown */}
      <View
        style={[
          styles.profileCard,
          {
            position: 'relative',
            zIndex: 99999,
            backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white,
            borderColor:
              theme === 'dark'
                ? colors.themeBorderDropdown
                : colors.borderColor,
          },
        ]}
      >
        <Image
          source={require('../../assets/icons/profile-icons.png')}
          style={styles.profileIcon}
        />
        <View style={{ zIndex: 999, flex: 1 }}>
          <TouchableOpacity
            style={[
              styles.input,
              {
                paddingVertical: 5,
              },
            ]}
            onPress={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
          >
            <Text
              style={[
                styles.selectedMemberText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              {selectedMemberId
                ? membersData?.find((m: any) => m.id === selectedMemberId)
                    ?.full_name || 'Select Member'
                : 'Select Member'}
            </Text>
          </TouchableOpacity>

          <Modal
            visible={isMemberDropdownOpen}
            transparent={true}
            style={{ overflow: 'hidden' }}
            animationType="none"
            onRequestClose={() => {
              setIsMemberDropdownOpen(false);
              setSearchQuery('');
            }}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              // activeOpacity={1}
              onPress={() => {
                setIsMemberDropdownOpen(false);
                setSearchQuery('');
              }}
            >
              <View
                style={[
                  styles.modalDropdownContainer,
                  {
                    // overflow: 'hidden',
                    // borderWidth:theme === 'dark'  ? 0.2 : 1,
                    backgroundColor:
                      theme === 'dark' ? colors.DarkNavy : colors.transparent,
                    // borderColor: theme === 'dark' ? colors.themeBorderDropdown : colors.yellow,
                  },
                ]}
              >
                <View
                  style={[
                    styles.dropdownContainer,
                    {
                      backgroundColor:
                        theme === 'dark' ? colors.DarkNavy : colors.white,
                      borderColor: colors.borderColor,
                    },
                  ]}
                >
                  {/* Search Input */}
                  <View
                    style={[
                      styles.searchContainer,
                      {
                        backgroundColor:
                          theme === 'dark' ? colors.DarkNavy : colors.white,
                      },
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.searchInput,
                        {
                          backgroundColor: colors.cardBackground,
                          color: colors.textPrimary,
                          borderColor: colors.borderColor,
                        },
                      ]}
                      placeholder="Search members..."
                      placeholderTextColor={colors.grayText}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoFocus={true}
                    />
                  </View>

                  {filteredMembers && filteredMembers.length > 0 ? (
                    <FlatList
                      data={filteredMembers}
                      keyExtractor={item => item.id.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.dropdownItem,
                            { borderBottomColor: colors.borderColor },
                          ]}
                          onPress={() => {
                            setSelectedMemberId(item.id);
                            setIsMemberDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {item.full_name}
                          </Text>
                        </TouchableOpacity>
                      )}
                      showsVerticalScrollIndicator={true}
                      bounces={false}
                      keyboardShouldPersistTaps="handled"
                      style={styles.flatListStyle}
                      removeClippedSubviews={false}
                      scrollEventThrottle={16}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.noResultsText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {searchQuery
                        ? 'No members found matching your search'
                        : 'No members found'}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
        <TouchableOpacity
          style={styles.arrowIconContainer}
          onPress={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
        >
          <Image
            source={require('../../assets/icons/Dropdown.png')}
            style={[
              styles.arrowIcon,
              {
                tintColor:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                transform: [
                  { rotate: isMemberDropdownOpen ? '180deg' : '0deg' },
                ],
              },
            ]}
          />
        </TouchableOpacity>
      </View>

      <ImageBackground
        source={
          theme === 'dark'
            ? require('../../assets/image/DarkBackground.png')
            : require('../../assets/image/LightBackground.png')
        }
        blurRadius={12}
        style={[
          styles.tabsContainer,
          {
            backgroundColor:
              theme === 'dark' ? colors.transparentBg : colors.white,
            borderColor:
              theme === 'dark'
                ? colors.themeBorderDropdown
                : colors.borderColor,
          },
        ]}
        imageStyle={[
          styles.tabsBgImage,
          {
            backgroundColor:
              theme === 'dark' ? colors.transparent : colors.white,
            borderColor:
              theme === 'dark'
                ? colors.themeBorderDropdown
                : colors.borderColor,
          },
        ]}
      >
        <View style={styles.tabsOverlay} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabsScrollContent,
            {
              backgroundColor:
                theme === 'dark' ? colors.transparent : colors.white,
              borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,
            },
          ]}
          style={styles.tabsScrollView}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'available' && {
                ...styles.activeTab,
                borderBottomColor:
                  theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
              },
              {
                backgroundColor:
                  theme === 'dark' ? colors.transparent : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
            onPress={() => setActiveTab('available')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: theme === 'dark' ? colors.white : colors.DarkNavy,
                },
                activeTab === 'available' && {
                  color:
                    theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
                },
              ]}
            >
              Available
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'purchased' && {
                ...styles.activeTab,
                borderBottomColor:
                  theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
              },
              {
                backgroundColor:
                  theme === 'dark' ? colors.transparent : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
            onPress={() => setActiveTab('purchased')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: theme === 'dark' ? colors.white : colors.DarkNavy,
                },
                activeTab === 'purchased' && {
                  color:
                    theme === 'dark' ? colors.accent : colors.Orangeaccentcolor,
                },
              ]}
            >
              Purchased
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>

      {/* Main Content Card */}
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollIndicatorInsets={{ right: 1 }}
      >
        {activeTab === 'available' && (
          <View style={styles.reportsContainer}>
            {reportsData.map(report => (
              <ImageBackground
                blurRadius={12}
                key={report.id}
                source={
                  theme === 'dark'
                    ? require('../../assets/image/DarkBackground.png')
                    : require('../../assets/image/LightBackground.png')
                }
                style={[
                  styles.reportCardImageBackground,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.transparentBg : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.borderColor
                        : colors.borderColor,
                  },
                ]}
                imageStyle={[
                  styles.reportCardImageStyle,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.transparentBg : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.borderColor
                        : colors.borderColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.reportCard,
                    {
                      backgroundColor:
                        theme === 'dark' ? colors.transparentBg : colors.white,
                      borderColor:
                        theme === 'dark'
                          ? colors.borderColor
                          : colors.borderColor,
                    },
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.reportCardHeader}>
                    <Text
                      style={[
                        styles.reportTitle,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      {report.title}
                    </Text>
                    <Text
                      style={[
                        styles.reportDescription,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      {report.description}
                    </Text>

                    <Text
                      style={[
                        styles.featuresText,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      {report.featuresTitel}:
                    </Text>
                  </View>

                  {/* Features List */}
                  <View style={styles.featuresContainer}>
                    {(expandedReports.has(report.id)
                      ? report.features
                      : report.features.slice(0, 3)
                    ).map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Image
                          source={require('../../assets/icons/checkIcon.png')}
                          resizeMode="contain"
                          style={styles.checkIcon}
                        />
                        <Text
                          style={[
                            styles.featureText,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.white
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Show More/Show Less Link */}
                  {report.features.length > 3 && (
                    <TouchableOpacity
                      style={styles.showMoreContainer}
                      onPress={() => toggleReportExpanded(report.id)}
                    >
                      <Text
                        style={[
                          styles.showMoreText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.themeTextWhite
                                : colors.DarkNavy,
                          },
                        ]}
                      >
                        {expandedReports.has(report.id)
                          ? 'Show Less <<'
                          : 'Show More >>'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Price */}
                  <View style={styles.priceContainer}>
                    <View style={styles.priceRow}>
                      <Text
                        style={[
                          styles.priceText,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        {report.price}
                      </Text>
                      <Text
                        style={[
                          styles.priceCurrency,
                          {
                            color:
                              theme === 'dark' ? colors.white : colors.DarkNavy,
                          },
                        ]}
                      >
                        (INR)
                      </Text>
                    </View>
                  </View>

                  {/* Buy Now / Coming Soon Button */}
                  <TouchableOpacity
                    style={[
                      styles.buyNowButton,
                      report.isComingSoon && styles.disabledButton,
                      {
                        backgroundColor: report.isComingSoon
                          ? colors.grayText
                          : colors.Orangeaccentcolor,
                      },
                    ]}
                    disabled={
                      report.isComingSoon || processingReportId === report.id
                    }
                    onPress={() =>
                      !report.isComingSoon && handleReportPayment(report.id)
                    }
                  >
                    <Text style={styles.buyNowButtonText}>
                      {processingReportId === report.id
                        ? 'Processing...'
                        : report.isComingSoon
                        ? 'Coming Soon'
                        : 'Buy Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            ))}
          </View>
        )}

        {activeTab === 'purchased' && (
          <View style={styles.reportsContainerpurchased}>
            <Image
              source={require('../../assets/icons/coming-soon.png')}
              style={styles.emptyStateImagepurchased}
            />
          </View>
        )}
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
    // top:
    //   Platform.OS === 'android'
    //     ? responsiveWidth('11.5%')
    //     : responsiveWidth('1.5%'),
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
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  // Tab Styles - Matching ChatScreen
  tabsContainer: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
    marginBottom: responsiveHeight(2),
    marginHorizontal: responsiveWidth(3),
  },
  tabsBgImage: {
    borderRadius: 10,
    opacity: 0.7,
  },
  tabsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabsScrollView: {
    position: 'relative',
    zIndex: 1,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(3),
  },
  tab: {
    paddingVertical: responsiveWidth(2),
    paddingHorizontal: responsiveWidth(1.5),
    alignItems: 'center',
    minWidth: responsiveWidth(43.5),
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#F2994A', // This will be overridden by theme colors
  },
  tabText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    lineHeight: 27,
    letterSpacing: -0.45,
  },
  price: {
    fontSize: 36,
    fontFamily: fontFamily.bold,
    marginRight: 8,
  },
  priceUnit: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  planDescription: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    marginBottom: responsiveWidth(3),
  },
  // Features List Styles
  featuresList: {
    // marginBottom: responsiveWidth(2),
  },
  // Disclaimer Styles
  disclaimerContainer: {
    marginBottom: responsiveWidth(2),
  },

  // Profile member dropdown styles
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    padding: responsiveWidth('2'),
    marginTop: responsiveWidth('1.5'),
    marginHorizontal: responsiveWidth('3'),
    marginBottom: 24,
    borderWidth: 2,
  },
  profileIcon: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    marginRight: 10,
  },
  input: {
    flex: 1,
    // paddingVertical: 12,
    paddingHorizontal: 8,
  },
  selectedMemberText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  arrowIconContainer: {
    alignSelf: 'center',
  },
  arrowIcon: {
    width: responsiveWidth(7),
    height: responsiveWidth(7),
    marginRight: -responsiveWidth(1),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
    transform: [{ rotate: '270deg' }],
  },
  modalOverlay: {
    flex: 1,
    // backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop:
      Platform.OS === 'ios' ? responsiveWidth('40') : responsiveHeight('12'),
  },
  modalDropdownContainer: {
    width: '92%',
    maxWidth: responsiveWidth('92'),
    alignSelf: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownContainer: {
    borderRadius: 10,
    borderWidth: Platform.OS === 'ios' ? 0.2 : 1,
    maxHeight: 230,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.2,
  },
  searchInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    borderWidth: 0.2,
  },
  flatListStyle: {
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderBottomWidth: 0.2,
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    paddingVertical: 10,
  },
  // Report cards styles
  reportsContainer: {
    marginHorizontal: responsiveWidth(3),
    paddingVertical: responsiveWidth(2),
  },
  reportsContainerpurchased: {
    // flex: 1,
    marginTop: responsiveWidth(30),
    justifyContent: 'center',
    alignItems: 'center',
    // marginHorizontal: responsiveWidth(3),
    // paddingVertical: responsiveWidth(2),
  },

  emptyStateImagepurchased: {
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    resizeMode: 'contain',
  },
  reportCardImageBackground: {
    borderRadius: 16,
    marginBottom: responsiveWidth(5),
    overflow: 'hidden',
    // opacity: 0.6,
  },
  reportCardImageStyle: {
    borderRadius: 16,
    opacity: 0.2,
  },
  reportCard: {
    borderRadius: 16,
    padding: responsiveWidth(4),
    borderWidth: 0.2,
    // opacity: 0.6,
    // borderColor: 'rgba(255, 255, 255, 0.1)',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 8,
  },
  reportCardHeader: {
    marginBottom: responsiveWidth(3),
  },
  reportTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    marginBottom: responsiveWidth(1),
    fontWeight: '700',
  },
  reportDescription: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    opacity: 0.9,
  },
  featuresText: {
    fontSize: 14,
    marginTop: responsiveWidth(1),
    fontFamily: fontFamily.regular,
    // lineHeight: 22,
    fontWeight: '700',
    // opacity: 0.9,
  },
  featuresContainer: {
    // marginBottom: responsiveWidth(3),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveWidth(2),
  },
  checkIconContainer: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    // borderRadius: 16,
    backgroundColor: '#DF8A5D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveWidth(3),
    marginTop: responsiveWidth(0.5),
  },
  checkIcon: {
    width: responsiveWidth(4),
    height: responsiveWidth(4),
    marginTop: responsiveWidth(1),
    resizeMode: 'contain',
    marginRight: responsiveWidth(2),
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    // opacity: 0.9,
  },
  showMoreContainer: {
    alignSelf: 'flex-start',
    // marginBottom: responsiveWidth(3),
  },
  showMoreText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    // opacity: 0.8,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: responsiveWidth(3),
  },
  priceText: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    marginLeft: 4,
  },
  buyNowButton: {
    borderRadius: 10,
    paddingVertical: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(6),
    marginHorizontal: responsiveWidth(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
    shadowOpacity: 0.1,
    elevation: 1,
  },
  buyNowButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
});

export default ReportScreen;
