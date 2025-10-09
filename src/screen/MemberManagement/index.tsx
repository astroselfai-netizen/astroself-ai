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
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useProfileData } from '../../hooks/useProfileData';
import { responsiveWidth, fontFamily, color } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import serviceFactory from '../../services/serviceFactory';
import UserService from '../../services/user/user.service';
import LottieView from 'lottie-react-native';
import { useDispatch } from 'react-redux';
import { setMembersUpdated } from '../../state/slices/appSlice';
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

const handleTogglePrimary = async (memberId: string, refreshProfileData: () => Promise<void>, setTogglingMember: (id: string | null) => void, setLocalMembersData: (data: any[]) => void, currentMembersData: any[], dispatch: any) => {
  try {
    console.log('Toggling primary member for ID:', memberId);
    setTogglingMember(memberId);
    
    // Immediately update local state to show the change
    const updatedMembers = currentMembersData.map(member => ({
      ...member,
      primary_mamber: member.id === memberId ? "True" : "False"
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

const MemberItem = React.memo(({ item, navigation, togglingMember, onToggle }: { item: any, navigation: any, togglingMember: string | null, onToggle: () => void }) => {
  const { theme, colors } = useTheme();
  console.log('MemberItem rendering for:', item.full_name, 'primary_mamber:', item.primary_mamber);
  
  // Extract name from API response
  const memberName = item.full_name || 
    (item.first_name && item.last_name ? `${item.first_name} ${item.last_name}` : 
     item.first_name || 'Unknown Member');
  
  // Extract birth data from API response
  const formatBirthDate = (birthData: any) => {
    if (!birthData) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${birthData.day} ${months[birthData.month - 1]}, ${birthData.year}`;
  };
  
  const formatBirthTime = (birthData: any) => {
    if (!birthData) return 'N/A';
    const hour = birthData.hour;
    const min = birthData.min.toString().padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${min} ${ampm}`;
  };
  
  const birthDate = formatBirthDate(item.birth_data);
  const birthTime = formatBirthTime(item.birth_data);
  const location = item.birthplace || 'Location not specified';
  
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
            theme === 'dark' ? colors.themeBorderDropdown : colors.borderColor,
        },
      ]}
      imageStyle={[
        styles.newMembersBgImage,
        {
          backgroundColor: theme === 'dark' ? colors.surface : colors.white,
          borderColor:
            theme === 'dark' ? colors.themeBorderDropdown : colors.borderColor,
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
          <View style={[styles.nameContainer,
           item.primary_mamber === 'True' && { alignItems: 'center' },
          ]}>
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
              {item.primary_mamber === 'True' && (
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
              )}
            </View>
          </View>
          <View style={styles.actionIcons}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('HomeScreen', {
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
                navigation.navigate('HomeScreen', { screen: 'ChatScreen' })
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
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
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
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
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
                width: responsiveWidth('100%'),
                marginLeft: -responsiveWidth('0.5'),
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
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              {location}
            </Text>
          </View>
        </View>

        {/* Primary Member Toggle Row */}
        <View style={styles.toggleRow}>
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
        </View>
      </View>
    </ImageBackground>
  );
});

// Separate Switch component to prevent unnecessary re-renders
const PrimaryMemberSwitch = React.memo(({ 
  item, 
  togglingMember, 
  onToggle 
}: { 
  item: any, 
  togglingMember: string | null, 
  onToggle: () => void 
}) => {
  const { theme, colors } = useTheme();
  console.log('Switch rendering for:', item.full_name, 'primary_mamber:', item.primary_mamber);
  
  return (
    <Switch
      value={item.primary_mamber === "True"}
      onValueChange={onToggle}
      disabled={togglingMember === (item.id || item._id)}
      trackColor={{
        false: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        true: colors.Orangeaccentcolor
      }}
      thumbColor={item.primary_mamber === "True" ? '#FFFFFF' : '#FFFFFF'}
      // ios_backgroundColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}
      style={[
        styles.switch,
        togglingMember === (item.id || item._id) && styles.switchLoading
      ]}
    />
  );
});

const MemberManagement = () => {
  const navigation = useNavigation<MemberManagementNavigationProp>();
  const { theme, colors } = useTheme();
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingMember, setTogglingMember] = useState<string | null>(null);
  const [localMembersData, setLocalMembersData] = useState<any[]>([]);

  const { membersData, loading, error, refreshProfileData } = useProfileData();

  // Update local state when membersData changes
  React.useEffect(() => {
    if (membersData) {
      setLocalMembersData(membersData);
    }
  }, [membersData]);

  // Memoized toggle handler to prevent unnecessary re-renders
  const handleTogglePrimaryMemo = React.useCallback((memberId: string) => {
    return handleTogglePrimary(memberId, refreshProfileData, setTogglingMember, setLocalMembersData, localMembersData, dispatch);
  }, [refreshProfileData, localMembersData, dispatch]);

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
        barStyle={theme === 'dark' ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent={true} 
      />

      {/* Background with texture */}
      <View style={styles.backgroundContainer}>
        <Image
          source={theme === 'dark' ? require('../../assets/image/DarkBackground.png') : require('../../assets/image/LightBackground.png')}
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
            style={[styles.backIcon, { tintColor: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy }]}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy }]}>Manager Members</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, {
          backgroundColor: theme === 'dark' ? colors.surface : colors.white,
          borderColor: theme === 'dark' ? colors.themeBorderDropdown : colors.borderColor
        }]}>
          <TextInput
            style={[styles.searchInput, { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy }]}
            placeholder="Search family members..."
            placeholderTextColor={theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy}
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
              <Text style={[styles.clearButtonText, { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy }]}>✕</Text>
            </TouchableOpacity>
          ) : (
            <Image
              source={require('../../assets/icons/search-alt.png')}
              style={[styles.searchIcon, { tintColor: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy }]}
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
        { error ? (
          <Text style={[styles.errorText, { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy }]}>Error: {error}</Text>
        ) : filteredMembers.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy }]}>
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
      </ScrollView>)}

      {/* Floating Action Button */}
      {/* <TouchableOpacity onPress={() => navigation.navigate('AddNewMember')} style={styles.fab}>
        <Image
          source={require('../../assets/icons/add-plus-circle.png')}
          style={styles.fabIcon}
        />
      </TouchableOpacity> */}
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
    paddingBottom: 100,
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
    paddingHorizontal: responsiveWidth('1'),
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth('1'),
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
    marginRight: responsiveWidth('3'),
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
    fontSize: 14,
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
