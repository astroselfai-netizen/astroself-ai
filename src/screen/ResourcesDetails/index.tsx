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



    useEffect(() => {
      if (book?.summary) {
        // Check if content contains HTML tags
        const hasHTML = /<[^>]+>/.test(book.summary);
        
        if (hasHTML) {
          // For HTML content, split by h3 tags to create sections
          const htmlSections = book.summary.split(/(?=<h3)/i);
          const cleanedSections = htmlSections
            .map((section: string) => section.trim())
            .filter((section: string) => section.length > 0);

          let charCount = 0;
          const splitIndex = cleanedSections.findIndex((section: string) => {
            charCount += section.length;
            return charCount > 500; // Split after 500 characters
          });

          if (splitIndex === -1) {
            setInitialSummary(cleanedSections);
            setRemainingSummary([]);
          } else {
            setInitialSummary(cleanedSections.slice(0, splitIndex + 1));
            setRemainingSummary(cleanedSections.slice(splitIndex + 1));
          }
        } else {
          // Original logic for plain text
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
      }
    }, [book]);

  // Function to decode HTML entities
  const decodeHTML = (text: string) => {
    if (!text) return '';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  };

  // Function to check if a line is a numbered list item
  const isNumberedListItem = (text: string): boolean => {
    const trimmed = text.trim();
    // Check for numbered lists (1., 2., etc.) at the start
    return /^\d+\.\s/.test(trimmed);
  };

  // Function to parse numbered list item
  const parseNumberedListItem = (text: string): { number: string; content: string } => {
    const trimmed = text.trim();
    const match = trimmed.match(/^(\d+\.)\s*(.*)$/);
    if (match) {
      return {
        number: match[1],
        content: match[2] || '',
      };
    }
    return { number: '', content: trimmed };
  };

  // Function to check if a line is a bullet point
  const isBulletPoint = (text: string): boolean => {
    const trimmed = text.trim();
    // Check for bullet points (•, -, *, etc.) at the start
    return /^[•\-*]\s/.test(trimmed);
  };

  // Function to parse bullet point
  const parseBulletPoint = (text: string): { bullet: string; content: string } => {
    const trimmed = text.trim();
    const match = trimmed.match(/^([•\-*])\s*(.*)$/);
    if (match) {
      return {
        bullet: match[1],
        content: match[2] || '',
      };
    }
    return { bullet: '', content: trimmed };
  };

  // Function to parse text with nested strong tags
  const parseTextWithNestedTags = (text: string) => {
    if (!text) return [];
    
    const parts: any[] = [];
    const strongRegex = /<strong>(.*?)<\/strong>/gi;
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    while ((match = strongRegex.exec(text)) !== null) {
      // Add text before strong tag
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        const cleanedBefore = decodeHTML(beforeText.replace(/<[^>]*>/g, ''));
        if (cleanedBefore.trim()) {
          parts.push({ type: 'text', content: cleanedBefore, key: `text-${keyCounter++}` });
        }
      }
      // Add strong content
      const strongContent = decodeHTML(match[1]);
      if (strongContent.trim()) {
        parts.push({ type: 'strong', content: strongContent, key: `strong-${keyCounter++}` });
      }
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex);
      const cleanedRemaining = decodeHTML(remaining.replace(/<[^>]*>/g, ''));
      if (cleanedRemaining.trim()) {
        parts.push({ type: 'text', content: cleanedRemaining, key: `text-${keyCounter++}` });
      }
    }

    // If no strong tags found, return the whole text
    if (parts.length === 0) {
      const cleanedText = decodeHTML(text.replace(/<[^>]*>/g, ''));
      if (cleanedText.trim()) {
        parts.push({ type: 'text', content: cleanedText, key: `text-${keyCounter++}` });
      }
    }

    return parts;
  };

  // Function to parse and render HTML content
  const parseHTMLContent = (htmlString: string) => {
    if (!htmlString) return [];

    const elements: any[] = [];
    let keyCounter = 0;

    // Split by block-level tags (h3, p) while preserving them
    const blockTagRegex = /<(h3|p)([^>]*)>(.*?)<\/\1>/gis;
    const brRegex = /<br\s*\/?>/gi;
    
    let lastIndex = 0;
    let match;

    // First, find all block tags
    const blockTags: any[] = [];
    while ((match = blockTagRegex.exec(htmlString)) !== null) {
      blockTags.push({
        type: match[1].toLowerCase(),
        fullMatch: match[0],
        content: match[3],
        index: match.index,
        endIndex: match.index + match[0].length,
      });
    }

    // Process block tags in order
    blockTags.forEach((blockTag) => {
      // Add any text or br tags before this block tag
      const beforeText = htmlString.substring(lastIndex, blockTag.index);
      
      // Check for br tags in the before text
      const brMatches = beforeText.match(brRegex);
      if (brMatches) {
        brMatches.forEach(() => {
          elements.push({
            type: 'br',
            key: `br-${keyCounter++}`,
          });
        });
      }
      
      // Add the block tag
      const content = blockTag.content;
      const hasNestedTags = /<strong>|<b>/.test(content);
      
      elements.push({
        type: blockTag.type,
        content: content,
        hasNestedTags: hasNestedTags,
        key: `block-${keyCounter++}`,
      });

      lastIndex = blockTag.endIndex;
    });

    // Handle remaining content after last block tag
    if (lastIndex < htmlString.length) {
      const remaining = htmlString.substring(lastIndex);
      const brMatches = remaining.match(brRegex);
      if (brMatches) {
        brMatches.forEach(() => {
          elements.push({
            type: 'br',
            key: `br-${keyCounter++}`,
          });
        });
      }
    }

    return elements;
  };

  // Function to render HTML elements
  const renderHTMLElements = (htmlString: string) => {
    const elements = parseHTMLContent(htmlString);
    const baseTextColor = theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy;

    return elements.map((element) => {
      switch (element.type) {
        case 'h3':
          const h3Parts = parseTextWithNestedTags(element.content);
          return (
            <Text
              key={element.key}
              style={[
                styles.summaryText,
                {
                  color: baseTextColor,
                  fontWeight: '700',
                  fontSize: 18,
                  // marginTop: 2,
                  marginBottom: 8,
                  lineHeight: 24,
                },
              ]}
            >
              {h3Parts.map((part) => {
                if (part.type === 'strong') {
                  return (
                    <Text key={part.key} style={{ fontWeight: '700' }}>
                      {part.content}
                    </Text>
                  );
                }
                return part.content;
              })}
            </Text>
          );

        case 'p':
          const pContent = element.content;
          const cleanedPContent = decodeHTML(pContent.replace(/<[^>]*>/g, ''));
          
          if (!cleanedPContent.trim()) {
            // Empty paragraph, just add spacing
            return <View key={element.key} style={{ height: 8 }} />;
          }

          // Check if paragraph contains numbered list items or bullet points
          const lines = cleanedPContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          const hasNumberedList = lines.some(line => isNumberedListItem(line));
          const hasBulletPoints = lines.some(line => isBulletPoint(line));

          if (hasNumberedList) {
            // Render as numbered list with proper alignment
            return (
              <View key={element.key} style={{ }}>
                {lines.map((line, lineIndex) => {
                  if (isNumberedListItem(line)) {
                    const { number, content } = parseNumberedListItem(line);
                    const contentParts = parseTextWithNestedTags(content);
                    
                    return (
                      <View
                        key={`list-item-${lineIndex}`}
                        style={styles.listItemContainer}
                      >
                        <Text
                          style={[
                            styles.listNumber,
                            {
                              color: baseTextColor,
                            },
                          ]}
                        >
                          {number}
                        </Text>
                        <View style={styles.listContentContainer}>
                          <Text
                            style={[
                              styles.summaryText,
                              {
                                color: baseTextColor,
                                fontWeight: 'normal',
                                fontSize: 14,
                                lineHeight: 22,
                              },
                            ]}
                          >
                            {contentParts.map((part) => {
                              if (part.type === 'strong') {
                                return (
                                  <Text key={part.key} style={{ fontWeight: '700' }}>
                                    {part.content}
                                  </Text>
                                );
                              }
                              return part.content;
                            })}
                          </Text>
                        </View>
                      </View>
                    );
                  } else {
                    // Regular text line (not a numbered list item)
                    const textParts = parseTextWithNestedTags(line);
                    return (
                      <Text
                        key={`text-line-${lineIndex}`}
                        style={[
                          styles.summaryText,
                          {
                            color: baseTextColor,
                            fontWeight: 'normal',
                            fontSize: 14,
                            // marginBottom: lineIndex < lines.length - 1 ? 6 : 0,
                            lineHeight: 22,
                          },
                        ]}
                      >
                        {textParts.map((part) => {
                          if (part.type === 'strong') {
                            return (
                              <Text key={part.key} style={{ fontWeight: '700' }}>
                                {part.content}
                              </Text>
                            );
                          }
                          return part.content;
                        })}
                      </Text>
                    );
                  }
                })}
              </View>
            );
          }

          if (hasBulletPoints) {
            // Render as bullet list with proper alignment
            return (
              <View key={element.key} style={{ }}>
                {lines.map((line, lineIndex) => {
                  if (isBulletPoint(line)) {
                    const { bullet, content } = parseBulletPoint(line);
                    const contentParts = parseTextWithNestedTags(content);
                    
                    return (
                      <View
                        key={`bullet-item-${lineIndex}`}
                        style={styles.listItemContainer}
                      >
                        <Text
                          style={[
                            styles.bulletPoint,
                            {
                              color: baseTextColor,
                            },
                          ]}
                        >
                          {bullet}
                        </Text>
                        <View style={styles.listContentContainer}>
                          <Text
                            style={[
                              styles.summaryText,
                              {
                                color: baseTextColor,
                                fontWeight: 'normal',
                                fontSize: 14,
                                lineHeight: 22,
                              },
                            ]}
                          >
                            {contentParts.map((part) => {
                              if (part.type === 'strong') {
                                return (
                                  <Text key={part.key} style={{ fontWeight: '700' }}>
                                    {part.content}
                                  </Text>
                                );
                              }
                              return part.content;
                            })}
                          </Text>
                        </View>
                      </View>
                    );
                  } else {
                    // Regular text line (not a bullet point)
                    const textParts = parseTextWithNestedTags(line);
                    return (
                      <Text
                        key={`text-line-${lineIndex}`}
                        style={[
                          styles.summaryText,
                          {
                            color: baseTextColor,
                            fontWeight: 'normal',
                            fontSize: 14,
                            lineHeight: 22,
                          },
                        ]}
                      >
                        {textParts.map((part) => {
                          if (part.type === 'strong') {
                            return (
                              <Text key={part.key} style={{ fontWeight: '700' }}>
                                {part.content}
                              </Text>
                            );
                          }
                          return part.content;
                        })}
                      </Text>
                    );
                  }
                })}
              </View>
            );
          }

          // Regular paragraph (no numbered list or bullets)
          const pParts = parseTextWithNestedTags(element.content);
          return (
            <Text
              key={element.key}
              style={[
                styles.summaryText,
                {
                  color: baseTextColor,
                  fontWeight: 'normal',
                  fontSize: 14,
                  // marginBottom: 12,
                  lineHeight: 22,
                },
              ]}
            >
              {pParts.map((part) => {
                if (part.type === 'strong') {
                  return (
                    <Text key={part.key} style={{ fontWeight: '700' }}>
                      {part.content}
                    </Text>
                  );
                }
                return part.content;
              })}
            </Text>
          );

        case 'br':
          return <View key={element.key} style={{ height: 8 }} />;

        default:
          return null;
      }
    });
  };

  // Function to render summary paragraphs (updated to handle HTML)
  const renderSummaryParagraphs = (paragraphs: string[]) => {
    console.log('paragraphs---->', paragraphs);

    if (!paragraphs || paragraphs.length === 0) {
      return null;
    }

    // Check if content contains HTML tags
    const hasHTML = paragraphs.some((para) => 
      /<[^>]+>/.test(para)
    );

    if (hasHTML) {
      // Join all paragraphs and render as HTML
      const htmlContent = paragraphs.join('');
      return renderHTMLElements(htmlContent);
    }

    // Fallback to original rendering for plain text
    return paragraphs.map((para: string, index: number) => {
      const baseStyle = [
        styles.summaryText,
        {
          color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
        },
      ];

      const isHeading = para.length < 80 && !para.endsWith('.') && !para.endsWith('?');

      if (isHeading) {
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
                {/* <Text
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
                </Text> */}
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
    marginBottom: responsiveWidth('10%'),
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
    lineHeight: 15,
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
    marginTop: responsiveWidth('5%'),
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
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // marginBottom: 8,
  },
  listNumber: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    minWidth: responsiveWidth(4),
  },
  bulletPoint: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    minWidth: responsiveWidth(2),
    // marginTop: 2,
  },
  listContentContainer: {
    flex: 1,
    // paddingLeft: responsiveWidth(1),
  },
});

export default ResourcesDetailsScreen;
