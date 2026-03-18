// MemberManagement.tsx

import React, { useState, useMemo } from 'react';
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
  Linking,
} from 'react-native';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useProfileData } from '../../hooks/useProfileData';
import { responsiveWidth, fontFamily, color } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getTransactionJwsIOS,
  getActiveSubscriptions,
  getAvailablePurchases,
  hasActiveSubscriptions,
  restorePurchases,
} from 'react-native-iap';
import {   } from 'react-native-iap';

import RNIap from 'react-native-iap';
import type { Purchase, PurchaseError } from 'react-native-iap';
import planService from '../../services/plan/plan.service';
import serviceFactory from '../../services/serviceFactory';
import UserService from '../../services/user/user.service';
import PaymentService from '../../services/payment/payment.service';
import { useDispatch, useSelector } from 'react-redux';
import { setMembersUpdated } from '../../state/slices/appSlice';
import { RootState } from '../../state/store';
import { icons } from '../../assets';

// iOS In-App Subscription product ID for Premium access
const IAP_PREMIUM_SUBSCRIPTION_PRODUCT_ID = 'com.astroself.ai';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: { screen: string; params?: { userId?: string } };
  ContinueWithOtp: undefined;
  ChatScreen: undefined;
  NakshatraScreen: { userId: string };
  MemberPlanManagement: undefined;
  AddNewMember: { fromMemberPlanManagement?: boolean } | undefined;
  PurchasedHistoryScreen: undefined;
};

type MemberPlanManagementNavigationProp = StackNavigationProp<
  RootStackParamList,
  'MemberPlanManagement'
>;

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
  }) => {
    console.log('itemitemitemitem', item);

    const { theme, colors } = useTheme();
    console.log('MemberItem rendering for:', item);

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
      return `${months[birthData.month - 1]} ${birthData.day}, ${
        birthData.year
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
            const timePart = parts[1]; // "13:39"

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
            {/* Dynamic Predictions - show for all, but check plan on click (first_user gets full access) */}
            <TouchableOpacity
              onPress={() => {
                console.log('item.current_plan---->474', item);
                // Check if user has paid plan or is first_user (keep enabled for first_user)
                if (item.current_plan === 'eternal_path' || item.first_user) {
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
            {item.current_plan !== 'eternal_path' && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    borderColor:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
                onPress={onSubscriptionClick || (() => {})}
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
                  {item.current_plan === 'cosmic_foundation'
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
  const { theme, colors } = useTheme();
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

  // iOS: In-App Purchase helper for premium (consumable-style) purchase
  const purchasePremiumSubscriptionViaIAP = async (productId: string): Promise<Purchase> => {
    return new Promise(async (resolve, reject) => {
      let updateSub: any;
      let errorSub: any;

      // Listeners ko saaf karne ke liye helper
      const cleanup = () => {
        if (updateSub) updateSub.remove();
        if (errorSub) errorSub.remove();
      };

      // 1. Success Listener
      updateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
        console.log('Purchase successful:', purchase.productId);

        if (purchase.productId === productId) {
          try {
            // iOS ke liye transaction finish karna mandatory hai
            await finishTransaction({ purchase, isConsumable: false });
            cleanup();
            resolve(purchase);
          } catch (finishErr) {
            console.error('Finish transaction failed', finishErr);
            cleanup();
            reject(finishErr);
          }
        }
      });

      // 2. Error Listener
      errorSub = purchaseErrorListener((error: PurchaseError) => {
        console.log('Purchase Error:', error.message);
        // restorePurchases()
        // finishTransaction()
        cleanup();
        reject(error);
      });

      // 3. Purchase Request Trigger (react-native-iap v14 signature)
      console.log('requestPurchase:--->653', productId);
      try {
        await requestPurchase({
          request: {
            apple: {
              sku: productId,
              andDangerouslyFinishTransactionAutomatically: false,
            },
          },
          type: 'subs',
        });
      } catch (err) {
        cleanup();
        restorePurchases()
        console.error('Request Purchase Error:', err);
        reject(err);
      }
    });
  };
  // Update local state when membersData changes
  React.useEffect(() => {
    if (membersData) {
      setLocalMembersData(membersData);
    }
  }, [membersData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Refresh profile data when screen comes into focus
      refreshProfileData();
      // Reset selection state when coming back to screen
      setSelectedMembers(new Set());
      setIsAssignPlanMode(false);
      // Note: localMembersData will be updated via useEffect when membersData changes
    }, [refreshProfileData]),
  );

  // Use all members (no filtering needed)
  const filteredMembers = useMemo(() => {
    return localMembersData || [];
  }, [localMembersData]);

  console.log('filteredMembersprofileData------', profileData);

  // Calculate member and children counts
  const memberCount = profileData?.members_allow
    ? profileData?.members_allow - profileData?.current_members
    : 0;
  const childrenCount = profileData?.child_allow
    ? profileData?.child_allow - profileData?.current_child
    : 0;
  const totalAvailablePlans = memberCount + childrenCount;

  // Check if buttons should be enabled
  // Assign Plan: Only enabled if memberCount > 0
  const isAssignPlanEnabled = memberCount > 0;
  // Create Chart: Enabled if any plans available (memberCount or childrenCount)
  const isCreateChartEnabled = totalAvailablePlans > 0;

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

  // Handle Assign Plan button
  const handleAssignPlan = () => {
    setIsAssignPlanMode(true);
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

  // Handle opening premium modal
  const handleOpenPremiumModal = (member: any) => {
    setSelectedMemberForSubscription(member);
    setShowPremiumModal(true);
  };

  // Handle closing premium modal
  const handleClosePremiumModal = () => {
    setShowPremiumModal(false);
    setSelectedMemberForSubscription(null);
  };

  // Handle Buy Premium Access
  const handleBuyPremiumAccess = async () => {
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

    try {
      setCreatingSubscription(true);

      const planId = 'd461266c-574b-4312-994a-ebd2b5cf6dc3'; // Premium plan ID
      const userId = user?._id || (user as any)?.id || '';
      const memberUserId =
        selectedMemberForSubscription.id ||
        selectedMemberForSubscription._id ||
        '';

      // ---------- iOS: Apple In-App Purchase flow (consumable-style) ----------
      if (Platform.OS === 'ios') {
        const productId = "com.astroself.ai.itme";
        if (!productId) {
          throw new Error('Premium subscription product id is not configured.');
        }

        // Close modal before starting purchase
        handleClosePremiumModal();

        await initConnection();
        try {
          const products = await fetchProducts({
            skus: [productId],
            type: 'subs',
          });

          console.log('products:--->875', products);

      



          // if (!products || products.length === 0) {
          //   throw new Error(
          //     'Subscription currently not available. Please try again later.',
          //   );
          // }

          const purchase = await purchasePremiumSubscriptionViaIAP(productId);

          console.log('purchase:--->894', purchase);

          const receipt =
            (await getTransactionJwsIOS(productId)) ||
            (purchase as any).transactionReceipt ||
            purchase.transactionId;

          // TODO: Backend verification for subscription IAP
          // Example (after adding verifySubscriptionIAP in PaymentService):
          // const verifyResponse = await paymentService.verifySubscriptionIAP({
          //   user_id: userId,
          //   member_user_id: memberUserId,
          //   plan_id: planId,
          //   receipt: receipt || purchase.transactionId,
          //   transaction_id: purchase.transactionId,
          //   product_id: productId,
          //   platform: 'ios',
          // });
          //
          // if (!verifyResponse.success) {
          //   throw new Error(
          //     verifyResponse.message || 'Subscription verification failed',
          //   );
          // }

          await finishTransaction({
            purchase,
            isConsumable: true,
          });

          await refreshProfileData();

          Toast.show({
            type: 'success',
            text1: 'Subscription Active',
            text2:
              'Premium subscription has been activated for this member on your Apple ID.',
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
          });

          return;
        } finally {
          await endConnection();
        }
      }

      // ---------- Android: Razorpay subscription flow ----------

      // First create subscription on backend (Android flow)
      const subscriptionResponse = await paymentService.createSubscription({
        plan_id: planId,
        user_id: userId,
        member_user_id: memberUserId,
        notes: {
          action: 'premium_subscription',
          member_name: selectedMemberForSubscription.full_name || 'Member',
        },
      });

      console.log('Subscription created:', subscriptionResponse);

      // Check if subscription was created
      if (!subscriptionResponse.subscription_id) {
        throw new Error('Subscription ID not received from server');
      }

      // Android: use Razorpay SDK as before
      if (!subscriptionResponse.razorpay_key) {
        throw new Error('Razorpay key not received from server');
      }

      // Get user data for prefill
      const userDataString = await AsyncStorage.getItem('USER_DATA');
      let currentUserData: any = {};
      if (userDataString) {
        currentUserData = JSON.parse(userDataString);
      }

      // Close the premium modal before opening Razorpay
      handleClosePremiumModal();

      // Razorpay payment options for subscription
      const options = {
        key: subscriptionResponse.razorpay_key,
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
            `${currentUserData.first_name || (user as any)?.first_name || ''} ${
              currentUserData.last_name || (user as any)?.last_name || ''
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
                  />
                );
              }}
              keyExtractor={item =>
                item.id || item._id || Math.random().toString()
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

      {/* Premium Plan Modal */}
      <Modal
        visible={showPremiumModal}
        transparent
        animationType="fade"
        onRequestClose={handleClosePremiumModal}
      >
        <TouchableOpacity
          style={styles.premiumModalOverlay}
          activeOpacity={1}
          onPress={handleClosePremiumModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
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

            {/* Header with Crown Icon */}
            <View style={styles.premiumModalHeader}>
              <Text style={styles.premiumModalCrownIcon}>👑</Text>
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
                Annual Plan – What You Unlock
              </Text>
            </View>

            {/* Price */}
            <View style={styles.premiumModalPriceContainer}>
              <Text
                style={[
                  styles.premiumModalPrice,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                999
              </Text>
              <Text
                style={[
                  styles.premiumModalPriceUnit,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                INR/year
              </Text>
            </View>

            {/* Description */}
            <Text
              style={[
                styles.premiumModalDescription,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Experience the full power of{' '}
              <Text style={styles.premiumModalBoldText}>
                Natal Insights + Dynamic Planetary Insights + Action Alignment
              </Text>{' '}
              in one seamless journey.
            </Text>

            {/* Features List */}
            <View style={styles.premiumModalFeaturesContainer}>
              {/* Feature 1 */}
              <View style={styles.premiumModalFeatureItem}>
                <Text style={styles.premiumModalCheckIcon}>✓</Text>
                <View style={styles.premiumModalFeatureTextContainer}>
                  <Text
                    style={[
                      styles.premiumModalFeatureTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Natal Chart-Based Insights:
                  </Text>
                  <Text
                    style={[
                      styles.premiumModalFeatureDescription,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Deep interpretations of core personality, soul desires, &
                    blended predictions for all 12 houses. Includes 100 BNN
                    snapshot predictions, planetary strength/weakness, &
                    hyper-personalisation.
                  </Text>
                </View>
              </View>

              {/* Feature 2 */}
              <View style={styles.premiumModalFeatureItem}>
                <Text style={styles.premiumModalCheckIcon}>✓</Text>
                <View style={styles.premiumModalFeatureTextContainer}>
                  <Text
                    style={[
                      styles.premiumModalFeatureTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Dynamic Insights (Active Planet + Transits):
                  </Text>
                  <Text
                    style={[
                      styles.premiumModalFeatureDescription,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Guidance that evolves: your most active planet, transit
                    influences, and refreshed updates every 15 days with new
                    planetary movements.
                  </Text>
                </View>
              </View>

              {/* Feature 3 */}
              <View style={styles.premiumModalFeatureItem}>
                <Text style={styles.premiumModalCheckIcon}>✓</Text>
                <View style={styles.premiumModalFeatureTextContainer}>
                  <Text
                    style={[
                      styles.premiumModalFeatureTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Dynamic Task Module (Mobile App Only):
                  </Text>
                  <Text
                    style={[
                      styles.premiumModalFeatureDescription,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Karma-Aligned Action: Turn insights into momentum with
                    personalised Do's & Don'ts, track progress, and build habits
                    aligned with your planetary phase.
                  </Text>
                </View>
              </View>
            </View>

            {/* Buy Premium Access Button */}
            <TouchableOpacity
              style={[
                styles.premiumModalBuyButton,
                {
                  backgroundColor: colors.Orangeaccentcolor,
                  opacity: creatingSubscription ? 0.6 : 1,
                },
              ]}
              onPress={handleBuyPremiumAccess}
              disabled={creatingSubscription}
            >
              {creatingSubscription ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.premiumModalBuyButtonText}>
                    Buy an Annual Plan
                  </Text>
                  {/* <Text style={styles.premiumModalBuyButtonArrow}>→</Text> */}
                </>
              )}
            </TouchableOpacity>
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
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    // flex: 1,
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
