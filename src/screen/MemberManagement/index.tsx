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
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useProfileData } from '../../hooks/useProfileData';
import { responsiveWidth, fontFamily, color } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import serviceFactory from '../../services/serviceFactory';
import UserService from '../../services/user/user.service';
import LottieView from 'lottie-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setMembersUpdated } from '../../state/slices/appSlice';
import { RootState } from '../../state/store';
import Toast from 'react-native-toast-message';
import { icons } from '../../assets';
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: { screen: string; params?: { userId?: string } };
  ContinueWithOtp: undefined;
  ChatScreen: undefined;
  NakshatraScreen: { userId: string };
};

type MemberManagementNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Register'
>;

const handleTogglePrimary = async (
  memberId: string,
  refreshProfileData: () => Promise<void>,
  setTogglingMember: (id: string | null) => void,
  setLocalMembersData: (data: any[]) => void,
  currentMembersData: any[],
  dispatch: any,
) => {
  try {
    console.log('Toggling primary member for ID:', memberId);
    setTogglingMember(memberId);

    // Immediately update local state to show the change
    const updatedMembers = currentMembersData.map(member => ({
      ...member,
      primary_mamber: member.id === memberId ? 'True' : 'False',
    }));
    setLocalMembersData(updatedMembers);

    const userService = serviceFactory.get<UserService>('UserService');
    const response = await userService.setPrimaryMember(memberId);
    console.log('Primary member set successfully:', response);

    // Set flag to indicate members data has been updated
    dispatch(setMembersUpdated(true));

    // Refresh the profile data to get the latest from server
    console.log('Starting profile data refresh...');
    await refreshProfileData();
    console.log('Profile data refreshed after setting primary member');
  } catch (error) {
    console.error('Error setting primary member:', error);
    // Revert the local state change if API call failed
    setLocalMembersData(currentMembersData);
  } finally {
    setTogglingMember(null);
  }
};

const MemberItem = React.memo(
  ({
    item,
    navigation,
    togglingMember,
    onToggle,
    onEdit,
  }: {
    item: any;
    navigation: any;
    togglingMember: string | null;
    onToggle: () => void;
    onEdit: () => void;
  }) => {

    // console.log('itemitemitemitem', item);

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
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return `${birthData.day} ${months[birthData.month - 1]}, ${
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
    const currentPlan = item.current_plan || 'Free Plan';
    const whatDoYouDo = item.what_do_you_do || '';

    return (
      <ImageBackground
        source={
          theme === 'dark'
            ? require('../../assets/image/DarkBackground.png')
            : require('../../assets/image/LightBackground.png')
        }
        blurRadius={12}
        style={[
          styles.newMembersCard,
          {
            backgroundColor: theme === 'dark' ? colors.surface : colors.white,
            borderColor:
              theme === 'dark'
                ? colors.themeBorderDropdown
                : colors.borderColor,
          },
        ]}
        imageStyle={[
          styles.newMembersBgImage,
          {
            backgroundColor: theme === 'dark' ? colors.surface : colors.white,
            borderColor:
              theme === 'dark'
                ? colors.themeBorderDropdown
                : colors.borderColor,
          },
        ]}
      >
        <View
          style={[
            styles.newMmembersOverlay,
            {
              backgroundColor:
                theme === 'dark' ? colors.transparent : colors.white,
            },
          ]}
        />
        <View
          style={[
            styles.memberCard,
            {
              backgroundColor: theme === 'dark' ? colors.surface : colors.white,
              borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,
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
                {/* {item.primary_mamber === 'True' && (
                  <View style={styles.primaryMemberLabel}>
                    <Text
                      style={[
                        styles.primaryMemberText,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.white,
                        },
                      ]}
                    >
                      Primary Member
                    </Text>
                  </View>
                )} */}
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
                  navigation.navigate('ChatTab', { screen: 'ChatScreen' })
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
              <TouchableOpacity onPress={onEdit} style={styles.iconButton}>
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
            </View>
          </View>
          <View style={styles.divider} />
          {/* Middle Row - Birth Date and Time */}
          <View style={styles.cardMiddleRow}>
            <View
              style={[styles.detailItem, { marginLeft: responsiveWidth('1') }]}
            >
              <View style={styles.iconContainer}>
                {/* <Text style={styles.iconText}>🎂</Text> */}
                <Image
                  source={require('../../assets/icons/birthday.png')}
                  style={styles.detailIcon}
                />
              </View>
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
              >
                {birthDate}
              </Text>
            </View>
            <View style={[styles.detailItem]}>
              <View style={styles.iconContainer}>
                {/* <Text style={styles.iconText}>🕐</Text> */}
                <Image
                  source={require('../../assets/icons/time.png')}
                  style={styles.detailIcon}
                />
              </View>
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
              >
                {birthTime}
              </Text>
            </View>

            {/* <View style={[styles.detailItem, styles.lastDetailItem]}>
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/icons/briefcase.png')}
                style={styles.detailIcon}
              />
            </View>
            <Text style={styles.detailText}>{profession}</Text>
          </View> */}
          </View>

          {/* Bottom Row - Location and Profession */}
          <View style={styles.cardBottomRow}>
            <View
              style={[
                styles.detailItem,
                {
                  // marginLeft: -responsiveWidth('0.5'),
                },
              ]}
            >
              <Image
                source={require('../../assets/icons/office-building.png')}
                style={styles.detailIcon}
              />
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
              >
                {location}
              </Text>
            </View>
            <View
              style={[
                styles.detailItem,
                {
                  // width: responsiveWidth('100%'),
                  marginLeft: -responsiveWidth('0.5'),
                },
              ]}
            >
              <Image
                source={require('../../assets/icons/briefcase.png')}
                style={
                  styles.detailIcon
                }
              />
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
              >
                {currentPlan}
              </Text>
            </View>
          </View>
          {/* Primary Member Toggle Row */}
          {/* <View style={styles.toggleRow}>
          <View style={styles.toggleContainer}>
            <Text
              style={[
                styles.toggleLabel,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Set as Primary Member
            </Text>
            <PrimaryMemberSwitch
              item={item}
              togglingMember={togglingMember}
              onToggle={onToggle}
            />
          </View>
        </View> */}
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
          {/* </View> */}
        </View>
      </ImageBackground>
    );
  },
);

// Separate Switch component to prevent unnecessary re-renders
const PrimaryMemberSwitch = React.memo(
  ({
    item,
    togglingMember,
    onToggle,
  }: {
    item: any;
    togglingMember: string | null;
    onToggle: () => void;
  }) => {
    const { theme, colors } = useTheme();
    console.log(
      'Switch rendering for:',
      item.full_name,
      'primary_mamber:',
      item.primary_mamber,
    );

    return (
      <Switch
        value={item.primary_mamber === 'True'}
        onValueChange={onToggle}
        disabled={togglingMember === (item.id || item._id)}
        trackColor={{
          false:
            theme === 'dark'
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(0, 0, 0, 0.2)',
          true: colors.Orangeaccentcolor,
        }}
        thumbColor={item.primary_mamber === 'True' ? '#FFFFFF' : '#FFFFFF'}
        // ios_backgroundColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}
        style={[
          styles.switch,
          togglingMember === (item.id || item._id) && styles.switchLoading,
        ]}
      />
    );
  },
);

const MemberManagement = () => {
  const navigation = useNavigation<MemberManagementNavigationProp>();
  const { theme, colors } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.app.user);
  const userService = serviceFactory.get<UserService>('UserService');
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingMember, setTogglingMember] = useState<string | null>(null);
  const [localMembersData, setLocalMembersData] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [personalDetails, setPersonalDetails] = useState('');
  const [personalizedDetailsEnabled, setPersonalizedDetailsEnabled] =
    useState(true);
  const [updating, setUpdating] = useState(false);

  const { membersData, loading, error, refreshProfileData } = useProfileData();

  // Update local state when membersData changes
  React.useEffect(() => {
    if (membersData) {
      setLocalMembersData(membersData);
    }
  }, [membersData]);

  // Memoized toggle handler to prevent unnecessary re-renders
  const handleTogglePrimaryMemo = React.useCallback(
    (memberId: string) => {
      return handleTogglePrimary(
        memberId,
        refreshProfileData,
        setTogglingMember,
        setLocalMembersData,
        localMembersData,
        dispatch,
      );
    },
    [refreshProfileData, localMembersData, dispatch],
  );

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
    } catch (error: any) {
      console.error('Error updating member:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update member',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle set as primary member from modal
  const handleSetAsPrimaryFromModal = async () => {
    if (!selectedMember) return;

    try {
      setUpdating(true);
      await handleTogglePrimary(
        selectedMember.id || selectedMember._id,
        refreshProfileData,
        setTogglingMember,
        setLocalMembersData,
        localMembersData,
        dispatch,
      );
      handleCloseEditModal();
    } catch (error: any) {
      console.error('Error setting primary member:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to set as primary member',
        position: 'top',
        topOffset: 60,
        visibilityTime: 3000,
      });
    } finally {
      setUpdating(false);
    }
  };

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    const familyMembers = localMembersData || [];

    if (!searchQuery.trim()) {
      return familyMembers;
    }

    const query = searchQuery.toLowerCase().trim();
    return familyMembers.filter((member: any) => {
      // Search in name fields
      const fullName = member.full_name || '';
      const firstName = member.first_name || '';
      const lastName = member.last_name || '';
      const name = `${firstName} ${lastName}`.toLowerCase();

      // Search in other fields
      const profession = (member.what_do_you_do || '').toLowerCase();
      const location = (member.birthplace || '').toLowerCase();

      return (
        fullName.toLowerCase().includes(query) ||
        name.includes(query) ||
        firstName.toLowerCase().includes(query) ||
        lastName.toLowerCase().includes(query) ||
        profession.includes(query) ||
        location.includes(query)
      );
    });
  }, [localMembersData, searchQuery]);

  // Log the full members data to see the structure
  console.log('Full membersData:', JSON.stringify(membersData, null, 2));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Background with texture */}
      <View style={styles.backgroundContainer}>
        <Image
          source={
            theme === 'dark'
              ? require('../../assets/image/DarkBackground.png')
              : require('../../assets/image/LightBackground.png')
          }
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>

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
          Manage Members
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme === 'dark' ? colors.surface : colors.white,
              borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,
            },
          ]}
        >
          <TextInput
            style={[
              styles.searchInput,
              {
                color:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
            placeholder="Search family members..."
            placeholderTextColor={
              theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Text
                style={[
                  styles.clearButtonText,
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
          ) : (
            <Image
              source={require('../../assets/icons/search-alt.png')}
              style={[
                styles.searchIcon,
                {
                  tintColor:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            />
          )}
        </View>
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
              {searchQuery.trim()
                ? 'No members found matching your search'
                : 'No family members found'}
            </Text>
          ) : (
            <FlatList
              data={filteredMembers}
              renderItem={({ item }) => (
                <MemberItem
                  item={item}
                  navigation={navigation}
                  togglingMember={togglingMember}
                  onToggle={() => handleTogglePrimaryMemo(item.id || item._id)}
                  onEdit={() => handleOpenEditModal(item)}
                />
              )}
              keyExtractor={item =>
                item.id || item._id || Math.random().toString()
              }
              // ItemSeparatorComponent={ItemSeparator}
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
          // opacity={0.9}
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
              {/* <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.setPrimaryButton,
                  {
                    backgroundColor: colors.Orangeaccentcolor,
                  },
                ]}
                onPress={handleSetAsPrimaryFromModal}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text
                    style={[styles.setPrimaryButtonText, { color: colors.white }]}
                  >
                    Set as Primary Member
                  </Text>
                )}
              </TouchableOpacity> */}
            </View>
          </ImageBackground>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 60 : 60,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: responsiveWidth('3'),
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(34, 49, 73, 1)',
    borderRadius: 12,
    paddingHorizontal: responsiveWidth('2.5'),
    paddingVertical: responsiveWidth('2.5'),
    borderWidth: 2,
    borderColor: color.themeBorderDropdown,
  },
  searchInput: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    flex: 1,
    paddingVertical: 0,
  },
  searchIcon: {
    height: responsiveWidth(6),
    width: responsiveWidth(6),
    resizeMode: 'contain',
    color: color.themeTextWhite,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fontFamily.regular,
  },
  memberCard: {},
  newMembersCard: {
    borderRadius: 16,
    padding: responsiveWidth('3'),
    marginBottom: responsiveWidth('4%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
  },
  newMembersBgImage: {
    borderRadius: 16,
    opacity: 0.7,
  },
  newMmembersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveWidth('3'),
  },
  nameContainer: {
    flexDirection: 'row',
    // alignItems: 'center',
    flex: 1,
    // marginRight: responsiveWidth('2'),
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
  memberNameContainer: {
    // flexDirection: 'row',
    // justifyContent: "flex-start",
    // alignItems: "flex-start",
    // alignItems: 'center',
    // flex: 1,
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
  cardMiddleRow: {
    // flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    // gap: responsiveWidth('2'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: responsiveWidth('3'),
    paddingHorizontal: responsiveWidth('2'),
  },
  cardBottomRow: {
    flex: 1,
    alignItems: 'center',
    // gap: responsiveWidth('2'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: responsiveWidth('3'),
    paddingHorizontal: responsiveWidth('2.5'),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: responsiveWidth('30%'),
    marginRight: responsiveWidth('2'),
  },
  lastDetailItem: {
    marginRight: 0,
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
  iconText: {
    fontSize: 12,
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
  divider: {
    height: 0.3,
    backgroundColor: 'rgba(238, 229, 202, 1)',
    marginBottom: responsiveWidth('3'),
    // marginHorizontal: 20,
  },
  whatDoYouDoContainer: {
    marginTop: responsiveWidth('2'),
    paddingHorizontal: responsiveWidth('2.5'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  whatDoYouDoTextContainer: {
    flex: 1,
    // flexDirection: 'row',
    // alignItems: 'center',
    marginLeft: responsiveWidth('1'),
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

export default MemberManagement;
