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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { icons } from '../../assets';
import UserService from '../../services/user/user.service';
import { useTheme } from '../../context/ThemeContext';
import LottieView from 'lottie-react-native';
import { Api, CurrentDashaTimeResponse } from '../../types/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';

interface ChatWithPromptsProps {
  userId: string;
  cardTitles?: string;
  tab?: string;
  subCards?: Array<{ id: number; title: string }>;
  planet?: string;
  current_plan?: string;
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
  subCards,
  planet: _planet,
  current_plan,
}) => {
  const showInfoContainer = useSelector((state: RootState) => state.app.showInfoContainer);
  const [topics, setTopics] = useState<PredictionTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTopicId, setLoadingTopicId] = useState<string | null>(null);
  const [loadingTime, setLoadingTime] = useState<number>(0);
  const userService = serviceFactory.get<UserService>('UserService');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [_hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCardTitle, setSelectedCardTitle] = useState(cardTitles);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const membersData = useSelector((state: RootState) => state.app.members);
  const navigation = useNavigation<any>();
  const { theme, colors } = useTheme();
  const [userData, setUserData] = useState<Api.User.Res.Detail | null>(null);
  const [updatedList, setUpdatedList] = useState<Record<string, boolean>>({});
  const [generalAnalysisCards] = useState<Array<{ title: string; subtitle: string; value: string }>>([]);
  const [currentSituationCards] = useState<Array<{ title: string; subtitle: string; value: string }>>([]);
  const [dashaTimeData, setDashaTimeData] = useState<CurrentDashaTimeResponse | null>(null);
  const [loadingDashaTime, setLoadingDashaTime] = useState(false);
  
  // Check if current member is a child (age between 15-18 years)
  const isCurrentMemberChild = React.useMemo(() => {
    if (!userId || !membersData || !Array.isArray(membersData)) {
      return false;
    }
    
    const currentMember = membersData.find(
      (m: any) => (m.id || m._id) === userId || (m.id || m._id)?.toString() === userId?.toString()
    );
    
    if (!currentMember || !currentMember.birth_data) {
      return false;
    }
    
    const { year, month, day } = currentMember.birth_data;
    if (!year || !month || !day) {
      return false;
    }
    
    // Calculate age
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Check if age is between 15 and 18 (inclusive)
    return age >= 15 && age <= 18;
  }, [userId, membersData]);
  
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

  console.log('cardTitles---->128', _tab);

  // topic state
  const [selectedTopicValue, setSelectedTopicValue] = useState(
    cardTitles === 'Antardasha'
      ? 'summary'
      : _tab === 'SnapCast'
      ? 'Your Personality'
      : _tab === 'LifeNow' 
      ? 'Your Tendencies' 
      : 'summary'
  );


   const topicOptions = [
     { title: 'Your Tendencies', value: 'Your Tendencies' },
     { title: 'Summary', value: 'Summary' },
     { title: 'Predictions', value: 'Planet' },
    //  { title: 'Predictions bases on Lords', value: 'Lords in Houses' },
    //  { title: 'Predictions based on Planets', value: 'Planets in Signs' },
    //  { title: 'Predictions based on Nakshtra', value: 'Nakshatra Themes' },
   ];

  // Special topic options for Antardasha
  const antardashaTopicOptions = [
    { title: 'Summary', value: 'summary' },
    { title: 'General Analysis', value: 'General Analysis' },
    // { title: 'Active Planet Connections', value: 'Active Planet Connections' },
    {title: 'Predictions', value: 'Planet' },
    // { title: 'Nakshatra', value: 'Nakshatra' },
    // { title: 'Moon Lagna', value: 'Moon Lagna' },
    

  ];

  // Labels for Antardasha topic options
  const antardashaTopicLabels = [
    { title: 'Summary', value: 'summary' },
    { title: 'Predictions', value: 'Planet' },
    { title: 'General Analysis', value: 'General Analysis' },
  ];

  // No longer fetching cards from API - they come from navigation params


  // Get current card options based on the current cardTitles
  const getCurrentCardOptions = () => {
    // If subCards prop is provided, use it directly (for "Natal Chart Insights")
    if (subCards && subCards.length > 0) {
      return subCards.map(subCard => ({
        title: subCard.title,
        subtitle: '',
        value: subCard.title,
      }));
    }
    
    if (_tab === 'LifeView') {
      return generalAnalysisCards;
    } else if (_tab === 'LifeNow') {
      return currentSituationCards;
    }
    // Default fallback
    return generalAnalysisCards;
  };

  // Reset expanded topic when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setExpandedTopic(null);
      setHasAutoExpanded(false);
    }, [])
  );

  // Reset expanded topic and clear content when cardTitles, selectedCardTitle or selectedTopicValue changes
  useEffect(() => {
    setExpandedTopic(null);
    setHasAutoExpanded(false);
    setUpdatedList({});
    setTopics(prevTopics => 
      prevTopics.map(topic => ({
        ...topic,
        content: `Welcome! I'm here to guide you through your cosmic journey. What would you like to explore about your birth chart today? This is detailed content for ${topic.title}.`,
        isExpanded: false
      }))
    );
  }, [cardTitles, selectedCardTitle, selectedTopicValue]);

  // Update selectedCardTitle when cardTitles prop changes
  useEffect(() => {
    // If subCards prop is provided, automatically select first sub_card

    console.log('cardTitles---->214', subCards, cardTitles);
    if (subCards && subCards.length > 0) {
      setSelectedCardTitle(subCards[0].title);
    } else {
      setSelectedCardTitle(cardTitles || '');
    }
  }, [cardTitles, subCards]);

  // Fetch current dasha time when Antardasha is selected
  useEffect(() => {
    const fetchDashaTime = async () => {
      if ((cardTitles === 'Antardasha' || selectedCardTitle === 'Antardasha') && userId) {
        try {
          setLoadingDashaTime(true);
          const response = await userService.getCurrentDashaTime(userId);
          console.log('Dasha time response:', response);
          setDashaTimeData(response);
        } catch (error: any) {
          console.error('Error fetching dasha time:', error);
          setDashaTimeData(null);
        } finally {
          setLoadingDashaTime(false);
        }
      } else {
        setDashaTimeData(null);
      }
    };

    fetchDashaTime();
  }, [cardTitles, selectedCardTitle, userId, userService]);

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
        if ( selectedCardTitle.startsWith('Current Phase of Life -')) {
          mainHeading = 'Antardasha';
        }
        // If selectedCardTitle starts with 'Active Planet -', set mainHeading to 'Antardasha'
        else if (selectedCardTitle.startsWith('Birth Chart Insights') ) {
          mainHeading = 'Personality, Attitude, Vitality';
        } else {
          switch (selectedCardTitle) {
            case 'Birth Chart Insights':
              mainHeading = 'Personality, Attitude, Vitality';
              break;
          case 'General Analysis':
            mainHeading = 'General Analysis';
            break;
          case 'Your Personality':
            mainHeading = 'Your Personality';
            break;

          case 'Snapshot Prediction':
            mainHeading = 'Snapshot Prediction';
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
          case 'Birth Chart Insights':
              mainHeading = 'Your Personality';
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
      }

      console.log('selectedTopicValue---->', selectedTopicValue);

      // Map selectedTopicValue to correct topic parameter for house/categorize API
      let apiTopic = 'Blended Predictions';
      switch (selectedTopicValue) {
        case 'Your Tendencies':
          apiTopic = 'Your Tendencies';
          break;
      

        case 'Your Personality':
          apiTopic = 'Blended Predictions';
            break;

            case 'Summary':
          apiTopic = 'General';
              break;

        case 'summary':
          apiTopic = 'summary';
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
        case 'Active Planet Connections':
          apiTopic = 'Active Planet Connections';
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

      
    console.log('mainHeading---->402', mainHeading);
      // Handle different API calls based on mainHeading
      if (mainHeading === 'Antardasha' ) {

        if (apiTopic === 'Your Tendencies') {
          apiTopic = 'General Analysis';
          setSelectedTopicValue('General Analysis');
        }
        response = await userService.getAntardashaData(
          userId,
          mainHeading,
          apiTopic, // In this case, apiTopic contains the planet parameter
        );
      } else
      
      if (mainHeading === 'Current predictions' || mainHeading === 'Additional Predictions' || mainHeading === 'Next 30 to 45 Days' || mainHeading === 'Next 6 to 30 Months') {
        const categorizeResponse = await userService.getDashaCategorizeData(
          userId,
          mainHeading,
        );
        // Store updated_list for 'Life at the Moment' only
        if (mainHeading === 'Next 30 to 45 Days' || mainHeading === 'Next 6 to 30 Months' && categorizeResponse.updated_list) {
          setUpdatedList(categorizeResponse.updated_list || {});
        } else {
          setUpdatedList({});
        }
        response = categorizeResponse.data;
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
      if (selectedCardTitle === 'Antardasha' || selectedCardTitle === 'Next 30 to 45 Days' || selectedCardTitle === 'Next 6 to 30 Months' ) {
        aiResponse = await userService.getAntardashaAiResponse(
          userId || '68bab4b85f4bc17df0359d83',
          selectedCardTitle || 'Antardasha',
          topicTitle || 'General Analysis',
        );
      } else if (selectedCardTitle?.startsWith('Active Planet -') || selectedCardTitle === 'Current predictions' || selectedCardTitle === 'Additional Predictions' || selectedCardTitle === 'Life on the Horizon' || selectedCardTitle === 'Life at the Moment' || selectedCardTitle?.startsWith('Current Phase of Life -') ) {
        // For Current predictions and Additional Predictions, call the dasha AI response API
        // If selectedCardTitle starts with 'Active Planet -', use 'Antardasha' instead
        const cardTitleForApi = selectedCardTitle?.startsWith('Active Planet -') || selectedCardTitle?.startsWith('Current Phase of Life -') ? 'Antardasha' : (selectedCardTitle || 'Additional Predictions');
        aiResponse = await userService.getDashaAiResponse(
          userId || '68bab4b85f4bc17df0359d83',
          cardTitleForApi,
          topicTitle || 'General Analysis',
        );
      } else {

        // userId = profileData;
      //  const plan = profileData?.current_plan;
        aiResponse = await userService.getGenerateHeadingAiResponse(
          userId || '68bab4b85f4bc17df0359d83',
          selectedCardTitle || 'General Analysis',
          topicTitle || 'about_house',
          current_plan || 'cosmic_foundation',
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
      const errorContent = errorMessage;
       

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
  }, [expandedTopic, topics, userId, selectedCardTitle, userService, current_plan]);

  // Helper function to format birth date as "Month Day, Year" (e.g., "May 20, 1995")
  const formatBirthDate = (birthData: any): string => {
    if (!birthData || !birthData.day || !birthData.month || !birthData.year) {
      return 'N/A';
    }
    
    const { day, month, year } = birthData;
    // Create a Date object (month is 0-indexed in Date constructor)
    const date = new Date(year, month - 1, day);
    
    // Format as "Month Day, Year" (e.g., "May 20, 1995")
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get user data from membersData based on userId
  useEffect(() => {
    if (!userId || !membersData || !Array.isArray(membersData)) {
      return;
    }

    // Find the member whose id or _id matches userId
    const member = membersData.find(
      (m: any) => (m.id || m._id) === userId || (m.id || m._id)?.toString() === userId?.toString()
    );

    if (member) {

      console.log('member---->687', member);
      // Transform member data to match the expected user data structure
      setUserData({
        _id: member.id || member._id,
        email: member.email || '',
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        current_plan: member.current_plan || '',
        complete_profile: member.complete_profile || false,
        members_allow: member.members_allow || 0,
        current_members: member.current_members || 0,
        child_allow: member.child_allow || 0,
        current_child: member.current_child || 0,
        age: member.age || '',
        birth_data: member.birth_data || {},
        birthplace: member.birthplace || '',
        created_at: member.created_at || '',
        gender: member.gender || '',
        user_id: member.user_id || '',
      } as Api.User.Res.Detail);
    }
  }, [userId, membersData]);

  useEffect(() => {
    if (userId) {
      fetchBlendedPredictions();
    }
  }, [userId, selectedCardTitle, selectedTopicValue, fetchBlendedPredictions]);

  // Auto-expand and generate AI content when Snapshot Prediction is selected
  useEffect(() => {
    if (
     
      topics.length === 1 &&

      !loading &&
      !_hasAutoExpanded &&
      expandedTopic === null
    ) {
      const firstTopic = topics[0];
      if (firstTopic) {
        setExpandedTopic(firstTopic.id);
        setHasAutoExpanded(true);
        // Automatically trigger AI content generation for the first topic
        setTimeout(() => {
          toggleExpanded(firstTopic.id, firstTopic.title, true);
        }, 100);
      }
    }
  }, [topics, loading, _hasAutoExpanded, selectedCardTitle, expandedTopic, toggleExpanded]);

  const renderArrowIcon = (isExpanded: boolean, topic: PredictionTopic) => (
    <Image 
      source={require('../../assets/icons/Dropdown.png')} 
      style={[
        styles.arrowIcon,
        {
          tintColor: selectedCardTitle === 'Life at the Moment' && updatedList[topic.title] === true ? colors.DarkNavy : theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
        },
        { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }
      ]} 
    />
  );

  // Function to check if a line is a title (starts/ends with asterisks for bold formatting)
  const isTitleLine = (line: string): boolean => {
    const trimmed = line.trim();
    // Check if line starts with asterisk(s) and/or ends with asterisk(s)
    // Examples: *text*, **text**, *text**, **text*, * text **, etc.
    return /^\*+/.test(trimmed) || /\*+$/.test(trimmed);
  };

  // Function to detect if a line starts with a bullet point or number
  const isBulletPoint = (line: string): boolean => {
    const trimmed = line.trim();
    // Check for bullet points: •, -, *, or numbered lists (1., 2., etc.)
    // But exclude lines that are titles (start/end with asterisks)
    if (isTitleLine(trimmed)) {
      return false;
    }
    return /^[•\-*]/.test(trimmed) || /^\d+\./.test(trimmed);
  };

  // Function to extract bullet/number and text
  const parseBulletLine = (line: string): { bullet: string; text: string } => {
    const trimmed = line.trim();
    // Match bullet points (•, -, *) or numbered lists (1., 2., etc.)
    const bulletMatch = trimmed.match(/^([•\-*]|\d+\.)\s*(.*)$/);
    if (bulletMatch) {
      return {
        bullet: bulletMatch[1],
        text: bulletMatch[2] || '',
      };
    }
    return { bullet: '', text: trimmed };
  };

  // Function to render text with bold formatting (**text** or *text*)
  // Asterisks are completely removed - only the text inside is displayed as bold
  // Handles: *text*, * text*, *text *, * text *, **text**, ** text**, *text**, **text*, etc.
  const renderFormattedTextFromWeb = (text: string, textStyle: any) => {
    if (!text) return null;

    const result: React.ReactNode[] = [];

    // Regex to match any asterisk pattern: *text*, **text**, *text**, **text*, etc.
    // Matches one or more asterisks at start, text content, one or more asterisks at end
    const regex = /(\*+\s*(.*?)\s*\*+)/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // normal text before match
      if (match.index > lastIndex) {
        result.push(text.slice(lastIndex, match.index));
      }

      // Extract text content (match[2] is the text between asterisks)
      // Trim to remove any leading/trailing spaces
      const boldText = (match[2] || '').trim();
      
      if (boldText) {
        result.push(
          <Text
            key={`b-${result.length}`}
            style={[textStyle, { fontWeight: 'bold' as const }]}
          >
            {boldText}
          </Text>,
        );
      }

      lastIndex = regex.lastIndex;
    }

    // remaining text
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }

    // If no matches found, return simple text
    if (result.length === 0) {
      return <Text style={textStyle}>{text}</Text>;
    }

    return <Text style={textStyle}>{result}</Text>;
  };




  // Function to render formatted text with proper bullet point indentation
  const renderFormattedText = (content: string) => {
    if (!content) return <Text style={[styles.topicText, { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy }]}>No content available</Text>;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentBulletItem: { bullet: string; lines: string[] } | null = null;

    const flushBulletItem = () => {
      if (currentBulletItem) {
        const { bullet, lines: bulletLines } = currentBulletItem;
        elements.push(
          <View key={`bullet-group-${elements.length}`} style={styles.bulletItemContainer}>
            <Text style={[styles.bulletPoint, { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy }]}>
              {bullet}
            </Text>
            <View style={styles.bulletContentContainer}>
              {bulletLines.map((line, lineIndex) => {
                const isLastLine = lineIndex === bulletLines.length - 1;
                return (
                  <View key={`bullet-line-${lineIndex}`}>
                    {renderFormattedTextFromWeb(
                      line,
                      [
                        styles.bulletText,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                          marginBottom: isLastLine ? 0 : responsiveHeight(0.3),
                        },
                      ],
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
        currentBulletItem = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) {
        flushBulletItem();
        if (index < lines.length - 1) {
          elements.push(<View key={`empty-${index}`} style={{ height: responsiveHeight(0.5) }} />);
        }
        return;
      }

      if (isBulletPoint(line)) {
        // Flush previous bullet item if exists
        flushBulletItem();
        // Start new bullet item
        const parsed = parseBulletLine(line);
        currentBulletItem = {
          bullet: parsed.bullet,
          lines: parsed.text ? [parsed.text] : [],
        };
      } else {
        // Regular text line
        if (currentBulletItem) {
          // This line is continuation of current bullet point
          currentBulletItem.lines.push(trimmed);
        } else {
          // Regular paragraph
          flushBulletItem();
          const textElement = renderFormattedTextFromWeb(
            trimmed,
            [
              styles.topicText,
              {
                color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                marginBottom: responsiveHeight(0.5),
              },
            ],
          );
          if (textElement) {
            elements.push(textElement);
          }
        }
      }
    });

    // Flush any remaining bullet item
    flushBulletItem();

    return <View>{elements}</View>;
  };

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
              {userData && userData.first_name && userData.last_name
                ? `${userData.first_name} ${userData.last_name}`
                : userData?.first_name || userData?.last_name || 'User'}
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
      {/* user name and birth details section */}
      {/* {userData && (
        <View style={[styles.userInfoContainer,{
          backgroundColor: theme === 'dark' ? colors.cardBackground : colors.white,
          borderColor: theme === 'dark' ? colors.themeTextWhite : colors.borderColor,
        }]}>
          <Text style={[styles.userName,{
            color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
          }]}>
            {userData.first_name && userData.last_name
              ? `${userData.first_name} ${userData.last_name}`
              : userData.first_name || 'User'}
          </Text>
          <View style={styles.birthDateContainer}>
            <Text style={[styles.birthDate,{
              color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
            }]}>
              {formatBirthDate(userData.birth_data)}
            </Text>
          </View>
        </View>
      )} */}
      {/* Only show dropdown when subCards prop is provided (for "Natal Chart Insights") */}
      {subCards && subCards.length > 0 && (
        <View
          style={[
            styles.dropdownContainer,
            {
              backgroundColor:
                theme === 'dark' ? colors.DarkNavy : colors.surface,
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
                theme === 'dark' ? colors.DarkNavy : colors.white,
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
          {renderArrowIcon(showDropdown, topics[0] || null)}
        </TouchableOpacity>

        {showDropdown && (
          <View
            style={[
              styles.dropdownList,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
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
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                },
              ]}
            >
              {getCurrentCardOptions().map((card, index) => {
                // Disable cards except "Snapshot Prediction" when showInfoContainer is true (only for LifeNow tab)
                const isDisabledByInfoContainer =
                  showInfoContainer &&
                  _tab === 'LifeNow' &&
                  card.value !== 'Snapshot Prediction';

                // Disable "Life at the Moment" and "Antardasha" (General Analysis) if member is a child (only for LifeNow tab)
                const isDisabledByChild =
                  isCurrentMemberChild &&
                  _tab === 'LifeNow' &&
                  (card.value === 'Life at the Moment' ||
                    card.value === 'Antardasha');

                const isDisabled =
                  isDisabledByInfoContainer || isDisabledByChild;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dropdownItem,
                      {
                        backgroundColor:
                          theme === 'dark' ? colors.DarkNavy : colors.white,
                        borderBottomColor:
                          theme === 'dark'
                            ? colors.themeBorderDropdown
                            : colors.borderColor,
                        opacity: isDisabled ? 0.5 : 1,
                      },
                      selectedCardTitle === card.value &&
                        styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      if (!isDisabled) {
                        handleCardTitleSelect(card.value);
                        // setExpandedTopic(null);
                      }
                    }}
                    activeOpacity={0.7}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                          opacity: isDisabled ? 0.5 : 1,
                        },
                        selectedCardTitle === card.value &&
                          styles.dropdownItemTextSelected,
                      ]}
                    >
                      {card.title}{' '}
                      {_tab === 'LifeView' && card.subtitle && (
                        <Text
                          style={[
                            styles.dropdownItemText,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          {card.subtitle}
                        </Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
      )}
      {/* Antardasha time period */}
      {(cardTitles === 'Antardasha' || selectedCardTitle === 'Antardasha') && (
        <View style={styles.antardashaTimeContainer}>
          {loadingDashaTime ? (
            <View style={styles.antardashaTimeContent}>
              <ActivityIndicator size="small" color={colors.Orangeaccentcolor} />
            </View>
          ) : dashaTimeData?.Antardasha ? (
            <View style={styles.antardashaTimeContent}>
              {Object.entries(dashaTimeData.Antardasha).map(([planet, dateRanges], index) => {
                const dateRangesArray = dateRanges as string[];
                if (dateRangesArray && Array.isArray(dateRangesArray) && dateRangesArray.length > 0) {
                  const dateRange = dateRangesArray[0]; // Get first date range
                  return (
                    <Text
                      key={index}
                      style={[
                        styles.antardashaTimeText,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      {dateRange} - {planet}
                    </Text>
                  );
                }
                return null;
              })}
            </View>
          ) : null}
        </View>
      )}
      {/* Horizontal Tabs Section */}
      {(() => {
        // Check if cardTitles contains values that don't need tabs
        const shouldHideTabs =
          selectedCardTitle?.includes('General Analysis') ||
          selectedCardTitle?.includes('Snapshot Prediction') ||
          selectedCardTitle?.includes('Current predictions') ||
          _tab?.includes('SnapCast') ||
          selectedCardTitle?.includes('Additional Predictions') ||
          // selectedCardTitle?.includes('Life on the Horizon') ||
          selectedCardTitle?.includes('Life at the Moment') ||
          selectedCardTitle?.includes('Next 30 to 45 Days') ||
          selectedCardTitle?.includes('Next 6 to 30 Months') ||
          selectedCardTitle?.includes('Your Personality');

        // Don't render tabs if they should be hidden
        if (shouldHideTabs) {
          return null;
        }

        console.log('selectedCardTitle---->1355', selectedCardTitle);

        // Check if selectedCardTitle is 'Antardasha' or starts with 'Active Planet -'
        const isAntardasha = selectedCardTitle === 'Antardasha' || selectedCardTitle?.startsWith('Active Planet -') || selectedCardTitle?.startsWith('Current Phase of Life -');

        const tabOptions =
          isAntardasha
            ? antardashaTopicOptions
            : topicOptions;
        const tabLabels =
          isAntardasha
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
                    theme === 'dark' ? colors.DarkNavy : colors.white,
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
            {[...topics]
              .sort((a, b) => {
                // If 'Life at the Moment' is selected, sort unread items to the top
                if (selectedCardTitle === 'Life at the Moment') {
                  const aIsUnread = updatedList[a.title] === true;
                  const bIsUnread = updatedList[b.title] === true;

                  // Unread items (green) should be at the top
                  if (aIsUnread && !bIsUnread) return -1;
                  if (!aIsUnread && bIsUnread) return 1;
                }
                // Maintain original order for other cases
                return 0;
              })
              .map(topic => (
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
                          // Check if this is 'Life at the Moment' and item is unread
                          selectedCardTitle === 'Life at the Moment' &&
                          updatedList[topic.title] === true
                            ? theme === 'dark'
                              ? 'rgb(139, 196, 40)' // green tint for dark theme
                              : 'rgb(139, 196, 40)' // green tint for dark theme
                            : theme === 'dark'
                            ? colors.transparent
                            : colors.white,
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
                            // Check if this is 'Life at the Moment' and item is unread
                            selectedCardTitle === 'Life at the Moment' &&
                            updatedList[topic.title] === true
                              ? colors.DarkNavy // Orange color for unread items
                              : theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                          fontWeight:
                            selectedCardTitle === 'Life at the Moment' &&
                            updatedList[topic.title] === true
                              ? '600'
                              : '700',
                        },
                      ]}
                    >
                      {topic.title}
                    </Text>
                    {renderArrowIcon(expandedTopic === topic.id, topic)}
                  </TouchableOpacity>

                  {expandedTopic === topic.id && (
                    <View
                      style={[
                        styles.topicContent,
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
                            Loading time: {loadingTime}s (may take 30-60
                            seconds)
                          </Text>
                        </View>
                      ) : (
                        // <View style={styles.topicContent}>
                        renderFormattedText(
                          topic.content || 'No content available',
                        )
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
            source={
              theme === 'dark'
                ? require('../../assets/image/DarkBackground.png')
                : require('../../assets/image/LightBackground.png')
            }
            blurRadius={12}
            style={styles.modalContainer}
            imageStyle={styles.modalBgImage}
          >
            <View style={styles.modalHeader}>
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
                Note
              </Text>
              <TouchableOpacity
                onPress={() => setShowNoteModal(false)}
                // style={styles.closeButton}
                // activeOpacity={0.7}
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
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            />
            <View style={styles.modalContent}>
              {/* <Text
                style={[
                  styles.modalSectionTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Explanation Note-1
              </Text>
              <Text
                style={[
                  styles.modalText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Main predictions are prepared by analysing{'\n'}
                (a) Your running Dasha and{'\n'}
                (b) Other Planets transiting over that Planet along with the
                time period. As Transit planets keep moving these combinations
                will also change. Updates in this section happens every 15 days
              </Text>

              <Text
                style={[
                  styles.modalSectionTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Explanation Note-2
              </Text>
              <Text
                style={[
                  styles.modalText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Subsidiary predictions are prepared by analysing{'\n'}
                (a) Planets in houses as per your natal chart and{'\n'}
                (b) Other Planets going over that planet as per the current
                Transit. The exact degrees of planets of your Natal chart and
                Degrees of the planet in Transit are considered for identifying
                the most impactful conjunctions As Transit planets keep moving
                these combinations will also change. Updates in this section
                happens every 15 days
              </Text> */}

              <Text
                style={[
                  styles.modalSectionTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Disclaimer
              </Text>
              <Text
                style={[
                  styles.modalText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
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
    paddingBottom: Platform.OS === 'android' ? 85 : 85,
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
    paddingVertical: responsiveWidth(1),
    // backgroundColor: 'transparent',
    minHeight: responsiveHeight(6),
  },
  topicTitle: {
    color: color.themeTextWhite,
    // fontSize: fontSize.mini,\
    fontSize: 16,
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
  bulletItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveHeight(0.8),
  },
  bulletPoint: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 26,
    opacity: 0.9,
    // marginRight: responsiveWidth(1),
    minWidth: responsiveWidth(2),
  },
  bulletContentContainer: {
    flex: 1,
    paddingLeft: responsiveWidth(1),
  },
  bulletText: {
    fontSize: 14,
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
    fontWeight: '700',
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    // opacity: 0.8,
  },
  tabTextSelected: {
    color: '#F2994A',
    fontSize: 16,
    fontWeight: '700',
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
  // User Info Container styles
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // backgroundColor: '#283044',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveWidth(1.5),
    marginHorizontal: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
    marginTop: responsiveHeight(1),
  },
  userName: {
    color: '#E0E0D8',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    flex: 1,
  },
  birthDateContainer: {
    // backgroundColor: '#283044',
    // borderRadius: 6,
    // borderWidth: 1,
    // borderColor: '#5078B8',
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.8),
    minWidth: responsiveWidth(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  birthDate: {
    color: '#E0E0D8',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
  },
  // Antardasha time period styles
  antardashaTimeContainer: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.15)',
    backgroundColor: 'transparent',
  },
  antardashaTimeContent: {
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  antardashaTimeText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ChatWithPrompts;