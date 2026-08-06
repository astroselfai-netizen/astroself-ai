// MemberManagement.tsx

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  FlatList,
  StatusBar,
  ImageBackground,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  Switch,
  Dimensions,
} from 'react-native';

import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useProfileData } from '../../hooks/useProfileData';
import { responsiveWidth, fontFamily, color } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import planService from '../../services/plan/plan.service';
import { subscriptionApi } from '../../api/subscriptionApi';
import serviceFactory from '../../services/serviceFactory';
import UserService from '../../services/user/user.service';
import PaymentService from '../../services/payment/payment.service';
import {
  getPlanIdForPlatform,
  getIapProductId,
  type PlanType,
} from '../../constant/subscriptionPlans';
import {
  getRazorpaySubscriptionPaymentFields,
  getRazorpayUpiEnabledFields,
  withUpiPrefill,
} from '../../utils/razorpayUpiOptions';
import {
  useIAP,
  ErrorCode,
  type PurchaseError,
  clearTransactionIOS,
  deepLinkToSubscriptions,
  getAvailablePurchases as getAvailablePurchasesNative,
  fetchProducts as fetchStoreKitProducts,
} from 'react-native-iap';
import type { Purchase } from 'react-native-iap';
import { useDispatch, useSelector } from 'react-redux';
import { setMembersUpdated } from '../../state/slices/appSlice';
import { RootState } from '../../state/store';
import { icons } from '../../assets';
import http from '../../utils/http';
import FamilyUpgradeModal from '../../components/FamilyUpgradeModal';
import {
  getMemberUserId,
  resolveBillingMemberForFamilyUpgrade,
} from '../../utils/resolveBillingMemberForUpgrade';

const PREMIUM_FREE_FEATURES = [
  'Major Life Cycle',
  'Current Chapter of Life',
  'Life Guidance',
  'Recent Experience',
  'Your Patterns',
  'Your Manifestations',
  'Your Personality',
  'About Your Partner',
];

const PREMIUM_INDIVIDUAL_MONTHLY_UPDATES = [
  'Mahadasha updates',
  'Antardasha changes',
  'Transit-based predictions',
  "Monthly dos & don'ts",
  'Timely guidance based on planetary movement',
];

const PREMIUM_INDIVIDUAL_HOUSE_BONUS = [
  'Strengths',
  'Advice',
  'Daily Tasks',
  'Think Twice (Things to be cautious about)',
  'What Combinations Are Active',
];

const PREMIUM_INDIVIDUAL_ALSO_INCLUDES = [
  'Dynamic monthly insights',
  'Evolving predictions',
  'Guidance updated with every change',
];

const PREMIUM_FAMILY_FEATURES = [
  'Separate monthly updates for each member',
  "Personalized dos & don'ts for each member",
  'Separate active combinations for each member',
  'Individual dynamic guidance for every member',
  'Full 12-house bonus analysis for every member',
];

const PREMIUM_FAMILY_UPDATE_TRIGGERS = [
  { icon: '🔗', label: 'Mahadasha\nChange' },
  { icon: '🔗', label: 'Antardasha\nChange' },
  { icon: '✦', label: 'Transit\nChange' },
];

type PremiumCheckVariant = 'blue' | 'green' | 'orange';

type SubscriptionPlanApiItem = {
  title?: string;
  price?: string;
  priceMode?: string;
};

const getPremiumPriceUnit = (priceMode?: string) => {
  const mode = (priceMode ?? 'month').toLowerCase();
  return mode.includes('year') ? '/ year' : '/ month';
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: { screen: string; params?: { userId?: string } };
  ContinueWithOtp: undefined;
  ChatScreen: undefined;
  NakshatraScreen: { userId: string };
  MemberPlanManagement: {
    planType?: PlanType;
    memberId?: string;
  };
  AddNewMember: { fromMemberPlanManagement?: boolean } | undefined;
  PurchasedHistoryScreen: undefined;
};

export type MemberPlanManagementEmbedProps = {
  embeddedPlanType?: PlanType;
  embeddedMemberId?: string;
};

type MemberPlanManagementNavigationProp = StackNavigationProp<
  RootStackParamList,
  'MemberPlanManagement'
>;
type MemberPlanManagementRouteProp = RouteProp<RootStackParamList, 'MemberPlanManagement'>;

const MemberItem = React.memo(
  ({
    item,
    isSelected,
    onSelect,
    isAssignPlanMode,
    isAssigned,
    canSelect,
    navigation,
    onEdit,
    onSubscriptionClick,
    onUpgradeClick,
    userCurrentPlan: _userCurrentPlan,
    isSubscriptionLoading,
    onRequestDeallocate,
    onRequestDelete,
    hasAnyEternalPath,
  }: {
    item: any;
    isSelected: boolean;
    onSelect: () => void;
    isAssignPlanMode: boolean;
    isAssigned: boolean;
    canSelect: boolean;
    navigation: any;
    onEdit: () => void;
    onSubscriptionClick?: () => void;
    onUpgradeClick?: () => void;
    userCurrentPlan?: string;
    isSubscriptionLoading?: boolean;
    onRequestDeallocate?: (member: any) => void;
    onRequestDelete?: (member: any) => void;
    hasAnyEternalPath?: boolean;
  }) => {
    // console.log('itemitemitemitem', item);

    const { theme, colors } = useTheme();
    // console.log('MemberItem rendering for:', item);
    const userCurrentPlan = _userCurrentPlan;

    // Extract name from API response
    const memberName =
      item.full_name ||
      (item.first_name && item.last_name
        ? `${item.first_name} ${item.last_name}`
        : item.first_name || 'Unknown Member');

    // Extract birth data from API response
    const formatBirthDate = (birthData: any) => {
      if (!birthData) return 'N/A';
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return `${months[birthData.month - 1]} ${birthData.day}, ${birthData.year
        }`;
    };

    const formatBirthTime = (birthData: any) => {
      if (!birthData) return 'N/A';
      const hour = birthData.hour;
      const min = birthData.min.toString().padStart(2, '0');
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${min} ${ampm}`;
    };

    const birthDate = formatBirthDate(item.birth_data);
    const birthTime = formatBirthTime(item.birth_data);
    const location = item.birthplace || 'Location not specified';

    const isPrimaryMember =
      item?.primary_member === true ||
      item?.primary_member === 'true' ||
      item?.primary_member === 'True' ||
      item?.primary_mamber === true ||
      item?.primary_mamber === 'true' ||
      item?.primary_mamber === 'True';

    const [includeInFamily, setIncludeInFamily] = useState(false);
    React.useEffect(() => {
      setIncludeInFamily(false);
    }, [item?.current_plan]);

    // Format renewal date - "31-12-2026 05:03"
    const formatRenewalDate = (dateStr: string | null | undefined): string => {
      if (!dateStr) return '';
      try {
        // Handle format like "29-Dec-2026 13:39" or "31-12-2026 05:03"
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          // Try manual parsing for "DD-MMM-YYYY HH:MM" format
          const parts = dateStr.split(' ');
          if (parts.length >= 2) {
            const datePart = parts[0]; // "29-Dec-2026"
            // const timePart = parts[1]; // "13:39"

            const [day, monthName, year] = datePart.split('-');
            const monthNames: { [key: string]: string } = {
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
            const month = monthNames[monthName] || '01';

            // const [hour, minute] = timePart.split(':');
            return `${day}-${month}-${year}`;
          }
          return dateStr;
        }

        // Format as "DD-MM-YYYY HH:MM"
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');

        return `${day}-${month}-${year} ${hour}:${minute}`;
      } catch (e) {
        return dateStr || '';
      }
    };

    const isDark = theme === 'dark';
    const accent = colors.Orangeaccentcolor || '#F27420';
    // Solid opaque fills in dark mode — rgba over ImageBackground causes dark-corner vignette
    const cardBg = isDark ? '#2A3F58' : '#FFFFFF';
    const subCardBg = isDark ? '#334A65' : '#FFF9F3';
    const textPrimary = isDark ? colors.themeTextWhite : '#1A2B48';
    const textMuted = isDark ? '#B8B0A0' : '#8B95A8';
    const borderSubtle = isDark ? 'rgba(238, 229, 202, 0.2)' : '#EFE6DC';
    const iconBoxBg = isDark ? 'rgba(242, 116, 32, 0.18)' : '#FFF0E6';
    const familyBg = isDark ? '#1E3D32' : '#EAF8EF';
    const familyBorder = isDark ? '#3D6B55' : '#C8EBD4';
    const familyText = isDark ? '#7DD4A0' : '#2D8A52';
    const chevronCircleBg = isDark ? '#3F5570' : '#FFFFFF';
    const avatarInitial = (memberName.trim().charAt(0) || '?').toUpperCase();
    const createdAtDisplay = item.created_at
      ? formatRenewalDate(item.created_at).split(' ')[0]
      : null;

    const navigateToInsights = () => {
      if (isPrimaryMember) {
        navigation.navigate('ChatTab', {
          screen: 'ChatScreen',
          params: { userId: item.id || item._id, tab: 'Static Predictions' },
        });
        return;
      }
      if (
        item.current_plan === 'eternal_path' ||
        item.current_plan === 'family_plan'
      ) {
        navigation.navigate('ChatTab', {
          screen: 'ChatScreen',
          params: { userId: item.id || item._id, tab: 'Static Predictions' },
        });
      } else if (onUpgradeClick) {
        onUpgradeClick();
      }
    };

    const planCtaLabel =
      item.current_plan === 'family_plan'
        ? null
        : hasAnyEternalPath && item.current_plan !== 'eternal_path'
          ? null
          : isSubscriptionLoading
            ? 'Loading...'
            : item.current_plan === 'eternal_path'
              ? 'Upgrade to Family Plan'
              : item.current_plan === 'renew'
                ? 'Renew Plan'
                : 'Buy Plan';

    return (
      <View
        style={[
          styles.newMembersCard,
          styles.memberCardV2,
          isDark && styles.memberCardV2Dark,
          {
            backgroundColor: cardBg,
            borderColor: borderSubtle,
          },
        ]}
      >
        <View style={styles.memberCardContent}>
          {/* Header: Created At + actions */}
          <View style={styles.memberCardHeaderRow}>
            {createdAtDisplay ? (
              <View style={styles.memberCreatedAtBlock}>
                <View
                  style={[styles.memberIconBox, { backgroundColor: iconBoxBg }]}
                >
                  <Text style={[styles.memberIconEmoji, { color: accent }]}>
                    📅
                  </Text>
                </View>
                <View>
                  <Text style={[styles.memberMetaLabel, { color: textMuted }]}>
                    Created At
                  </Text>
                  <Text style={[styles.memberMetaValue, { color: textPrimary }]}>
                    {createdAtDisplay}
                  </Text>
                </View>
              </View>
            ) : (
              <View />
            )}

            <View style={styles.memberHeaderActions}>
              {isAssignPlanMode && (
                <TouchableOpacity
                  onPress={onSelect}
                  disabled={isAssigned || !canSelect}
                  style={[
                    styles.checkbox,
                    styles.memberAssignCheckbox,
                    {
                      borderColor: isAssigned
                        ? colors.grayText || '#999'
                        : colors.Orangeaccentcolor,
                      backgroundColor: isSelected
                        ? colors.Orangeaccentcolor
                        : isAssigned
                          ? colors.grayText || '#999'
                          : isDark
                            ? colors.themeTextWhite
                            : colors.white,
                      opacity: isAssigned || !canSelect ? 0.5 : 1,
                    },
                  ]}
                >
                  {(isSelected || isAssigned) && (
                    <View style={styles.checkboxInner}>
                      <Text style={styles.checkboxCheckmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {!isAssignPlanMode && (
                <View style={styles.memberHeaderIconGroup}>
                  <TouchableOpacity
                    onPress={onEdit}
                    style={styles.memberHeaderActionCol}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[styles.memberRoundIconBtn, { backgroundColor: iconBoxBg }]}
                    >
                      <Image
                        source={require('../../assets/icons/edit-painel.png')}
                        style={[styles.memberHeaderIconImg, { tintColor: accent }]}
                      />
                    </View>
                  
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('NakshatraScreen', {
                        screen: 'NakshatraScreen',
                        params: { userId: item.id || item._id },
                      })
                    }
                    style={styles.memberHeaderActionCol}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[styles.memberRoundIconBtn, { backgroundColor: iconBoxBg }]}
                    >
                      <Image
                        source={require('../../assets/icons/ZodiacWheel.png')}
                        style={[styles.memberHeaderIconImg, { tintColor: accent }]}
                      />
                    </View>
                   
                  </TouchableOpacity>
                  {!isPrimaryMember && (
                    <TouchableOpacity
                      onPress={() => onRequestDelete?.(item)}
                      style={[styles.memberRoundIconBtn, { backgroundColor: iconBoxBg }]}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={require('../../assets/icons/trash.png')}
                        style={[styles.memberHeaderIconImg, { tintColor: accent }]}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Family plan badge */}
          {item.current_plan === 'family_plan' && (
            <View
              style={[
                styles.familyPlanBadge,
                {
                  backgroundColor: familyBg,
                  borderColor: familyBorder,
                },
              ]}
            >
              <View style={styles.familyPlanTopRow}>
                <View style={styles.familyPlanLabelRow}>
                  <Text style={styles.familyPlanShield}>🛡️</Text>
                  <Text style={[styles.familyPlanLabel, { color: familyText }]}>
                    Covered in Family Plan
                  </Text>
                </View>
                <Switch
                  value
                  disabled={
                    userCurrentPlan !== 'family_plan' || isSubscriptionLoading
                  }
                  onValueChange={(nextVal: boolean) => {
                    if (!nextVal && onRequestDeallocate) {
                      onRequestDeallocate(item);
                    }
                  }}
                  trackColor={{ false: '#BDBDBD', true: '#4CAF50' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#BDBDBD"
                  style={styles.familyPlanSwitch}
                />
              </View>
            </View>
          )}

          {/* Profile: avatar + name */}
          <View style={styles.memberProfileRow}>
            <View
              style={[
                styles.memberAvatar,
                {
                  borderColor: isDark
                    ? 'rgba(223, 138, 93, 0.45)'
                    : 'rgba(223, 138, 93, 0.35)',
                  backgroundColor: isDark ? '#3F5570' : '#FFF5EE',
                },
              ]}
            >
              <Text style={[styles.memberAvatarText, { color: accent }]}>
                {avatarInitial}
              </Text>
            </View>
            <View style={styles.memberNameBlock}>
              <Text style={[styles.memberNameTitle, { color: textPrimary }]}>
                {memberName}
              </Text>
              <View
                style={[
                  styles.memberNameAccent,
                  { backgroundColor: accent },
                ]}
              />
            </View>
          </View>

          {/* Include in family plan */}
          {userCurrentPlan === 'family_plan' &&
            item.current_plan !== 'family_plan' &&
            !isAssignPlanMode && (
              <View
                style={[
                  styles.includeFamilyRow,
                  styles.memberIncludeFamilyRow,
                  {
                    backgroundColor: isDark ? '#3A5068' : '#FFF3E8',
                    borderColor: isDark ? borderSubtle : '#F5D9C4',
                    opacity: isSubscriptionLoading ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[styles.includeFamilyText, { color: textPrimary }]}>
                  I Would Like To Include This Profile As Part Of My Family Plan
                </Text>
                <Switch
                  value={includeInFamily}
                  disabled={isSubscriptionLoading}
                  onValueChange={(nextVal: boolean) => {
                    setIncludeInFamily(nextVal);
                    if (nextVal && onSubscriptionClick) {
                      onSubscriptionClick();
                    }
                  }}
                  trackColor={{ false: '#CFCFCF', true: '#0E3B2E' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#CFCFCF"
                  style={styles.includeFamilySwitch}
                />
              </View>
            )}

          {/* DOB + Location cards */}
          <View style={styles.memberInfoCardsRow}>
            <View
              style={[
                styles.memberInfoCard,
                { backgroundColor: subCardBg, borderColor: borderSubtle },
              ]}
            >
              <View style={[styles.memberIconBox, { backgroundColor: iconBoxBg }]}>
                <Text style={[styles.memberIconEmoji, { color: accent }]}>📅</Text>
              </View>
              <View style={styles.memberInfoCardText}>
                <Text style={[styles.memberInfoLabel, { color: textMuted }]}>
                  Date Of Birth
                </Text>
                <Text style={[styles.memberInfoValue, { color: textPrimary }]}>
                  {birthDate}
                </Text>
                <Text
                  style={[
                    styles.memberInfoTime,
                    { color: accent },
                  ]}
                >
                  {birthTime}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.memberInfoCard,
                { backgroundColor: subCardBg, borderColor: borderSubtle },
              ]}
            >
              <View style={[styles.memberIconBox, { backgroundColor: iconBoxBg }]}>
                  <Text style={[styles.memberIconEmoji, { color: accent }]}>
                    📍
                  </Text>
              </View>
              <View style={styles.memberInfoCardText}>
                <Text style={[styles.memberInfoLabel, { color: textMuted }]}>
                  Location
                </Text>
                <Text
                  style={[styles.memberInfoValue, { color: textPrimary }]}
                  numberOfLines={3}
                >
                  {location}
                </Text>
              </View>
            </View>
          </View>

          {/* Insights */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.memberBottomActionCard,
              styles.memberBottomActionCardFull,
              styles.memberInsightsActionCard,
              {
                backgroundColor: subCardBg,
                borderColor: borderSubtle,
              },
            ]}
            onPress={navigateToInsights}
          >
            <View style={[styles.memberIconBox, { backgroundColor: iconBoxBg }]}>
              <Text style={[styles.memberIconEmoji, { color: accent }]}>💡</Text>
            </View>
            <View style={styles.memberBottomActionText}>
              <Text style={[styles.memberBottomActionTitle, { color: textPrimary }]}>
                Insights
              </Text>
              <Text style={[styles.memberBottomActionSub, { color: textMuted }]}>
                Discover personalized insights about your future.
              </Text>
            </View>
            <View
              style={[
                styles.memberChevronCircle,
                {
                  backgroundColor: chevronCircleBg,
                  borderColor: borderSubtle,
                },
              ]}
            >
              <Text style={[styles.memberBottomChevron, { color: accent }]}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Buy Reports + Buy Plan */}
          <View style={styles.memberBottomActionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.memberBottomActionCard,
                !planCtaLabel && styles.memberBottomActionCardFull,
                {
                  backgroundColor: subCardBg,
                  borderColor: borderSubtle,
                },
              ]}
              onPress={() =>
                navigation.navigate('ReportScreen', {
                  userId: item.id || item._id,
                })
              }
            >
              <View style={[styles.memberIconBox, { backgroundColor: iconBoxBg }]}>
                <Image
                  source={require('../../assets/icons/Report.png')}
                  style={[styles.memberBottomActionIcon, { tintColor: accent }]}
                />
              </View>
              <View style={styles.memberBottomActionText}>
                <Text style={[styles.memberBottomActionTitle, { color: textPrimary }]}>
                  Buy Reports
                </Text>
                <Text style={[styles.memberBottomActionSub, { color: textMuted }]}>
                  Detailed astrological reports
                </Text>
              </View>
              <View
                style={[
                  styles.memberChevronCircle,
                  {
                    backgroundColor: chevronCircleBg,
                    borderColor: borderSubtle,
                  },
                ]}
              >
                <Text style={[styles.memberBottomChevron, { color: accent }]}>›</Text>
              </View>
            </TouchableOpacity>

            {planCtaLabel ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.memberBottomActionCard,
                  {
                    backgroundColor: subCardBg,
                    borderColor: borderSubtle,
                  },
                  isSubscriptionLoading && { opacity: 0.6 },
                ]}
                onPress={onSubscriptionClick || (() => {})}
                disabled={isSubscriptionLoading}
              >
                <View style={[styles.memberIconBox, { backgroundColor: iconBoxBg }]}>
                  <Image
                    source={require('../../assets/icons/subscription.png')}
                    style={[styles.memberBottomActionIcon, { tintColor: accent }]}
                  />
                </View>
                <View style={styles.memberBottomActionText}>
                  <Text
                    style={[styles.memberBottomActionTitle, { color: textPrimary }]}
                    numberOfLines={2}
                  >
                    {planCtaLabel}
                  </Text>
                  <Text style={[styles.memberBottomActionSub, { color: textMuted }]}>
                    Premium plans & benefits
                  </Text>
                </View>
                <View
                  style={[
                    styles.memberChevronCircle,
                    {
                      backgroundColor: chevronCircleBg,
                      borderColor: borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.memberBottomChevron, { color: accent }]}>›</Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  },
);

const MemberPlanManagement = ({
  embeddedPlanType,
  embeddedMemberId,
}: MemberPlanManagementEmbedProps = {}) => {
  const navigation = useNavigation<MemberPlanManagementNavigationProp>();
  const route = useRoute<MemberPlanManagementRouteProp>();
  const { theme, colors } = useTheme();
  const planTypeFromParams =
    embeddedPlanType ?? route.params?.planType ?? 'individual';
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.app.user);
  const userService = serviceFactory.get<UserService>('UserService');
  const paymentService = serviceFactory.get<PaymentService>('PaymentService');
  const [localMembersData, setLocalMembersData] = useState<any[]>([]);

  const { membersData, profileData, loading, error, refreshProfileData } =
    useProfileData();
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(),
  );
  const [isAssignPlanMode, setIsAssignPlanMode] = useState(false);
  const [assignedMembers, setAssignedMembers] = useState<Set<string>>(
    new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [personalDetails, setPersonalDetails] = useState('');
  const [personalizedDetailsEnabled, setPersonalizedDetailsEnabled] =
    useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlanApiItem[]>([]);
  const [subscriptionPlansLoading, setSubscriptionPlansLoading] = useState(false);
  const [showIndividualSubscribeConfirm, setShowIndividualSubscribeConfirm] =
    useState(false);
  const [showFamilyUpgradeModal, setShowFamilyUpgradeModal] = useState(false);
  const [selectedMemberForSubscription, setSelectedMemberForSubscription] =
    useState<any>(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [_selectedMemberForUpgrade, setSelectedMemberForUpgrade] = useState<any>(null);
  const [userPlanDetails, setUserPlanDetails] = useState<{
    current_plan: string;
    members_allow: number;
    available_members_allow: number;
    email: string;
  } | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isFetchingPlan, setIsFetchingPlan] = useState(false);
  const [showDeallocateModal, setShowDeallocateModal] = useState(false);
  const [memberToDeallocate, setMemberToDeallocate] = useState<any>(null);
  const [isDeallocating, setIsDeallocating] = useState(false);
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [deleteMemberResult, setDeleteMemberResult] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showNoAvailablePlanModal, setShowNoAvailablePlanModal] =
    useState(false);
  const [_pendingIosUpgrade, setPendingIosUpgrade] = useState<{
    sku: string;
    planType: PlanType;
    planId: string;
    userId: string;
    memberUserId: string;
  } | null>(null);

  // Update local state when membersData changes
  React.useEffect(() => {
    if (membersData) {
      setLocalMembersData(membersData);
    }
  }, [membersData]);

  const userId = user?._id || (user as any)?.id || '';

  // Fetch user plan details when screen comes into focus
  const fetchUserPlanDetails = React.useCallback(async () => {
    if (!userId) return;
    try {
      const details = await planService.getUserPlanDetails(userId);
      setUserPlanDetails(details);
    } catch (err) {
      console.error('Failed to fetch user plan details:', err);
    }
  }, [userId]);

  const fetchSubscriptionPlans = React.useCallback(async () => {
    setSubscriptionPlansLoading(true);
    try {
      const res = await http.get<{ status: boolean; data?: SubscriptionPlanApiItem[] }>('/plans');
      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      setSubscriptionPlans(raw);
    } catch (err) {
      console.error('Failed to fetch subscription plans:', err);
      setSubscriptionPlans([]);
    } finally {
      setSubscriptionPlansLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (showPremiumModal) {
      fetchSubscriptionPlans();
    }
  }, [showPremiumModal, fetchSubscriptionPlans]);

  const individualPlanFromApi = useMemo(
    () => subscriptionPlans.find(p => p.title?.toLowerCase().includes('individual')) || null,
    [subscriptionPlans],
  );
  const freePlanFromApi = useMemo(
    () => subscriptionPlans.find(p => p.title?.toLowerCase().includes('free')) || null,
    [subscriptionPlans],
  );
  const familyPlanFromApi = useMemo(
    () => subscriptionPlans.find(p => p.title?.toLowerCase().includes('family')) || null,
    [subscriptionPlans],
  );
  const freePrice = freePlanFromApi?.price ?? '0';
  const individualPrice = individualPlanFromApi?.price ?? '299';
  const familyPrice = familyPlanFromApi?.price ?? '999';

  const renderPremiumCircleCheck = (variant: PremiumCheckVariant) => {
    const bg =
      variant === 'blue' ? '#3B6FD4' : variant === 'green' ? '#22C55E' : '#F2994A';
    return (
      <View style={[styles.premiumCircleCheck, { backgroundColor: bg }]}>
        <Text style={styles.premiumCircleCheckMark}>✓</Text>
      </View>
    );
  };

  const renderPremiumFeatureList = (items: string[], variant: PremiumCheckVariant) =>
    items.map((item, i) => (
      <View key={`${item}-${i}`} style={styles.premiumModalFeatureRow}>
        {renderPremiumCircleCheck(variant)}
        <Text
          style={
            variant === 'blue'
              ? [
                  styles.premiumModalFeatureTextDark,
                  {
                    color: theme === 'dark' ? colors.white : '#1F2937',
                  },
                ]
              : styles.premiumModalFeatureTextLight
          }
        >
          {item}
        </Text>
      </View>
    ));

  const renderPremiumPrice = (
    price: string,
    priceMode?: string,
    priceColor = '#FFFFFF',
  ) => {
    if (subscriptionPlansLoading) {
      return (
        <ActivityIndicator
          size="small"
          color={priceColor}
          style={styles.premiumPriceLoader}
        />
      );
    }
    return (
      <View style={styles.premiumPriceRow}>
        <Text style={[styles.premiumPriceAmount, { color: priceColor }]}>₹ {price}</Text>
        <Text style={[styles.premiumPriceUnit, { color: priceColor }]}>
          {getPremiumPriceUnit(priceMode)}
        </Text>
      </View>
    );
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshProfileData();
      setSelectedMembers(new Set());
      setIsAssignPlanMode(false);
      fetchUserPlanDetails();
    }, [refreshProfileData, fetchUserPlanDetails]),
  );

  // Use all members (no filtering needed)
  const filteredMembers = useMemo(() => {
    return localMembersData || [];
  }, [localMembersData]);

  const hasAnyEternalPath = useMemo(() => {
    return (filteredMembers || []).some(
      (m: any) => m?.current_plan === 'eternal_path' || m?.current_plan === 'family_plan',
    );
  }, [filteredMembers]);

  // console.log('filteredMembersprofileData------', profileData);

  // Calculate member and children counts
  const memberCount = profileData?.members_allow
    ? profileData?.members_allow - profileData?.current_members
    : 0;
  // child plan counts not used in this screen currently

  // Check if member can be selected (not already assigned and within limit)
  const canSelectMember = (memberId: string) => {
    if (assignedMembers.has(memberId)) {
      return false; // Already assigned
    }
    const currentSelectedCount = selectedMembers.size;
    if (selectedMembers.has(memberId)) {
      return true; // Can deselect
    }
    return currentSelectedCount < memberCount; // Can't exceed memberCount
  };

  // Toggle member selection
  const toggleMemberSelection = (memberId: string) => {
    if (!canSelectMember(memberId)) {
      Toast.show({
        type: 'info',
        text1: 'Limit Reached',
        text2: `You can only assign plan to ${memberCount} member(s)`,
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
      return;
    }

    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  // Handle Save button
  const handleSave = async () => {
    if (selectedMembers.size === 0) {
      Toast.show({
        type: 'info',
        text1: 'No Selection',
        text2: 'Please select at least one member',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
      return;
    }

    if (isSaving) {
      return; // Prevent multiple calls
    }

    setIsSaving(true);

    try {
      // Convert Set to Array for API call
      const userIds = Array.from(selectedMembers);

      console.log('Calling API with user_ids:', userIds);

      // Make API call using service
      const response = await planService.allocatePlanMultiSelection(userIds);

      console.log('API Response:', response);

      // Mark selected members as assigned
      const newAssigned = new Set(assignedMembers);
      selectedMembers.forEach(memberId => {
        newAssigned.add(memberId);
      });
      setAssignedMembers(newAssigned);

      // Refresh profile data to get updated member counts
      await refreshProfileData();

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2:
          response.message ||
          `Plan assigned to ${selectedMembers.size} member(s) successfully`,
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });

      // Clear selection and exit assign mode
      setSelectedMembers(new Set());
      setIsAssignPlanMode(false);
    } catch (apiError: any) {
      console.error('Error allocating plan:', apiError);

      const errorMessage =
        apiError.message || 'Failed to allocate plan. Please try again.';

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Clear button
  const handleClear = () => {
    setSelectedMembers(new Set());
    setIsAssignPlanMode(false);
  };

  // Handle Create Chart button
  const handleCreateChart = () => {
    navigation.navigate('AddNewMember', { fromMemberPlanManagement: true });
  };

  // Handle opening edit modal
  const handleOpenEditModal = (member: any) => {
    setSelectedMember(member);
    setPersonalDetails(member.what_do_you_do || '');
    setPersonalizedDetailsEnabled(member.personalizedDetails !== false);
    setShowEditModal(true);
  };

  // Handle closing edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedMember(null);
    setPersonalDetails('');
    setPersonalizedDetailsEnabled(true);
  };

  const openFamilyUpgradeForMember = useCallback((member: any) => {
    setSelectedMemberForSubscription(member);
    setShowFamilyUpgradeModal(true);
  }, []);

  // Handle opening premium/assign modal - calls API first to check user plan
  const handleOpenPremiumModal = async (member: any) => {
    const userId = user?._id || (user as any)?.id;
    if (!userId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'User not found', position: 'top', topOffset: 60 });
      return;
    }

    try {
      setIsFetchingPlan(true);
      const planDetails = await planService.getUserPlanDetails(userId);

      console.log('planDetails------', planDetails);
      setUserPlanDetails(planDetails);
      setSelectedMemberForSubscription(member);

      if (planDetails.current_plan === 'eternal_path') {
        await openFamilyUpgradeForMember(member);
        return;
      }

      if (
        planDetails.current_plan === 'family_plan' &&
        Number(planDetails.available_members_allow) <= 0
      ) {
        setShowNoAvailablePlanModal(true);
        return;
      }

      if (planDetails.current_plan === 'family_plan') {
        setShowAssignModal(true);
      } else {
        setShowPremiumModal(true);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to load plan details',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsFetchingPlan(false);
    }
  };

  // Handle assign family plan
  const handleAssignFamilyPlan = async () => {
    if (!selectedMemberForSubscription || !user) return;

    const userId = user._id || (user as any).id;
    const birthInputId =
      selectedMemberForSubscription.birth_input_id ||
      selectedMemberForSubscription.id ||
      selectedMemberForSubscription._id;

    if (!birthInputId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Member ID not found', position: 'top', topOffset: 60 });
      return;
    }

    try {
      setIsAssigning(true);
      const res = await planService.assignFamilyPlan(userId, birthInputId);

      console.log('res------', res);

      if (res.success) {
        Toast.show({
          type: 'success',
          text1: 'Plan Assigned',
          text2: 'Family plan assigned successfully',
          position: 'top',
          topOffset: 60,
        });
        setShowAssignModal(false);
        setSelectedMemberForSubscription(null);
        if (refreshProfileData) await refreshProfileData();
      } else {
        const msg = res.message || 'Assign failed';
        const isAlreadyHad = msg.toLowerCase().includes('already had a plan') || msg.toLowerCase().includes('already had');
        Toast.show({
          type: isAlreadyHad ? 'info' : 'error',
          text1: isAlreadyHad ? 'Already Assigned' : 'Unable to Assign',
          text2: isAlreadyHad ? 'This member already has a plan' : msg,
          position: 'top',
          topOffset: 60,
        });
        setShowAssignModal(false);
        setSelectedMemberForSubscription(null);
        if (refreshProfileData) await refreshProfileData();
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to assign plan';
      const isAlreadyHad = msg.toLowerCase().includes('already had');
      Toast.show({
        type: isAlreadyHad ? 'info' : 'error',
        text1: isAlreadyHad ? 'Already Assigned' : 'Error',
        text2: msg,
        position: 'top',
        topOffset: 60,
      });
      setShowAssignModal(false);
      setSelectedMemberForSubscription(null);
      if (refreshProfileData) await refreshProfileData();
    } finally {
      setIsAssigning(false);
    }
  };

  const handleOpenDeallocateModal = (member: any) => {
    setMemberToDeallocate(member);
    setShowDeallocateModal(true);
  };

  const handleCloseDeallocateModal = () => {
    setShowDeallocateModal(false);
    setMemberToDeallocate(null);
  };

  const handleOpenDeleteMemberModal = (member: any) => {
    console.log('member------', member);
    setMemberToDelete(member);
    setShowDeleteMemberModal(true);
  };

  const handleCloseDeleteMemberModal = () => {
    if (isDeletingMember) return;
    setShowDeleteMemberModal(false);
    setMemberToDelete(null);
  };

  const handleConfirmDeleteMember = async () => {
    const adminId = memberToDelete?.user_id || user?._id || (user as any)?.id;
    const birthId = memberToDelete?.id || memberToDelete?._id;
     

    if (!adminId || !birthId) {
      setDeleteMemberResult({
        kind: 'error',
        message: 'Unable to delete member. Missing member details.',
      });
      setShowDeleteMemberModal(false);
      return;
    }

    try {
      setIsDeletingMember(true);
      const res = await userService.deleteMember(String(adminId), String(birthId));
      if (res?.status === false) {
        setDeleteMemberResult({
          kind: 'error',
          message: res?.message || 'Failed to delete member.',
        });
      } else {
        setDeleteMemberResult({
          kind: 'success',
          message: res?.message || 'Member deleted successfully.',
        });
        await refreshProfileData();
      }
    } catch (e: any) {
      setDeleteMemberResult({
        kind: 'error',
        message: e?.message || 'Failed to delete member.',
      });
    } finally {
      setIsDeletingMember(false);
      setShowDeleteMemberModal(false);
      setMemberToDelete(null);
    }
  };

  const handleConfirmDeallocate = async () => {
    if (!memberToDeallocate || !user) return;
    const userId = user._id || (user as any).id;
    const birthInputId =
      memberToDeallocate.birth_input_id ||
      memberToDeallocate.id ||
      memberToDeallocate._id;

    if (!userId || !birthInputId) return;

    try {
      setIsDeallocating(true);
      const res = await planService.deallocateFamilyPlan(userId, birthInputId);
      if (res?.status) {
        Toast.show({
          type: 'success',
          text1: 'De-allocated',
          text2: res.message || 'Family member deallocated successfully',
          position: 'top',
          topOffset: 60,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: res?.message || 'Failed to deallocate family member',
          position: 'top',
          topOffset: 60,
        });
      }
      handleCloseDeallocateModal();
      await refreshProfileData();
      fetchUserPlanDetails();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to deallocate family member',
        position: 'top',
        topOffset: 60,
      });
      handleCloseDeallocateModal();
    } finally {
      setIsDeallocating(false);
    }
  };

  // Handle Update Plan (upgrade/initiate -> Razorpay -> upgrade/confirm)
  const handleUpdatePlan = async (member: any) => {
    if (Platform.OS !== 'android') {
      // iOS must not use Razorpay; upgrade happens via iOS subscription purchase
      await handleBuyPremiumAccess('family');
      return;
    }

    const uid = user?._id || (user as any)?.id || '';
    const members =
      localMembersData.length > 0 ? localMembersData : membersData ?? [];
    const billingMember = resolveBillingMemberForFamilyUpgrade(member, members);
    const memberUserId = getMemberUserId(billingMember);
    const familyPlanId = getPlanIdForPlatform('family');

    if (!uid || !memberUserId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User or member not found',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    try {
      setCreatingSubscription(true);

      console.log('initiating upgrade------');
      const initRes = await subscriptionApi.upgradeInitiate({
        user_id: uid,
        member_user_id: memberUserId,
        family_plan_id: familyPlanId,
      });

      console.log('initRes------', initRes);

      const userDataString = await AsyncStorage.getItem('USER_DATA');
      const currentUserData: any = userDataString ? JSON.parse(userDataString) : {};

      // Backend returns: razorpay_order_id, amount_paise, currency
      const orderId =
        (initRes as any)?.razorpay_order_id ||
        (initRes as any)?.order_id ||
        (initRes as any)?.data?.razorpay_order_id ||
        (initRes as any)?.data?.order_id;
      const amountPaise =
        (initRes as any)?.amount_paise ||
        (initRes as any)?.amount ||
        (initRes as any)?.data?.amount_paise ||
        (initRes as any)?.data?.amount;
      const currency =
        (initRes as any)?.currency || (initRes as any)?.data?.currency || 'INR';

      // Upgrade initiate may not return key; use stored/app key
      const key =
        (initRes as any)?.razorpay_key ||
        (initRes as any)?.data?.razorpay_key ||
        currentUserData?.razorpay_key ||
        'rzp_test_Rueu06YDULsQCD';

      if (!orderId || !amountPaise || !key) {
        throw new Error((initRes as any)?.message || 'Upgrade initiate failed');
      }

      const options = {
        key,
        order_id: orderId,
        amount: Number(amountPaise),
        currency,
        
        name: 'Astrodha',
        description: 'Upgrade to Family Plan',
        ...getRazorpayUpiEnabledFields(),
        prefill: withUpiPrefill({
          email:
            currentUserData.email || (user as any)?.email || 'user@example.com',
          contact:
            currentUserData.phone || (user as any)?.phone || '9999999999',
          name:
            `${currentUserData.first_name || (user as any)?.first_name || ''} ${currentUserData.last_name || (user as any)?.last_name || ''
              }`.trim() || 'User',
        }),
        theme: { color: '#DF8A5D' },
      };

      const payRes: any = await RazorpayCheckout.open(options as any);
      console.log('payRes------', payRes);

      const confirmRes = await subscriptionApi.upgradeConfirm({
        razorpay_order_id: payRes.razorpay_order_id,
        razorpay_payment_id: payRes.razorpay_payment_id,
        razorpay_signature: payRes.razorpay_signature,
      });
      console.log('confirmRes------', confirmRes);

      const ok =
        (confirmRes as any)?.success === true ||
        (confirmRes as any)?.status === 'success' ||
        (confirmRes as any)?.status === 'completed' ||
        String((confirmRes as any)?.success) === 'true';

      if (!ok) throw new Error((confirmRes as any)?.message || 'Upgrade failed');

      Toast.show({
        type: 'success',
        text1: 'Upgrade Successful',
        text2: (confirmRes as any)?.message || 'Family plan has been activated',
        position: 'top',
        topOffset: 60,
      });

      handleClosePremiumModal();
      if (refreshProfileData) await refreshProfileData();
      fetchUserPlanDetails();
    } catch (e: any) {
      const msg = e?.description || e?.message || 'Upgrade cancelled';
      const isCancel = String(msg).toLowerCase().includes('cancel');
      Toast.show({
        type: isCancel ? 'info' : 'error',
        text1: isCancel ? 'Cancelled' : 'Error',
        text2: isCancel ? 'Upgrade cancelled' : msg,
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setCreatingSubscription(false);
    }
  };

  // Handle closing premium modal
  const handleClosePremiumModal = () => {
    setShowPremiumModal(false);
    setShowIndividualSubscribeConfirm(false);
    setSelectedMemberForSubscription(null);
  };

  const handleCloseFamilyUpgradeModal = () => {
    setShowFamilyUpgradeModal(false);
    setSelectedMemberForSubscription(null);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedMemberForSubscription(null);
  };

  type PurchaseSubscriptionResult = {
    success: boolean;
    message: string;
    purchase?: Purchase;
    code?: string;
    requestedProductId?: string;
    receivedProductId?: string;
    isPendingUpgrade?: boolean;
    pendingUpgradeProductId?: string;
  };

  const IOS_INDIVIDUAL_PRODUCT_ID = 'com.astroself.subscription.individual_annual';
  const IOS_FAMILY_PRODUCT_ID = 'com.astroself.subscription.family_annual';
  const pendingPurchaseResolveRef = useRef<((value: PurchaseSubscriptionResult) => void) | null>(null);
  const pendingPurchaseRejectRef = useRef<((reason?: any) => void) | null>(null);
  const pendingPurchaseSkuRef = useRef<string | null>(null);
  const pendingPurchaseStartedAtRef = useRef<number>(0);

  const {
    connected,
    requestPurchase: requestIapPurchase,
    finishTransaction: finishIapTransaction,
  } = useIAP({
    onPurchaseSuccess: (purchase: Purchase) => {
      const resolve = pendingPurchaseResolveRef.current;
      if (!resolve) return;

      const requestedSku = String(pendingPurchaseSkuRef.current || '');
      const pid = String((purchase as any)?.productId || '');
      const txDate = Number((purchase as any)?.transactionDate || 0);
      const startedAtMs = pendingPurchaseStartedAtRef.current || 0;

      if (
        Number.isFinite(txDate) &&
        txDate > 0 &&
        startedAtMs > 0 &&
        txDate < startedAtMs - 2 * 60 * 1000
      ) {
        return;
      }

      if (!IOS_KNOWN_PRODUCT_IDS.includes(pid as (typeof IOS_KNOWN_PRODUCT_IDS)[number])) {
        return;
      }

      const pendingUpgradeProductId = String(
        (purchase as any)?.renewalInfoIOS?.pendingUpgradeProductId ||
          (purchase as any)?.renewalInfoIOS?.autoRenewPreference ||
          '',
      );
      const isFamilyRequested = requestedSku === IOS_FAMILY_PRODUCT_ID;
      const isPendingUpgrade =
        isFamilyRequested &&
        pid !== IOS_FAMILY_PRODUCT_ID &&
        pendingUpgradeProductId === IOS_FAMILY_PRODUCT_ID;

      if (pid !== requestedSku && !isPendingUpgrade) {
        return;
      }

      pendingPurchaseResolveRef.current = null;
      pendingPurchaseRejectRef.current = null;
      pendingPurchaseSkuRef.current = null;

      resolve({
        success: true,
        message: isPendingUpgrade
          ? 'Upgrade pending in App Store'
          : 'Subscription purchase completed successfully',
        purchase,
        requestedProductId: requestedSku,
        receivedProductId: pid,
        isPendingUpgrade,
        pendingUpgradeProductId: pendingUpgradeProductId || undefined,
      });
    },
    onPurchaseError: (error: PurchaseError) => {
      const resolve = pendingPurchaseResolveRef.current;
      const reject = pendingPurchaseRejectRef.current;
      if (!resolve && !reject) return;

      const code = String((error as any)?.code || '').toLowerCase();
      const message = String((error as any)?.message || '');
      const lowerMessage = message.toLowerCase();
      const isCancelled =
        code.includes('cancel') ||
        code === String(ErrorCode.UserCancelled).toLowerCase() ||
        lowerMessage.includes('cancel');
      const isAlreadyOwned =
        code === 'already-owned' ||
        code.includes('already') ||
        code.includes('owned') ||
        lowerMessage.includes('already subscribed') ||
        lowerMessage.includes('already purchased');

      pendingPurchaseResolveRef.current = null;
      pendingPurchaseRejectRef.current = null;
      pendingPurchaseSkuRef.current = null;

      if (resolve && isCancelled) {
        resolve({ success: false, code, message: 'Purchase cancelled by user' });
        return;
      }
      if (resolve && isAlreadyOwned) {
        resolve({ success: true, code, message: 'Item already owned' });
        return;
      }
      if (reject) reject(error);
    },
  });
  const IOS_KNOWN_PRODUCT_IDS = useMemo(
    () => [IOS_INDIVIDUAL_PRODUCT_ID, IOS_FAMILY_PRODUCT_ID] as const,
    [],
  );

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    return (await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), ms);
      }),
    ])) as T;
  }, []);

  const getPurchaseReceipt = useCallback((purchase: any): string => {
    return String(
      purchase?.purchaseToken ||
      purchase?.transactionReceipt ||
      purchase?.originalJson ||
      purchase?.dataAndroid ||
      '',
    );
  }, []);

  const getPurchaseDateValue = useCallback((purchase: any): number => {
    const raw =
      purchase?.transactionDate ||
      purchase?.purchaseTime ||
      purchase?.originalPurchaseDateIOS ||
      purchase?.purchaseDate;

    if (typeof raw === 'number') {
      return raw;
    }

    if (typeof raw === 'string') {
      const asNumber = Number(raw);
      if (!Number.isNaN(asNumber) && asNumber > 0) {
        return asNumber;
      }
      const asDate = new Date(raw).getTime();
      return Number.isNaN(asDate) ? 0 : asDate;
    }

    return 0;
  }, []);

  const getLatestKnownIosPurchase = useCallback((purchases: any[]): Purchase | null => {
    const filtered = (purchases || []).filter((purchase: any) =>
      IOS_KNOWN_PRODUCT_IDS.includes(purchase?.productId),
    );

    if (!filtered.length) {
      return null;
    }

    filtered.sort(
      (a: any, b: any) => getPurchaseDateValue(b) - getPurchaseDateValue(a),
    );

    return filtered[0] as Purchase;
  }, [getPurchaseDateValue, IOS_KNOWN_PRODUCT_IDS]);

  const verifyExistingIosSubscription = useCallback(
    async ({
      purchases,
      preferredProductId,
      userId,
      memberUserId,
      fallbackPlanId,
    }: {
      purchases: any[];
      preferredProductId?: string;
      userId: string;
      memberUserId: string;
      fallbackPlanId: string;
    }): Promise<{ success: boolean; productId?: string; message?: string }> => {
      const sortedPurchases = [...(purchases || [])].sort(
        (a: any, b: any) => getPurchaseDateValue(b) - getPurchaseDateValue(a),
      );

      const matchingPurchase =
        (preferredProductId
          ? sortedPurchases.find((purchase: any) => purchase?.productId === preferredProductId)
          : undefined) || getLatestKnownIosPurchase(sortedPurchases);

      if (!matchingPurchase) {
        return { success: false, message: 'No existing subscription found on this Apple ID' };
      }

      const productId = String((matchingPurchase as any)?.productId || '');
      const receipt = getPurchaseReceipt(matchingPurchase);

      if (!receipt) {
        return { success: false, message: 'Receipt not found for existing subscription' };
      }

      const verifyResponse = await paymentService.verifySubscriptionIAP({
        user_id: userId,
        member_user_id: memberUserId,
        plan_id:
          productId === IOS_FAMILY_PRODUCT_ID
            ? getPlanIdForPlatform('family')
            : fallbackPlanId,
        receipt,
        transaction_id: String((matchingPurchase as any)?.transactionId || ''),
        product_id: productId,
        plan_type:
          productId === IOS_FAMILY_PRODUCT_ID ? 'family_plan' : 'eternal_path',
        currency: 'INR',
      });

      const isSuccess =
        (verifyResponse as any)?.success === true ||
        (verifyResponse as any)?.status === true ||
        (verifyResponse as any)?.status === 'success' ||
        String((verifyResponse as any)?.success) === 'true' ||
        String((verifyResponse as any)?.status) === 'true';

      return {
        success: isSuccess,
        productId,
        message: (verifyResponse as any)?.message,
      };
    },
    [getLatestKnownIosPurchase, getPurchaseDateValue, getPurchaseReceipt, paymentService],
  );

  const finishIosTransactionSafely = useCallback(
    async (purchase?: Purchase | null) => {
      if (!purchase) {
        return;
      }

      try {
        await withTimeout(
          finishIapTransaction({ purchase, isConsumable: false }),
          5000,
        );
      } catch (finishError) {
        console.log('finishTransaction ignored error:', finishError);
      }

      try {
        await withTimeout(clearTransactionIOS(), 5000);
      } catch (clearError) {
        console.log('clearTransactionIOS ignored error:', clearError);
      }
    },
    [withTimeout, finishIapTransaction],
  );

  const openIosSubscriptionManagement = useCallback(
    async (message?: string) => {
      try {
        await deepLinkToSubscriptions();
      } catch (linkError) {
        console.log('deepLinkToSubscriptions error:', linkError);
      }

      if (message) {
        Toast.show({
          type: 'info',
          text1: 'Manage Subscription',
          text2: message,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      }
    },
    [],
  );

  const getIosProductsForPlan = useCallback(async (iapProductId: string) => {
    console.log('iapProductId------1378', iapProductId);
    // useIAP().fetchProducts returns void and only updates hook state; use the
    // module-level API when we need the loaded products array.
    return await fetchStoreKitProducts({
      skus: [iapProductId],
      type: 'subs',
    });
  }, []);

  // Helper: iOS IAP subscription purchase
  const purchaseSubscriptionViaIAP = async (
    productId: string,
  ): Promise<PurchaseSubscriptionResult> => {
    return new Promise((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      pendingPurchaseResolveRef.current = (result) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(result);
      };
      pendingPurchaseRejectRef.current = (err) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(err);
      };
      pendingPurchaseSkuRef.current = productId;
      pendingPurchaseStartedAtRef.current = Date.now();

      timeoutId = setTimeout(() => {
        const pendingResolve = pendingPurchaseResolveRef.current;
        pendingPurchaseResolveRef.current = null;
        pendingPurchaseRejectRef.current = null;
        pendingPurchaseSkuRef.current = null;
        if (pendingResolve) {
          pendingResolve({
            success: false,
            code: 'timeout',
            message: 'Purchase is taking longer than expected',
            requestedProductId: String(productId),
          });
        }
      }, 45000);

      requestIapPurchase({
        request: { ios: { sku: productId } },
        type: 'subs',
      }).catch((err) => {
        const pendingReject = pendingPurchaseRejectRef.current;
        pendingPurchaseResolveRef.current = null;
        pendingPurchaseRejectRef.current = null;
        pendingPurchaseSkuRef.current = null;
        if (timeoutId) clearTimeout(timeoutId);
        if (pendingReject) pendingReject(err);
      });
    });
  };

  // Handle Buy Premium Access
  const handleBuyPremiumAccess = async (planTypeArg?: PlanType) => {
    if (!selectedMemberForSubscription || !user) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Member or user information not found',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
      return;
    }

    const planType = planTypeArg ?? planTypeFromParams;
    const planId = getPlanIdForPlatform(planType);
    const userId = user?._id || (user as any)?.id || '';
    const memberUserId =
      selectedMemberForSubscription.id ||
      selectedMemberForSubscription._id ||
      '';

    let verifiedThisAttempt = false;

    try {
      setCreatingSubscription(true);

      // ---------- iOS: StoreKit IAP flow ----------
      if (Platform.OS === 'ios') {
        console.log('planType------', planType);
        const iapProductId = getIapProductId(planType);

        console.log('productId------1492', iapProductId);

        if (!iapProductId) {
          throw new Error('Subscription not available on this device');
        }

        if (!connected) {
          throw new Error('IAP connection is not ready yet. Please try again.');
        }
        try {
          await clearTransactionIOS();
        } catch (clearError) {
          console.log('initial clearTransactionIOS ignored error:', clearError);
        }

          const owned = await withTimeout(getAvailablePurchasesNative(), 5000).catch(() => []);
          const hasIndividual = owned.some(
            (purchase: any) => purchase?.productId === IOS_INDIVIDUAL_PRODUCT_ID,
          );
          const hasFamily = owned.some(
            (purchase: any) => purchase?.productId === IOS_FAMILY_PRODUCT_ID,
          );

          if (planType === 'individual' && hasIndividual) {
            const verifyExisting = await verifyExistingIosSubscription({
              purchases: owned,
              preferredProductId: IOS_INDIVIDUAL_PRODUCT_ID,
              userId,
              memberUserId,
              fallbackPlanId: planId,
            });

            if (verifyExisting.success) {
              verifiedThisAttempt = true;
              handleClosePremiumModal();
              if (refreshProfileData) await refreshProfileData();
              await fetchUserPlanDetails();
              Toast.show({
                type: 'success',
                text1: 'Already Active',
                text2: 'Your Individual plan is already active',
                position: 'top',
                topOffset: 60,
                visibilityTime: 2500,
              });
              return;
            }

            await openIosSubscriptionManagement(
              'This Apple ID already has an Individual subscription. Manage it from App Store subscriptions.',
            );
            return;
          }

          if (planType === 'family' && hasFamily) {
            const verifyExisting = await verifyExistingIosSubscription({
              purchases: owned,
              preferredProductId: IOS_FAMILY_PRODUCT_ID,
              userId,
              memberUserId,
              fallbackPlanId: getPlanIdForPlatform('family'),
            });

            if (verifyExisting.success) {
              verifiedThisAttempt = true;
              handleClosePremiumModal();
              if (refreshProfileData) await refreshProfileData();
              await fetchUserPlanDetails();
              Toast.show({
                type: 'success',
                text1: 'Already Active',
                text2: 'Your Family plan is already active',
                position: 'top',
                topOffset: 60,
                visibilityTime: 2500,
              });
              return;
            }
          }

          if (planType === 'family' && hasIndividual && !hasFamily) {
            // Don't force-open the App Store subscriptions screen here; requestPurchase will
            // show Apple's upgrade UI. If Apple still keeps the user on Individual, we'll
            // guide them to manage subscriptions after the purchase callback.
            setPendingIosUpgrade({
              sku: IOS_FAMILY_PRODUCT_ID,
              planType: 'family',
              planId,
              userId,
              memberUserId,
            });
            Toast.show({
              type: 'info',
              text1: 'Upgrade to Family',
              text2: 'Apple will ask you to confirm the upgrade.',
              position: 'top',
              topOffset: 60,
              visibilityTime: 2500,
            });
          }
          console.log('iapProductId------1592', iapProductId);

          const products = await getIosProductsForPlan(iapProductId);
          console.log('iapProductId------1595', iapProductId);
          console.log('products------', products);

          if (!products || products.length === 0) {
            throw new Error('Subscription not available. Please try again later.');
          }

          let purchase: Purchase | null = null;
          let purchaseCode: string | undefined;
          let purchaseMessage = '';

          try {
            console.log('iapProductId------1607', iapProductId);
            const purchaseResult = await purchaseSubscriptionViaIAP(iapProductId);
            console.log('purchaseResult------', purchaseResult);

            // Also log the latest known Apple subscription after this attempt.
            const ownedAfter = await withTimeout(getAvailablePurchasesNative(), 5000).catch(() => []);
            const latestAfter = getLatestKnownIosPurchase(ownedAfter);
            console.log('currentAppleSubscription------', latestAfter);

            purchase = purchaseResult.purchase || null;
            purchaseCode = purchaseResult.code;
            purchaseMessage = purchaseResult.message || '';
          } catch (listenerError) {
            console.log('purchaseSubscriptionViaIAP error------', listenerError);
            purchase = null;
          }

          if (!purchase) {
            const messageLower = purchaseMessage.toLowerCase();
            const codeLower = String(purchaseCode || '').toLowerCase();
            const isCancelled =
              messageLower.includes('cancel') || codeLower.includes('cancel');
            const isAlreadyOwned =
              messageLower.includes('owned') || codeLower.includes('own');
            const isTimeout =
              messageLower.includes('timeout') || codeLower.includes('timeout');

            if (isCancelled) {
              Toast.show({
                type: 'info',
                text1: 'Payment Cancelled',
                text2: 'You can try again later',
                position: 'top',
                topOffset: 60,
                visibilityTime: 2500,
              });
              return;
            }

            if (isAlreadyOwned || isTimeout) {
              const latestOwned = await withTimeout(getAvailablePurchasesNative(), 5000).catch(() => []);
              const verifyExisting = await verifyExistingIosSubscription({
                purchases: latestOwned,
                preferredProductId:
                  planType === 'family'
                    ? IOS_FAMILY_PRODUCT_ID
                    : IOS_INDIVIDUAL_PRODUCT_ID,
                userId,
                memberUserId,
                fallbackPlanId:
                  planType === 'family'
                    ? getPlanIdForPlatform('family')
                    : getPlanIdForPlatform('individual'),
              });

              if (verifyExisting.success) {
                verifiedThisAttempt = true;
                handleClosePremiumModal();
                if (refreshProfileData) await refreshProfileData();
                await fetchUserPlanDetails();
                Toast.show({
                  type: 'success',
                  text1: 'Subscription Active',
                  text2:
                    planType === 'family'
                      ? 'Your Family subscription has been activated'
                      : 'Your Individual subscription has been activated',
                  position: 'top',
                  topOffset: 60,
                  visibilityTime: 3000,
                });
                return;
              }

              if (planType === 'family') {
                await openIosSubscriptionManagement(
                  'Family upgrade was not completed by Apple. Please confirm the upgrade in App Store subscriptions and try again.',
                );
                return;
              }

              await openIosSubscriptionManagement(
                'This subscription already exists on your Apple ID. Please manage it in App Store subscriptions.',
              );
              return;
            }

            throw new Error('Purchase not received. Please try again.');
          }

          const normalizedPurchase: Purchase =
            (purchase as any)?.purchase != null
              ? (purchase as any).purchase
              : purchase;

          console.log('purchase------', normalizedPurchase);

          const receivedSku = String((normalizedPurchase as any)?.productId || '');
          const receipt = getPurchaseReceipt(normalizedPurchase);

          if (!receipt) {
            throw new Error('Receipt not found for this purchase');
          }

          let purchaseForVerify: Purchase = normalizedPurchase;
          let productIdForVerify = receivedSku || iapProductId;

          if (planType === 'family' && productIdForVerify !== IOS_FAMILY_PRODUCT_ID) {
            const latestOwned = await withTimeout(getAvailablePurchasesNative(), 5000).catch(() => []);
            const matchingFamilyPurchase = [...latestOwned]
              .filter((item: any) => item?.productId === IOS_FAMILY_PRODUCT_ID)
              .sort((a: any, b: any) => getPurchaseDateValue(b) - getPurchaseDateValue(a))[0] as Purchase | undefined;

            if (matchingFamilyPurchase) {
              purchaseForVerify = matchingFamilyPurchase;
              productIdForVerify = IOS_FAMILY_PRODUCT_ID;
            } else {
              await finishIosTransactionSafely(normalizedPurchase);
              await openIosSubscriptionManagement(
                'Apple returned your existing Individual subscription instead of the Family upgrade. Please confirm the Family upgrade in App Store subscriptions and try again.',
              );
              return;
            }
          }

          const receiptForVerify = getPurchaseReceipt(purchaseForVerify);
          if (!receiptForVerify) {
            throw new Error('Receipt not found for this purchase');
          }

          const resolvedPlanType =
            productIdForVerify === IOS_FAMILY_PRODUCT_ID
              ? 'family_plan'
              : 'eternal_path';
          const resolvedPlanId =
            productIdForVerify === IOS_FAMILY_PRODUCT_ID
              ? getPlanIdForPlatform('family')
              : getPlanIdForPlatform('individual');

          const verifyResponse = await paymentService.verifySubscriptionIAP({
            user_id: userId,
            member_user_id: memberUserId,
            plan_id: resolvedPlanId,
            receipt: receiptForVerify,
            transaction_id: String((purchaseForVerify as any)?.transactionId || ''),
            product_id: productIdForVerify,
            plan_type: resolvedPlanType,
            currency: 'INR',
          });

          console.log('verifyResponse------', verifyResponse);

          const isSuccess =
            (verifyResponse as any)?.success === true ||
            (verifyResponse as any)?.status === true ||
            verifyResponse?.status === 'success' ||
            String((verifyResponse as any)?.success) === 'true' ||
            String((verifyResponse as any)?.status) === 'true';

          if (isSuccess) {
            verifiedThisAttempt = true;
            await finishIosTransactionSafely(normalizedPurchase);
            handleClosePremiumModal();
            if (refreshProfileData) await refreshProfileData();
            await fetchUserPlanDetails();
            Toast.show({
              type: 'success',
              text1: 'Payment Successful',
              text2:
                resolvedPlanType === 'family_plan'
                  ? 'Your Family subscription has been activated'
                  : 'Your Individual subscription has been activated',
              position: 'top',
              topOffset: 60,
              visibilityTime: 3000,
            });
          } else {
            throw new Error(
              (verifyResponse as any)?.message || 'Payment verification failed',
            );
          }
        return;
      }

      // ---------- Android: Razorpay flow (unchanged) ----------

      console.log('creating subscription------',);
      console.log('planId------', planId);
      console.log('userId------', userId);
      console.log('memberUserId------', memberUserId);
      console.log('planType------', planType);
      console.log('selectedMemberForSubscription------', selectedMemberForSubscription);
      const subscriptionResponse = await subscriptionApi.createAutopaySubscription({
        plan_id: planId,
        user_id: userId,
        member_user_id: memberUserId,
        plan_type: planType === 'family' ? 'family_plan' : 'eternal_path',
      });

      console.log('subscriptionResponse------', subscriptionResponse);

      if (!subscriptionResponse.subscription_id) {
        throw new Error('Subscription ID not received from server');
      }

      if (!subscriptionResponse.razorpay_key) {
        throw new Error('Razorpay key not received from server');
      }

      // Get user data for prefill
      const userDataString = await AsyncStorage.getItem('USER_DATA');
      let currentUserData: any = {};
      if (userDataString) {
        currentUserData = JSON.parse(String(userDataString));
      }

      // Close the premium modal before opening Razorpay
      handleClosePremiumModal();

      // Razorpay payment options for subscription
      const options = {
        key: String(subscriptionResponse.razorpay_key),
        subscription_id: subscriptionResponse.subscription_id,
        name: 'Astrodha',
        description: 'Premium Plan Subscription - Astrodha',
        currency: 'INR',
        ...getRazorpaySubscriptionPaymentFields(),
        prefill: withUpiPrefill({
          email:
            currentUserData.email || (user as any)?.email || 'user@example.com',
          contact:
            currentUserData.phone || (user as any)?.phone || '9999999999',
          name:
            `${currentUserData.first_name || (user as any)?.first_name || ''} ${currentUserData.last_name || (user as any)?.last_name || ''
              }`.trim() || 'User',
        }),
        notes: {
          source: 'react_native',
          user_id: userId,
          member_user_id: memberUserId,
          plan_id: planId,
        },
        // theme: { color: '#DF8A5D' },
      };

      try {
        // Open Razorpay checkout modal (Android only)
        console.log('Razorpay options:', options);
        const paymentData = await RazorpayCheckout.open(options);

        console.log('Payment response:', paymentData);

        // Payment successful
        if (paymentData) {
          Toast.show({
            type: 'success',
            text1: 'Payment Successful',
            text2: 'Your premium subscription has been activated',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });
        }

        // Refresh profile data
        await refreshProfileData();
      } catch (razorpayError: any) {
        console.error('Razorpay error:', razorpayError);

        // Check if it's a cancellation
        const isCancelled =
          razorpayError?.code === 'BAD_REQUEST_ERROR' ||
          razorpayError?.code === 'NETWORK_ERROR' ||
          razorpayError?.description?.toLowerCase().includes('cancelled') ||
          razorpayError?.reason?.toLowerCase().includes('cancelled') ||
          razorpayError?.step === 'payment_cancelled';

        if (isCancelled) {
          // User cancelled, don't show error
          console.log('Payment cancelled by user');
          Toast.show({
            type: 'info',
            text1: 'Payment Cancelled',
            text2: 'You can try again later',
            position: 'top',
            topOffset: 60,
            visibilityTime: 2000,
          });
        } else {
          // Show error for other cases
          Toast.show({
            type: 'error',
            text1: 'Payment Error',
            text2:
              razorpayError?.description ||
              razorpayError?.message ||
              'Payment failed. Please try again.',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });
        }
      }
    } catch (subscriptionError: any) {
      if (verifiedThisAttempt) {
        // If we already verified successfully, ignore any late iOS errors
        // (e.g. already-owned / duplicate callbacks).
        console.log('Ignoring post-verify error:', subscriptionError?.message);
        return;
      }
      console.error('Error creating subscription:', subscriptionError);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: subscriptionError.message || 'Failed to create subscription',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
    } finally {
      setCreatingSubscription(false);
    }
  };

  const resolveMemberForPlanAction = useCallback(
    (memberId?: string) => {
      const members =
        localMembersData.length > 0 ? localMembersData : membersData ?? [];
      if (!members.length) return null;

      if (memberId) {
        const matched = members.find(
          (m: { id?: string; _id?: string; birth_input_id?: string }) =>
            String(m.id || m._id || m.birth_input_id) === String(memberId),
        );
        if (matched) return matched;
      }

      const primary = members.find(
        (m: { primary_mamber?: string; first_user?: boolean }) =>
          m?.primary_mamber === 'True' || m?.first_user,
      );
      return primary || members[0];
    },
    [localMembersData, membersData],
  );

  const startPlanActionForMember = useCallback(
    async (member: any, planType: PlanType) => {
      const userId = user?._id || (user as any)?.id;
      if (!userId) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'User not found',
          position: 'top',
          topOffset: 60,
        });
        return;
      }

      try {
        setIsFetchingPlan(true);
        const planDetails = await planService.getUserPlanDetails(userId);
        setUserPlanDetails(planDetails);
        setSelectedMemberForSubscription(member);

        if (planType === 'individual') {
          if (
            planDetails.current_plan === 'eternal_path' ||
            planDetails.current_plan === 'family_plan'
          ) {
            Toast.show({
              type: 'info',
              text1: 'Already Subscribed',
              text2: 'You already have an active plan',
              position: 'top',
              topOffset: 60,
            });
            return;
          }
          setShowIndividualSubscribeConfirm(true);
          return;
        }

        if (planDetails.current_plan === 'family_plan') {
          if (Number(planDetails.available_members_allow) <= 0) {
            setShowNoAvailablePlanModal(true);
            return;
          }
          setShowAssignModal(true);
          return;
        }

        if (planDetails.current_plan === 'eternal_path') {
          if (Platform.OS === 'android') {
            await handleUpdatePlan(member);
          } else {
            await openFamilyUpgradeForMember(member);
          }
          return;
        }

        await handleBuyPremiumAccess('family');
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: err.message || 'Failed to start plan action',
          position: 'top',
          topOffset: 60,
        });
      } finally {
        setIsFetchingPlan(false);
      }
    },
    [
      user,
      handleBuyPremiumAccess,
      handleUpdatePlan,
      openFamilyUpgradeForMember,
    ],
  );

  const processedPlanNavRef = useRef(false);
  const lastPendingPlanKeyRef = useRef('');

  const tryApplyPendingPlanAction = useCallback(async () => {
    const planType = embeddedPlanType ?? route.params?.planType;
    if (!planType) return;

    const memberId = embeddedMemberId ?? route.params?.memberId;
    const member = resolveMemberForPlanAction(memberId);
    if (!member) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Member not found',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    await startPlanActionForMember(member, planType);

    if (route.params?.planType) {
      navigation.setParams({ planType: undefined, memberId: undefined });
    }
  }, [
    embeddedPlanType,
    embeddedMemberId,
    route.params?.planType,
    route.params?.memberId,
    resolveMemberForPlanAction,
    startPlanActionForMember,
    navigation,
  ]);

  useFocusEffect(
    useCallback(() => {
      const planType = embeddedPlanType ?? route.params?.planType;
      const memberId = embeddedMemberId ?? route.params?.memberId;
      if (!planType) {
        processedPlanNavRef.current = false;
        lastPendingPlanKeyRef.current = '';
        return;
      }

      const members =
        localMembersData.length > 0 ? localMembersData : membersData ?? [];
      if (!members.length) return;

      const planKey = `${planType}:${memberId ?? ''}`;
      if (
        processedPlanNavRef.current &&
        lastPendingPlanKeyRef.current === planKey
      ) {
        return;
      }

      processedPlanNavRef.current = true;
      lastPendingPlanKeyRef.current = planKey;
      void tryApplyPendingPlanAction();
    }, [
      embeddedPlanType,
      embeddedMemberId,
      route.params?.planType,
      route.params?.memberId,
      localMembersData,
      membersData,
      tryApplyPendingPlanAction,
    ]),
  );

  const handleMemberSelectForPremium = (member: any) => {
    setSelectedMemberForSubscription(member);
    setShowMemberDropdown(false);
  };

  // Handle update member
  const handleUpdateMember = async () => {
    if (!selectedMember) return;

    try {
      setUpdating(true);

      const birthData = selectedMember.birth_data || {};
      const userId = user?._id || selectedMember.userId || '';

      const updateData = {
        id: selectedMember.id || selectedMember._id,
        first_name: selectedMember.first_name || '',
        last_name: selectedMember.last_name || '',
        isUpdate: true,
        isProfile: false,
        gender: selectedMember.gender || 'Male',
        day: birthData.day || 1,
        month: birthData.month || 1,
        year: birthData.year || 2000,
        hour: birthData.hour || 0,
        min: birthData.min || 0,
        birthplace: selectedMember.birthplace || '',
        lat: selectedMember.lat || '',
        lon: selectedMember.lon || '',
        tzone: birthData.tzone || null,
        userId: userId,
        what_do_you_do: personalDetails,
        marital_status: selectedMember.marital_status || null,
        children: selectedMember.children || null,
        health_issues_if_any: selectedMember.health_issues_if_any || null,
        main_source_of_finances: selectedMember.main_source_of_finances || null,
        prediction_type: selectedMember.prediction_type || 'bullet',
        personalizedDetails: personalizedDetailsEnabled,
        profession: selectedMember.profession || '',
      };

      const response = await userService.updateBirthData(
        selectedMember.id || selectedMember._id,
        updateData,
      );

      if (response.status) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2:
            response.message || 'Member personal info updated successfully',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });

        dispatch(setMembersUpdated(true));
        await refreshProfileData();
        handleCloseEditModal();
      }
    } catch (updateError: any) {
      console.error('Error updating member:', updateError);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: updateError.message || 'Failed to update member',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentHistory = () => {
    navigation.navigate('PurchasedHistoryScreen');
  };

  // Log the full members data to see the structure
  // console.log('Full membersData:', JSON.stringify(membersData, null, 2));

  return (
    <ImageBackground
      source={
        theme === 'dark'
          ? require('../../assets/image/DarkBackground.png')
          : require('../../assets/image/LightBackground.png')
      }
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Header */}
      {/* <View style={styles.headerWrap}>
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
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
            },
          ]}
        >
          Buy Plans
        </Text>
        <View style={styles.placeholder} />
      </View> */}

      {/* Available Plans Section */}
      <View style={styles.availablePlansContainer}>
        {/* <View
          style={[
            styles.availablePlansCard,
            {
              backgroundColor:
                theme === 'dark' ? colors.transparentBg : colors.white,
              borderColor:
                theme === 'dark' ? colors.themeTextWhite : colors.borderColor,
            },
          ]}
        >
          <Text
            style={[
              styles.availablePlansTitle,
              {
                color:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
          >
            Available Plans
          </Text>
          <View style={styles.plansCountRow}>
            <Text
              style={[
                styles.plansCountText,
                {
                  color: theme === 'dark' ? colors.white : colors.DarkNavy,
                },
              ]}
            >
              Member: {String(memberCount).padStart(2, '0')}
            </Text>
            <Text
              style={[
                styles.plansCountText,
                {
                  color: theme === 'dark' ? colors.white : colors.DarkNavy,
                },
              ]}
            >
              Children: {String(childrenCount).padStart(2, '0')}
            </Text>
          </View>
        </View> */}

        {/* Action Buttons */}
        {!isAssignPlanMode ? (<>
          // <View style={styles.actionButtonsContainer}>
            {/* <TouchableOpacity
              style={[
                styles.assignPlanButton,
                {
                  backgroundColor: isAssignPlanEnabled
                    ? colors.Orangeaccentcolor
                    : colors.grayText || '#999',
                  opacity: isAssignPlanEnabled ? 1 : 0.5,
                },
              ]}
              onPress={handleAssignPlan}
              disabled={!isAssignPlanEnabled}
            >
              <Text style={styles.assignPlanButtonText}>Assign Plan</Text>
            </TouchableOpacity> */}
            {/* <TouchableOpacity
              style={[
                styles.paymentHistoryButton,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.surface : colors.white,
                  borderColor:
                    theme === 'dark' ? colors.themeTextWhite : colors.white,
                  borderWidth: 1,
                  // opacity: isCreateChartEnabled ? 1 : 0.5,
                },
              ]}
              onPress={handlePaymentHistory}
            // disabled={!isCreateChartEnabled}
            >
              <Text
                style={[
                  styles.createChartButtonText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                    // opacity: isCreateChartEnabled ? 1 : 0.5,
                  },
                ]}
              >
                Payment History
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createChartButton,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.surface : colors.white,
                  borderColor:
                    theme === 'dark' ? colors.themeTextWhite : colors.white,
                  borderWidth: 1,
                  // opacity: isCreateChartEnabled ? 1 : 0.5,
                },
              ]}
              onPress={handleCreateChart}
            // disabled={!isCreateChartEnabled}
            >
              <Text
                style={[
                  styles.createChartButtonText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                    // opacity: isCreateChartEnabled ? 1 : 0.5,
                  },
                ]}
              >
                Create A New Chart
              </Text>
            </TouchableOpacity> */}
          // </View>
        </>
        ) : (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.Orangeaccentcolor,
                  opacity: isSaving ? 0.6 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <LottieView
                  source={require('../../assets/lottie/loader-Animation-1.json')}
                  autoPlay
                  loop
                  style={styles.saveButtonLoader}
                />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.clearButtonStyle,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.surface : colors.white,
                  borderColor:
                    theme === 'dark' ? colors.themeTextWhite : colors.white,
                  borderWidth: 1,
                  opacity: isSaving ? 0.6 : 1,
                },
              ]}
              onPress={handleClear}
              disabled={isSaving}
            >
              <Text
                style={[
                  styles.clearButtonTextStyle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Family Members List */}

      {loading ? (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../../assets/lottie/loader-Animation-1.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <Text
              style={[
                styles.errorText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Error: {error}
            </Text>
          ) : filteredMembers.length === 0 ? (
            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              No family members found
            </Text>
          ) : (
            <FlatList
              data={filteredMembers}
              renderItem={({ item }) => {
                const memberId = item.id || item._id || '';
                const isAssigned = assignedMembers.has(memberId);
                const canSelect = canSelectMember(memberId);
                return (
                  <MemberItem
                    item={item}
                    isSelected={selectedMembers.has(memberId)}
                    onSelect={() => toggleMemberSelection(memberId)}
                    isAssignPlanMode={isAssignPlanMode}
                    isAssigned={isAssigned}
                    canSelect={canSelect}
                    navigation={navigation}
                    onEdit={() => handleOpenEditModal(item)}
                    onSubscriptionClick={() => handleOpenPremiumModal(item)}
                    onUpgradeClick={() => {
                      setSelectedMemberForUpgrade(item);
                      setShowUpgradeModal(true);
                    }}
                    userCurrentPlan={user?.current_plan || userPlanDetails?.current_plan}
                    isSubscriptionLoading={isFetchingPlan}
                    onRequestDeallocate={handleOpenDeallocateModal}
                    onRequestDelete={handleOpenDeleteMemberModal}
                    hasAnyEternalPath={hasAnyEternalPath}
                  />
                );
              }}
              keyExtractor={(item, index) =>
                item.id || item._id || `member-${index}`
              }
              scrollEnabled={false}
              refreshing={loading}
              onRefresh={refreshProfileData}
            />
          )}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      {/* <TouchableOpacity onPress={() => navigation.navigate('AddNewMember')} style={styles.fab}>
        <Image
          source={require('../../assets/icons/add-plus-circle.png')}
          style={styles.fabIcon}
        />
      </TouchableOpacity> */}

      {/* Edit Member Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseEditModal}
      >
        <View style={styles.modalOverlay}>
          <ImageBackground
            source={
              theme === 'dark'
                ? require('../../assets/image/DarkBackground.png')
                : require('../../assets/image/LightBackground.png')
            }
            blurRadius={12}
            style={[
              styles.modalContainer,
              {
                backgroundColor:
                  theme === 'dark' ? colors.surface : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
            imageStyle={[
              styles.modalBgImage,
              {
                backgroundColor:
                  theme === 'dark' ? colors.surface : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.transparent : colors.transparent,
                },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Personal Details
              </Text>
              <TouchableOpacity
                onPress={handleCloseEditModal}
                activeOpacity={0.7}
              >
                <Image
                  source={icons.Icclose}
                  style={[
                    styles.closeButtonImage,
                    {
                      tintColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.modalDivider,
                {
                  backgroundColor:
                    theme === 'dark'
                      ? 'rgba(255, 255, 255, 0.3)'
                      : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
            />

            {/* Modal Content */}
            <View style={styles.editModalContent}>
              {/* Personal Details Section */}
              <View style={styles.personalDetailsSection}>
                <Text
                  style={[
                    styles.personalDetailsDescription,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                      opacity: 0.8,
                    },
                  ]}
                >
                  Personalized predictions depend on the level of details shared
                  by you - more precise, accurate, and comprehensive details
                  will help generate relatable predictions.
                </Text>

                {/* Text Input Area */}
                <TextInput
                  style={[
                    styles.personalDetailsInput,
                    {
                      backgroundColor:
                        theme === 'dark' ? colors.cardBackground : colors.white,
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                      borderColor:
                        theme === 'dark'
                          ? colors.themeBorderDropdown
                          : colors.borderColor,
                    },
                  ]}
                  value={personalDetails}
                  onChangeText={setPersonalDetails}
                  placeholder={`Example:

(a) What do you do - e.g. studying, working, home maker, retired, consultant etc.

(b) Work details - e.g. employed, running a business, stock trader, IT professional, studying, doctor, etc.

(c) Family details - Father mother, children, siblings, partner etc.

(d) What keeps you busy these days

(e) Anything else that you wish to share.`}
                  placeholderTextColor={colors.grayText}
                  multiline
                  textAlignVertical="top"
                  numberOfLines={8}
                />
              </View>
            </View>

            {/* Modal Footer Buttons */}
            <View
              style={[
                styles.editModalFooter,
                {
                  borderTopColor:
                    theme === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  {
                    borderColor:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.primaryBlue,
                  },
                ]}
                onPress={handleCloseEditModal}
                disabled={updating}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.primaryBlue,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.updateButton,
                  {
                    backgroundColor:
                      theme === 'dark'
                        ? colors.Orangeaccentcolor
                        : colors.Orangeaccentcolor,
                  },
                ]}
                onPress={handleUpdateMember}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text
                    style={[styles.updateButtonText, { color: colors.white }]}
                  >
                    Update
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      </Modal>

      {/* No available slots modal */}
      <Modal
        visible={showNoAvailablePlanModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoAvailablePlanModal(false)}
      >
        <View style={styles.premiumModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowNoAvailablePlanModal(false)}
          />
          <View
            style={[
              styles.premiumModalContainer,
              {
                backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white,
                paddingTop: 24,
              },
            ]}
          >
            <Text
              style={[
                styles.premiumModalTitle,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.DarkNavy,
                  marginBottom: 12,
                },
              ]}
            >
              No Available Plan
            </Text>

            <Text
              style={[
                styles.premiumModalPlanFeatureText,
                {
                  color:
                    theme === 'dark'
                      ? 'rgba(255,255,255,0.8)'
                      : 'rgba(0,0,0,0.7)',
                  textAlign: 'center',
                  marginBottom: 16,
                },
              ]}
            >
              You don’t have an available plan to allocate a member. Please
              remove a member from your current plan or upgrade your plan to
              assign a new member.
            </Text>

            <TouchableOpacity
              style={[styles.premiumModalPlanCta, { backgroundColor: colors.Orangeaccentcolor }]}
              onPress={() => setShowNoAvailablePlanModal(false)}
            >
              <Text
                style={[
                  styles.premiumModalPlanCtaText,
                  // { color: '#1A2744' },
                ]}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FamilyUpgradeModal
        visible={showFamilyUpgradeModal}
        onClose={handleCloseFamilyUpgradeModal}
        member={selectedMemberForSubscription}
        membersData={localMembersData.length > 0 ? localMembersData : membersData}
        user={user}
        creatingSubscription={creatingSubscription}
        onCreatingChange={setCreatingSubscription}
        onSuccess={async () => {
          if (refreshProfileData) await refreshProfileData();
          fetchUserPlanDetails();
        }}
        onIosFamilyPurchase={async billingMember => {
          if (!billingMember) return;
          setSelectedMemberForSubscription(billingMember);
          await handleBuyPremiumAccess('family');
        }}
      />

      {/* Premium Plan Modal - Individual & Family Plans */}
      <Modal
        visible={showPremiumModal}
        transparent
        animationType="fade"
        onRequestClose={handleClosePremiumModal}
      >
        <View style={styles.premiumModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClosePremiumModal}
          />
          <View
            style={[
              styles.premiumModalContainer,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.premiumModalCloseButton}
              onPress={handleClosePremiumModal}
            >
              <Text
                style={[
                  styles.premiumModalCloseText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                ✕
              </Text>
            </TouchableOpacity>

            {/* Modal Title */}
            <Text
              style={[
                styles.premiumModalTitle,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.DarkNavy,
                },
              ]}
            >
              Choose Your Plan
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.premiumModalCardsRow}
              style={styles.premiumModalCardsScroll}
            >
              {/* Free Plan */}
              <View
                style={[
                  styles.premiumModalPlanCard,
                  styles.premiumModalPlanCardFree,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.cardBackground : '#F3F4F8',
                    borderColor:
                      theme === 'dark' ? colors.themeBorderDropdown : '#E5E7EB',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.premiumModalPlanCardTitle,
                    {
                      color: theme === 'dark' ? colors.white : '#111827',
                    },
                  ]}
                >
                  FREE
                </Text>
                {renderPremiumPrice(freePrice, freePlanFromApi?.priceMode, '#2563EB')}
                <View style={styles.premiumAlwaysFreePill}>
                  <Text style={styles.premiumAlwaysFreePillText}>Always Free</Text>
                </View>
                <Text
                  style={[
                    styles.premiumFreeDescription,
                    {
                      color: theme === 'dark' ? colors.textSecondary : '#6B7280',
                    },
                  ]}
                >
                  Get your core astrology insights at no cost.
                </Text>

                <Text style={styles.premiumSectionHeaderPurple}>YOU GET (ALL FREE)</Text>
                {renderPremiumFeatureList(PREMIUM_FREE_FEATURES, 'blue')}

                <View style={styles.premiumFreeHighlightBox}>
                  <Text style={styles.premiumFreeHighlightIcon}>🎁</Text>
                  <View style={styles.premiumFreeHighlightTextWrap}>
                    <Text style={styles.premiumFreeHighlightTitle}>
                      100% FREE FOR ALL USERS
                    </Text>
                    <Text style={styles.premiumFreeHighlightSub}>
                      No payment required.{'\n'}No credit card needed.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.premiumModalPlanCta,
                    styles.premiumCtaCurrentPlan,
                    styles.premiumCtaDisabled,
                  ]}
                  disabled
                  activeOpacity={1}
                >
                  <Text style={styles.premiumCtaCurrentPlanText}>Current Plan</Text>
                </TouchableOpacity>
              </View>

              {/* Individual Plan */}
              <View style={styles.premiumIndividualOuter}>
                <View style={styles.premiumMostPopularBadge}>
                  <Text style={styles.premiumMostPopularBadgeText}>★ MOST POPULAR</Text>
                </View>
                <View style={[styles.premiumModalPlanCard, styles.premiumModalPlanCardIndividual]}>
                  <Text style={[styles.premiumModalPlanCardTitle, styles.premiumTextWhite]}>
                    INDIVIDUAL PLAN
                  </Text>
                  {renderPremiumPrice(individualPrice, individualPlanFromApi?.priceMode)}

                  <View style={styles.premiumAutoUpdateBox}>
                    <Text style={styles.premiumAutoUpdateIcon}>↻</Text>
                    <Text style={styles.premiumAutoUpdateText}>
                      Updates automatically as Mahadasha, Antardasha & Transits change.
                    </Text>
                  </View>

                  <Text style={styles.premiumSectionHeaderGreen}>MONTHLY DYNAMIC UPDATES</Text>
                  {renderPremiumFeatureList(PREMIUM_INDIVIDUAL_MONTHLY_UPDATES, 'green')}

                  <Text style={styles.premiumSectionHeaderOrange}>★ BONUS: FULL HOUSE ANALYSIS</Text>
                  <Text style={styles.premiumSectionSubtext}>For all 12 houses, receive:</Text>
                  {renderPremiumFeatureList(PREMIUM_INDIVIDUAL_HOUSE_BONUS, 'orange')}

                  <Text style={styles.premiumSectionHeaderLight}>ALSO INCLUDES</Text>
                  {renderPremiumFeatureList(PREMIUM_INDIVIDUAL_ALSO_INCLUDES, 'green')}

                  <View style={styles.premiumIndividualHighlightBox}>
                    <Text style={styles.premiumIndividualHighlightIcon}>📅</Text>
                    <Text style={styles.premiumIndividualHighlightText}>
                      Always updated. Always relevant.{'\n'}No manual refresh needed.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.premiumModalPlanCta,
                      styles.premiumModalCtaOrange,
                      (creatingSubscription || userPlanDetails?.current_plan === 'eternal_path') && {
                        opacity: 0.5,
                      },
                    ]}
                    onPress={() => setShowIndividualSubscribeConfirm(true)}
                    disabled={creatingSubscription || userPlanDetails?.current_plan === 'eternal_path'}
                  >
                    {creatingSubscription ? (
                      <ActivityIndicator color="#0F1A2E" size="small" />
                    ) : (
                      <Text style={[styles.premiumModalPlanCtaText, { color: '#0F1A2E' }]}>
                        Start Individual →
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Family Plan */}
              <View style={[styles.premiumModalPlanCard, styles.premiumModalPlanCardFamily]}>
                <Text style={[styles.premiumModalPlanCardTitle, styles.premiumTextWhite]}>
                  FAMILY PLAN
                </Text>
                {renderPremiumPrice(familyPrice, familyPlanFromApi?.priceMode)}

                <View style={styles.premiumFamilySubtitleBox}>
                  <Text style={styles.premiumFamilySubtitleText}>
                    Everything in Individual Plan for up to 5 members
                  </Text>
                </View>

                <View style={styles.premiumFamilyIconWrap}>
                  <Image
                    source={require('../../assets/icons/subscription.png')}
                    style={styles.premiumFamilyIcon}
                    resizeMode="contain"
                  />
                </View>

                {renderPremiumFeatureList(PREMIUM_FAMILY_FEATURES, 'green')}

                <View style={styles.premiumFamilyMembersBox}>
                  <Text style={styles.premiumFamilyMembersIcon}>👥</Text>
                  <View style={styles.premiumFamilyMembersTextWrap}>
                    <Text style={styles.premiumFamilyMembersTitle}>UP TO 5 MEMBERS</Text>
                    <Text style={styles.premiumFamilyMembersSub}>
                      Manage up to 5 profiles in one plan.
                    </Text>
                  </View>
                </View>

                <Text style={[styles.premiumSectionHeaderLight, styles.premiumUpdateTriggeredHeader]}>
                  Update Triggered By
                </Text>
                <View style={styles.premiumUpdateTriggersRow}>
                  {PREMIUM_FAMILY_UPDATE_TRIGGERS.map((item, i) => (
                    <View key={i} style={styles.premiumUpdateTriggerCol}>
                      <Text style={styles.premiumUpdateTriggerIcon}>{item.icon}</Text>
                      <Text style={styles.premiumUpdateTriggerLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.premiumModalPlanCta, styles.premiumModalCtaPurple]}
                  onPress={async () => {
                    if (userPlanDetails?.current_plan === 'eternal_path') {
                      if (Platform.OS === 'android') {
                        await handleUpdatePlan(selectedMemberForSubscription);
                        return;
                      }
                      await handleBuyPremiumAccess('family');
                      return;
                    }
                    await handleBuyPremiumAccess('family');
                  }}
                  disabled={creatingSubscription}
                >
                  {creatingSubscription ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={[styles.premiumModalPlanCtaText, { color: '#FFFFFF' }]}>
                      Upgrade to Family →
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Individual plan: 12-month / auto-renew info + Yes/No (replaces Alert) */}
      <Modal
        visible={showIndividualSubscribeConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIndividualSubscribeConfirm(false)}
      >
        <View style={styles.upgradeModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowIndividualSubscribeConfirm(false)}
          />
          <View
            style={[
              styles.upgradeModalContainer,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <Text
              style={[
                styles.upgradeModalTitle,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.DarkNavy,
                },
              ]}
            >
              Info
            </Text>
            <Text
              style={[
                styles.upgradeModalMessage,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.DarkNavy,
                },
              ]}
            >
              Your subscription is valid for the next 12 months and will be
              auto-renewed unless cancelled.
            </Text>
            <View style={styles.upgradeModalButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.upgradeModalButton,
                  styles.upgradeModalCancelButton,
                  {
                    borderColor:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
                onPress={() => setShowIndividualSubscribeConfirm(false)}
              >
                <Text
                  style={[
                    styles.upgradeModalButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.upgradeModalButton,
                  styles.upgradeModalBuyButton,
                  { backgroundColor: colors.Orangeaccentcolor },
                ]}
                onPress={() => {
                  setShowIndividualSubscribeConfirm(false);
                  handleBuyPremiumAccess('individual');
                }}
              >
                <Text
                  style={[styles.upgradeModalButtonText, { color: '#FFFFFF' }]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Family Plan Modal - when user has family_plan */}
      <Modal
        visible={showAssignModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseAssignModal}
      >
        <View style={styles.upgradeModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleCloseAssignModal}
          />
          <View
            style={[
              styles.upgradeModalContainer,
              {
                backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <Text
              style={[
                styles.upgradeModalTitle,
                { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
              ]}
            >
              Are You Sure?
            </Text>
            <Text
              style={[
                styles.upgradeModalMessage,
                { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
              ]}
            >
              Are you sure you want to allocate this profile under the Family plan?
            </Text>
            <View style={styles.upgradeModalButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.upgradeModalButton,
                  styles.upgradeModalCancelButton,
                  { borderColor: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
                ]}
                onPress={handleCloseAssignModal}
              >
                <Text
                  style={[
                    styles.upgradeModalButtonText,
                    { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.upgradeModalButton,
                  styles.upgradeModalBuyButton,
                  { backgroundColor: colors.Orangeaccentcolor, opacity: isAssigning ? 0.6 : 1 },
                ]}
                onPress={handleAssignFamilyPlan}
                disabled={isAssigning}
              >
                {isAssigning ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.upgradeModalButtonText, { color: '#FFFFFF' }]}>
                    Assign
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm De-allocation Modal */}
      <Modal
        visible={showDeallocateModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDeallocateModal}
      >
        <View style={styles.upgradeModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleCloseDeallocateModal}
          />
          <View
            style={[
              styles.deallocateModalContainer,
              {
                backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <Text
              style={[
                styles.deallocateModalTitle,
                { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
              ]}
            >
              Confirm De-allocation
            </Text>
            <Text
              style={[
                styles.deallocateModalMessage,
                { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
              ]}
            >
              Under the Family Plan, only one deletion is allowed within a 12-months. This action cannot be undone once completed.
            </Text>
            <Text
              style={[
                styles.deallocateModalMessage,
                { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
              ]}
            >
              Are you sure you want to delete this profile from the Family Plan?
            </Text>
            <View style={styles.deallocateModalButtons}>
              <TouchableOpacity
                style={[styles.deallocateBtn, styles.deallocateYesBtn, { opacity: isDeallocating ? 0.6 : 1 }]}
                onPress={handleConfirmDeallocate}
                disabled={isDeallocating}
              >
                {isDeallocating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.deallocateYesText}>Yes</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deallocateBtn,
                  styles.deallocateNoBtn,
                  { borderColor: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
                ]}
                onPress={handleCloseDeallocateModal}
                disabled={isDeallocating}
              >
                <Text
                  style={[
                    styles.deallocateNoText,
                    { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Delete Member Modal */}
      <Modal
        visible={showDeleteMemberModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDeleteMemberModal}
      >
        <View style={styles.upgradeModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleCloseDeleteMemberModal}
          />
          <View
            style={[
              styles.deallocateModalContainer,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <Text
              style={[
                styles.deallocateModalTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Delete Member
            </Text>
            <Text
              style={[
                styles.deallocateModalMessage,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Once deleted you will not receive any regular updates for this
              member
            </Text>
            <View style={styles.deallocateModalButtons}>
              <TouchableOpacity
                style={[
                  styles.deallocateBtn,
                  styles.deallocateYesBtn,
                  { opacity: isDeletingMember ? 0.6 : 1 },
                ]}
                onPress={handleConfirmDeleteMember}
                disabled={isDeletingMember}
              >
                {isDeletingMember ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.deallocateYesText}>Yes</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deallocateBtn,
                  styles.deallocateNoBtn,
                  {
                    borderColor:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
                onPress={handleCloseDeleteMemberModal}
                disabled={isDeletingMember}
              >
                <Text
                  style={[
                    styles.deallocateNoText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Member Result Modal */}
      <Modal
        visible={deleteMemberResult != null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteMemberResult(null)}
      >
        <TouchableOpacity
          style={styles.upgradeModalOverlay}
          activeOpacity={1}
          onPress={() => setDeleteMemberResult(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={[
              styles.upgradeModalContainer,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <Text
              style={[
                styles.upgradeModalTitle,
                {
                  color:
                    deleteMemberResult?.kind === 'error'
                      ? colors.Orangeaccentcolor
                      : theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                },
              ]}
            >
              {deleteMemberResult?.kind === 'error' ? 'Error' : 'Success'}
            </Text>
            <Text
              style={[
                styles.upgradeModalMessage,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              {deleteMemberResult?.message || ''}
            </Text>
            <View style={styles.upgradeModalButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.upgradeModalButton,
                  styles.upgradeModalBuyButton,
                  { backgroundColor: colors.Orangeaccentcolor },
                ]}
                onPress={() => setDeleteMemberResult(null)}
              >
                <Text style={[styles.upgradeModalButtonText, { color: '#FFFFFF' }]}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Upgrade Plan Modal for Dynamic Predictions */}
      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <TouchableOpacity
          style={styles.upgradeModalOverlay}
          activeOpacity={1}
          onPress={() => setShowUpgradeModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={[
              styles.upgradeModalContainer,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            {/* Title */}
            <Text
              style={[
                styles.upgradeModalTitle,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.DarkNavy,
                },
              ]}
            >
              Upgrade Plan
            </Text>

            {/* Message */}
            <Text
              style={[
                styles.upgradeModalMessage,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.DarkNavy,
                },
              ]}
            >
              To Access Dynamic Predictions, Please Upgrade Your Plan.
            </Text>

            {/* Buttons */}
            <View style={styles.upgradeModalButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.upgradeModalButton,
                  styles.upgradeModalCancelButton,
                  {
                    borderColor:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text
                  style={[
                    styles.upgradeModalButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              {/* <TouchableOpacity
                style={[
                  styles.upgradeModalButton,
                  styles.upgradeModalBuyButton,
                  {
                    backgroundColor: colors.Orangeaccentcolor,
                  },
                ]}
                onPress={async () => {
                  setShowUpgradeModal(false);
                  if (_selectedMemberForUpgrade) {
                    // If this member already has individual (eternal_path), upgrade to family directly
                    if (_selectedMemberForUpgrade.current_plan === 'eternal_path') {
                      setSelectedMemberForSubscription(_selectedMemberForUpgrade);
                      await handleUpdatePlan(_selectedMemberForUpgrade);
                      return;
                    }
                    // Otherwise open normal plan selection / assign flow
                    handleOpenPremiumModal(_selectedMemberForUpgrade);
                  }
                }}
              >
                <Text
                  style={[
                    styles.upgradeModalButtonText,
                    { color: colors.white },
                  ]}
                >
                  Buy
                </Text>
              </TouchableOpacity> */}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollViewContent: {
    // paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 90 : 90,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    // paddingHorizontal: 14,
    paddingBottom: 10,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  headerTitle: {
    // color: '#FFFFFF',
    color: color.themeTextWhite,
    // ...font.topHeder,
    fontSize: 24,
    fontFamily: fontFamily.regular,
    // fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  availablePlansContainer: {
    // paddingHorizontal: 14,
    paddingBottom: responsiveWidth('3'),
    zIndex: 10,
  },
  availablePlansCard: {
    borderRadius: 8,
    paddingHorizontal: responsiveWidth('3'),
    paddingVertical: responsiveWidth('2'),

    marginBottom: responsiveWidth('3'),
    borderWidth: 0.4,
    overflow: 'hidden',
  },
  availablePlansTitle: {
    fontSize: 20,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    marginBottom: responsiveWidth('3'),
  },
  plansCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('4'),
  },
  plansCountText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: responsiveWidth(1),
    // marginTop: responsiveWidth(2),
  },
  actionButton: {
    flex: 1,
    paddingVertical: responsiveWidth(2.5),
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  saveButtonLoader: {
    width: 24,
    height: 24,
  },
  clearButtonStyle: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonTextStyle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  assignPlanButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignPlanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  createChartButton: {
    // flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    // width: '30%',
    paddingHorizontal: responsiveWidth(2),
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  createChartButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  paymentHistoryButton: {
    // flex: 1,
    paddingVertical: 10,
    // paddingHorizontal: 24,
    borderRadius: 5,
    // width: '40%',
    paddingHorizontal: responsiveWidth(2),
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  paymentHistoryButtonText: {
    fontSize: 14,
    color: color.themeTextWhite,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  memberCardV2: {
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#C4A88A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  memberCardV2Dark: {
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: 'visible',
  },
  memberCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsiveWidth(2.5),
  },
  memberCreatedAtBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: responsiveWidth(2),
  },
  memberIconBox: {
    width: responsiveWidth(9),
    height: responsiveWidth(9),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveWidth(2),
  },
  memberIconEmoji: {
    fontSize: 16,
  },
  memberMetaLabel: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    marginBottom: 2,
  },
  memberMetaValue: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    fontWeight: '700',
  },
  memberHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(1.5),
  },
  memberHeaderIconGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveWidth(2),
  },
  memberHeaderActionCol: {
    alignItems: 'center',
    minWidth: responsiveWidth(11),
  },
  memberHeaderActionLabel: {
    fontSize: 10,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    marginTop: 4,
  },
  memberRoundIconBtn: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberHeaderIconImg: {
    width: responsiveWidth(4.5),
    height: responsiveWidth(4.5),
    resizeMode: 'contain',
  },
  memberAssignCheckbox: {
    marginRight: 0,
    marginLeft: 0,
  },
  memberProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveWidth(3),
  },
  memberAvatar: {
    width: responsiveWidth(16),
    height: responsiveWidth(16),
    borderRadius: responsiveWidth(8),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveWidth(3),
  },
  memberAvatarText: {
    fontSize: 26,
    fontFamily: fontFamily.semiBold,
    fontWeight: '700',
  },
  memberNameBlock: {
    flex: 1,
  },
  memberNameTitle: {
    fontSize: 20,
    fontFamily: fontFamily.semiBold,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  memberNameAccent: {
    width: responsiveWidth(10),
    height: 4,
    borderRadius: 2,
    marginTop: responsiveWidth(1),
  },
  memberIncludeFamilyRow: {
    marginBottom: responsiveWidth(2.5),
    borderRadius: 12,
  },
  memberInfoCardsRow: {
    flexDirection: 'row',
    gap: responsiveWidth(2),
    marginBottom: responsiveWidth(2.5),
  },
  memberInfoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: responsiveWidth(2.5),
    borderRadius: 14,
    borderWidth: 1,
  },
  memberInfoCardText: {
    flex: 1,
  },
  memberInfoLabel: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    marginBottom: 4,
  },
  memberInfoValue: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    lineHeight: 17,
  },
  memberInfoTime: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    marginTop: 2,
  },
  memberInsightsActionCard: {
    marginBottom: responsiveWidth(2.5),
  },
  memberBottomActionsRow: {
    flexDirection: 'row',
    gap: responsiveWidth(2),
  },
  memberBottomActionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveWidth(2.5),
    borderRadius: 14,
    borderWidth: 1,
    minHeight: responsiveWidth(18),
  },
  memberBottomActionCardFull: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  memberBottomActionIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
  },
  memberBottomActionText: {
    flex: 1,
    marginHorizontal: responsiveWidth(1.5),
  },
  memberBottomActionTitle: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    fontWeight: '700',
    marginBottom: 2,
  },
  memberBottomActionSub: {
    fontSize: 9,
    fontFamily: fontFamily.regular,
    lineHeight: 12,
  },
  memberBottomChevron: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: -1,
  },
  memberChevronCircle: {
    width: responsiveWidth(7.5),
    height: responsiveWidth(7.5),
    borderRadius: responsiveWidth(3.75),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMembersCard: {
    borderRadius: 12,
    marginBottom: responsiveWidth('3'),
    borderWidth: 0,
    // // width: '100%',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  newMembersBgImage: {
    borderRadius: 12,
    opacity: 0.2,
  },
  memberCardContent: {
    // width: '100%',
    // flex: 1,
    // padding: responsiveWidth('3'),
    paddingHorizontal: responsiveWidth('3'),
    paddingVertical: responsiveWidth('2'),
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveWidth('1'),
  },
  nameContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  memberNameContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    // justifyContent: "flex-start",
    // alignItems: "flex-start",
    // alignItems: 'center',
    // flex: 1,
  },
  divider: {
    height: 0.3,
    backgroundColor: 'rgba(238, 229, 202, 1)',
    // marginBottom: responsiveWidth('3'),
  },
  detailsGrid: {
    marginTop: responsiveWidth('2'),
  },
  detailsRow: {
    flexDirection: 'row',
    // alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: responsiveWidth('2'),
  },
  detailsItem: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    // flex: 1,
    width: responsiveWidth('40%'),
    marginRight: responsiveWidth('2'),
  },
  detailIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    marginRight: responsiveWidth('1'),
    // marginTop: 2,
  },
  iconContainer: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    alignItems: 'center',
    justifyContent: 'center',
    // marginRight: responsiveWidth('1'),
    // marginTop: 2,
  },
  detailText: {
    color: 'rgba(238, 229, 202, 1)',
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontStyle: 'normal',
    lineHeight: 18,
    letterSpacing: -0.19,
    // flex: 1,
    flexWrap: 'wrap',
    width: responsiveWidth('70%'),
  },
  profileIcon: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    resizeMode: 'contain',
    marginRight: responsiveWidth('2'),
  },
  memberName: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.regular,
    flex: 1,
  },
  memberNameHeader: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.regular,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: responsiveWidth(2),
    marginVertical: responsiveWidth(1),
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    marginRight: responsiveWidth(1),
  },
  infoValue: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    flex: 1,
  },
  predictionLinksContainer: {
    flexDirection: 'row',
    justifyContent: "space-around",
    alignItems: 'center',
    // gap: responsiveWidth(4),
    marginVertical: responsiveWidth(1),
    marginBottom: responsiveWidth(1),
    // marginHorizontal: responsiveWidth(2),
  },
  predictionLink: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    alignSelf: 'center',
    fontWeight: '600',
    // textDecorationLine: 'underline',
  },
  includeFamilyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveWidth(1),
    borderRadius: 5,
    borderWidth: 1,
    marginTop: responsiveWidth(2),
    // marginHorizontal: responsiveWidth(1),
  },
  includeFamilyText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    marginRight: responsiveWidth(2),
  },
  includeFamilySwitch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  checkbox: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveWidth('3'),
    // marginLeft: responsiveWidth('1'),
  },
  checkboxInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    marginRight: responsiveWidth('2'),
  },
  infoText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    flex: 1,
    flexWrap: 'wrap',
  },
  primaryMemberLabel: {
    backgroundColor: 'rgba(223, 138, 93, 1)',
    paddingHorizontal: 8,
    // paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    // marginLeft: 8,
  },
  primaryMemberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',

    // paddingVertical: 4,

    fontFamily: fontFamily.regular,
  },
  nameAndDateContainer: {
    flex: 1,
  },
  createdAtText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    // marginTop: responsiveWidth(0.5),
  },
  rightSectionContainer: {
    alignItems: 'flex-end',
    gap: responsiveWidth(1),
  },
  renewalDateBadge: {
    backgroundColor: '#4CAF50', // Green color
    borderRadius: 8,
    paddingVertical: responsiveWidth(1.5),
    paddingHorizontal: responsiveWidth(3),
    marginBottom: responsiveWidth(1),
  },
  renewalDateText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
  familyPlanBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: responsiveWidth(2),
    paddingHorizontal: responsiveWidth(2.5),
    marginBottom: responsiveWidth(2.5),
  },
  familyPlanTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: responsiveWidth(2),
  },
  familyPlanLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: responsiveWidth(1.5),
  },
  familyPlanShield: {
    fontSize: 16,
  },
  familyPlanLabel: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    fontWeight: '700',
    flexShrink: 1,
  },
  familyPlanRenewalText: {
    marginTop: responsiveWidth(0.8),
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
  familyPlanSwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: responsiveWidth('2'),
  },
  iconButton: {
    padding: responsiveWidth('1'),
    marginLeft: responsiveWidth('2'),
  },
  actionIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    tintColor: 'rgba(238, 229, 202, 1)',
  },
  whatDoYouDoContainer: {
    // marginTop: responsiveWidth('2'),
    paddingHorizontal: responsiveWidth('0.7'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  whatDoYouDoTextContainer: {
    flex: 1,
    // flexDirection: 'row',
    // alignItems: 'center',
    marginLeft: responsiveWidth('1.5'),
    justifyContent: 'flex-start',
  },
  readMoreButton: {
    marginTop: responsiveWidth('1'),
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',

    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    // maxWidth: 500,
    maxHeight: '85%',
    // height: 420,
    // flex:1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalBgImage: {
    borderRadius: 10,
    width: '100%',
    // opacity: 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveWidth(3),
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  closeButtonImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  modalDivider: {
    height: 1,
    marginHorizontal: responsiveWidth(2),
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(3),
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: fontFamily.regular,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '300',
  },
  editModalContent: {
    // flex: 1,
    // height: 420,
    // width: '100%',
    // height: '100%',
    paddingHorizontal: responsiveWidth(4),
  },
  personalDetailsSection: {
    paddingVertical: responsiveWidth(4),
  },
  personalDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveWidth(2),
  },
  personalDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fontFamily.regular,
  },
  personalDetailsDescription: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
    marginBottom: responsiveWidth(3),
    opacity: 0.8,
  },
  personalDetailsInput: {
    minHeight: 360,
    borderRadius: 12,
    padding: responsiveWidth(3),
    borderWidth: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlignVertical: 'top',
  },
  editModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(3),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButton: {
    flex: 1,
    paddingVertical: responsiveWidth(2.5),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginHorizontal: responsiveWidth(1),
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.regular,
  },
  updateButton: {
    // backgroundColor set inline
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.regular,
  },
  setPrimaryButton: {
    // backgroundColor set inline
  },
  setPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.regular,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    paddingVertical: 40,
  },
  lottieAnimation: {
    width: 264,
    height: 264,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    paddingVertical: 40,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    paddingVertical: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 50,
    right: 30,
    width: 50,
    height: 50,
    borderRadius: 28,
    backgroundColor: 'rgba(223, 138, 93, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    width: responsiveWidth(7.5),
    height: responsiveWidth(7.5),
    resizeMode: 'contain',
    // tintColor: '#FFFFFF',
  },
  toggleRow: {
    marginTop: responsiveWidth('3'),
    paddingHorizontal: responsiveWidth('1'),
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    color: 'rgba(238, 229, 202, 1)',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  switchLoading: {
    opacity: 0.6,
  },
  // Premium Modal Styles
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    // padding: responsiveWidth(5),
  },
  premiumModalContainer: {
    width: '90%',
    maxWidth: responsiveWidth(90),
    borderRadius: 20,
    padding: responsiveWidth(5),
    maxHeight: '85%',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  premiumModalCloseButton: {
    position: 'absolute',
    top: responsiveWidth(2),
    right: responsiveWidth(2),
    width: responsiveWidth(7),
    height: responsiveWidth(7),
    borderRadius: responsiveWidth(4),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  premiumModalCloseText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  premiumModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveWidth(2),
    marginBottom: responsiveWidth(3),
  },
  premiumModalCrownIcon: {
    fontSize: 24,
    marginRight: responsiveWidth(2),
  },
  premiumModalTitle: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    marginBottom: 12,
  },
  premiumModalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: responsiveWidth(3),
  },
  premiumModalPrice: {
    fontSize: 36,
    fontFamily: fontFamily.bold,
    marginRight: responsiveWidth(1),
  },
  premiumModalPriceUnit: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  premiumModalDescription: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    marginBottom: responsiveWidth(4),
  },
  premiumModalBoldText: {
    fontWeight: 'bold',
    fontFamily: fontFamily.semiBold,
  },
  premiumModalFeaturesContainer: {
    marginBottom: responsiveWidth(4),
  },
  premiumModalFeatureItem: {
    flexDirection: 'row',
    marginBottom: responsiveWidth(3),
    alignItems: 'flex-start',
  },
  premiumModalCheckIcon: {
    fontSize: 20,
    color: '#DF8A5D',
    marginRight: responsiveWidth(2),
    marginTop: responsiveWidth(0.5),
    fontWeight: 'bold',
  },
  premiumModalFeatureTextContainer: {
    flex: 1,
  },
  premiumModalFeatureTitle: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    marginBottom: responsiveWidth(1),
  },
  premiumModalFeatureDescription: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
    opacity: 0.9,
  },
  premiumModalBuyButton: {
    // flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveWidth(3.5),
    borderRadius: 12,
    // marginTop: responsiveWidth(2),
  },
  premiumModalBuyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    // marginRight: responsiveWidth(2),
  },
  premiumModalBuyButtonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  premiumModalCardsRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 16,
  },
  premiumModalCardsScroll: {
    width: '100%',
    alignSelf: 'stretch',
    maxHeight: Dimensions.get('window').height *1,
  },
  premiumModalPlanCard: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: 16,
    padding: 16,
    paddingRight: 18,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  premiumModalPlanCardFree: {
    marginBottom: 4,
  },
  premiumModalPlanCardIndividual: {
    backgroundColor: '#0F1A2E',
    borderColor: '#F2994A',
    borderWidth: 2,
    marginTop: 14,
  },
  premiumModalPlanCardFamily: {
    backgroundColor: '#0F1A2E',
    borderColor: '#7C3AED',
    borderWidth: 1.5,
  },
  premiumIndividualOuter: {
    position: 'relative',
    marginTop: 4,
  },
  premiumMostPopularBadge: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 2,
    backgroundColor: '#F2994A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    elevation: 4,
  },
  premiumMostPopularBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#0F1A2E',
    letterSpacing: 0.3,
  },
  premiumTextWhite: {
    color: '#FFFFFF',
  },
  premiumPriceLoader: {
    marginVertical: 8,
    alignSelf: 'center',
  },
  premiumPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 4,
  },
  premiumPriceAmount: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
  },
  premiumPriceUnit: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    opacity: 0.9,
  },
  premiumAlwaysFreePill: {
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 8,
  },
  premiumAlwaysFreePillText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: '#2563EB',
  },
  premiumFreeDescription: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 17,
  },
  premiumSectionHeaderPurple: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  premiumFreeHighlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 111, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 111, 212, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 12,
    gap: 8,
  },
  premiumFreeHighlightIcon: {
    fontSize: 20,
  },
  premiumFreeHighlightTextWrap: {
    flex: 1,
  },
  premiumFreeHighlightTitle: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#2563EB',
    marginBottom: 3,
  },
  premiumFreeHighlightSub: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: '#4B5563',
    lineHeight: 14,
  },
  premiumCtaCurrentPlan: {
    backgroundColor: '#A5B4FC',
  },
  premiumCtaCurrentPlanText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  premiumCtaDisabled: {
    opacity: 0.55,
  },
  premiumAutoUpdateBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 4,
    gap: 8,
  },
  premiumAutoUpdateIcon: {
    fontSize: 16,
    color: '#A78BFA',
  },
  premiumAutoUpdateText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
  },
  premiumSectionHeaderGreen: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#22C55E',
    letterSpacing: 0.3,
    marginTop: 12,
    marginBottom: 8,
  },
  premiumSectionHeaderOrange: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#F2994A',
    letterSpacing: 0.3,
    marginTop: 12,
    marginBottom: 4,
  },
  premiumSectionHeaderLight: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.3,
    marginTop: 12,
    marginBottom: 8,
  },
  premiumSectionSubtext: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
  },
  premiumCircleCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
    flexShrink: 0,
  },
  premiumCircleCheckMark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fontFamily.bold,
    lineHeight: 12,
  },
  premiumModalFeatureTextLight: {
    flex: 1,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 17,
  },
  premiumModalFeatureTextDark: {
    flex: 1,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#1F2937',
    lineHeight: 17,
  },
  premiumIndividualHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F2994A',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 12,
    gap: 8,
    backgroundColor: 'rgba(242, 153, 74, 0.08)',
  },
  premiumIndividualHighlightIcon: {
    fontSize: 18,
  },
  premiumIndividualHighlightText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: '#F2994A',
    lineHeight: 16,
  },
  premiumModalCtaOrange: {
    backgroundColor: '#F2994A',
  },
  premiumFamilySubtitleBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  premiumFamilySubtitleText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 16,
  },
  premiumFamilyIconWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumFamilyIcon: {
    width: 48,
    height: 48,
    tintColor: '#A78BFA',
  },
  premiumFamilyMembersBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 6,
    gap: 8,
  },
  premiumFamilyMembersIcon: {
    fontSize: 20,
  },
  premiumFamilyMembersTextWrap: {
    flex: 1,
  },
  premiumFamilyMembersTitle: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#A78BFA',
    marginBottom: 3,
  },
  premiumFamilyMembersSub: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 14,
  },
  premiumUpdateTriggeredHeader: {
    textAlign: 'center',
    marginTop: 12,
  },
  premiumUpdateTriggersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 6,
  },
  premiumUpdateTriggerCol: {
    flex: 1,
    alignItems: 'center',
  },
  premiumUpdateTriggerIcon: {
    fontSize: 18,
    color: '#A78BFA',
    marginBottom: 4,
  },
  premiumUpdateTriggerLabel: {
    fontSize: 9,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 13,
  },
  premiumModalPlanBanner: {
    alignSelf: 'center',
    backgroundColor: '#E8B923',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 10,
  },
  premiumModalPlanBannerText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#1A2744',
    letterSpacing: 0.5,
  },
  premiumModalPlanCardTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    marginBottom: 6,
    textAlign: 'center',
  },
  premiumModalPlanCardSubtitle: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    marginBottom: 6,
  },
  premiumModalPriceBox: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'center',
  },
  premiumModalPlanPrice: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
  },
  premiumModalPlanPriceUnit: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
  },
  premiumModalPlanCta: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumModalCtaGold: {
    backgroundColor: '#E8B923',
  },
  premiumModalCtaPurple: {
    backgroundColor: '#7C3AED',
  },
  premiumModalPlanCtaText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
  },
  premiumModalFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  premiumModalFeatureTextWrapper: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  premiumModalPlanCheckIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    marginTop: 2,
  },
  premiumModalPlanFeatureText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
    flexShrink: 1,
  },
  premiumModalPlanFeatureSub: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    lineHeight: 16,
    marginTop: 4,
    marginLeft: 0,
    flexShrink: 1,
  },
  premiumModalPlanFooterCapsule: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  premiumModalPlanFooterText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    lineHeight: 16,
    flexShrink: 1,
  },
  // Upgrade Modal Styles
  upgradeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeModalContainer: {
    width: responsiveWidth(85),
    borderRadius: 16,
    padding: responsiveWidth(6),
    alignItems: 'center',
  },
  upgradeModalTitle: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    fontWeight: '700' as const,
    marginBottom: responsiveWidth(4),
    textAlign: 'center',
  },
  upgradeModalMessage: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    marginBottom: responsiveWidth(6),
    textAlign: 'center',
    lineHeight: 24,
  },
  upgradeModalButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: responsiveWidth(3),
  },
  upgradeModalButton: {
    flex: 1,
    paddingVertical: responsiveWidth(3.5),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeModalCancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  upgradeModalBuyButton: {
    // backgroundColor will be set inline
  },
  upgradeModalButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    fontWeight: '700' as const,
  },
  // De-allocation Modal Styles
  deallocateModalContainer: {
    width: responsiveWidth(88),
    borderRadius: 18,
    padding: responsiveWidth(6),
    alignItems: 'center',
  },
  deallocateModalTitle: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    fontWeight: '700' as const,
    marginBottom: responsiveWidth(3),
    textAlign: 'center',
  },
  deallocateModalMessage: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: responsiveWidth(3),
  },
  deallocateModalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: responsiveWidth(3),
    marginTop: responsiveWidth(2),
  },
  deallocateBtn: {
    flex: 1,
    paddingVertical: responsiveWidth(3.5),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deallocateYesBtn: {
    backgroundColor: color.Orangeaccentcolor || '#1A4EAA',
  },
  deallocateNoBtn: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  deallocateYesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.bold,
    fontWeight: '700' as const,
  },
  deallocateNoText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    fontWeight: '700' as const,
  },
});

export default MemberPlanManagement;
