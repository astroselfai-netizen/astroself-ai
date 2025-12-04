// PrivacyPolicyScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  fontFamily,
  responsiveWidth,
  responsiveHeight,
} from '../../constant/theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';
import booksService, { SendEmailRequest } from '../../services/books/books.service';
import { RootState } from '../../state/store';
import { useSelector } from 'react-redux';
import { baseURL } from '../../utils/http';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  ForgotPasswordOtp: undefined;
  ResourcesDetailsScreen: { book: any };
};

type ResourcesDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ResourcesDetailsScreen'
>;

type ResourcesDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'ResourcesDetailsScreen'
>;

const ResourcesDetailsScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<ResourcesDetailsScreenNavigationProp>();
  const route = useRoute<ResourcesDetailsScreenRouteProp>();
  const {user} = useSelector((state: RootState) => state.app);
  console.log('user---->', user);
  const { book } = route.params;
  
  const [isLoading, setIsLoading] = useState(false);
  const [initialSummary, setInitialSummary] = useState<string[]>([]);
  const [remainingSummary, setRemainingSummary] = useState<string[]>([]);

  console.log('book---->', book);

  // Function to split summary text
  const splitSummaryText = (text: string) => {
    if (!text) return { firstPart: '', secondPart: '' };
    
    // Split by double line breaks to get sections
    const sections = text.split('\r\n\r\n');
    const firstPartSections = [];
    const secondPartSections = [];
    
    let currentLength = 0;
    const maxLength = 225; // Approximate character limit for 225 height
    
    for (let i = 0; i < sections.length; i++) {
      if (currentLength + sections[i].length <= maxLength) {
        firstPartSections.push(sections[i]);
        currentLength += sections[i].length;
      } else {
        secondPartSections.push(sections[i]);
      }
    }
    
    return {
      firstPart: firstPartSections,
      secondPart: secondPartSections
    };
  };

  const { firstPart, secondPart } = splitSummaryText(book?.summary || '');


    useEffect(() => {
      if (book?.summary) {
        const summaryParagraphs = book.summary
          .split(/\r?\n\r?\n+/) // Split by blank lines
          .map((para: any) => para.trim())
          .filter((para: any) => para.length > 0);

        let charCount = 0;
        const splitIndex = summaryParagraphs.findIndex((para: any) => {
          charCount += para.length;
          return charCount > 500; // Split after 500 characters
        });

        if (splitIndex === -1) {
          setInitialSummary(summaryParagraphs);
          setRemainingSummary([]);
        } else {
          setInitialSummary(summaryParagraphs.slice(0, splitIndex + 1));
          setRemainingSummary(summaryParagraphs.slice(splitIndex + 1));
        }
      }
    }, [book]);

  // Function to check if text is a heading (converted from test.tsx logic)
  const isHeading = (text: string) => {
    return text.length < 80 && !text.endsWith('.') && !text.endsWith('?');
  };

  // Function to render summary paragraphs (converted from test.tsx)
  const renderSummaryParagraphs = (paragraphs: string[]) => {
    return paragraphs.map((para: string, index: number) => {
      const baseStyle = [
        styles.summaryText,
        {
          color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
        },
      ];

      if (isHeading(para)) {
        return (
          <Text key={index} style={[
            ...baseStyle, 
            { 
              fontWeight: '700', 
              fontSize: 16, 
              marginTop: 12, 
              marginBottom: 8,
              lineHeight: 20
            }
          ]}>
            {para}
          </Text>
        );
      } else {
        return (
          <Text key={index} style={[
            ...baseStyle, 
            { 
              fontWeight: 'normal',
              marginBottom: 6,
              lineHeight: 20
            }
          ]}>
            {para}
          </Text>
        );
      }
    });
  };

  // Function to show email input aler

  // Function to handle sending email
  const handleSendEmail = async (email: string) => {

    // console.log('email---->', email);
    if (!book) {
      Alert.alert('Error', 'Book information not available.');
      return;
    }

    setIsLoading(true);
    
    try {
      const emailData: SendEmailRequest = {
        path: book.file_path || '',
        email: email,
        user_name: email.split('@')[0] || 'User', // Extract username from email
        title: book.title || '',
        slogan: book.slogan || '',
      };

      console.log('emailData---->', emailData);

      const response = await booksService.sendEmail(emailData);
      
      if (response.status) {
        Alert.alert(
          'Success!', 
          'A copy of the book has been sent to your email address.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert(
        'Error', 
        'Failed to send email. Please check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

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
            {book?.title || 'Book Details'}
          </Text>
        </View>
      </View>

      {/* Main Content Card */}
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.contentCard,
            {
              backgroundColor:
                theme === 'dark'
                  ? colors.cardBackground
                  : colors.surfaceOpacity,
            },
          ]}
        >
          <View style={styles.mainRowContainer}>
            {/* Book Cover Section */}
            <View style={styles.bookCoverSectionContainer}>
              <View style={styles.bookCoverSection}>
                <Image
                  source={{
                    uri: `${baseURL}/${book.image_path}`,
                  }}
                  style={styles.bookImage}
                  resizeMode="cover"
                />
              </View>

              {/* Summary Section */}
              <View style={styles.summarySection}>
                <Text
                  style={[
                    styles.summaryTitle,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Summary
                </Text>
                {/* Get a Copy Button */}
                <TouchableOpacity
                  style={[
                    styles.getCopyButton,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? colors.Orangeaccentcolor
                          : colors.Orangeaccentcolor,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleSendEmail(user?.email || '')}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.getCopyButtonText}>Get a Copy</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Initial summary section */}
            <View style={styles.secondSectionContainer}>
              <View style={styles.secondSectionContent}>
                {renderSummaryParagraphs(initialSummary)}
              </View>
            </View>

            {/* Remaining summary section */}
            {remainingSummary.length > 0 && (
              <View style={styles.secondSectionContainer}>
                <View style={styles.secondSectionContent}>
                  {renderSummaryParagraphs(remainingSummary)}
                </View>
              </View>
            )}
          </View>
        </View>
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
  contentCard: {
    borderRadius: 16,
    marginHorizontal: responsiveWidth('4'),
    marginTop: responsiveWidth('2%'),
    borderWidth: 0,
    // flexDirection: 'row',
    overflow: 'hidden',
    // marginBottom: responsiveWidth('5%'),
    paddingVertical: 0,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookCoverSection: {
    width: 150,
    height:225,
    padding: 14,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  bookTitleSmall: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 4,
  },
  bookTitleLarge: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 20,
    marginBottom: 2,
  },
  heartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: responsiveHeight('3%'),
  },
  heartIcon: {
    fontSize: 50,
    color: '#FF6B6B', // Reddish-orange heart
  },
  profileSilhouette: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#F5F5DC', // Light beige
    borderRadius: 12,
    top: 12,
    left: 12,
  },
  bookSubtitle: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 13,
    marginBottom: 2,
  },
  bookImage: {
    width: "100%",
    height:"100%",
    resizeMode: 'contain',
    borderRadius: 8,
    boxShadow: '0px 5px 5px 0px rgba(0, 0, 0, 0.35)',
  },
  summarySection: {
    width: '55%',
    alignItems: 'center',
    // paddingVertical: responsiveWidth('1%'),
    // paddingHorizontal: responsiveWidth('1%'),
    // backgroundColor: 'rgba(34, 49, 73, 0.3)', // Semi-transparent dark blue
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: fontFamily.regular,
    marginBottom: responsiveWidth('2%'),
    marginTop: responsiveHeight('2%'),
    lineHeight: 22,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    // textAlign: 'left',
    // marginBottom: responsiveWidth('2.5%'),
    // paddingRight: responsiveWidth('2%'),
  },
  getCopyButton: {
    backgroundColor: '#FF6B6B', // Reddish-orange button
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveWidth('1%'),
    marginBottom: responsiveWidth('3%'),
    alignSelf: 'center',
  },
  getCopyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    letterSpacing: 0.5,
  },
  mainRowContainer: {
    // flexDirection: 'row',
    flex: 1,
  },
  bookCoverSectionContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  secondSectionContainer: {
    // paddingVertical: responsiveHeight('3%'),
    paddingHorizontal: responsiveWidth('4%'),
    paddingBottom: responsiveWidth('5%'),
  },
  secondSectionContent: {
    flex: 1,
  },
  secondSectionTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    // marginBottom: responsiveHeight('1%'),
    lineHeight: 20,
  },
});

export default ResourcesDetailsScreen;
