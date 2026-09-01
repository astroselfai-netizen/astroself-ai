import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
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
  useWindowDimensions,
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
import { StackNavigationProp } from '@react-navigation/stack';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';
import { useProfileData } from '../../hooks/useProfileData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaymentService, {
  CreateAstrologerReportOrderRequest,
  AstrologerReportVerifyRequest,
} from '../../services/payment/payment.service';
import serviceFactory from '../../services/serviceFactory';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { isAstrologerUser } from '../../utils/userRole';
import UserService from '../../services/user/user.service';
import {
  getRazorpayUpiEnabledFields,
  withUpiPrefill,
} from '../../utils/razorpayUpiOptions';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getTransactionJwsIOS,
  ErrorCode,
} from 'react-native-iap';
import type { Purchase } from 'react-native-iap';
import RenderHTML from 'react-native-render-html';
import http, { baseURL } from '../../utils/http';

type ReportFeatureApi = {
  text: string;
  hasChildren: boolean;
  children: string[];
};

type ReportApiItem = {
  id: number;
  report_type: string;
  title: string;
  subtitle: string;
  price: number;
  data: string;
  features: ReportFeatureApi[];
  image?: string;
};

type ReportsApiResponse = {
  status: boolean;
  count?: number;
  data?: ReportApiItem[];
};

type ReportFeatureUi = {
  html: string;
  childrenHtml?: string;
};

type ReportUiItem = {
  id: string; // report_type
  title: string;
  description: string; // subtitle
  featuresTitel: string; // data
  price: string;
  features: ReportFeatureUi[];
  imageUrl?: string;
};

// iOS In-App Purchase product IDs (must match App Store Connect)
const IAP_REPORT_PRODUCT_IDS: Record<string, string> = {
  nakshatra: 'com.astroself.report.nakshatra',
  adl: 'com.astroself.report.adl',
  lord: 'com.astroself.report.lord',
  planet: 'com.astroself.report.planet',
};

// Razorpay Configuration
const RAZORPAY_CONFIG = {
  TEST_KEY: 'rzp_test_Rueu06YDULsQCD',
  LIVE_KEY: 'rzp_live_t11y7Cds0JWo47',
  PLAN_ID: 'd461266c-574b-4312-994a-ebd2b5cf6dc3',
  IS_TEST_MODE: true, // Set to false for production
};

const getReportCardTheme = (reportId: string, currentTheme: string) => {
  const isDark = currentTheme === 'dark';
  const id = String(reportId).toLowerCase();

  if (id.includes('nakshatra')) {
    return {
      cardBg: isDark ? '#142C33' : '#F0FDF9',
      borderColor: isDark ? '#2DD4BF' : '#0D9488',
      iconBg: isDark ? 'rgba(45, 212, 191, 0.2)' : '#CCFBF1',
      iconBorder: isDark ? '#2DD4BF' : '#0D9488',
      iconTintColor: isDark ? '#2DD4BF' : '#0D9488',
      priceBadgeBg: isDark ? 'rgba(45, 212, 191, 0.15)' : '#CCFBF1',
      priceBadgeBorder: isDark ? '#2DD4BF' : '#0D9488',
      priceTextColor: isDark ? '#5EEAD4' : '#0F766E',
      accentColor: isDark ? '#2DD4BF' : '#0D9488',
      titleColor: isDark ? '#FFFFFF' : '#0F766E',
      subColor: isDark ? '#A7F3D0' : '#115E59',
      featureTextColor: isDark ? '#E6FFFA' : '#134E4A',
      dividerColor: isDark ? 'rgba(45, 212, 191, 0.25)' : 'rgba(13, 148, 136, 0.25)',
      icon: require('../../assets/icons/Nakshatra-active.png'),
    };
  }

  if (id.includes('lord')) {
    return {
      cardBg: isDark ? '#17223B' : '#EEF2FF',
      borderColor: isDark ? '#818CF8' : '#4F46E5',
      iconBg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
      iconBorder: isDark ? '#F59E0B' : '#D97706',
      iconTintColor: isDark ? '#FBBF24' : '#D97706',
      priceBadgeBg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
      priceBadgeBorder: isDark ? '#F59E0B' : '#D97706',
      priceTextColor: isDark ? '#FCD34D' : '#92400E',
      accentColor: isDark ? '#FBBF24' : '#4F46E5',
      titleColor: isDark ? '#FFFFFF' : '#1E1B4B',
      subColor: isDark ? '#C7D2FE' : '#3730A3',
      featureTextColor: isDark ? '#EEF2FF' : '#1E1B4B',
      dividerColor: isDark ? 'rgba(129, 140, 248, 0.25)' : 'rgba(99, 102, 241, 0.25)',
      icon: require('../../assets/icons/Sun.png'),
    };
  }

  if (id.includes('planet') || id.includes('soul') || id.includes('imprint')) {
    return {
      cardBg: isDark ? '#332410' : '#FFFBEB',
      borderColor: isDark ? '#F59E0B' : '#D97706',
      iconBg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
      iconBorder: isDark ? '#F59E0B' : '#D97706',
      iconTintColor: isDark ? '#FBBF24' : '#D97706',
      priceBadgeBg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
      priceBadgeBorder: isDark ? '#F59E0B' : '#D97706',
      priceTextColor: isDark ? '#FDE68A' : '#78350F',
      accentColor: isDark ? '#F59E0B' : '#D97706',
      titleColor: isDark ? '#FFFFFF' : '#78350F',
      subColor: isDark ? '#FDE68A' : '#92400E',
      featureTextColor: isDark ? '#FFFBEB' : '#78350F',
      dividerColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(217, 119, 6, 0.25)',
      icon: require('../../assets/icons/star.png'),
    };
  }

  // Default / ADL
  return {
    cardBg: isDark ? '#2B1638' : '#FAF5FF',
    borderColor: isDark ? '#C084FC' : '#9333EA',
    iconBg: isDark ? 'rgba(192, 132, 252, 0.2)' : '#F3E8FF',
    iconBorder: isDark ? '#C084FC' : '#9333EA',
    iconTintColor: isDark ? '#E9D5FF' : '#9333EA',
    priceBadgeBg: isDark ? 'rgba(192, 132, 252, 0.15)' : '#F3E8FF',
    priceBadgeBorder: isDark ? '#C084FC' : '#9333EA',
    priceTextColor: isDark ? '#F3E8FF' : '#581C87',
    accentColor: isDark ? '#C084FC' : '#9333EA',
    titleColor: isDark ? '#FFFFFF' : '#581C87',
    subColor: isDark ? '#E9D5FF' : '#6B21A8',
    featureTextColor: isDark ? '#FAF5FF' : '#581C87',
    dividerColor: isDark ? 'rgba(192, 132, 252, 0.25)' : 'rgba(168, 85, 247, 0.25)',
    icon: require('../../assets/icons/Report-active.png'),
  };
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

type ReportScreenRouteProp = RouteProp<RootStackParamList, 'ReportScreen'>;
type ReportScreenNavProp = StackNavigationProp<
  RootStackParamList,
  'ReportScreen'
>;

const ReportScreen = () => {
  const { theme, colors } = useTheme();
  const route = useRoute<ReportScreenRouteProp>();
  const { userId } = route.params || {};
  const navigation = useNavigation<ReportScreenNavProp>();
  const { width } = useWindowDimensions();
  const { refreshProfileData, membersData } = useProfileData();
  const user = useSelector((state: RootState) => state.app.user);
  const isAstrologer = isAstrologerUser(user);

  const paymentService = serviceFactory.get<PaymentService>('PaymentService');
  const [activeTab, setActiveTab] = useState<'available' | 'purchased'>(
    'available',
  );
  const [processingReportId, setProcessingReportId] = useState<string | null>(
    null,
  );
  const [purchasedReports, setPurchasedReports] = useState<any[]>([]);
  const [loadingPurchasedReports, setLoadingPurchasedReports] = useState(false);

  // Available reports (dynamic)
  const [reportsData, setReportsData] = useState<ReportUiItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  // Astrologer clients state
  const [astrologerClients, setAstrologerClients] = useState<
    Array<{ id: string; full_name: string }>
  >([]);

  const apiHost = useMemo(() => {
    // baseURL includes "/api"
    return baseURL.endsWith('/api') ? baseURL.slice(0, -4) : baseURL;
  }, []);

  const toEmHtml = useCallback((text: string) => {
    // Convert simple *emphasis* to <em>emphasis</em> (API children strings are markdown-ish)
    return String(text).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }, []);

  const parseReportItem = useCallback(
    (r: any, defaultType?: string): ReportUiItem => {
      const reportType = r.report_type || r.id || defaultType || 'report';
      const imageUrl =
        typeof r.image === 'string' && r.image.trim().length > 0
          ? r.image.startsWith('http')
            ? r.image
            : `${apiHost}/${r.image}`.replace(/([^:]\/)\/+/g, '$1')
          : undefined;

      const features: ReportFeatureUi[] = Array.isArray(r.features)
        ? r.features.map((f: any) => {
            if (typeof f === 'string') {
              return { html: toEmHtml(f) };
            }
            const base = {
              html: f?.text || f?.title || f?.html || '',
            } as ReportFeatureUi;
            if (
              f?.hasChildren &&
              Array.isArray(f.children) &&
              f.children.length
            ) {
              const childrenLis = f.children
                .map((c: any) => `<li>${toEmHtml(String(c))}</li>`)
                .join('');
              base.childrenHtml = `<ul>${childrenLis}</ul>`;
            }
            return base;
          })
        : [];

      return {
        id: String(reportType),
        title: r.title || r.name || 'Report',
        description: r.subtitle || r.description || '',
        featuresTitel:
          r.data ||
          r.featuresTitle ||
          r.features_title ||
          'Our Report Covers',
        price: String(r.price ?? '999'),
        features,
        imageUrl,
      };
    },
    [apiHost, toEmHtml],
  );

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    setReportsError(null);
    try {
      if (isAstrologer) {
        try {
          const res = await paymentService.getAstrologerReportContent();
          let items: ReportUiItem[] = [];

          if (Array.isArray(res)) {
            items = res.map((r: any) => parseReportItem(r));
          } else if (res && Array.isArray(res.data)) {
            items = res.data.map((r: any) => parseReportItem(r));
          } else if (res && typeof res.data === 'object' && res.data !== null) {
            items = Object.entries(res.data).map(([key, val]: [string, any]) =>
              parseReportItem(val, key),
            );
          } else if (res && typeof res === 'object' && !res.status) {
            items = Object.entries(res).map(([key, val]: [string, any]) =>
              parseReportItem(val, key),
            );
          }

          // If still empty, try individual endpoints as fallback
          if (items.length === 0) {
            const reportTypes = ['nakshatra', 'lord', 'planet'];
            const fetchedItems = await Promise.allSettled(
              reportTypes.map(t => paymentService.getAstrologerReportContent(t)),
            );
            items = fetchedItems
              .filter(
                (r): r is PromiseFulfilledResult<any> =>
                  r.status === 'fulfilled' && !!r.value,
              )
              .map((r, idx) => {
                const val = r.value?.data || r.value;
                return parseReportItem(val, reportTypes[idx]);
              });
          }

          if (items.length > 0) {
            setReportsData(items);
            return;
          }
        } catch (astrologerErr) {
          console.log(
            'Astrologer report content error, falling back to /reports:',
            astrologerErr,
          );
        }
      }

      // Regular user or fallback:
      const res = await http.get<ReportsApiResponse>('/reports');
      const rawItems = Array.isArray(res.data?.data) ? res.data.data : [];
      const mapped = rawItems.map(r => parseReportItem(r));
      setReportsData(mapped);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Unable to load reports.';
      setReportsError(String(msg));
      setReportsData([]);
    } finally {
      setLoadingReports(false);
    }
  }, [isAstrologer, parseReportItem, paymentService]);

  const fetchAstrologerClients = useCallback(async () => {
    try {
      const userDataString = await AsyncStorage.getItem('USER_DATA');
      const currentUser = userDataString ? JSON.parse(userDataString) : user;
      const astrologerId = currentUser?._id || currentUser?.id;
      if (!astrologerId) return;

      const userService = new UserService();
      const response = await userService.getAstrologerClients(
        astrologerId,
        0,
        100,
      );
      if (response?.status && Array.isArray(response?.data?.data)) {
        const mapped = response.data.data.map((c: any) => ({
          id: String(c.id || c._id),
          full_name:
            `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Client',
        }));
        setAstrologerClients(mapped);
      }
    } catch (err) {
      console.error('Error fetching astrologer clients for report:', err);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchReports();
      if (isAstrologer) {
        fetchAstrologerClients();
      }
    }, [fetchReports, fetchAstrologerClients, isAstrologer]),
  );

  const htmlBaseStyle = useMemo(
    () => ({
      color: theme === 'dark' ? colors.white : colors.DarkNavy,
      fontSize: 14,
      fontFamily: fontFamily.regular,
      lineHeight: 20,
    }),
    [colors.DarkNavy, colors.white, theme],
  );

  const htmlTagsStyles = useMemo(
    () => ({
      p: { marginTop: 0, marginBottom: 0 },
      ul: { marginTop: 6, marginBottom: 0, paddingLeft: 16 },
      ol: { marginTop: 6, marginBottom: 0, paddingLeft: 16 },
      li: { marginBottom: 4 },
      em: { fontStyle: 'italic' },
      a: { color: colors.primary ?? colors.yellow },
      span: { color: htmlBaseStyle.color },
    }),
    [colors.primary, colors.yellow, htmlBaseStyle.color],
  );

  // Profile member / client dropdown state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Set selectedMemberId when members/clients are loaded and userId exists or default
  useEffect(() => {
    if (userId) {
      setSelectedMemberId(userId);
    } else if (!selectedMemberId) {
      if (isAstrologer && astrologerClients.length > 0) {
        setSelectedMemberId(astrologerClients[0].id);
      } else if (!isAstrologer && membersData && membersData.length > 0) {
        setSelectedMemberId(membersData[0].id);
      }
    }
  }, [userId, isAstrologer, astrologerClients, membersData, selectedMemberId]);

  // Fetch purchased reports when purchased tab is active
  useEffect(() => {
    const fetchPurchasedReports = async () => {
      if (activeTab === 'purchased' && selectedMemberId) {
        try {
          setLoadingPurchasedReports(true);
          const response = isAstrologer
            ? await paymentService.getAstrologerPurchasedReports(selectedMemberId)
            : await paymentService.getPurchasedReports(selectedMemberId);
          const isSuccess =
            response?.status === 'success' ||
            String(response?.status) === 'true' ||
            (response as any)?.success === true;
          if (isSuccess && response?.data) {
            setPurchasedReports(response.data);
          } else {
            setPurchasedReports([]);
          }
        } catch (error: any) {
          console.error('Error fetching purchased reports:', error);
          setPurchasedReports([]);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.message || 'Failed to fetch purchased reports',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });
        } finally {
          setLoadingPurchasedReports(false);
        }
      }
    };

    fetchPurchasedReports();
  }, [activeTab, selectedMemberId, isAstrologer, paymentService]);

  // Show more state for each report
  const [expandedReports, setExpandedReports] = useState<Set<string>>(
    new Set(),
  );

  // Payment success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [successModalMessage, setSuccessModalMessage] = useState('');
  const [showMemberRequiredModal, setShowMemberRequiredModal] = useState(false);

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

  // Active member / client list
  const currentMembersList: Array<{ id: string; full_name: string }> = useMemo(() => {
    if (isAstrologer) {
      return astrologerClients;
    }
    return (
      membersData?.map((m: any) => ({
        id: String(m.id || m._id),
        full_name: m.full_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Member',
      })) || []
    );
  }, [isAstrologer, astrologerClients, membersData]);

  // Filter members based on search query
  const filteredMembers =
    currentMembersList.filter((member: any) =>
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  // Helper: iOS IAP purchase - returns Purchase on success
  const purchaseReportViaIAP = (productId: string): Promise<Purchase> => {
    return new Promise((resolve, reject) => {
      const updateSub = purchaseUpdatedListener((purchase: Purchase) => {
        console.log('====================================');
        console.log('purchase:--->246', purchase);
        console.log('====================================');
        if (purchase.productId === productId) {
          updateSub.remove();
          errorSub.remove();
          resolve(purchase);
        }
      });
      const errorSub = purchaseErrorListener((error) => {
        updateSub.remove();
        errorSub.remove();
        reject(error);
      });
      requestPurchase({
        request: {
          apple: { sku: productId },
        },
        type: 'in-app',
      }).catch((err) => {
        updateSub.remove();
        errorSub.remove();
        reject(err);
      });
    });
  };

  // Payment handling function
  const handleReportPayment = async (reportId: string) => {
    try {
      // Check if member is selected
      if (!selectedMemberId) {
        setShowMemberRequiredModal(true);
        return;
      }

      setProcessingReportId(reportId);

      // Get current user data
      const userDataString = await AsyncStorage.getItem('USER_DATA');
      if (!userDataString) {
        throw new Error('User data not found. Please login again.');
      }

      const currentUserData = JSON.parse(userDataString);
      const currentUserId = currentUserData._id || currentUserData.user_id || currentUserData.id;

      if (!currentUserId) {
        throw new Error('User ID not found. Please login again.');
      }

      // Get selected member data
      const selectedMember = currentMembersList.find(
        (member: any) => String(member.id) === String(selectedMemberId),
      );
      if (!selectedMember) {
        throw new Error(isAstrologer ? 'Selected client not found.' : 'Selected member not found.');
      }

      // ---------- iOS: In-App Purchase flow ----------
      if (Platform.OS === 'ios') {
        const productId = IAP_REPORT_PRODUCT_IDS[reportId];
        if (!productId) {
          throw new Error(`Report "${reportId}" is not configured for in-app purchase.`);
        }

        console.log('Platform.OS:--->313', productId);
        await initConnection();
        try {
          const products = await fetchProducts({
            skus: [productId],
            type: 'in-app',
          });

          console.log('====================================');
          console.log('products:--->325', products);
          console.log('====================================');
          if (!products || products.length === 0) {
            throw new Error('Report not available for purchase. Please try again later.');
          }

          const purchase = await purchaseReportViaIAP(productId);

          // Get JWS receipt for backend verification (StoreKit 2)
          const receipt =
            (await getTransactionJwsIOS(productId)) ||
            (purchase as any).transactionReceipt ||
            purchase.transactionId;

          const verifyResponse = await paymentService.verifyUserReportIAP({
            user_id: selectedMemberId,
            report_type: reportId,
            receipt: receipt || purchase.transactionId,
            transaction_id: purchase.transactionId ?? receipt ?? '',
            product_id: productId,
            currency: 'USD',
          });

          const isSuccess =
            verifyResponse.success === true ||
            verifyResponse?.status === 'success' ||
            String(verifyResponse.success) === 'true' ||
            (verifyResponse.message &&
              verifyResponse.message.toLowerCase().includes('verified')) ||
            (verifyResponse.message &&
              verifyResponse.message.toLowerCase().includes('successful'));

          if (isSuccess) {
            await finishTransaction({
              purchase,
              isConsumable: false,
            });
            if (refreshProfileData) await refreshProfileData();
            setSuccessModalTitle('Payment Successful');
            setSuccessModalMessage(
              'Payment Successful. Your report is being generated and will be sent to your email within 1 hour.',
            );
            setShowSuccessModal(true);
          } else {
            throw new Error(verifyResponse.message || 'Payment verification failed');
          }
        } finally {
          await endConnection();
        }
        return;
      }

      // ---------- Android / Astrologer Razorpay flow ----------
      if (isAstrologer) {
        const reportData: CreateAstrologerReportOrderRequest = {
          report_type: reportId,
          user_id: selectedMemberId,
          receipt: paymentService.generateReceipt(),
          currency: 'INR',
          country_code:
            currentUserData.country_code || currentUserData.countryCode || 'IN',
          notes: {
            action: 'purchase_report',
            report_id: reportId,
            client_id: selectedMemberId,
            client_name: selectedMember.full_name,
            astrologer_id: currentUserId,
            astrologer_name:
              `${currentUserData.first_name || ''} ${currentUserData.last_name || ''}`.trim() || 'Astrologer',
          },
        };

        const orderResponse = await paymentService.createAstrologerReportOrder(reportData);
        const orderId = orderResponse.order_id || (orderResponse as any).id;
        const orderAmount = orderResponse.amount;

        if (!orderId || !orderAmount) {
          throw new Error('Invalid order response from server');
        }

        const options = {
          description: `Purchase ${
            reportsData.find(r => r.id === reportId)?.title || 'Report'
          } for ${selectedMember.full_name}`,
          currency: 'INR',
          key: RAZORPAY_CONFIG.IS_TEST_MODE ? RAZORPAY_CONFIG.TEST_KEY : RAZORPAY_CONFIG.LIVE_KEY,
          amount: orderAmount,
          order_id: orderId,
          name: 'Astrodha',
          ...getRazorpayUpiEnabledFields(),
          prefill: withUpiPrefill({
            email: currentUserData.email || 'user@example.com',
            contact: currentUserData.phone || '9999999999',
            name:
              `${currentUserData.first_name || ''} ${currentUserData.last_name || ''}`.trim() || 'Astrologer',
          }),
          theme: { color: '#DF8A5D' },
        };

        const paymentResponse = await RazorpayCheckout.open(options);

        const verifyData: AstrologerReportVerifyRequest = {
          razorpay_payment_id: paymentResponse.razorpay_payment_id || '',
          razorpay_order_id: paymentResponse.razorpay_order_id || orderId,
          razorpay_signature: paymentResponse.razorpay_signature || '',
        };

        const verifyResponse = await paymentService.verifyAstrologerReportPayment(verifyData);
        console.log('Astrologer report verify response:', verifyResponse);

        const isSuccess =
          verifyResponse.success === true ||
          verifyResponse?.status === 'success' ||
          String(verifyResponse.success) === 'true' ||
          (verifyResponse.message &&
            verifyResponse.message.toLowerCase().includes('verified')) ||
          (verifyResponse.message &&
            verifyResponse.message.toLowerCase().includes('successful'));

        if (isSuccess) {
          if (refreshProfileData) {
            await refreshProfileData();
          }
          setSuccessModalTitle('Payment Successful');
          setSuccessModalMessage(
            'Payment Successful. Your report is being generated and will be sent to your email within 1 hour.',
          );
          setShowSuccessModal(true);
        } else {
          throw new Error(verifyResponse.message || 'Payment verification failed');
        }
        return;
      }

      // Normal user Razorpay flow
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

      if (!orderResponse || !orderResponse.order_id || !orderResponse.amount) {
        throw new Error('Invalid order response from server');
      }

      const options = {
        description: `Purchase ${
          reportsData.find(r => r.id === reportId)?.title || 'Report'
        } for ${selectedMember.full_name}`,
        currency: 'INR',
        key: RAZORPAY_CONFIG.TEST_KEY,
        amount: orderResponse.amount,
        order_id: orderResponse.order_id,
        name: 'Astrodha',
        ...getRazorpayUpiEnabledFields(),
        prefill: withUpiPrefill({
          email: currentUserData.email || 'user@example.com',
          contact: currentUserData.phone || '9999999999',
          name:
            `${currentUserData.first_name || ''} ${
              currentUserData.last_name || ''
            }`.trim() || 'User',
        }),
        theme: { color: '#DF8A5D' },
      };

      const paymentResponse = await RazorpayCheckout.open(options);

      const verifyData = {
        razorpay_payment_id: paymentResponse.razorpay_payment_id || '',
        razorpay_order_id: paymentResponse.razorpay_order_id || orderResponse.order_id,
        razorpay_signature: paymentResponse.razorpay_signature || '',
      };

      const verifyResponse = await paymentService.userReportVerify(verifyData);
      console.log('Verify response:', verifyResponse);

      const isSuccess =
        verifyResponse.success === true ||
        verifyResponse?.status === 'success' ||
        String(verifyResponse.success) === 'true' ||
        (verifyResponse.message &&
          verifyResponse.message
            .toLowerCase()
            .includes('verified successfully')) ||
        (verifyResponse.message &&
          verifyResponse.message.toLowerCase().includes('payment successful'));

      if (isSuccess) {
        console.log('Payment successful! Refreshing profile data...');
        if (refreshProfileData) {
          await refreshProfileData();
        }
        setSuccessModalTitle('Payment Successful');
        setSuccessModalMessage('Payment Successful. Your report is being generated and will be sent to your email within 1 hour.');
        setShowSuccessModal(true);
      } else {
        console.log('Payment verification failed:', verifyResponse);
        throw new Error(
          verifyResponse.message || 'Payment verification failed',
        );
      }
    } catch (paymentError: any) {
      let errorMessage = 'Payment failed. Please try again.';
      let alertTitle = 'Payment Failed';

      console.log('Payment error details:', paymentError);

      // Check if this is IAP user cancellation (iOS)
      if (
        paymentError.code === ErrorCode?.UserCancelled ||
        paymentError.code === 'user-cancelled'
      ) {
        Toast.show({
          type: 'info',
          text1: 'Payment Cancelled',
          text2: 'Payment was cancelled',
          visibilityTime: 3000,
        });
        return;
      }

      // Check if this is a Razorpay cancellation error
      if (
        paymentError.code === 0 &&
        paymentError.description === 'Payment processing cancelled by user' &&
        paymentError.details?.error?.reason === 'payment_cancelled'
      ) {
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
            Reports
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
                ? currentMembersList.find((m: any) => String(m.id) === String(selectedMemberId))
                    ?.full_name || (isAstrologer ? 'Select Client' : 'Select Member')
                : (isAstrologer ? 'Select Client' : 'Select Member')}
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
                      placeholder={isAstrologer ? 'Search clients...' : 'Search members...'}
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
                        ? (isAstrologer ? 'No clients found matching your search' : 'No members found matching your search')
                        : (isAstrologer ? 'No clients found' : 'No members found')}
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
            {loadingReports ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="small"
                  color={theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy}
                />
                <Text
                  style={[
                    styles.loadingText,
                    {
                      color:
                        theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                      marginTop: 10,
                    },
                  ]}
                >
                  Loading reports...
                </Text>
              </View>
            ) : reportsError ? (
              <View style={styles.emptyStateContainer}>
                <Text
                  style={[
                    styles.emptyStateText,
                    {
                      color:
                        theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                      // marginBottom: 10,
                    },
                  ]}
                >
                  {reportsError}
                </Text>
                <TouchableOpacity onPress={fetchReports} activeOpacity={0.8}>
                  <Text style={[styles.showMoreText, { color: colors.yellow }]}>
                    Tap to retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : reportsData.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text
                  style={[
                    styles.emptyStateText,
                    {
                      color:
                        theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                    },
                  ]}
                >
                  No reports found
                </Text>
              </View>
            ) : (
              reportsData.map(report => {
                const cardTheme = getReportCardTheme(report.id, theme);
                const isExpanded = expandedReports.has(report.id);
                const visibleFeatures = isExpanded
                  ? report.features
                  : report.features.slice(0, 3);
                const cleanFeaturesTitle =
                  (report.featuresTitel || 'Our Report Covers').replace(
                    /:+$/,
                    '',
                  ) + ':';
                const displayPrice = report.price.startsWith('₹')
                  ? report.price
                  : `₹${report.price}`;

                return (
                  <View
                    key={report.id}
                    style={[
                      styles.reportCardWrapper,
                      {
                        backgroundColor: cardTheme.cardBg,
                        borderColor: cardTheme.borderColor,
                        shadowColor: cardTheme.borderColor,
                      },
                    ]}
                  >
                    {/* Centered Top Emblem Icon */}
                    <View style={styles.cardIconCenterWrap}>
                      <View
                        style={[
                          styles.cardIconCircle,
                          {
                            backgroundColor: cardTheme.iconBg,
                            borderColor: cardTheme.iconBorder,
                          },
                        ]}
                      >
                        <Image
                          source={cardTheme.icon}
                          style={[
                            styles.cardIconImg,
                            { tintColor: cardTheme.iconTintColor },
                          ]}
                          resizeMode="contain"
                        />
                      </View>
                    </View>

                    {/* Centered Title */}
                    <Text
                      style={[
                        styles.reportTitle,
                        {
                          color: cardTheme.titleColor,
                        },
                      ]}
                    >
                      {report.title}
                    </Text>

                    {/* Centered Description / Subtitle */}
                    {report.description ? (
                      <Text
                        style={[
                          styles.reportDescription,
                          {
                            color: cardTheme.subColor,
                          },
                        ]}
                      >
                        {report.description}
                      </Text>
                    ) : null}

                    {/* Centered Price Pill Badge */}
                    <View style={styles.pricePillContainer}>
                      <View
                        style={[
                          styles.pricePillBadge,
                          {
                            backgroundColor: cardTheme.priceBadgeBg,
                            borderColor: cardTheme.priceBadgeBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pricePillText,
                            { color: cardTheme.priceTextColor },
                          ]}
                        >
                          {displayPrice} (INR)
                        </Text>
                      </View>
                    </View>

                    {/* Card Divider */}
                    <View
                      style={[
                        styles.cardDivider,
                        { backgroundColor: cardTheme.dividerColor },
                      ]}
                    />

                    {/* Features Header */}
                    <Text
                      style={[
                        styles.featuresText,
                        {
                          color: cardTheme.titleColor,
                        },
                      ]}
                    >
                      {cleanFeaturesTitle}
                    </Text>

                    {/* Features List */}
                    <View style={styles.featuresContainer}>
                      {visibleFeatures.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <Image
                            source={require('../../assets/icons/checkIcon.png')}
                            resizeMode="contain"
                            style={[
                              styles.checkIcon,
                              { tintColor: cardTheme.accentColor },
                            ]}
                          />
                          <View style={styles.featureTextWrap}>
                            <RenderHTML
                              contentWidth={Math.max(
                                0,
                                width - responsiveWidth('8') - 60,
                              )}
                              source={{ html: feature.html ?? '' }}
                              baseStyle={{
                                color: cardTheme.featureTextColor,
                                fontSize: 13.5,
                                fontFamily: fontFamily.regular,
                                lineHeight: 20,
                              }}
                              tagsStyles={{
                                p: { marginTop: 0, marginBottom: 0 },
                                ul: {
                                  marginTop: 4,
                                  marginBottom: 0,
                                  paddingLeft: 14,
                                },
                                ol: {
                                  marginTop: 4,
                                  marginBottom: 0,
                                  paddingLeft: 14,
                                },
                                li: { marginBottom: 3 },
                                em: { fontStyle: 'italic' },
                                span: { color: cardTheme.featureTextColor },
                              }}
                              defaultTextProps={{ selectable: false }}
                            />
                            {feature.childrenHtml ? (
                              <RenderHTML
                                contentWidth={Math.max(
                                  0,
                                  width - responsiveWidth('8') - 60,
                                )}
                                source={{ html: feature.childrenHtml }}
                                baseStyle={{
                                  color: cardTheme.featureTextColor,
                                  fontSize: 13,
                                  fontFamily: fontFamily.regular,
                                  lineHeight: 18,
                                }}
                                tagsStyles={{
                                  p: { marginTop: 0, marginBottom: 0 },
                                  ul: {
                                    marginTop: 4,
                                    marginBottom: 0,
                                    paddingLeft: 14,
                                  },
                                  ol: {
                                    marginTop: 4,
                                    marginBottom: 0,
                                    paddingLeft: 14,
                                  },
                                  li: { marginBottom: 3 },
                                  em: { fontStyle: 'italic' },
                                  span: { color: cardTheme.featureTextColor },
                                }}
                                defaultTextProps={{ selectable: false }}
                              />
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Show More/Show Less Link */}
                    {report.features.length > 3 && (
                      <TouchableOpacity
                        style={styles.showMoreContainer}
                        onPress={() => toggleReportExpanded(report.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.showMoreText,
                            {
                              color: cardTheme.accentColor,
                            },
                          ]}
                        >
                          {isExpanded ? 'Show Less <<' : 'Show More >>'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Buy Now Button */}
                    <TouchableOpacity
                      style={[
                        styles.buyNowButton,
                        {
                          backgroundColor: colors.Orangeaccentcolor,
                        },
                      ]}
                      disabled={processingReportId === report.id}
                      onPress={() => handleReportPayment(report.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.buyNowButtonText}>
                        {processingReportId === report.id
                          ? 'Processing...'
                          : 'Buy Now'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'purchased' && (
          <View style={styles.reportsContainerpurchased}>
            {loadingPurchasedReports ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="small"
                  color={theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy}
                />
                <Text
                  style={[
                    styles.loadingText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                      marginTop: 10,
                    },
                  ]}
                >
                  Loading purchased reports...
                </Text>
              </View>
            ) : purchasedReports.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text
                  style={[
                    styles.emptyStateText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  No purchased reports found
                </Text>
              </View>
            ) : (
              <View style={styles.purchasedReportsList}>
                {purchasedReports.map((report, index) => {
                  console.log('report:--->', report);
                  const reportDetails = reportsData.find(
                    r => r.id === report.report_type,
                  );
                  const reportTitle =
                    reportDetails?.title || report.report_type;
                  const reportDescription =
                    reportDetails?.description || 'Report';
                  const cardTheme = getReportCardTheme(
                    report.report_type,
                    theme,
                  );

                  // Format verified_at date
                  const formatDate = (dateStr: string) => {
                    if (!dateStr) return 'Verified';
                    try {
                      const [datePart, timePart] = dateStr.split(' ');
                      const [day, monthName, year] = datePart.split('-');
                      const monthNames: { [key: string]: string } = {
                        Jan: 'January',
                        Feb: 'February',
                        Mar: 'March',
                        Apr: 'April',
                        May: 'May',
                        Jun: 'June',
                        Jul: 'July',
                        Aug: 'August',
                        Sep: 'September',
                        Oct: 'October',
                        Nov: 'November',
                        Dec: 'December',
                      };
                      const month = monthNames[monthName] || monthName;
                      return `${day} ${month} ${year}${
                        timePart ? ` at ${timePart}` : ''
                      }`;
                    } catch (e) {
                      return dateStr;
                    }
                  };

                  const clientName =
                    report.name ||
                    currentMembersList.find(
                      m => String(m.id) === String(selectedMemberId),
                    )?.full_name ||
                    'Client';

                  return (
                    <View
                      key={`${report.report_type}-${index}`}
                      style={[
                        styles.reportCardWrapper,
                        {
                          backgroundColor: cardTheme.cardBg,
                          borderColor: cardTheme.borderColor,
                          shadowColor: cardTheme.borderColor,
                        },
                      ]}
                    >
                      {/* Centered Top Emblem Icon */}
                      <View style={styles.cardIconCenterWrap}>
                        <View
                          style={[
                            styles.cardIconCircle,
                            {
                              backgroundColor: cardTheme.iconBg,
                              borderColor: cardTheme.iconBorder,
                            },
                          ]}
                        >
                          <Image
                            source={cardTheme.icon}
                            style={[
                              styles.cardIconImg,
                              { tintColor: cardTheme.iconTintColor },
                            ]}
                            resizeMode="contain"
                          />
                        </View>
                      </View>

                      {/* Centered Purchased Badge */}
                      <View style={styles.pricePillContainer}>
                        <View
                          style={[
                            styles.purchasedBadge,
                            {
                              backgroundColor: cardTheme.priceBadgeBg,
                              borderColor: cardTheme.priceBadgeBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.purchasedBadgeText,
                              { color: cardTheme.priceTextColor },
                            ]}
                          >
                            ✓ Purchased for {clientName}
                          </Text>
                        </View>
                      </View>

                      {/* Centered Title */}
                      <Text
                        style={[
                          styles.reportTitle,
                          {
                            color: cardTheme.titleColor,
                          },
                        ]}
                      >
                        {reportTitle}
                      </Text>

                      {reportDescription ? (
                        <Text
                          style={[
                            styles.reportDescription,
                            {
                              color: cardTheme.subColor,
                            },
                          ]}
                        >
                          {reportDescription}
                        </Text>
                      ) : null}

                      {/* Verified Date Box */}
                      <View
                        style={[
                          styles.verifiedDateContainer,
                          {
                            borderColor: cardTheme.dividerColor,
                            backgroundColor: cardTheme.iconBg,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.verifiedDateLabel,
                            {
                              color: cardTheme.subColor,
                            },
                          ]}
                        >
                          Verified on:
                        </Text>
                        <Text
                          style={[
                            styles.verifiedDateValue,
                            {
                              color: cardTheme.accentColor,
                            },
                          ]}
                        >
                          {formatDate(report.verified_at)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Payment Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <TouchableOpacity
          style={styles.successModalOverlay}
          activeOpacity={1}
          onPress={() => setShowSuccessModal(false)}
        >
          <View
            style={[
              styles.successModalContainer,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <View style={styles.successModalContent}>
              <Text
                style={[
                  styles.successModalTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                {successModalTitle}
              </Text>
              <Text
                style={[
                  styles.successModalMessage,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                {successModalMessage}
              </Text>
              <TouchableOpacity
                style={[
                  styles.successModalButton,
                  {
                    backgroundColor: colors.Orangeaccentcolor,
                  },
                ]}
                onPress={() => setShowSuccessModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.successModalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showMemberRequiredModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMemberRequiredModal(false)}
      >
        <TouchableOpacity
          style={styles.successModalOverlay}
          activeOpacity={1}
          onPress={() => setShowMemberRequiredModal(false)}
        >
          <View
            style={[
              styles.successModalContainer,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <View style={styles.successModalContent}>
              <Text
                style={[
                  styles.successModalTitle,
                  { color: colors.Orangeaccentcolor },
                ]}
              >
                {isAstrologer ? 'Client Selection Required' : 'Member Selection Required'}
              </Text>
              <Text
                style={[
                  styles.successModalMessage,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                {isAstrologer
                  ? 'Please select a client before purchasing the report.'
                  : 'Please select a member before purchasing the report.'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.successModalButton,
                  {
                    backgroundColor: colors.Orangeaccentcolor,
                  },
                ]}
                onPress={() => setShowMemberRequiredModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.successModalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'android' ? 100 : 100,
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
    marginLeft: -responsiveWidth(5),
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
    marginBottom: responsiveHeight(1),
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
    paddingBottom: responsiveHeight(1),
  },
  reportsContainerpurchased: {
    marginHorizontal: responsiveWidth(3),
    paddingVertical: responsiveWidth(2),
    paddingBottom: responsiveHeight(1),
  },
  purchasedReportsList: {
    marginTop: responsiveWidth(2),
    paddingBottom: responsiveHeight(1),
  },
  emptyStateContainer: {
    marginTop: responsiveWidth(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateImagepurchased: {
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    resizeMode: 'contain',
  },
  emptyStateText: {
    marginTop: responsiveWidth(5),
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: responsiveWidth(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  reportCardWrapper: {
    borderRadius: 18,
    borderWidth: 1.8,
    marginBottom: responsiveHeight(3),
    padding: responsiveWidth(4.5),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  cardIconCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveWidth(2),
    marginTop: responsiveWidth(1),
  },
  cardIconCircle: {
    width: responsiveWidth(13),
    height: responsiveWidth(13),
    borderRadius: responsiveWidth(6.5),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconImg: {
    width: responsiveWidth(6.5),
    height: responsiveWidth(6.5),
  },
  reportTitle: {
    fontSize: 19,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: responsiveWidth(1),
  },
  reportDescription: {
    fontSize: 13.5,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: responsiveWidth(2.5),
    paddingHorizontal: responsiveWidth(2),
  },
  pricePillContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveWidth(3),
  },
  pricePillBadge: {
    borderRadius: 20,
    borderWidth: 1.2,
    paddingHorizontal: responsiveWidth(4.5),
    paddingVertical: responsiveWidth(1.5),
  },
  pricePillText: {
    fontSize: 14.5,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardDivider: {
    height: 1,
    width: '100%',
    marginBottom: responsiveWidth(3),
  },
  featuresText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    marginBottom: responsiveWidth(2.5),
  },
  featuresContainer: {
    marginBottom: responsiveWidth(1),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveWidth(2),
  },
  checkIcon: {
    width: responsiveWidth(4),
    height: responsiveWidth(4),
    marginTop: responsiveWidth(0.8),
    resizeMode: 'contain',
    marginRight: responsiveWidth(2.5),
  },
  featureTextWrap: {
    flex: 1,
    paddingRight: responsiveWidth(1),
  },
  showMoreContainer: {
    alignSelf: 'center',
    paddingVertical: responsiveWidth(1.5),
    marginBottom: responsiveWidth(2),
  },
  showMoreText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  buyNowButton: {
    borderRadius: 12,
    paddingVertical: responsiveWidth(3.2),
    paddingHorizontal: responsiveWidth(6),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveWidth(1),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.6,
    shadowOpacity: 0.1,
    elevation: 1,
  },
  buyNowButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  purchasedBadge: {
    alignSelf: 'center',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(1.5),
    borderRadius: 20,
    borderWidth: 1.2,
    marginBottom: responsiveWidth(2),
  },
  purchasedBadgeText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  verifiedDateContainer: {
    marginTop: responsiveWidth(2),
    padding: responsiveWidth(2.5),
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifiedDateLabel: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
  },
  verifiedDateValue: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContainer: {
    borderRadius: 16,
    padding: 24,
    marginHorizontal: responsiveWidth(10),
    maxWidth: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successModalContent: {
    alignItems: 'center',
  },
  successModalTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  successModalMessage: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  successModalButton: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  successModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
});

export default ReportScreen;
