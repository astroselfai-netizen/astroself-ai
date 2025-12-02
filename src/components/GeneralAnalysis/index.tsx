import React from 'react';
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

interface GeneralAnalysisProps {
  selectedMemberId?: string;
}

const GeneralAnalysis: React.FC<GeneralAnalysisProps> = ({ selectedMemberId }) => {
  const navigation = useNavigation<any>();
  const { theme, colors } = useTheme();

  const handleCardPress = (cardValue: string) => {
    // if (cardId === 1 && selectedMemberId) {
    console.log('cardTitle-->24', cardValue);
    console.log('selectedMemberId-->25', selectedMemberId);
      // Navigate to ChatWithPrompts screen for General Analysis
      navigation.navigate('ChatWithPrompts', {
        userId: selectedMemberId,
        cardTitles:cardValue,
        tab : 'LifeView',
      });
    // }
    // Add other card navigation handlers here if needed
  };

  const cards = [
    // {
    //   id: 1,
    //   title: 'General Analysis',
    //   value: 'General Analysis',
    //   subtitle: 'Strengths, Patterns',
    //   icon: require('../../assets/icons/GeneralAnalysis/GeneralAnalysis.png'),
    // },
    // {
    //   id: 2,
    //   title: 'Snapshot Prediction',
    //   subtitle: 'Future, Glimpse',
    //   value: 'Snapshot Prediction',
    //   icon: require('../../assets/icons/GeneralAnalysis/SnapshotPrediction.png'),
    // },
    {
      id: 3,
      title: 'Personality',
      subtitle: 'Vitality, Attitude',
      value: 'Personality, Attitude, Vitality',
      //   icon: require('../../assets/icons/profile.png'),
      icon: require('../../assets/icons/GeneralAnalysis/Personality.png'),
    },
    {
      id: 4,
      title: 'Family & Values',
      subtitle: 'Wealth, Comfort',
      value: 'Family, Wealth, Comfort, Values',
      //   icon: require('../../assets/icons/home.png'),
      icon: require('../../assets/icons/GeneralAnalysis/FamilyValues.png'),
    },
    {
      id: 5,
      title: 'Communication',
      subtitle: 'Speaking, Skills',
      value: 'Style of speaking, Siblings, Courage, Skills',
      //   icon: require('../../assets/icons/chat.png'),
      icon: require('../../assets/icons/GeneralAnalysis/Communication.png'),
    },
    {
      id: 6,
      title: 'Home',
      subtitle: 'Happiness, Foundation',
      value: 'Home, happiness, Emotional foundation',
      //   icon: require('../../assets/icons/home.png'),
      icon: require('../../assets/icons/GeneralAnalysis/Home.png'),
    },
    {
      id: 7,
      title: 'Love & Romance',
      subtitle: 'Celebration, Hobbies',
      value: 'Love affairs, Romance, Children, Celebration, hobbies',
      //   icon: require('../../assets/icons/heart.png'),
      icon: require('../../assets/icons/GeneralAnalysis/LoveRomance.png'),
    },
    {
      id: 8,
      title: 'Health & Service',
      subtitle: 'Routines, Care',
      value: 'Health, Daily routines, service to others, Conflict',
      //   icon: require('../../assets/icons/health.png'),
      icon: require('../../assets/icons/GeneralAnalysis/HealthService.png'),
    },
    {
      id: 9,
      title: 'Marriage & Partnerships',
      subtitle: 'Business, Relationships',
      value: 'Marriage, Relationships, partnerships business travel',
      //   icon: require('../../assets/icons/rings.png'),
      icon: require('../../assets/icons/GeneralAnalysis/MarriagePartnerships.png'),
    },
    {
      id: 10,
      title: 'Sexuality & Transformation',
      subtitle: 'Inheritance, Intimacy',
      value:
        'Sexuality, Intimacy, Inheritance, Occult, Transformation, Unearned income',
      //   icon: require('../../assets/icons/infinity.png'),
      icon: require('../../assets/icons/GeneralAnalysis/SexualityTransformation.png'),
    },
    {
      id: 11,
      title: 'Higher Education',
      subtitle: 'Philosophy, Travel',
      value: 'Higher education, Philosophy, Long distance Travel',
      //   icon: require('../../assets/icons/graduation.png'),
      icon: require('../../assets/icons/GeneralAnalysis/HigherEducation.png'),
    },
    {
      id: 12,
      title: 'Career & Reputation',
      subtitle: 'Status, Recognition',
      value: 'Career, Reputation, Status in Society, Recognition',
      //   icon: require('../../assets/icons/briefcase.png'),
      icon: require('../../assets/icons/GeneralAnalysis/CareerReputation.png'),
    },
    {
      id: 13,
      title: 'Income & Innovation',
      subtitle: 'New Ideas, Work',
      value: 'Income, Network, Innovation, New ideas',
      //   icon: require('../../assets/icons/lightbulb.png'),
      icon: require('../../assets/icons/GeneralAnalysis/IncomeInnovation.png'),
    },
    {
      id: 14,
      title: 'Subconscious & Spirituality',
      subtitle: 'Hidden Enemies, Mind',
      value:
        'Subconcious Mind, Spirituality, Hidden enemies, Losses and investment',
      //   icon: require('../../assets/icons/moon-star.png'),
      icon: require('../../assets/icons/GeneralAnalysis/SubconsciousSpirituality.png'),
    },
  ];

  return (
    <View style={[styles.container,{
      backgroundColor: theme === 'dark' ? colors.primary : colors.white,
      borderColor: theme === 'dark' ? colors.themeBorderDropdown : colors.borderColor,
    }]}>
      <View style={styles.content}>
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
              <Text style={[styles.cardSubtitle,{
                color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              }]}>{card.subtitle}</Text>
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
});

export default GeneralAnalysis;
