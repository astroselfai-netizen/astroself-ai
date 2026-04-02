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

const INDIVIDUAL_FEATURES = [
  { title: 'Everything in Free', icon: 'star' },
  {
    title: 'Dynamic Life Intelligence',
    sub: ['Real-time transit predictions', 'Life phase intelligence (Antardasha)', 'Active planet influence tracking'],
  },
  {
    title: 'AI Insight Engine',
    sub: ['Detailed chart interpretation', 'Nakshatra-based predictions', 'Guidance & analysis'],
  },
  {
    title: 'Dynamic Task Module',
    sub: ['Personalized growth tasks', 'Habit development & tracking', 'Adaptive self-improvement'],
  },
];

const FAMILY_FEATURES = [
  { title: 'Everything in Individual', icon: 'star' },
  {
    title: 'Family Intelligence Layer',
    sub: ['Up to 5 family profiles', 'Individual insights for each member', 'Growth tasks for each member'],
  },
  { title: 'Centralized family dashboard', sub: ['Track all profile progress'] },
  { title: 'Add/change members anytime', icon: 'user-plus' },
  { title: 'Up to 60% savings versus individual plans', icon: 'percent' },
];

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: { screen: string; params?: { userId?: string } };
  ContinueWithOtp: undefined;
  ChatScreen: undefined;
  NakshatraScreen: { userId: string };
  MemberPlanManagement: { planType?: PlanType };
  AddNewMember: { fromMemberPlanManagement?: boolean } | undefined;
  PurchasedHistoryScreen: undefined;
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
  }) => {
    // console.log('itemitemitemitem', item);

    const { theme, colors } = useTheme();
    // console.log('MemberItem rendering for:', item);

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

    // Combined date and time format
    const combinedBirthDateTime = `${birthDate} ${birthTime}`;

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

    return (
      <View
        style={[
          styles.newMembersCard,
          {
            backgroundColor:
              theme === 'dark' ? colors.transparentBg : colors.white,
            borderColor:
              theme === 'dark' ? colors.themeTextWhite : colors.borderColor,
          },
        ]}
      >
        <View
          style={[
            styles.memberCardContent,
            {
              backgroundColor:
                theme === 'dark' ? colors.transparentBg : colors.white,
            },
          ]}
        >
          {/* Header - Name and Icons */}
          <View style={styles.cardTopRow}>
            <View style={styles.nameAndDateContainer}>
              {item.created_at && (
                <Text
                  style={[
                    styles.createdAtText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.textSecondary || '#999'
                          : colors.textSecondary || '#666',
                    },
                  ]}
                >
                  Created At: {formatRenewalDate(item.created_at).split(' ')[0]}
                </Text>
              )}
              <View style={styles.memberNameContainer}>
                <Text
                  style={[
                    styles.memberNameHeader,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  {memberName}
                </Text>
                {/* Created At - Top Left */}

                <View style={styles.actionIcons}>
                  {/* Action Icons - Hide when in assign plan mode */}
                  {!isAssignPlanMode && (
                    <>
                      {/* Edit icon */}
                      <TouchableOpacity
                        onPress={onEdit}
                        style={styles.iconButton}
                      >
                        <Image
                          source={require('../../assets/icons/edit-painel.png')}
                          style={[
                            styles.actionIcon,
                            {
                              tintColor:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                            {
                              width: responsiveWidth(5),
                              height: responsiveWidth(5),
                            },
                          ]}
                        />
                      </TouchableOpacity>
                      {/* Chart icon */}
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('NakshatraScreen', {
                            screen: 'NakshatraScreen',
                            params: { userId: item.id || item._id },
                          })
                        }
                        style={styles.iconButton}
                      >
                        <Image
                          source={require('../../assets/icons/ZodiacWheel.png')}
                          style={[
                            styles.actionIcon,
                            {
                              tintColor:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                            {
                              width: responsiveWidth(5),
                              height: responsiveWidth(5),
                            },
                          ]}
                        />
                      </TouchableOpacity>
                      {/* Subscription icon */}
                      {/* <TouchableOpacity
                        onPress={onSubscriptionClick || (() => {})}
                        style={styles.iconButton}
                      >
                        <Image
                          source={require('../../assets/icons/Ic-ball.png')}
                          style={[
                            styles.actionIcon,
                            {
                              tintColor:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                            {
                              width: responsiveWidth(5),
                              height: responsiveWidth(5),
                            },
                          ]}
                        />
                      </TouchableOpacity> */}
                    </>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.rightSectionContainer}>
              {/* Renewal Date Badge - Top Right */}
              {item.end_plan_time && (
                <View style={styles.renewalDateBadge}>
                  <Text style={styles.renewalDateText}>RENEWAL DUE ON:</Text>
                  <Text style={styles.renewalDateText}>
                    {formatRenewalDate(item.end_plan_time)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Checkbox - Only show in assign plan mode */}
          {isAssignPlanMode && (
            <TouchableOpacity
              onPress={onSelect}
              disabled={isAssigned || !canSelect}
              style={[
                styles.checkbox,
                {
                  borderColor: isAssigned
                    ? colors.grayText || '#999'
                    : colors.Orangeaccentcolor,
                  backgroundColor: isSelected
                    ? colors.Orangeaccentcolor
                    : isAssigned
                      ? colors.grayText || '#999'
                      : theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.white,
                  opacity: isAssigned || !canSelect ? 0.5 : 1,
                  marginLeft: responsiveWidth('2'),
                },
              ]}
            >
              {(isSelected || isAssigned) && (
                <View style={styles.checkboxInner}>
                  <Text style={styles.checkboxCheckmark}>
                    {isAssigned ? '✓' : '✓'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View
            style={[
              styles.divider,
              {
                backgroundColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
          />

          {/* Date of Birth */}
          <View style={styles.infoRow}>
            <Text
              style={[
                styles.infoLabel,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Date Of Birth :
            </Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              {combinedBirthDateTime}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <Text
              style={[
                styles.infoLabel,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Location :
            </Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              {location}
            </Text>
          </View>

          {/* Prediction Links */}
          <View style={styles.predictionLinksContainer}>
            <TouchableOpacity
              onPress={() => {
                // Navigate to Static Predictions
                navigation.navigate('ChatTab', {
                  screen: 'ChatScreen',
                  params: { userId: item.id || item._id, tab: 'Static Predictions' },
                });
              }}
            >
              <Text
                style={[
                  styles.predictionLink,
                  {
                    color: colors.Orangeaccentcolor,
                  },
                ]}
              >
                Birth Chart Prediction
              </Text>
            </TouchableOpacity>
            {/* Dynamic Predictions - show for all, but check plan on click */}
            <TouchableOpacity
              onPress={() => {
                // Check if user has paid plan
                if (item.current_plan === 'eternal_path') {
                  // Navigate to Dynamic Predictions
                  navigation.navigate('ChatTab', {
                    screen: 'ChatScreen',
                    params: { userId: item.id || item._id, tab: 'Dynamic Predictions' },
                  });
                } else {
                  // Show upgrade modal
                  if (onUpgradeClick) {
                    onUpgradeClick();
                  }
                }
              }}
            >
              <Text
                style={[
                  styles.predictionLink,
                  {
                    color: colors.Orangeaccentcolor,
                  },
                ]}
              >
                Dynamic Predictions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View
            style={[
              styles.divider,
              {
                backgroundColor:
                  theme === 'dark'
                    ? colors.themeBorderDropdown
                    : colors.borderColor,
              },
            ]}
          />

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  borderColor:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
              onPress={() =>
                navigation.navigate('ReportScreen', {
                  userId: item.id || item._id,
                })
              }
            >
              <Text
                style={[
                  styles.actionButtonText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Buy Reports
              </Text>
            </TouchableOpacity>
            {item.current_plan !== 'family_plan' &&
              (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      borderColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                    isSubscriptionLoading && { opacity: 0.6 },
                  ]}
                  onPress={onSubscriptionClick || (() => { })}
                  disabled={isSubscriptionLoading}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    {isSubscriptionLoading
                      ? 'Loading...'
                      : item.current_plan === 'eternal_path'
                        ? 'Update Plan'
                        : item.current_plan === 'cosmic_foundation'
                          ? 'Buy Plan'
                          : item.current_plan === 'renew'
                            ? 'Renew Plan'
                            : 'Buy Plan'}
                  </Text>
                </TouchableOpacity>
              )}
          </View>
        </View>
      </View>
    );
  },
);

const MemberPlanManagement = () => {
  const navigation = useNavigation<MemberPlanManagementNavigationProp>();
  const route = useRoute<MemberPlanManagementRouteProp>();
  const { theme, colors } = useTheme();
  const planTypeFromParams = route.params?.planType ?? 'individual';
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
  const [selectedMemberForSubscription, setSelectedMemberForSubscription] =
    useState<any>(null);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedMemberForUpgrade, setSelectedMemberForUpgrade] = useState<any>(null);
  const [userPlanDetails, setUserPlanDetails] = useState<{
    current_plan: string;
    members_allow: number;
    available_members_allow: number;
    email: string;
  } | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isFetchingPlan, setIsFetchingPlan] = useState(false);
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

  // Handle Update Plan (upgrade/initiate -> Razorpay -> upgrade/confirm)
  const handleUpdatePlan = async (member: any) => {
    if (Platform.OS !== 'android') {
      // iOS must not use Razorpay; upgrade happens via iOS subscription purchase
      await handleBuyPremiumAccess('family');
      return;
    }

    const uid = user?._id || (user as any)?.id || '';
    const memberUserId = member?.id || member?._id || '';
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
        name: 'Astroself',
        description: 'Upgrade to Family Plan',
        prefill: {
          email:
            currentUserData.email || (user as any)?.email || 'user@example.com',
          contact:
            currentUserData.phone || (user as any)?.phone || '9999999999',
          name:
            `${currentUserData.first_name || (user as any)?.first_name || ''} ${currentUserData.last_name || (user as any)?.last_name || ''
              }`.trim() || 'User',
        },
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
        String((confirmRes as any)?.success) === 'true';

      if (!ok) throw new Error((confirmRes as any)?.message || 'Upgrade failed');

      Toast.show({
        type: 'success',
        text1: 'Upgrade Successful',
        text2: 'Family plan has been activated',
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
        prefill: {
          email:
            currentUserData.email || (user as any)?.email || 'user@example.com',
          contact:
            currentUserData.phone || (user as any)?.phone || '9999999999',
          name:
            `${currentUserData.first_name || (user as any)?.first_name || ''} ${currentUserData.last_name || (user as any)?.last_name || ''
              }`.trim() || 'User',
        },
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
        {!isAssignPlanMode ? (
          <View style={styles.actionButtonsContainer}>
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
            <TouchableOpacity
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
                Create Chart
              </Text>
            </TouchableOpacity>
          </View>
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
                  placeholder="Example :
I am a 42-year-old married male, living in Mumbai with my family. I run a successful export business that has been steadily growing for the past 12 years. Financially, I am stable, but I am looking to expand into international markets and diversify into new sectors. My relationship with my wife and children is supportive, though I often struggle to balance family time with professional commitments. At this stage, my main priorities are scaling my business, ensuring long-term wealth security, and maintaining good health amidst a busy lifestyle."
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
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.premiumModalCardsRow}
              style={styles.premiumModalCardsScroll}
            >
              {/* Individual Annual Card */}
              <View style={[styles.premiumModalPlanCard, { backgroundColor: '#1A2744' }]}>
                <View style={styles.premiumModalPlanBanner}>
                  <Text style={styles.premiumModalPlanBannerText}>MOST POPULAR</Text>
                </View>
                <Text style={[styles.premiumModalPlanCardTitle, { color: '#FFFFFF' }]}>Individual Annual</Text>
                <View style={[styles.premiumModalPriceBox, { backgroundColor: '#0F1A2E' }]}>
                  <Text style={[styles.premiumModalPlanPrice, { color: '#FFFFFF' }]}>₹999</Text>
                  <Text style={[styles.premiumModalPlanPriceUnit, { color: 'rgba(255,255,255,0.8)' }]}>/ year</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.premiumModalPlanCta,
                    styles.premiumModalCtaGold,
                    (creatingSubscription || userPlanDetails?.current_plan === 'eternal_path') && {
                      opacity: 0.5,
                    },
                  ]}
                  onPress={() => handleBuyPremiumAccess('individual')}
                  disabled={creatingSubscription || userPlanDetails?.current_plan === 'eternal_path'}
                >
                  {creatingSubscription ? (
                    <ActivityIndicator color="#1A2744" size="small" />
                  ) : (
                    <Text style={[styles.premiumModalPlanCtaText, { color: '#1A2744' }]}>
                      Upgrade to Individual Plan
                    </Text>
                  )}
                </TouchableOpacity>
                {INDIVIDUAL_FEATURES.map((f, i) => (
                  <View key={i} style={styles.premiumModalFeatureRow}>
                    <Image
                      source={require('../../assets/icons/checkIcon.png')}
                      style={[styles.premiumModalPlanCheckIcon, { tintColor: '#E8B923' }]}
                    />
                    <View style={styles.premiumModalFeatureTextWrapper}>
                      <Text style={[styles.premiumModalPlanFeatureText, { color: '#FFFFFF' }]}>{f.title}</Text>
                      {f.sub?.map((s, j) => (
                        <Text key={j} style={[styles.premiumModalPlanFeatureSub, { color: 'rgba(255,255,255,0.9)' }]}>
                          • {s}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              {/* Family Annual Card */}
              <View style={[styles.premiumModalPlanCard, { backgroundColor: '#2D1B4E' }]}>
                <View style={styles.premiumModalPlanBanner}>
                  <Text style={styles.premiumModalPlanBannerText}>BEST VALUE</Text>
                </View>
                <Text style={[styles.premiumModalPlanCardTitle, { color: '#FFFFFF' }]}>Family Annual</Text>
                <Text style={[styles.premiumModalPlanCardSubtitle, { color: 'rgba(255,255,255,0.9)' }]}>
                  - For families growing together -
                </Text>
                <View style={[styles.premiumModalPriceBox, { backgroundColor: '#1E1335' }]}>
                  <Text style={[styles.premiumModalPlanPrice, { color: '#FFFFFF' }]}>₹2999</Text>
                  <Text style={[styles.premiumModalPlanPriceUnit, { color: 'rgba(255,255,255,0.8)' }]}>/ year</Text>
                </View>
                <TouchableOpacity
                  style={[styles.premiumModalPlanCta, styles.premiumModalCtaPurple]}
                  onPress={async () => {
                    if (userPlanDetails?.current_plan === 'eternal_path') {
                      // For eternal_path, family selection should go through upgrade flow (Android)
                      if (Platform.OS === 'android') {
                        await handleUpdatePlan(selectedMemberForSubscription);
                        return;
                      }
                      // iOS must not use Razorpay; fallback to iOS subscription purchase
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
                      Start Family Plan
                    </Text>
                  )}
                </TouchableOpacity>
                {FAMILY_FEATURES.map((f, i) => (
                  <View key={i} style={styles.premiumModalFeatureRow}>
                    <Image
                      source={require('../../assets/icons/checkIcon.png')}
                      style={[styles.premiumModalPlanCheckIcon, { tintColor: '#E8B923' }]}
                    />
                    <View style={styles.premiumModalFeatureTextWrapper}>
                      <Text style={[styles.premiumModalPlanFeatureText, { color: '#FFFFFF' }]}>{f.title}</Text>
                      {f.sub?.map((s, j) => (
                        <Text key={j} style={[styles.premiumModalPlanFeatureSub, { color: 'rgba(255,255,255,0.9)' }]}>
                          • {s}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
                <View style={styles.premiumModalPlanFooterCapsule}>
                  <Text style={[styles.premiumModalPlanFooterText, { color: '#2D1B4E' }]}>
                    Best for families who want structured life guidance together
                  </Text>
                </View>
              </View>
            </ScrollView>
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
              Assign Family Plan
            </Text>
            <Text
              style={[
                styles.upgradeModalMessage,
                { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
              ]}
            >
              You already have a Family Plan. You can assign this member.
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
              <TouchableOpacity
                style={[
                  styles.upgradeModalButton,
                  styles.upgradeModalBuyButton,
                  {
                    backgroundColor: colors.Orangeaccentcolor,
                  },
                ]}
                onPress={() => {
                  setShowUpgradeModal(false);
                  // Navigate to upgrade/subscription
                  if (selectedMemberForUpgrade) {
                    handleOpenPremiumModal(selectedMemberForUpgrade);
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
              </TouchableOpacity>
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
    gap: responsiveWidth(2),
    marginTop: responsiveWidth(2),
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
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
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
    borderRadius: 10,
    width: '30%',
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
    borderRadius: 10,
    width: '40%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  paymentHistoryButtonText: {
    fontSize: 14,
    color: color.themeTextWhite,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  newMembersCard: {
    borderRadius: 12,
    overflow: 'hidden',
    // padding: responsiveWidth('3'),
    // padding: responsiveWidth('3'),
    marginBottom: responsiveWidth('3'),
    // marginHorizontal: 0,
    // flex: 1,
    borderWidth: 0.2,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    // gap: responsiveWidth(4),
    marginVertical: responsiveWidth(1),
    marginBottom: responsiveWidth(1),
    marginHorizontal: responsiveWidth(5),
  },
  predictionLink: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
    minHeight: 290,
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
  },
  premiumModalCloseButton: {
    position: 'absolute',
    top: responsiveWidth(3),
    right: responsiveWidth(3),
    width: responsiveWidth(8),
    height: responsiveWidth(8),
    borderRadius: responsiveWidth(4),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  premiumModalCloseText: {
    fontSize: 20,
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
    fontSize: 18,
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
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 12,
    gap: 16,
  },
  premiumModalCardsScroll: {
    // flexGrow: 1,
    // flex:1
    maxHeight: "100%",
  },
  premiumModalPlanCard: {
    width: 260,
    borderRadius: 12,
    padding: 16,
    paddingRight: 18,
    borderWidth: 1,
    borderColor: 'transparent',
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
    alignSelf: 'flex-start',
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
});

export default MemberPlanManagement;
