// NotificationScreen.tsx

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ScrollView,
  Image,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { responsiveWidth, fontFamily } from '../../constant/theme';
import { icons } from '../../assets';
import { useTheme } from '../../context/ThemeContext';
import { MainContainer } from '../../components/common/mainContainer';


export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  BasicDeatil: undefined;
  MemberManagement: undefined;
  ChatScreen: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Register'
>;

// Notification data structure
interface NotificationItem {
  id: string;
  type: 'astrology' | 'family' | 'transit' | 'phase' | 'ai' | 'subscription' | 'offer';
  icon: any;
  title: string;
  date: string;
  isRead: boolean;
}

// Sample notification data
const sampleNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'astrology',
    icon: require('../../assets/icons/Sun.png'),
    title: 'Your pratyantar dasha is changing on 9th October',
    date: '8 Oct.',
    isRead: false,
  },
  {
    id: '2',
    type: 'family',
    icon: require('../../assets/icons/Sun.png'),
    title: 'Prajjwal added to your astro family',
    date: '8 Oct.',
    isRead: false,
  },
  {
    id: '3',
    type: 'transit',
    icon: require('../../assets/icons/Moon.png'),
    title: "Today's Moon transit may influence your creativity. Check",
    date: 'Yesterday',
    isRead: false,
  },
  {
    id: '4',
    type: 'phase',
    icon: require('../../assets/icons/Saturn.png'),
    title: 'Your current Mahadasha has entered a new phase. Explore details.',
    date: 'Today',
    isRead: false,
  },
  {
    id: '5',
    type: 'ai',
    icon: require('../../assets/icons/Sun.png'),
    title: "Haven't spoken with Astro AI today? Get your daily guidance.",
    date: '3 Aug.',
    isRead: false,
  },
  {
    id: '6',
    type: 'subscription',
    icon: require('../../assets/icons/Sun.png'),
    title: 'Your subscription will expire in 3 days. Renew now to continue.',
    date: '3 Aug.',
    isRead: false,
  },
  {
    id: '7',
    type: 'offer',
    icon: require('../../assets/icons/Sun.png'),
    title: 'Special Offer: Get **20% off** on adding a new member today',
    date: '3 Aug.',
    isRead: false,
  },
];

// Get icon and color for notification type
const getNotificationStyle = (type: string) => {
  switch (type) {
    case 'astrology':
      return {
        // iconBg: 'rgba(255, 215, 0, 0.8)', // Gold
        icon: require('../../assets/icons/Sun.png'),
      };
    case 'family':
      return {
        // iconBg: 'rgba(255, 165, 0, 0.8)', // Orange
        icon: require('../../assets/icons/Sun.png'),
      };
    case 'transit':
      return {
        // iconBg: 'rgba(255, 165, 0, 0.8)', // Orange
        icon: require('../../assets/icons/Moon.png'),
      };
    case 'phase':
      return {
        // iconBg: 'rgba(255, 165, 0, 0.8)', // Orange
        icon: require('../../assets/icons/Saturn.png'),
      };
    case 'ai':
      return {
        // iconBg: 'rgba(255, 165, 0, 0.8)', // Orange
        icon: require('../../assets/icons/Sun.png'),
      };
    case 'subscription':
      return {
        // iconBg: 'rgba(255, 215, 0, 0.8)', // Gold
        icon: require('../../assets/icons/Sun.png'),
      };
    case 'offer':
      return {
        // iconBg: 'rgba(255, 165, 0, 0.8)', // Orange
        icon: require('../../assets/icons/Sun.png'),
      };
    default:
      return {
        // iconBg: 'rgba(255, 165, 0, 0.8)',
        icon: require('../../assets/icons/Sun.png'),
      };
  }
};

const CATEGORIES = ['All', 'Astrology', 'Offers', 'System'];

const NotificationScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [notifications] = useState<NotificationItem[]>(sampleNotifications);
  const {theme,colors} = useTheme();


  const getFilteredNotifications = () => {
    if (selectedCategory === 'All') {
      return notifications;
    }
    return notifications.filter(notification => {
      switch (selectedCategory) {
        case 'Astrology':
          return ['astrology', 'transit', 'phase'].includes(notification.type);
        case 'Offers':
          return ['offer', 'subscription'].includes(notification.type);
        case 'System':
          return ['family', 'ai'].includes(notification.type);
        default:
          return true;
      }
    });
  };

  const renderNotificationCard = (notification: NotificationItem) => {
    const notificationStyle = getNotificationStyle(notification.type);
    
    return (
      <ImageBackground
        source={theme === 'dark' ? require('../../assets/image/DarkBackground.png') : require('../../assets/image/LightBackground.png')}
        blurRadius={12}
        style={[styles.mahadashaCard,{backgroundColor: theme === 'dark' ? colors.surface : colors.white, borderColor: theme === 'dark' ? colors.themeBorderDropdown : colors.borderColor}]}
        imageStyle={[styles.mahadashaBgImage,{backgroundColor: theme === 'dark' ? colors.surface : colors.white, borderColor: theme === 'dark' ? colors.themeBorderDropdown : colors.borderColor}]}
      >
        <View style={[styles.mahadashaOverlay,{backgroundColor: theme === 'dark' ? colors.transparent : colors.white}]} />
        <View
          style={[
            styles.mahadashaInner,
            styles.notificationRow
          ]}
        >
          {/* <View key={notification.id} style={styles.notificationCard}> */}
          <View
            style={[
              styles.notificationIconContainer,
              { backgroundColor: theme === 'dark' ? colors.surface : colors.white },
            ]}
          >
            <Image
              source={notificationStyle.icon}
              style={styles.notificationIcon}
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationText,{color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy}]}>{notification.title}</Text>
          </View>
          <Text style={[styles.notificationDate,{color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy}]}>{notification.date}</Text>
        </View>
        {/* </View> */}
      </ImageBackground>
    );
  };

  return (
    // <SafeAreaView style={styles.safeArea}>
    <View style={styles.safeArea}>
      {/* <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      /> */}

      <MainContainer>

      {/* Background with pattern */}
      {/* <ImageBackground
        source={
          theme === 'dark'
            ? require('../../assets/image/DarkBackground.png')
            : require('../../assets/image/LightBackground.png')
        }
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      > */}
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Image
                // source={require('../../assets/icons/back.png')}
                source={icons.Icback}
                style={[
                  styles.backIcon,
                  {
                    tintColor:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.headerTitle,
                  {
                    color:
                      theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  },
                ]}
              >
                Notification
              </Text>
            </View>
            <View style={styles.backButton} />
          </View>
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScrollContainer}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map(category => (
            <TouchableOpacity
              key={category}
               style={[
                 styles.categoryTab,
                 selectedCategory === category && styles.selectedCategoryTab,
                 {
                   borderColor:
                     selectedCategory === category
                       ? theme === 'dark'
                         ? colors.Orangeaccentcolor
                         : colors.white
                       : theme === 'dark'
                         ? colors.themeBorderDropdown
                         : colors.borderColor,
                   backgroundColor:
                     selectedCategory === category
                       ? theme === 'dark'
                         ? colors.Orangeaccentcolor
                         : colors.white
                       : theme === 'dark'
                         ? colors.surface
                         : colors.white,
                 },
               ]}
              onPress={() => setSelectedCategory(category)}
            >
               <Text
                 style={[
                   styles.categoryText,
                   {
                     color:
                       selectedCategory === category
                         ? theme === 'dark'
                           ? colors.themeTextWhite
                           : colors.Orangeaccentcolor
                         : theme === 'dark'
                           ? colors.themeTextWhite
                           : colors.DarkNavy,
                   },
                 ]}
               >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notifications List */}
        <ScrollView
          style={styles.notificationsContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.notificationsContent}
        >
          {getFilteredNotifications().map(renderNotificationCard)}
        </ScrollView>
      </MainContainer>
      {/* </ImageBackground> */}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1F3A',
  },
  backgroundImage: {
    flex: 1,
    // paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  backgroundImageStyle: {
    // opacity: 0.8,
  },

  // Header Section
  headerSection: {
    paddingTop:
      Platform.OS === 'ios' ? responsiveWidth('15%') : responsiveWidth('10%'),
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalIcon: {
    width: 20,
    height: 12,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
    borderRadius: 2,
  },
  wifiIcon: {
    width: 16,
    height: 12,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
    borderRadius: 2,
  },
  batteryIcon: {
    width: 24,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    // marginRight: 15,
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fontFamily.regular,
    // fontWeight: '600',
    textAlign: 'center',
    color: '#F6EFD9',
    // color: 'rgba(238, 229, 202, 1)',
  },

  // Category Tabs
  categoryScrollContainer: {
    // marginBottom: responsiveWidth('1'),
    height: 40,
    maxHeight:  40,
    // flex: 0.5,
    // backgroundColor: 'red',
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: responsiveWidth('6'),
    marginBottom: responsiveWidth('2'),
    maxHeight:  40,
  },
  categoryTab: {
    paddingHorizontal: responsiveWidth('5'),
    // paddingVertical: responsiveWidth('2'),
    borderRadius: 6,
    marginRight: responsiveWidth('1'),
    borderWidth: 1,
    // height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCategoryTab: {
    // Dynamic styling handled in component
  },
  categoryText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
  },
  selectedCategoryText: {
    // Dynamic styling handled in component
  },

  // Notifications
  notificationsContainer: {
    flex: 1,
    paddingHorizontal: responsiveWidth('2'),
  },
  notificationsContent: {
    paddingBottom: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  notificationIconContainer: {
    width: responsiveWidth(15),
    height: responsiveWidth(15),
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationIcon: {
    width: 48,
    height:48,
    resizeMode: 'contain',
    // tintColor: '#FFFFFF',
  },
  notificationContent: {
    flex: 1,
    marginRight: 10,
  },
  notificationText: {
    color: 'rgba(238, 229, 202, 1)',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    fontWeight: '400',
  },
  notificationDate: {
    color: 'rgba(145, 145, 145, 1)',
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
  },
  mahadashaCard: {
    borderRadius: 10,
    // marginHorizontal: responsiveWidth('1'),
    marginTop: responsiveWidth('3%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
  },
  mahadashaBgImage: {
    borderRadius: 20,
    opacity: 0.7,
  },
  mahadashaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  mahadashaInner: {
    paddingHorizontal: responsiveWidth('2'),
    paddingVertical: responsiveWidth('1'),
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mahadashaCardHeder: {
    borderRadius: 20,
    marginHorizontal: 8,
    marginTop: responsiveWidth('3%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
  },
});

export default NotificationScreen;
