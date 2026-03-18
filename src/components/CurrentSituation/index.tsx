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
  fontFamily,
  color,
} from '../../constant/theme';
import { useNavigation } from '@react-navigation/native';
import HouseService, { CardDataItem } from '../../services/house/house.service';
import { useTheme } from '../../context/ThemeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { getCardIcon } from '../../utils/cardIconMapper';

interface CurrentSituationProps {
  // Define any props that the CurrentSituation component might need
  selectedMemberId?: string;
  isChild?: boolean;
  current_plan?: string;
  first_user?: boolean;
  onShowBuyMembershipModal?: (featureName?: string) => void;
}

interface CardData {
  id: number;
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  subCards?: Array<{ id: number; title: string }>;
}

const CurrentSituation: React.FC<CurrentSituationProps> = ({ selectedMemberId, isChild = false, current_plan, first_user = false, onShowBuyMembershipModal }) => {
  const showInfoContainer = useSelector((state: RootState) => state.app.showInfoContainer);
  const navigation = useNavigation<any>();
  const { theme, colors } = useTheme();
  const [cards, setCards] = useState<CardData[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  const fetchPredictionHeadings = useCallback(async () => {
    if (!selectedMemberId) return;
    
    setCardsLoading(true);
    setError(null);
    try {
      const headings = await HouseService.getPredictionHeadings(
        selectedMemberId,
        'staticpredictions',
      );
      console.log('Prediction headings fetched:', headings);
      
      // Map API response array to cards array
      // API returns: [{ card_type: "Snapshot Predictions" }, { card_type: "Natal Chart Insights", sub_card: [...] }]
      const mappedCards: CardData[] = headings.map((item: CardDataItem, index: number) => {
        const titleStr = item.card_type || '';
        // Normalize values for cards
        let valueStr = titleStr;
        
        // "Snapshot Predictions" -> "Snapshot Prediction" (singular)
        if (titleStr === 'Snapshot Predictions') {
          valueStr = 'Snapshot Prediction';
        }
        // "Active Planet - {planet}" or any variation -> "Antardasha"
        else if (titleStr.toLowerCase().includes('active planet') || 
                 titleStr.toLowerCase().includes('antardasha')) {
          valueStr = 'Antardasha';
        }

        console.log('titleStr-->75', titleStr);
        console.log('valueStr-->76', valueStr);
        
        return {
          id: index + 1,
          title: titleStr,
          value: valueStr,
          subtitle: '',
          icon: getCardIcon(titleStr, valueStr),
          subCards: item.sub_card || undefined,
        };
      });
      
      setCards(mappedCards);
    } catch (err: any) {
      console.error('Error fetching prediction headings:', err);
      setError(err.message || 'Failed to fetch prediction headings');
    } finally {
      setCardsLoading(false);
    }
  }, [selectedMemberId]);

  useEffect(() => {
    if (selectedMemberId) {
      fetchPredictionHeadings();
    }
  }, [selectedMemberId, fetchPredictionHeadings]);

  const handleCardPress = (card: CardData) => {
    // Prevent navigation to disabled cards
    const cardValueLower = card.value.toLowerCase();
    if (showInfoContainer && !cardValueLower.includes('snapshot')) {
      return;
    }
    
    console.log('cardTitle-->24', card.title);
    console.log('selectedMemberId-->25', selectedMemberId);
    
    // If card is "Natal Chart Insights" and current_plan is "cosmic_foundation", show Buy Memberships Modal (first_user gets full access)
    const isNatalChartInsights = card.title === 'Birth Chart Insights';
    if (isNatalChartInsights && current_plan === 'cosmic_foundation' && !first_user && onShowBuyMembershipModal) {
      onShowBuyMembershipModal('Birth Chart Insights');
      return;
    }
    
    // If card is "Natal Chart Insights" and has sub_cards, pass them
    const navigationParams: any = {
      userId: selectedMemberId,
      cardTitles:
        card.title === 'Birth Chart Insights'
          ? 'Birth Chart Insights'
          : card.value,
      tab: 'LifeNow',
      current_plan: current_plan,
    };
    
    // Pass sub_cards if available
    if (card.title === 'Birth Chart Insights' && card.subCards && card.subCards.length > 0) {
      navigationParams.subCards = card.subCards;
    }
    
    // Navigate to ChatWithPrompts screen
    navigation.navigate('ChatWithPrompts', navigationParams);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme === 'dark' ? colors.primary : colors.white,
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
          {cardsLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy }]}>
                Loading cards...
              </Text>
            </View>
          ) : (
            cards.map(card => {
              // Cards to disable when showInfoContainer is true: Your Personality, Life at the Moment, Active Planet (Antardasha)
              // Also disable Life at the Moment and Active Planet if member is a child
              const cardValueLower = card.value.toLowerCase();
              const isPersonality = cardValueLower.includes('personality') && cardValueLower.includes('your');
              const isLifeAtMoment = cardValueLower.includes('life at the moment');
              const isAntardasha = cardValueLower.includes('antardasha') || cardValueLower.includes('active planet');
              // Don't disable Natal Chart Insights for cosmic_foundation - we'll show modal instead
              
              const isDisabledByInfoContainer = showInfoContainer && (isPersonality || isLifeAtMoment || isAntardasha);
              const isDisabledByChild = isChild && (isLifeAtMoment || isAntardasha);
              const isDisabled = isDisabledByInfoContainer || isDisabledByChild;
            
            return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.surface,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeBorderDropdown
                      : colors.borderColor,
                  // boxShadow:
                  //   theme === 'dark'
                  //     ? ''
                  //     : '0px 0px 10px rgba(0, 0, 0, 0.35) inset',
                  opacity: isDisabled ? 0.5 : 1,
                },
              ]}
              onPress={() => !isDisabled && handleCardPress(card)}
              disabled={isDisabled}
            >
              <View style={styles.cardIconContainer}>
                <Image
                  source={card.icon}
                  style={{
                    width: responsiveWidth(15),
                    height: responsiveWidth(15),
                  }}
                />
              </View>
              <Text
                style={[
                  styles.cardText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                    opacity: isDisabled ? 0.5 : 1,
                  },
                ]}
              >
                {card.title}
              </Text>
            </TouchableOpacity>
            );
          }))}
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
});

export default CurrentSituation;
