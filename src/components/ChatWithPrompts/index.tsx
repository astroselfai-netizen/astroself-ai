import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Image,
  ImageBackground,
  Modal,
} from 'react-native';
import {
  responsiveWidth,
  responsiveHeight,
  fontSize,
  fontFamily,
  color,
} from '../../constant/theme';
import { MainContainer } from '../common/mainContainer';
import serviceFactory from '../../services/serviceFactory';
import { useNavigation } from '@react-navigation/native';
import { icons } from '../../assets';
import UserService from '../../services/user/user.service';
import { useTheme } from '../../context/ThemeContext';
import LottieView from 'lottie-react-native';

interface ChatWithPromptsProps {
  userId: string;
  cardTitles?: string;
  tab?: string;
  planet?: string;
}

interface PredictionTopic {
  id: string;
  title: string;
  content?: string;
  isExpanded: boolean;
}

const ChatWithPrompts: React.FC<ChatWithPromptsProps> = ({
  userId,
  cardTitles,
  tab: _tab,
  planet,
}) => {
  const [topics, setTopics] = useState<PredictionTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTopicId, setLoadingTopicId] = useState<string | null>(null);
  const [loadingTime, setLoadingTime] = useState<number>(0);
  const userService = serviceFactory.get<UserService>('UserService');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCardTitle, setSelectedCardTitle] = useState(cardTitles);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const navigation = useNavigation<any>();
  const { theme, colors } = useTheme();

  // Timer effect for loading time
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loadingTopicId) {
      setLoadingTime(0);
      interval = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadingTopicId]);

  // topic state
  const [selectedTopicValue, setSelectedTopicValue] = useState(
    cardTitles === 'Antardasha'
      ? 'General Analysis'
      : _tab === 'SnapCast'
      ? 'Your Personality'
      : 'Your Tendencies',
  );


   const topicOptions = [
     { title: 'Your Tendencies', value: 'Your Tendencies' },
     { title: 'Summary', value: 'Summary' },
     { title: 'Predictions set 1-L', value: 'Lords in Houses' },
     { title: 'Predictions set 2-P', value: 'Planets in Signs' },
     { title: 'Predictions set 3-N', value: 'Nakshatra Themes' },
   ];

  // Special topic options for Antardasha
  const antardashaTopicOptions = [
    { title: 'General Analysis', value: 'General Analysis' },
    { title: 'Planet', value: 'Planet' },
    { title: 'Nakshatra', value: 'Nakshatra' },
    { title: 'Moon Lagna', value: 'Moon Lagna' },
  ];

  // Labels for Antardasha topic options
  const antardashaTopicLabels = [
    { title: 'General Analysis', value: 'General Analysis' },
    { title: 'Prediction Set 1-P', value: 'Prediction Set 1-P' },
    { title: 'Prediction Set 2-N', value: 'Prediction Set 2-N' },
    { title: 'Prediction Set 3-ML', value: 'Prediction Set 3-ML' },
  ];

  // Card options for General Analysis
  const generalAnalysisCards = [
    // { title: 'General Analysis',subtitle: 'Strengths, Patterns', value: 'General Analysis' },
    // { title: 'Snapshot Prediction',subtitle: 'Future, Glimpse', value: 'Snapshot Prediction' },
    { title: 'Personality', subtitle: 'Vitality, Attitude', value: 'Personality, Attitude, Vitality' },
    { title: 'Family & Values', subtitle: 'Wealth, Comfort', value: 'Family, Wealth, Comfort, Values' },
    { title: 'Communication', subtitle: 'Speaking, Skills', value: 'Style of speaking, Siblings, Courage, Skills' },
    { title: 'Home', subtitle: 'Happiness, Foundation', value: 'Home, happiness, Emotional foundation' },
    { title: 'Love & Romance', subtitle: 'Celebration, Hobbies', value: 'Love affairs, Romance, Children, Celebration, hobbies' },
    { title: 'Health & Service', subtitle: 'Routines, Care', value: 'Health, Daily routines, service to others, Conflict' },
    { title: 'Marriage & Partnerships', subtitle: 'Business, Relationships', value: 'Marriage, Relationships, partnerships business travel' },
    { title: 'Sexuality & Transformation', subtitle: 'Inheritance, Intimacy', value: 'Sexuality, Intimacy, Inheritance, Occult, Transformation, Unearned income' },
    { title: 'Higher Education', subtitle: 'Philosophy, Travel', value: 'Higher education, Philosophy, Long distance Travel' },
    { title: 'Career & Reputation', subtitle: 'Status, Recognition', value: 'Career, Reputation, Status in Society, Recognition' },
    { title: 'Income & Innovation', subtitle: 'New Ideas, Work', value: 'Income, Network, Innovation, New ideas' },
    { title: 'Subconscious & Spirituality', subtitle: 'Hidden Enemies, Mind', value: 'Subconcious Mind, Spirituality, Hidden enemies, Losses and investment' },
  ];

  // Card options for Current Situation
  const currentSituationCards = [
    { title: planet || 'Antardasha', subtitle: 'General Analysis', value: 'Antardasha' },
    { title: 'Life on the Horizon', subtitle: 'Life on the Horizon', value: 'Life on the Horizon' },
    { title: 'Life at the Moment', subtitle: 'Life at the Moment', value: 'Life at the Moment' },
  ];

  // Get current card options based on the current cardTitles
  const getCurrentCardOptions = () => {
    if (
      _tab === 'LifeView' 
    ) {
      return generalAnalysisCards;
    } else if (_tab === 'LifeNow') {
      return currentSituationCards;
    }
    // Default fallback
    return generalAnalysisCards;
  };

  // Reset expanded topic and clear content when cardTitles or selectedTopicValue changes
  useEffect(() => {
    setExpandedTopic(null);
    setHasAutoExpanded(false);
    setTopics(prevTopics => 
      prevTopics.map(topic => ({
        ...topic,
        content: `Welcome! I'm here to guide you through your cosmic journey. What would you like to explore about your birth chart today? This is detailed content for ${topic.title}.`,
        isExpanded: false
      }))
    );
  }, [cardTitles, selectedTopicValue]);

  // Update selectedCardTitle when cardTitles prop changes
  useEffect(() => {
    setSelectedCardTitle(cardTitles || '');
  }, [cardTitles]);

  // Handle card title selection
  const handleCardTitleSelect = (newCardTitle: string) => {
    console.log('newCardTitle-->165', newCardTitle);
    setSelectedCardTitle(newCardTitle);
    setShowDropdown(false);
    // Reset expanded topic when changing card title
    setExpandedTopic(null);
    setHasAutoExpanded( false);
  };

  console.log('cardTitle-->3', cardTitles);

  // API call to fetch blended predictions
  const fetchBlendedPredictions = useCallback(async () => {
    try {
      setLoading(true);

      console.log('cardTitle866', selectedCardTitle);
      console.log('userId---->', selectedTopicValue);

      // Determine mainHeading based on selectedCardTitle
      let mainHeading = 'General Analysis'; // default

      if (selectedCardTitle) {
        switch (selectedCardTitle) {
          case 'General Analysis':
            mainHeading = 'General Analysis';
            break;
          case 'Your Personality':
            mainHeading = 'Your Personality';
            break;

          case 'Life on the Horizon':
            mainHeading = 'Life on the Horizon';
            break;
          case 'Life at the Moment':
            mainHeading = 'Life at the Moment';
            break;
          case 'Antardasha':
            mainHeading = 'Antardasha';
            break;
          case 'Snapshot Prediction':
            mainHeading = 'Snapshot Prediction';
            break;
          case 'Current predictions':
            mainHeading = 'Current predictions';
            break;
          case 'Additional Predictions':
            mainHeading = 'Additional Predictions';
            break;
          case 'Personality':
            mainHeading = 'Personality, Attitude, Vitality';
            break;
          case 'Family & Values':
            mainHeading = 'Family, Wealth, Comfort, Values';
            break;
          case 'Communication':
            mainHeading = 'Style of speaking, Siblings, Courage, Skills';
            break;
          case 'Home':
            mainHeading = 'Home, happiness, Emotional foundation';
            break;
          case 'Love & Romance':
            mainHeading =
              'Love affairs, Romance, Children, Celebration, hobbies';
            break;
          case 'Health & Service':
            mainHeading = 'Health, Daily routines, service to others, Conflict';
            break;
          case 'Marriage & Partnerships':
            mainHeading =
              'Marriage, Relationships, partnerships business travel';
            break;
          case 'Sexuality & Transformation':
            mainHeading =
              'Sexuality, Intimacy, Inheritance, Occult, Transformation, Unearned income';
            break;
          case 'Higher Education':
            mainHeading = 'Higher education, Philosophy, Long distance Travel';
            break;
          case 'Career & Reputation':
            mainHeading = 'Career, Reputation, Status in Society, Recognition';
            break;
          case 'Income & Innovation':
            mainHeading = 'Income, Network, Innovation, New ideas';
            break;
          case 'Subconscious & Spirituality':
            mainHeading =
              'Subconcious Mind, Spirituality, Hidden enemies, Losses and investment';
            break;
          default:
            mainHeading = selectedCardTitle;
        }
      }

      console.log('selectedTopicValue---->', selectedTopicValue);

      // Map selectedTopicValue to correct topic parameter for house/categorize API
      let apiTopic = 'Blended Predictions';
      switch (selectedTopicValue) {
        case 'Your Tendencies':
          apiTopic = 'Your Tendencies';
          break;
        case 'Summary':
          apiTopic = 'General';
          break;
        case 'Lords in Houses':
          apiTopic = 'Lord';
          break;
        case 'Planets in Signs':
          apiTopic = 'Planet';
          break;
        case 'Nakshatra Themes':
          apiTopic = 'Nakshatra';
          break;
        case 'General Analysis':
          apiTopic = 'General Analysis';
          break;
        case 'Planet':
          apiTopic = 'Planet';
          break;
        case 'Nakshatra':
          apiTopic = 'Nakshatra';
          break;
        case 'Moon Lagna':
          apiTopic = 'Moon Lagna';
          break;
        case 'Life on the Horizon':
          apiTopic = 'Life on the Horizon';
          break;
        case 'Life at the Moment':
          apiTopic = 'Life at the Moment';
          break;
        default:
          apiTopic = 'Blended Predictions';
      }

      console.log(
        'Calling API with mainHeading:',
        mainHeading,
        'topic/planet:',
        apiTopic,
      );

      let response;
      
      // Handle different API calls based on mainHeading
      if (mainHeading === 'Antardasha') {

        if (apiTopic === 'Your Tendencies') {
          apiTopic = 'General Analysis';
          setSelectedTopicValue('General Analysis');
        }
        response = await userService.getAntardashaData(
          userId,
          mainHeading,
          apiTopic, // In this case, apiTopic contains the planet parameter
        );
      } else if (mainHeading === 'Current predictions' || mainHeading === 'Additional Predictions' || mainHeading === 'Life on the Horizon' || mainHeading === 'Life at the Moment') {
        response = await userService.getDashaCategorizeData(
          userId,
          mainHeading,
        );
      } else {
        // Call house/categorize API for all other cases

        console.log('apiTopic---->228', mainHeading);
        console.log('apiTopic---->229', apiTopic);

        response = await userService.getBlendedPredictions(
          userId,
          mainHeading,
          apiTopic,
        );
      }

      console.log('Categories response:', response);

      // Transform response into topics with expanded state
      const transformedTopics: PredictionTopic[] = response.map(
        (title: string, index: number) => ({
          id: `topic_${index}`,
          title,
          content: `Welcome! I'm here to guide you through your cosmic journey. What would you like to explore about your birth chart today? This is detailed content for ${title}.`,
          isExpanded: false,
        }),
      );

      setTopics(transformedTopics);
    } catch (error) {
      console.error('Error fetching blended predictions:', error);
      Alert.alert('Error', 'Failed to load predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedCardTitle, selectedTopicValue, userService]);

  const toggleExpanded = useCallback(async (topicId: string, topicTitle: string, forceRefresh: boolean = false) => {
    if (expandedTopic === topicId && !forceRefresh) {
      // If already expanded, collapse it
      setExpandedTopic(null);
      return;
    }

    // Collapse any currently expanded topic and expand the new one
    setExpandedTopic(topicId);

    // Find the topic to get its title
    const topic = topics.find(t => t.id === topicId);
    if (
      !forceRefresh &&
      topic &&
      topic.content &&
      !topic.content.includes("Welcome! I'm here to guide you") &&
      !topic.content.includes('Error loading content')
    ) {
      // Content already loaded, no need to fetch again
      console.log('Content already loaded for topic:', topic.title);
      return;
    }

    try {
      // Show loading for this specific topic
      setLoadingTopicId(topicId);

      console.log('Fetching AI content for topic:', topic?.title);
      console.log('API call parameters:', {
        userId: userId || '68bab4b85f4bc17df0359d83',
        topic: selectedCardTitle || 'General Analysis',
        subTopic: topicTitle || 'about_house',
      });

      console.log('selectedCardTitle---->293', selectedCardTitle);
      console.log('topicTitle---->294', topicTitle);

      // Call appropriate AI response API based on selectedCardTitle
      let aiResponse;
      if (selectedCardTitle === 'Antardasha') {
        aiResponse = await userService.getAntardashaAiResponse(
          userId || '68bab4b85f4bc17df0359d83',
          selectedCardTitle || 'Antardasha',
          topicTitle || 'General Analysis',
        );
      } else if (selectedCardTitle === 'Current predictions' || selectedCardTitle === 'Additional Predictions' || selectedCardTitle === 'Life on the Horizon' || selectedCardTitle === 'Life at the Moment') {
        // For Current predictions and Additional Predictions, call the dasha AI response API
        aiResponse = await userService.getDashaAiResponse(
          userId || '68bab4b85f4bc17df0359d83',
          selectedCardTitle || 'Additional Predictions',
          topicTitle || 'General Analysis',
        );
      } else {
        aiResponse = await userService.getGenerateHeadingAiResponse(
          userId || '68bab4b85f4bc17df0359d83',
          selectedCardTitle || 'General Analysis',
          topicTitle || 'about_house',
        );
      }

      console.log('AI response received:', aiResponse);
      console.log('AI response type:', typeof aiResponse);
      console.log('AI response keys:', Object.keys(aiResponse || {}));
      console.log('AI response data:', aiResponse?.data);
      console.log('AI response data type:', typeof aiResponse?.data);
      console.log(
        'AI response data is array252',
        aiResponse && aiResponse.data && Array.isArray(aiResponse.data),
      );

      // Update the topic with AI content
      if (aiResponse && aiResponse.data) {
        console.log('Processing AI data---258', aiResponse.data);

        let aiContent = '';

        // Handle different response structures
        let dataArray: any[] = [];
        if (Array.isArray(aiResponse.data)) {
          // Direct array response (for regular house/categorize API)
          dataArray = aiResponse.data;
        } else if (aiResponse.data.data && Array.isArray(aiResponse.data.data)) {
          // Nested data array response (for dasha AI response)
          dataArray = aiResponse.data.data;
        } else {
          console.log('Unexpected response structure:', aiResponse.data);
          dataArray = [];
        }

        // Process each item in the data array
        for (const item of dataArray) {
          console.log('Processing item---264', item);

          // Check for different possible structures
          let contentArray = null;
          let contentKey = null;

          // Check if this is a direct Antardasha response structure (item has heading and insights directly)
          if ((item as any).heading && (item as any).insights) {
            // This is a direct Antardasha response - process it directly
            console.log('Processing direct Antardasha response item:', item);
            
            const heading = (item as any).heading || topic?.title || 'Topic';
            let insights = '';

            if (Array.isArray((item as any).insights)) {
              // If insights is an array, join them with proper formatting
              insights = (item as any).insights.join('\n\n');
            } else if (typeof (item as any).insights === 'string') {
              // If insights is a single string, use it directly
              insights = (item as any).insights;
            } else {
              insights = 'No insights available.';
            }

            console.log('Antardasha - Heading:', heading);
            console.log('Antardasha - Insights length:', insights.length);
            console.log('Antardasha - Insights preview:', insights.substring(0, 100) + '...');

            if (aiContent) {
              aiContent += '\n\n';
            }
            aiContent += `${insights}`;
            
            // Skip the array processing since we handled this item directly
            continue;
          }

          // Priority: General Summary and Snapshot Prediction first (new structures), then existing ones
          if (
            (item as any)['General Summary'] &&
            Array.isArray((item as any)['General Summary'])
          ) {
            contentArray = (item as any)['General Summary'];
            contentKey = 'General Summary';
          } else if (
            (item as any)['Snapshot Prediction'] &&
            Array.isArray((item as any)['Snapshot Prediction'])
          ) {
            contentArray = (item as any)['Snapshot Prediction'];
            contentKey = 'Snapshot Prediction';
          } else if (
            (item as any).about_house &&
            Array.isArray((item as any).about_house)
          ) {
            contentArray = (item as any).about_house;
            contentKey = 'about_house';
          } else if (
            (item as any).Lord &&
            Array.isArray((item as any).Lord)
          ) {
            contentArray = (item as any).Lord;
            contentKey = 'Lord';
          } else if (
            (item as any).Planet &&
            Array.isArray((item as any).Planet)
          ) {
            contentArray = (item as any).Planet;
            contentKey = 'Planet';
          } else if (
            (item as any).Nakshatra &&
            Array.isArray((item as any).Nakshatra)
          ) {
            contentArray = (item as any).Nakshatra;
            contentKey = 'Nakshatra';
          }

          if (contentArray) {
            console.log(`Processing ${contentKey}:`, contentArray);
            console.log(`Content array length: ${contentArray.length}`);

            // Process each content item
            for (const contentItem of contentArray) {
              console.log('Processing contentItem:', contentItem);
              console.log('ContentItem type:', typeof contentItem);
              console.log('ContentItem keys:', Object.keys(contentItem));

              const heading = contentItem.heading || topic?.title || 'Topic';
              let insights = '';

              if (Array.isArray(contentItem.insights)) {
                // If insights is an array, join them with proper formatting
                insights = contentItem.insights.join('\n\n');
              } else if (typeof contentItem.insights === 'string') {
                // If insights is a single string, use it directly
                // For General Summary, the insights are already formatted with bullet points
                insights = contentItem.insights;
              } else {
                insights = 'No insights available.';
              }

              console.log('Insights type:', typeof contentItem.insights);
              console.log('Insights length:', insights.length);

              console.log('Heading:', heading);
              console.log('Insights length:', insights.length);
              console.log(
                'Insights preview:',
                insights.substring(0, 100) + '...',
              );

              // Special handling for Snapshot Prediction insights formatting
              if (
                contentKey === 'Snapshot Prediction' &&
                insights.includes('This is for females')
              ) {
                console.log(
                  'Processing Snapshot Prediction with gender-specific content',
                );
              }

              if (aiContent) {
                aiContent += '\n\n';
              }
              aiContent += `${insights}`;
            }
          } else {
            console.log(
              'No recognized content structure found in item:',
              item,
            );
          }
        }

        console.log('Final AI content:', aiContent);
        console.log('Final AI content length:', aiContent.length);

        // Update the specific topic with AI content
        setTopics(prevTopics =>
          prevTopics.map(t =>
            t.id === topicId
              ? { ...t, content: aiContent || 'No content available' }
              : t,
          ),
        );
      } else {
        console.log('AI response structure is not as expected:', aiResponse);

        // Try to extract content from different possible structures
        let fallbackContent = 'Unable to load content. Please try again.';

        if (aiResponse && typeof aiResponse === 'object') {
          // Try to find any text content in the response
          const responseStr = JSON.stringify(aiResponse);
          if (
            responseStr.includes('insights') ||
            responseStr.includes('heading')
          ) {
            fallbackContent =
              'Content received but parsing failed. Check console for details.';
          }
        }

        // Fallback: Set a default content
        setTopics(prevTopics =>
          prevTopics.map(t =>
            t.id === topicId ? { ...t, content: fallbackContent } : t,
          ),
        );
      }
    } catch (error: any) {
      console.error('Error fetching AI content:', error);

      // Set error content with retry option
      const errorMessage = error.message || 'Unknown error';
      const errorContent =
        'Error loading content: ' + errorMessage + '\n\nTap to retry.';

      setTopics(prevTopics =>
        prevTopics.map(t =>
          t.id === topicId
            ? {
                ...t,
                content: errorContent,
              }
            : t,
        ),
      );
    } finally {
      setLoadingTopicId(null);
    }
  }, [expandedTopic, topics, userId, selectedCardTitle, userService]);

  useEffect(() => {
    if (userId) {
      fetchBlendedPredictions();
    }
  }, [userId, selectedCardTitle, selectedTopicValue, fetchBlendedPredictions]);

  // Auto-expand and generate AI content when only one topic is available
  // useEffect(() => {

    // if (topics.length === 1 && !loading && !hasAutoExpanded) {
    //   const singleTopic = topics[0];
    //   setExpandedTopic(singleTopic.id);
    //   setHasAutoExpanded(true);
    //   // Automatically trigger AI content generation for the single topic
    //   setTimeout(() => {
    //     toggleExpanded(singleTopic.id, singleTopic.title, true);
    //   }, 100);
    // }

  // }, [topics, loading, hasAutoExpanded, toggleExpanded]);

  const renderArrowIcon = (isExpanded: boolean) => (
    <Image 
      source={require('../../assets/icons/Dropdown.png')} 
      style={[
        styles.arrowIcon,
        {
          tintColor: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
        },
        { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }
      ]} 
    />
  );

  if (loading) {
    return (
      <MainContainer>
        <View style={styles.loadingContainer}>
          {/* <ActivityIndicator size="large" color={theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy} />
          <Text style={[styles.loadingText,{
            color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
          }]}>Loading predictions...</Text> */}
          <LottieView
            source={require('../../assets/lottie/loader-Animation-1.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <StatusBar barStyle="light-content" backgroundColor="#202945" />
      {/* <TouchableOpacity
        style={styles.container}
        activeOpacity={1}
        onPress={() => showDropdown && setShowDropdown(false)}
      > */}
      {/* Header with back button */}
      <View
        style={[
          styles.header,
          {
            backgroundColor:
              theme === 'dark' ? colors.transparent : colors.surface,
            borderColor:
              theme === 'dark'
                ? colors.themeBorderDropdown
                : colors.borderColor,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Image
              source={icons.Icback}
              style={[
                styles.backIcon,
                {
                  tintColor:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
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
              {_tab}
            </Text>
          </View>
          <View style={styles.headerRight}>
            {_tab === 'LifeNow' && (
              <TouchableOpacity
                onPress={() => setShowNoteModal(true)}
                activeOpacity={0.7}
              >
                <Image
                  source={icons.IcrightNote}
                  style={[
                    styles.headerRightIcon,
                    {
                      tintColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      {/* cardTitles dropdown section */}
      <View
        style={[
          styles.dropdownContainer,
          {
            backgroundColor:
              theme === 'dark' ? colors.transparent : colors.surface,
            borderColor:
              theme === 'dark'
                ? colors.themeBorderDropdown
                : colors.borderColor,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            {
              backgroundColor:
                theme === 'dark' ? colors.cardBackground : colors.white,
              borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,
            },
          ]}
          onPress={() => {
            if (_tab !== 'SnapCast') {
              setShowDropdown(!showDropdown);
            }
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownButtonText,
              {
                color:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
          >
            {getCurrentCardOptions().find(
              card => card.value === selectedCardTitle,
            )?.title || selectedCardTitle}
          </Text>
          {renderArrowIcon(showDropdown)}
        </TouchableOpacity>

        {showDropdown && (
          <View
            style={[
              styles.dropdownList,
              {
                backgroundColor:
                  theme === 'dark' ? colors.cardBackground : colors.white,
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              style={[
                styles.dropdownScrollView,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.cardBackground : colors.white,
                },
              ]}
            >
              {getCurrentCardOptions().map((card, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    {
                      backgroundColor:
                        theme === 'dark' ? colors.cardBackground : colors.white,
                        borderBottomColor: theme === 'dark' ? colors.themeBorderDropdown : colors.borderColor,
                    },
                    selectedCardTitle === card.value &&
                      styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    handleCardTitleSelect(card.value);
                    // setExpandedTopic(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                      selectedCardTitle === card.value &&
                        styles.dropdownItemTextSelected,
                    ]}
                  >
                    {card.title} {card.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Horizontal Tabs Section */}
      {(() => {
        // Check if cardTitles contains values that don't need tabs
        const shouldHideTabs =
          selectedCardTitle?.includes('General Analysis') ||
          selectedCardTitle?.includes('Snapshot Prediction') ||
          selectedCardTitle?.includes('Current predictions') ||
          _tab?.includes('SnapCast') ||
          selectedCardTitle?.includes('Additional Predictions') ||
          selectedCardTitle?.includes('Life on the Horizon') ||
          selectedCardTitle?.includes('Life at the Moment');

        // Don't render tabs if they should be hidden
        if (shouldHideTabs) {
          return null;
        }

        const tabOptions =
          selectedCardTitle === 'Antardasha'
            ? antardashaTopicOptions
            : topicOptions;
        const tabLabels =
          selectedCardTitle === 'Antardasha'
            ? antardashaTopicLabels
            : topicOptions;

        return (
          <View style={styles.tabsContainer}>
            <ImageBackground
              source={
                theme === 'dark'
                  ? require('../../assets/image/DarkBackground.png')
                  : require('../../assets/image/LightBackground.png')
              }
              blurRadius={12}
              style={[
                styles.tabsBackground,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.cardBackground : colors.white,
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
                    theme === 'dark' ? colors.cardBackground : colors.white,
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
                      theme === 'dark' ? colors.cardBackground : colors.white,
                  },
                ]}
              >
                {tabOptions.map((option, index) => {
                  const displayText = tabLabels[index].title;
                  const isSelected = selectedTopicValue === option.value;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.tabItem,
                        isSelected && styles.tabItemSelected,
                        {
                          backgroundColor:
                            theme === 'dark'
                              ? colors.cardBackground
                              : colors.white,
                        },
                      ]}
                      onPress={() => {
                        setSelectedTopicValue(option.value);
                        // Reset expanded topic when changing topic selection
                        setExpandedTopic(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          isSelected && styles.tabTextSelected,
                          {
                            color:
                              theme === 'dark'
                                ? colors.themeTextWhite
                                : colors.DarkNavy,
                          },
                        ]}
                      >
                        {displayText}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </ImageBackground>
          </View>
        );
      })()}
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.topicsContainer}>
            {topics.map(topic => (
              <ImageBackground
                key={topic.id}
                source={
                  theme === 'dark'
                    ? require('../../assets/image/DarkBackground.png')
                    : require('../../assets/image/LightBackground.png')
                }
                blurRadius={12}
                style={[
                  styles.topicCard,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.cardBackground : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                  },
                ]}
                imageStyle={styles.topicCardBgImage}
              >
                <View style={styles.topicCardOverlay} />
                <TouchableOpacity
                  style={[
                    styles.topicHeader,
                    {
                      backgroundColor:
                        theme === 'dark' ? colors.transparent : colors.white,
                      borderColor:
                        theme === 'dark'
                          ? colors.themeBorderDropdown
                          : colors.borderColor,
                    },
                  ]}
                  onPress={() => toggleExpanded(topic.id, topic.title)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.topicTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    {topic.title}
                  </Text>
                  {renderArrowIcon(expandedTopic === topic.id)}
                </TouchableOpacity>

                {expandedTopic === topic.id && (
                  <View
                    style={[
                      styles.topicContent,
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
                    {loadingTopicId === topic.id ? (
                      <View
                        style={[
                          styles.topicLoadingContainer,
                          {
                            backgroundColor:
                              theme === 'dark'
                                ? colors.transparent
                                : colors.white,
                            borderColor:
                              theme === 'dark'
                                ? colors.themeBorderDropdown
                                : colors.borderColor,
                          },
                        ]}
                      >
                        <ActivityIndicator size="small" color="#F2994A" />
                        <Text
                          style={[
                            styles.topicLoadingText,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          Generating AI insights...
                        </Text>
                        <Text
                          style={[
                            styles.topicLoadingText,
                            styles.topicLoadingSubText,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          Loading time: {loadingTime}s (may take 30-60 seconds)
                        </Text>
                      </View>
                    ) : (
                      // <View style={styles.topicContent}>
                      <Text
                        style={[
                          styles.topicText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.themeTextWhite
                                : colors.DarkNavy,
                          },
                        ]}
                      >
                        {topic.content || 'No content available'}
                      </Text>
                      // </View>
                    )}
                  </View>
                )}
              </ImageBackground>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent={true}
        // style={styles.modalOverlay}
        animationType="fade"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ImageBackground
            source={require('../../assets/image/DarkBackground.png')}
            blurRadius={12}
            style={styles.modalContainer}
            imageStyle={styles.modalBgImage}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Note</Text>
              <TouchableOpacity
                onPress={() => setShowNoteModal(false)}
                // style={styles.closeButton}
                // activeOpacity={0.7}
              >
                <Image source={icons.Icclose} style={styles.closeButtonImage} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalDivider} />
            <View style={styles.modalContent}>
              <Text style={styles.modalSectionTitle}>Explanation Note-1</Text>
              <Text style={styles.modalText}>
                Main predictions are prepared by analysing{'\n'}
                (a) Your running Dasha and{'\n'}
                (b) Other Planets transiting over that Planet along with the
                time period. As Transit planets keep moving these combinations
                will also change. Updates in this section happens every 15 days
              </Text>

              <Text style={styles.modalSectionTitle}>Explanation Note-2</Text>
              <Text style={styles.modalText}>
                Subsidiary predictions are prepared by analysing{'\n'}
                (a) Planets in houses as per your natal chart and{'\n'}
                (b) Other Planets going over that planet as per the current
                Transit. The exact degrees of planets of your Natal chart and
                Degrees of the planet in Transit are considered for identifying
                the most impactful conjunctions As Transit planets keep moving
                these combinations will also change. Updates in this section
                happens every 15 days
              </Text>

              <Text style={styles.modalSectionTitle}>Disclaimer</Text>
              <Text style={styles.modalText}>
                Predictions are meant to give you guidance to prepare and take
                appropriate actions. These are AI-generated and not checked or
                verified. Please consult your astrologer for more personalized
                guidance
              </Text>
            </View>
          </ImageBackground>
        </View>
      </Modal>
      {/* </TouchableOpacity> */}
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingBottom: responsiveHeight(1),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop:
      Platform.OS === 'android'
        ? responsiveHeight('0%')
        : responsiveWidth('15%'),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  backBtn: {
    padding: responsiveWidth(2),
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    tintColor: '#F6EFD9',
    marginLeft: responsiveWidth('3'),
  },
  headerRightIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    tintColor: color.themeTextWhite,
    marginLeft: responsiveWidth('3'),
  },
  headerCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    // textAlign: 'center',
    // marginLeft: -responsiveWidth('15'),
  },

  headerRight: {
    width: responsiveWidth(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveWidth('3'),
    padding: responsiveWidth(2),
  },
  scrollViewContent: {
    flexGrow: 1,
    // zIndex: 1000,
    paddingHorizontal: responsiveWidth(4),
    paddingBottom: responsiveHeight(5),
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
    // paddingVertical: responsiveHeight(2),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveHeight(10),
  },
  loadingText: {
    color: '#F6EFD9',
    fontSize: fontSize.regular,
    fontFamily: fontFamily.regular,
    marginTop: responsiveHeight(2),
  },
  lottieAnimation: {
    width: 264,
    height: 264,
  },
  loadingSubText: {
    color: '#F6EFD9',
    fontSize: fontSize.mini,
    fontFamily: fontFamily.regular,
    marginTop: responsiveHeight(1),
    opacity: 0.8,
    textAlign: 'center',
  },
  headerTitle: {
    color: '#F6EFD9',
    fontSize: 24,
    fontFamily: fontFamily.regular,
  },
  topicsContainer: {
    // flexGrow: 1,
    gap: responsiveHeight(1.5),
  },
  topicCard: {
    // backgroundColor: 'transparent',
    flexGrow: 1,
    borderRadius: 8,
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
    marginBottom: responsiveHeight(1),
  },
  topicCardBgImage: {
    borderRadius: 8,
    opacity: 0.8,
  },
  topicCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(1),
    // backgroundColor: 'transparent',
    minHeight: responsiveHeight(6),
  },
  topicTitle: {
    color: color.themeTextWhite,
    // fontSize: fontSize.mini,\
    fontSize: 14,
    // fontWeight: '500',
    fontFamily: fontFamily.regular,
    flex: 1,
    marginRight: responsiveWidth(3),
    lineHeight: 22,
  },
  arrowIcon: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    marginRight: -responsiveWidth(2),
    resizeMode: 'contain',
    tintColor: color.themeTextWhite,
    // opacity: 0.8,
  },
  topicContent: {
    backgroundColor: 'transparent',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(1),
    borderTopWidth: 1,
    // flexGrow: 1,
    // height: responsiveHeight(100),
    borderTopColor: 'rgba(73, 108, 168, 0.3)',
  },
  topicText: {
    color: '#F6EFD9',
    // fontSize: fontSize.mini,
    fontSize: 14,
    // fontWeight: '500',
    fontFamily: fontFamily.regular,
    lineHeight: 26,
    opacity: 0.9,
  },
  topicLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveHeight(2),
  },
  topicLoadingText: {
    color: '#F6EFD9',
    fontSize: fontSize.mini,
    fontFamily: fontFamily.regular,
    marginLeft: responsiveWidth(2),
    opacity: 0.8,
  },
  topicLoadingSubText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    marginTop: 5,
    opacity: 0.7,
  },
  // Horizontal Tabs styles
  tabsContainer: {
    paddingHorizontal: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
    // paddingVertical: responsiveWidth(5),
    // paddingVertical: responsiveHeight(0.5),
  },
  tabsBackground: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: color.themeBorderDropdown,
    // paddingVertical: responsiveHeight(1),
  },
  tabsBgImage: {
    borderRadius: 8,
    opacity: 0.8,
  },
  tabsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  tabsScrollContent: {
    // paddingHorizontal: responsiveWidth(1),
    // borderWidth: 1,
    // backgroundColor: 'transparent',
    // borderRadius: 12,
    // borderColor: 'rgba(73, 108, 168, 0.4)',
  },
  tabItem: {
    backgroundColor: 'rgba(34, 49, 73, 0.6)',
    // borderRadius: 20,
    // borderWidth: 1,
    // borderColor: 'rgba(73, 108, 168, 0.3)',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(2.5),
    // marginRight: responsiveWidth(2),
    minWidth: responsiveWidth(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemSelected: {
    backgroundColor: 'rgba(34, 49, 73, 0.6)',
    borderColor: 'rgba(73, 108, 168, 0.3)',
    borderBottomWidth: 3,
    borderBottomColor: '#F2994A',
  },
  tabText: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    // opacity: 0.8,
  },
  tabTextSelected: {
    color: '#F2994A',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    // fontWeight: '600' as const,
    // opacity: 1,
  },
  // Dropdown styles
  dropdownContainer: {
    paddingHorizontal: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    backgroundColor: 'rgba(34, 49, 73, 0.9)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: color.themeBorderDropdown,
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(2.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    color: color.themeTextWhite,
    fontSize: 16,
    // fontWeight: '500',
    fontFamily: fontFamily.regular,
    flex: 1,
  },
  dropdownArrow: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    marginLeft: responsiveWidth(2),
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(34, 49, 73, 0.95)',
    borderRadius: 12,
    borderWidth: 0.2,
    borderColor: 'rgba(238, 229, 202, 1)',
    // height: responsiveHeight(35),
    // maxHeight: responsiveHeight(35),
    marginHorizontal: responsiveWidth(4),
    marginTop: responsiveHeight(0.5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
    overflow: 'hidden',
  },
  dropdownScrollView: {
    flex: 1,
    paddingVertical:responsiveWidth(3)
  },
  dropdownItem: {
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1),
    borderBottomWidth: 1,
    marginHorizontal: responsiveWidth(4),
    
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(242, 153, 74, 0.1)',
  },
  dropdownItemText: {
    color: '#F6EFD9',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fontFamily.regular,
  },
  dropdownItemTextSelected: {
    color: '#F2994A',
    fontWeight: '600' as const,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    // paddingTop:
    //   Platform.OS === 'ios' ? responsiveWidth('30') : responsiveWidth('25'), // Adjust this value to position below the button
    // paddingHorizontal: responsiveWidth(2),
  },
  modalContainer: {
    backgroundColor: 'rgba(34, 49, 73, 1)',
    borderRadius: 10,
    width: '100%',
    maxWidth: responsiveWidth(93),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  modalBgImage: {
    borderRadius: 10,
    opacity: 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveWidth(3),
  },
  modalTitle: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  closeButtonImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: color.themeTextWhite,
  },
 
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: responsiveWidth(2),
  },
  modalContent: {
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(2),
  },
  modalSectionTitle: {
    color: color.themeTextWhite,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: 'bold',
    marginTop: responsiveWidth(2),
    marginBottom: responsiveHeight(0.5),
  },
  modalText: {
    color: color.themeTextWhite,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    textAlign: 'left',
    marginBottom: responsiveHeight(1),
  },
  modalFooter: {
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveWidth(4),
    // paddingVertical: responsiveHeight(2),
    alignItems: 'center',
  },
  okButton: {
    backgroundColor: '#F2994A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minWidth: responsiveWidth(10),
    alignItems: 'center',
  },
  okButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
});

export default ChatWithPrompts;