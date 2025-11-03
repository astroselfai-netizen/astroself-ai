import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  responsiveWidth,
  responsiveHeight,
  fontFamily,
  color,
} from '../../constant/theme';
import { useNavigation } from '@react-navigation/native';
import UserService from '../../services/user/user.service';
import { CurrentDashaTimeResponse } from '../../types/api';
import { useTheme } from '../../context/ThemeContext';
import LottieView from 'lottie-react-native';

interface CurrentSituationProps {
  // Define any props that the CurrentSituation component might need
  selectedMemberId?: string;
}

const CurrentSituation: React.FC<CurrentSituationProps> = ({ selectedMemberId }) => {
  const navigation = useNavigation<any>();
  const { theme, colors } = useTheme();
  const [dashaData, setDashaData] = useState<CurrentDashaTimeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashaData = useCallback(async () => {
    if (!selectedMemberId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userService = new UserService();
      const response = await userService.getCurrentDashaTime(selectedMemberId);
      setDashaData(response);
      console.log('Dasha data fetched successfully:', response);
    } catch (err: any) {
      console.error('Error fetching dasha data:', err);
      setError(err.message || 'Failed to fetch dasha data');
    } finally {
      setLoading(false);
    }
  }, [selectedMemberId]);

  useEffect(() => {
    if (selectedMemberId) {
      fetchDashaData();
    }
  }, [selectedMemberId, fetchDashaData]);

  const getAntardashaTitle = () => {

    console.log('dashaData---->', dashaData);
    if (!dashaData?.Antardasha) return 'Antardasha';
    
    const antardashaEntries = Object.entries(dashaData.Antardasha);
    if (antardashaEntries.length > 0) {
      const [planet] = antardashaEntries[0];
      return `Active Planet - ${planet}`;
    }
    
    return 'Antardasha';
  };

  const handleCardPress = (cardValue: string) => {
    console.log('cardTitle-->24', cardValue);
    console.log('selectedMemberId-->25', selectedMemberId);
    // Navigate to ChatWithPrompts screen for General Analysis
    navigation.navigate('ChatWithPrompts', {
      userId: selectedMemberId,
      cardTitles: cardValue,
      tab: 'LifeNow',
      planet: cardValue === 'Antardasha' ? getAntardashaTitle() : null,
    });
  };
  const cards = [
    {
      id: 4,
      title: 'Snapshot Prediction',
      value: 'Snapshot Prediction',
      subtitle: 'Future, Glimpse',
      icon: require('../../assets/icons/SnapshotPrediction/SnapshotPrediction.png'),
    },
    {
      id: 5,
      title: 'Your Personality',
      value: 'Your Personality',
      subtitle: '',
      icon: require('../../assets/icons/GeneralAnalysis/SnapshotPrediction.png'),
    },

    // {
    //   id: 2,
    //   title: 'Life on the Horizon',
    //   value: 'Life on the Horizon',
    //   icon: require('../../assets/icons/chatIcons/Mahadasha-refined-analysis-chat.png'),
    // },
    {
      id: 3,
      title: 'Life at the Moment',
      value: 'Life at the Moment',
      icon: require('../../assets/icons/chatIcons/Antardasha-refined-analysis-chat.png'),
    },
    {
      id: 1,
      title: loading ? 'Loading...' : getAntardashaTitle(),
      value: 'Antardasha',
      icon: require('../../assets/icons/chatIcons/Antardasha-chat.png'),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme === 'dark' ? colors.primary : colors.DarkNavy,
          borderColor:
            theme === 'dark' ? colors.themeBorderDropdown : colors.borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        {/* {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchDashaData} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )} */}
        <View style={styles.cardsGrid}>
          {cards.map(card => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                loading && card.id === 1 && styles.loadingCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.surface,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeBorderDropdown
                      : colors.borderColor,
                  boxShadow:
                    theme === 'dark'
                      ? ''
                      : '0px 0px 10px rgba(0, 0, 0, 0.35) inset',
                },
              ]}
              onPress={() => !loading && handleCardPress(card.value)}
              disabled={loading && card.id === 1}
            >
              <View style={styles.cardIconContainer}>
                {loading && card.id === 1 ? (
                 <LottieView
                    source={require('../../assets/lottie/loader-Animation-1.json')}
                    autoPlay
                    loop
                    style={styles.lottieAnimation}
                  />
                ) : (
                  <Image
                    source={card.icon}
                    style={{
                      width: responsiveWidth(15),
                      height: responsiveWidth(15),
                    }}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.cardText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                {card.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(238, 229, 202, 1)',
    paddingHorizontal: responsiveWidth(3),
    paddingTop: responsiveHeight(1.5),
    borderRadius: 12,
  },

  content: {
    position: 'relative',
    zIndex: 1,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#223149',
    borderRadius: 20,
    padding: responsiveWidth(2),
    height: responsiveHeight(18),
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    marginBottom: responsiveHeight(1.5),
  },
  cardIconContainer: {
    // marginBottom: responsiveHeight(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    // marginBottom: 20,
  },
  cardIcon: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    // tintColor: '#DF8A5D',
    // resizeMode: 'contain',
  },
  cardText: {
    color: color.themeTextWhite,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    textAlign: 'center',
    // marginBottom: responsiveWidth(1),
  },
  cardSubtitle: {
    color: color.themeTextWhite,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fontFamily.regular,
    // opacity: 0.7,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: responsiveWidth(3),
    borderRadius: 8,
    marginBottom: responsiveHeight(2),
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: responsiveHeight(1),
  },
  retryButton: {
    backgroundColor: '#c62828',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(0.8),
    borderRadius: 6,
  },
  retryButtonText: {
    color: color.themeTextWhite,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  loadingCard: {
    opacity: 0.7,
  },
});

export default CurrentSituation;
