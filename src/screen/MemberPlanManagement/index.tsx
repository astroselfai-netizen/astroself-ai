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
} from 'react-native';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useProfileData } from '../../hooks/useProfileData';
import { responsiveWidth, fontFamily, color } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';
import planService from '../../services/plan/plan.service';
import serviceFactory from '../../services/serviceFactory';
import UserService from '../../services/user/user.service';
import { useDispatch, useSelector } from 'react-redux';
import { setMembersUpdated } from '../../state/slices/appSlice';
import { RootState } from '../../state/store';
import { icons } from '../../assets';
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
  }: {
    item: any;
    isSelected: boolean;
    onSelect: () => void;
    isAssignPlanMode: boolean;
    isAssigned: boolean;
    canSelect: boolean;
    navigation: any;
    onEdit: () => void;
  }) => {

    console.log('itemitemitemitem', item);

    const { theme, colors } = useTheme();
    const [isExpanded, setIsExpanded] = React.useState(false);
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
      return `${months[birthData.month - 1]} ${birthData.day}, ${birthData.year}`;
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
    const currentPlan = item.current_plan || 'Plan Expiry date';
    const whatDoYouDo = item.what_do_you_do || '';

    console.log('currentPlancurrentPlancurrentPlan', currentPlan);

    // Format plan display text
    const planDisplayText =
      currentPlan === 'Plan Expiry date' || !currentPlan
        ? 'Plan Expiry date'
        : currentPlan === 'cosmic_foundation'
        ? 'Cosmic Foundation'
        : currentPlan === 'eternal_path'
         ? 'Eternal Path'
         : currentPlan;
        

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
          {/* Top Row - Name and Action Icons */}
          <View style={styles.cardTopRow}>
            <View
              style={[
                styles.nameContainer,
                item.primary_mamber === 'True' && { alignItems: 'center' },
              ]}
            >
              <Image
                source={require('../../assets/icons/profile-icons.png')}
                style={styles.profileIcon}
              />
              <View style={styles.memberNameContainer}>
                <Text
                  style={[
                    styles.memberName,
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
              </View>
            </View>
            <View style={styles.actionIcons}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ReportScreen', {
                    userId: item.id || item._id,
                  })
                }
                style={styles.iconButton}
              >
                <Image
                  source={require('../../assets/icons/Report.png')}
                  style={[
                    styles.actionIcon,
                    {
                      tintColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                    {
                      width: responsiveWidth(6),
                      height: responsiveWidth(6),
                    },
                  ]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('NakshatraTab', {
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
                      width: responsiveWidth(6),
                      height: responsiveWidth(6),
                    },
                  ]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ChatTab', { 
                    screen: 'ChatScreen', 
                    params: { userId: item.id || item._id } 
                  })
                }
                style={styles.iconButton}
              >
                <Image
                  source={require('../../assets/icons/Chat-inactive.png')}
                  style={[
                    styles.actionIcon,
                    {
                      tintColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                />
              </TouchableOpacity>
              {/* edit member icon */}
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
                      width: responsiveWidth(6),
                      height: responsiveWidth(6),
                    },
                  ]}
                />
              </TouchableOpacity>
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
            </View>
          </View>

          <View style={styles.divider} />

          {/* Details Grid Section - 2x2 Layout */}
          <View
            style={[
              styles.detailsGrid,
              {
                backgroundColor:
                  theme === 'dark' ? colors.transparentBg : colors.white,
              },
            ]}
          >
            {/* First Row */}
            <View style={styles.detailsRow}>
              {/* Birthdate */}
              <View style={styles.detailsItem}>
                <Image
                  source={require('../../assets/icons/birthday.png')}
                  style={[
                    styles.infoIcon,
                    // { tintColor: colors.Orangeaccentcolor },
                  ]}
                />
                <Text
                  style={[
                    styles.infoText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  {birthDate}
                </Text>
              </View>

              {/* Time */}
              <View style={styles.detailsItem}>
                <Image
                  source={require('../../assets/icons/time.png')}
                  style={[
                    styles.infoIcon,
                    // { tintColor: colors.Orangeaccentcolor },
                  ]}
                />
                <Text
                  style={[
                    styles.infoText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  {birthTime}
                </Text>
              </View>
            </View>

            {/* Second Row */}
            <View style={styles.detailsRow}>
              {/* Location */}
              <View style={styles.detailsItem}>
                <Image
                  source={require('../../assets/icons/office-building.png')}
                  style={[
                    styles.infoIcon,
                    // { tintColor: colors.Orangeaccentcolor },
                  ]}
                />
                <Text
                  style={[
                    styles.infoText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  {location}
                </Text>
              </View>

              {/* Plan/Expiry */}
              <View style={styles.detailsItem}>
                <Image
                  source={require('../../assets/icons/briefcase.png')}
                  style={[
                    styles.infoIcon,
                    // { tintColor: colors.Orangeaccentcolor },
                  ]}
                />
                <Text
                  style={[
                    styles.infoText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  {planDisplayText}
                </Text>
              </View>
            </View>
          </View>
          {/* what_do_you_do */}
          {whatDoYouDo ? (
            <View style={styles.whatDoYouDoContainer}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    // justifyContent: "flex-start",
                    // alignItems: 'flex-start',
                  },
                ]}
              >
                <Image
                  source={require('../../assets/icons/briefcase.png')}
                  style={[styles.detailIcon]}
                />
              </View>
              <View style={styles.whatDoYouDoTextContainer}>
                <Text
                  style={[
                    styles.detailText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                  numberOfLines={isExpanded ? undefined : 4}
                >
                  {whatDoYouDo}
                </Text>
                {whatDoYouDo.length > 100 && (
                  <TouchableOpacity
                    onPress={() => setIsExpanded(!isExpanded)}
                    style={styles.readMoreButton}
                  >
                    <Text
                      style={[
                        styles.readMoreText,
                        {
                          color:
                            theme === 'dark'
                              ? colors.Orangeaccentcolor
                              : colors.Orangeaccentcolor,
                        },
                      ]}
                    >
                      {isExpanded ? 'Read less' : 'Read more'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : null}
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
  const [localMembersData, setLocalMembersData] = useState<any[]>([]);

  const { membersData, profileData, loading, error, refreshProfileData } = useProfileData();
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isAssignPlanMode, setIsAssignPlanMode] = useState(false);
  const [assignedMembers, setAssignedMembers] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [personalDetails, setPersonalDetails] = useState('');
  const [personalizedDetailsEnabled, setPersonalizedDetailsEnabled] = useState(true);
  const [updating, setUpdating] = useState(false);

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
    }, [refreshProfileData])
  );

  // Use all members (no filtering needed)
  const filteredMembers = useMemo(() => {
    return localMembersData || [];
  }, [localMembersData]);

  console.log('filteredMembersprofileData------', profileData);

  // Calculate member and children counts
  const memberCount = profileData?.members_allow ? profileData?.members_allow - profileData?.current_members : 0;
  const childrenCount =
    profileData?.child_allow 
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
        text2: response.message || `Plan assigned to ${selectedMembers.size} member(s) successfully`,
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
        apiError.message || 
        'Failed to allocate plan. Please try again.';

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

  // Log the full members data to see the structure
  console.log('Full membersData:', JSON.stringify(membersData, null, 2));

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
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
            },
          ]}
        >
          Buy Plan
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Available Plans Section */}
      <View style={styles.availablePlansContainer}>
        <View
          style={[
            styles.availablePlansCard,
            {
              backgroundColor:
                theme === 'dark'
                  ? colors.transparentBg
                  : colors.white,
              borderColor:
                theme === 'dark'
                  ? colors.themeTextWhite
                  : colors.borderColor,
            },
          ]}
        >
          <Text
            style={[
              styles.availablePlansTitle,
              {
                color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
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
        </View>

        {/* Action Buttons */}
        {!isAssignPlanMode ? (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
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
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createChartButton,
                {
                  backgroundColor: theme === 'dark' ? colors.surface : colors.white,
                  borderColor: theme === 'dark' ? colors.themeTextWhite : colors.white,
                  borderWidth: 1,
                  opacity: isCreateChartEnabled ? 1 : 0.5,
                },
              ]}
              onPress={handleCreateChart}
              disabled={!isCreateChartEnabled}
            >
              <Text
                style={[
                  styles.createChartButtonText,
                  {
                    color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                    opacity: isCreateChartEnabled ? 1 : 0.5,
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
                  backgroundColor: theme === 'dark' ? colors.surface : colors.white,
                  borderColor: theme === 'dark' ? colors.themeTextWhite : colors.white,
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
                  { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy },
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
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 90 : 90,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 14,
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
    paddingHorizontal: 14,
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
    gap: responsiveWidth('3'),
    marginTop: responsiveWidth('2'),
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
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createChartButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  memberCard: {},
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
    marginBottom: responsiveWidth('3'),
  },
  nameContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  memberNameContainer: {
    // flexDirection: 'row',
    // justifyContent: "flex-start",
    // alignItems: "flex-start",
    // alignItems: 'center',
    // flex: 1,
  },
  divider: {
    height: 0.3,
    backgroundColor: 'rgba(238, 229, 202, 1)',
    marginBottom: responsiveWidth('3'),
  },
  detailsGrid: {
    marginTop: responsiveWidth('1'),
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
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: responsiveWidth('1'),
    marginLeft: responsiveWidth('2'),
  },
  actionIcon: {
    width: responsiveWidth(7),
    height: responsiveWidth(7),
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
});

export default MemberPlanManagement;
