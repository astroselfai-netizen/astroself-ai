import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  responsiveWidth,
  responsiveHeight,
  // color,
  // font,
  fontFamily,
  color,
} from '../../constant/theme';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import HouseService, { CardDataItem } from '../../services/house/house.service';
import { getCardIcon } from '../../utils/cardIconMapper';

interface GeneralAnalysisProps {
  selectedMemberId?: string;
  current_plan?: string;
}

interface CardData {
  id: number;
  title: string;
  value: string;
  current_plan?: string;
  subtitle?: string;
  icon: any;
}

const GeneralAnalysis: React.FC<GeneralAnalysisProps> = ({ selectedMemberId, current_plan }) => {
  const navigation = useNavigation<any>();
  const { theme, colors } = useTheme();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictionHeadings = useCallback(async () => {
    if (!selectedMemberId) return;
    
    setLoading(true);
    setError(null);
    try {
      const headings = await HouseService.getPredictionHeadings(selectedMemberId, 'dynamicpredictions');
      console.log('Prediction headings fetched:', headings);
      
      // Map API response array to cards array
      // API returns: [{ card_type: "Personality" }, { card_type: "Family & Values" }, ...]
      const mappedCards: CardData[] = headings.map((item: CardDataItem, index: number) => {
        const titleStr = item.card_type || '';
        
        return {
          id: index + 1,
          title: titleStr,
          value: titleStr,
          subtitle: '',
          icon: getCardIcon(titleStr, titleStr),
        };
      });
      
      setCards(mappedCards);
    } catch (err: any) {
      console.error('Error fetching prediction headings:', err);
      setError(err.message || 'Failed to fetch prediction headings');
    } finally {
      setLoading(false);
    }
  }, [selectedMemberId]);

  useEffect(() => {
    if (selectedMemberId) {
      fetchPredictionHeadings();
    }
  }, [selectedMemberId, fetchPredictionHeadings]);

  const handleCardPress = (cardValue: string) => {
    console.log('cardTitle-->24', cardValue);
    console.log('selectedMemberId-->25', selectedMemberId);
    // Navigate to ChatWithPrompts screen for General Analysis
    navigation.navigate('ChatWithPrompts', {
      userId: selectedMemberId,
      cardTitles: cardValue,
      current_plan: current_plan,
      tab: 'LifeView',
    });
  };

  return (
    <View style={[styles.container,{
      backgroundColor: theme === 'dark' ? colors.primary : colors.white,
      borderColor: theme === 'dark' ? colors.themeBorderDropdown : colors.borderColor,
    }]}>
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy }]}>
              Loading cards...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy }]}>
              {error}
            </Text>
            <TouchableOpacity onPress={fetchPredictionHeadings} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {cards.map(card => (
              <TouchableOpacity 
                key={card.id} 
                style={[styles.card,{
                  backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.surface,
                  borderColor: theme === 'dark' ? colors.themeBorderDropdown : colors.borderColor,
                  // boxShadow: theme === 'dark' ? '' : '0px 0px 10px rgba(0, 0, 0, 0.35) inset',
                }]}
                onPress={() => handleCardPress(card.value)}
                activeOpacity={0.7}
              >
                <View style={styles.cardIconContainer}>
                  <Image source={card.icon} style={styles.cardIcon} />
                </View>
                <Text style={[styles.cardText,{
                  color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                }]}>{card.title}</Text>
                {card.subtitle && (
                  <Text style={[styles.cardSubtitle,{
                    color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  }]}>{card.subtitle}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    height: responsiveHeight(18),
    marginBottom: responsiveHeight(1.5),
  },
  cardIconContainer: {
    marginBottom: responsiveHeight(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    width: responsiveWidth(15),
    height: responsiveWidth(15),
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
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: -0.14,
  },
  loadingContainer: {
    width: '100%',
    padding: responsiveHeight(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  errorContainer: {
    padding: responsiveWidth(3),
    borderRadius: 8,
    marginBottom: responsiveHeight(2),
    alignItems: 'center',
  },
  errorText: {
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
});

export default GeneralAnalysis;
