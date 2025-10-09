import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  // fontSize,
  responsiveWidth,
  fontFamily,
  color,
} from '../../constant/theme';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import LottieView from 'lottie-react-native';

interface ChartDetails {
  D1: string;
  D9: string;
  D10: string;
  D60: string;
  planets_positions?: Array<{
    house?: number;
    name?: string;
    normDegree?: number;
    sign?: string;
    nakshatra?: string;
    nakshatra_pad?: string;
    isRetro?: string;
    planet_awastha?: string;
  }>;
}

interface ChartsScreenProps {
  chartDetails?: ChartDetails;
}

export default function ChartsScreen({ chartDetails }: ChartsScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [svgLoadingStates, setSvgLoadingStates] = useState<{[key: string]: boolean}>({
    D1: true,
    D9: true,
    D10: true,
    D60: true,
  });
  const { theme, colors } = useTheme();
  const scrollViewRefdash = useRef<ScrollView>(null);

  console.log('chartDetails===>', chartDetails?.planets_positions);

  // Reset loading states when chartDetails change
  useEffect(() => {
    if (chartDetails) {
      setSvgLoadingStates({
        D1: true,
        D9: true,
        D10: true,
        D60: true,
      });

      // Set timeout to hide loading indicators after SVG should be loaded
      const timeouts: ReturnType<typeof setTimeout>[] = [];
      
      chartList.forEach((chart, index) => {
        if (chart.svg) {
          const timeout = setTimeout(() => {
            console.log(`Loading completed for ${chart.key}`);
            setSvgLoadingStates(prev => ({
              ...prev,
              [chart.key]: false,
            }));
          }, 200 + (index * 50)); // Very short timeout, stagger the loading completion
          timeouts.push(timeout);
        } else {
          // If no SVG data, immediately set loading to false
          setSvgLoadingStates(prev => ({
            ...prev,
            [chart.key]: false,
          }));
        }
      });

      // Cleanup timeouts
      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [chartDetails]);

  // Additional effect to handle SVG loading based on SVG content
  useEffect(() => {
    if (chartDetails) {
      chartList.forEach((chart, index) => {
        if (chart.svg && chart.svg.length > 0) {
          // Set a very short timeout to allow SVG to render
          const timeout = setTimeout(() => {
            setSvgLoadingStates(prev => ({
              ...prev,
              [chart.key]: false,
            }));
          }, 100 + (index * 20));
          
          return () => clearTimeout(timeout);
        }
      });
    }
  }, [chartDetails?.D1, chartDetails?.D9, chartDetails?.D10, chartDetails?.D60]);


  // Function to convert full zodiac sign names to short names
  const getZodiacShortName = (signName: string): string => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const zodiacMap: { [key: string]: string } = {
      Aries: 'AR',
      Taurus: 'TA',
      Gemini: 'GE',
      Cancer: 'CN',
      Leo: 'LE',
      Virgo: 'VI',
      Libra: 'LI',
      Scorpio: 'SC',
      Sagittarius: 'SG',
      Capricorn: 'CP',
      Aquarius: 'AQ',
      Pisces: 'PI',
    };

    return zodiacMap[signName] || signName;
  };

  // Dynamic dasha data from chartDetails.planets_positions
  const dashaData =
    chartDetails?.planets_positions?.map(planet => {
      return {
        house: planet.house?.toString() || '--',
        planet: planet.name || '--',
        signIcon: planet.sign || '', // Convert to short zodiac name
        degree: `${planet.normDegree?.toFixed(2)} - ${planet.nakshatra} `,
        isRetro: planet.isRetro === 'true',
        planetAwastha: planet.planet_awastha || '--',
      };
    }) || [];

  // Fallback data if no chartDetails available
  const fallbackData = [
    {
      house: '1',
      planet: 'Sun',
      signIcon: 'CP', // Capricorn short name
      degree: '15.42° Capricorn - Uttara Ashadha (2)',
      isRetro: false,
      planetAwastha: 'Mrit',
    },
    {
      house: '2',
      planet: 'Moon',
      signIcon: 'LI', // Libra short name
      degree: '29.87° Libra - Vishakha (3)',
      isRetro: false,
      planetAwastha: 'Mrit',
    },
    {
      house: '3',
      planet: 'Mars',
      signIcon: 'CP', // Capricorn short name
      degree: '12.21° Capricorn - Shravana (1)',
      isRetro: false,
      planetAwastha: 'Yuva',
    },
  ];

  // Use actual data if available, otherwise use fallback
  const finalDashaData = dashaData.length > 0 ? dashaData : fallbackData;

  // Handle scroll event to update current index
  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = responsiveWidth('87') + responsiveWidth('3'); // card width + margin
    const index = Math.round(contentOffsetX / cardWidth);
    setCurrentIndex(index);
  };

  // Handle dot press to scroll to specific chart
  const handleDotPress = (index: number) => {
    const cardWidth = responsiveWidth('87') + responsiveWidth('5'); // full width cards
    const scrollToX = index * cardWidth;

    scrollViewRefdash.current?.scrollTo({
      x: scrollToX,
      animated: true,
    });
  };

  // Chart configuration for D1, D9, D10, D60
  const chartList = [
    { key: 'D1', label: 'Lagna-Chart', svg: chartDetails?.D1 },
    { key: 'D9', label: 'Navamsa-Chart', svg: chartDetails?.D9 },
    { key: 'D10', label: 'Dashamsa-Chart', svg: chartDetails?.D10 },
    { key: 'D60', label: 'Shashtiamsa-Chart', svg: chartDetails?.D60 },
  ];

  return (
    <View style={styles.container}>
      {/* <View style={styles.card}>
        <Text style={styles.sectionTitle}>Charts</Text>
        <View style={styles.chartsGrid}>
          {[1, 2, 3, 4].map((_, idx) => (
            <View key={idx} style={styles.chartCard}>
              <Image
                source={chartImage}
                style={styles.chartImage}
                resizeMode="contain"
              />
              <Text style={styles.chartLabel}>Lagna-Chart</Text>
            </View>
          ))}
        </View>
      </View> */}

      <View
        style={[
          styles.mainContainer,
          {
            backgroundColor:
              theme === 'dark' ? colors.themeTextWhite : colors.white,
            borderColor:
              theme === 'dark'
                ? colors.themeBorderDropdown
                : colors.borderColor,
          },
        ]}
      >
        {/* <Text style={styles.title}>Charts</Text> */}
        <ScrollView
          ref={scrollViewRefdash}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.chartsCarousel,
            {
              backgroundColor:
                theme === 'dark' ? colors.themeTextWhite : colors.white,
              borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,
            },
          ]}
          style={[
            styles.chartsScrollView,
            {
              backgroundColor:
                theme === 'dark' ? colors.themeTextWhite : colors.white,
              borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,
            },
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          pagingEnabled={true}
          decelerationRate="fast"
        >
          {chartList.map(chart => (
            <View key={chart.key} style={styles.chartCard}>
              <Text
                style={[
                  styles.chartLabel,
                  {
                    color:
                      theme === 'dark'
                        ? colors.DarkNavy
                        : colors.themeTextWhite,
                  },
                ]}
              >
                {chart.label}
              </Text>
              {chart.svg ? (
                <View style={styles.chartImageContainer}>
                  {svgLoadingStates[chart.key] && (
                    <View style={styles.loadingContainer}>
                      <LottieView
                        source={require('../../assets/lottie/loader-Animation-1.json')}
                        autoPlay
                        loop
                        style={styles.lottieAnimation}
                      />
                    </View>
                  )}
                  <SvgXml
                    xml={chart.svg}
                    width={responsiveWidth('87')}
                    height={responsiveWidth('87')}
                    style={[
                      styles.chartImage,
                      svgLoadingStates[chart.key] && styles.hiddenSvg,
                    ]}
                    preserveAspectRatio="xMidYMid meet"
                    viewBox="0 0 350 350"
                    onLayout={() => {
                      // Additional fallback to ensure loading state is cleared
                      setTimeout(() => {
                        setSvgLoadingStates(prev => ({
                          ...prev,
                          [chart.key]: false,
                        }));
                      }, 100);
                    }}
                  />
                </View>
              ) : (
                <View style={styles.chartImageContainer}>
                  <View style={styles.loadingContainer}>
                    <LottieView
                      source={require('../../assets/lottie/loader-Animation-1.json')}
                      autoPlay
                      loop
                      style={styles.lottieAnimation}
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {chartList.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              style={styles.paginationDotWrapper}
            >
              <View
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor:
                      theme === 'dark'
                        ? colors.DarkNavy
                        : colors.themeTextWhite,
                  },
                  index === currentIndex && styles.paginationDotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* <View style={styles.dashaCard}>
        <Text style={styles.dashaTitle}>Current Dasha Overview</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>House</Text>
          <Text style={styles.tableHeaderText}>Planet</Text>
          <Text style={styles.tableHeaderText}>Sign</Text>
          <Text style={styles.tableHeaderText}>Degree & Nakshatras</Text>
        </View>
       
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>1</Text>
          <Text style={styles.tableCell}>Saturn</Text>
          <Text style={styles.tableCell}>🪐</Text>
          <Text style={styles.tableCell}>23'15 Magha - 1</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>2</Text>
          <Text style={styles.tableCell}>Sun</Text>
          <Text style={styles.tableCell}>☀️</Text>
          <Text style={styles.tableCell}>05'42 Ardra - 3</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>3</Text>
          <Text style={styles.tableCell}>Rahu (R)</Text>
          <Text style={styles.tableCell}>🌑</Text>
          <Text style={styles.tableCell}>11.67 Ashwini - 4</Text>
        </View>
      </View> */}

      {/* Dasha Overview table */}
      <ImageBackground
        source={
          theme === 'dark'
            ? require('../../assets/image/DarkBackground.png')
            : require('../../assets/image/LightBackground.png')
        }
        blurRadius={12}
        style={[
          styles.membersCard,
          {
            backgroundColor: theme === 'dark' ? colors.surface : colors.white,
            borderColor:
              theme === 'dark' ? colors.borderColor : colors.borderColor,
          },
        ]}
        imageStyle={[
          styles.membersBgImage,
          {
            backgroundColor: theme === 'dark' ? colors.surface : colors.white,
            borderColor:
              theme === 'dark' ? colors.borderColor : colors.borderColor,
          },
        ]}
      >
        {/* <View style={styles.membersOverlay} /> */}
        <View style={[styles.dashaCardContainer]}>
          <Text
            style={[
              styles.dashaTitle,
              {
                backgroundColor:
                  theme === 'dark' ? colors.surface : colors.DarkNavy,
                color: theme === 'dark' ? colors.themeTextWhite : colors.white,
              },
            ]}
          >
            Lagna-Chart Overview
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tableScrollContainer}
            contentContainerStyle={styles.tableScrollContent}
          >
            <View
              style={[
                styles.dashaTable,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.surface : colors.white,
                  borderColor:
                    theme === 'dark' ? colors.borderColor : colors.borderColor,
                },
              ]}
            >
              <View
                style={[
                  styles.dashaTableHeader,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.tabaleHeder : colors.tabaleHeder,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dashaHeaderHouse,
                    { color: theme === 'dark' ? '#23304D' : colors.white },
                  ]}
                >
                  House
                </Text>
                <Text
                  style={[
                    styles.dashaHeaderPlanet,
                    { color: theme === 'dark' ? '#23304D' : colors.white },
                  ]}
                >
                  Planet
                </Text>
                <Text
                  style={[
                    styles.dashaHeaderSign,
                    { color: theme === 'dark' ? '#23304D' : colors.white },
                  ]}
                >
                  Sign
                </Text>
                <Text
                  style={[
                    styles.dashaHeaderDegree,
                    { color: theme === 'dark' ? '#23304D' : colors.white },
                  ]}
                >
                  Degree & Nakshatra
                </Text>
                {/* <Text style={styles.dashaHeaderAwastha}>Awastha</Text> */}
              </View>
              <View style={[styles.tableBody]}>
                {finalDashaData.map((row, idx) => (
                  <View
                    key={row.house + idx}
                    style={[
                      styles.dashaTableRow,
                      {
                        backgroundColor:
                          theme === 'dark' ? '#EFE6D0' : colors.white,
                        borderBottomColor:
                          theme === 'dark' ? '#CFCFCF' : colors.borderColor,
                      },
                      idx === finalDashaData.length - 1 && styles.lastTableRow,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dashaCellHouse,
                        {
                          color: theme === 'dark' ? '#23304D' : colors.DarkNavy,
                        },
                      ]}
                    >
                      {row.house}
                    </Text>
                    <Text
                      style={[
                        styles.dashaCellPlanet,
                        {
                          color: theme === 'dark' ? '#23304D' : colors.DarkNavy,
                        },
                      ]}
                    >
                      {row.planet}
                      {row.isRetro ? ' (R)' : ''}
                    </Text>
                    <View style={styles.dashaCellSign}>
                      <Text
                        style={[
                          styles.dashaSignIcon,
                          {
                            color: theme === 'dark' ? '#23304D' : colors.DarkNavy,
                          },
                        ]}
                      >
                        {row.signIcon}
                      </Text>
                      {/* <Image source={row.signIcon} style={styles.dashaSignIcon} /> */}
                    </View>
                    <Text
                      style={[
                        styles.dashaCellDegree,
                        {
                          color: theme === 'dark' ? '#23304D' : colors.DarkNavy,
                        },
                      ]}
                    >
                      {row.degree}
                    </Text>
                    {/* <Text style={styles.dashaCellAwastha}>{row.planetAwastha}</Text> */}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#444', // dark background
    // padding: responsiveWidth('1'),
  },

  mainContainer: {
    flex: 1,
    backgroundColor: '#EFE6D0',
    borderRadius: 16,
    padding: responsiveWidth('2'),
    margin: responsiveWidth('2'),
    

    marginBottom: responsiveWidth('5'),
    // margin: 10,
  },
  title: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    letterSpacing: -0.14,
    textAlignVertical: 'center',
    marginLeft: responsiveWidth('2'),
  },
  chartsScrollView: {},
  chartsCarousel: {
    paddingHorizontal: responsiveWidth('2'),
    height: responsiveWidth('93'),
    // width: responsiveWidth('100'),
    alignItems: 'center',
  },
  chartCard: {
    width: responsiveWidth('87'),
    
    // height: responsiveWidth('93'),
    alignItems: 'center',
    marginRight: responsiveWidth('5'),
  },
  chartImageContainer: {
    width: responsiveWidth('87'),
    height: responsiveWidth('87'),
    marginBottom: responsiveWidth('1'),
    borderRadius: 16,
    backgroundColor: '#fff',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartImage: {
    width: responsiveWidth('87'),
    height: responsiveWidth('87'),
    borderRadius: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  hiddenSvg: {
    opacity: 0,
  },
  lottieAnimation: {
    width: responsiveWidth('50'),
    height: responsiveWidth('50'),
  },
  chartLabel: {
    color: '#23304D',
    fontSize: 18,
    fontFamily: fontFamily.regular,
    fontWeight: 'bold',
    letterSpacing: 0,
    textAlignVertical: 'center',
    // marginBottom: responsiveWidth('0'),
  },

  card: {
    backgroundColor: '#ede3c8', // light beige
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    // fontWeight: '600',
    fontSize: 18,
    fontFamily: fontFamily.regular,
    marginBottom: 12,
    color: '#333',
  },
  dashaCardContainer: {
  
  },

  membersCard: {
    borderRadius: 16,
    marginTop: responsiveWidth('2%'),
    marginHorizontal: responsiveWidth('3'),
    marginBottom: 24,
    borderWidth: 0.2,
    // borderColor: '#EEE5CA',
  },
  membersBgImage: {
    borderRadius: 16,
    opacity: 0.7,
  },
  membersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dashaTitle: {
    color: color.themeTextWhite,
    fontSize: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingLeft: responsiveWidth('4'),
    paddingVertical: responsiveWidth('3'),
    // marginBottom: responsiveWidth('3'),
    fontFamily: fontFamily.regular,
  },
  dashaTable: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  tableBody: {
    // Table body container
  },
  dashaTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#D6C295',
    paddingVertical: 10,
    paddingHorizontal: 8,
    minWidth: responsiveWidth('100'),
  },
  dashaTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CFCFCF',
    backgroundColor: '#EFE6D0',
    minWidth: responsiveWidth('100'),
  },
  dashaHeaderHouse: {
    width: responsiveWidth('15'),
    color: '#23304D',
    fontWeight: 'bold',
    fontFamily: fontFamily.regular,
    fontSize: 14,

    textAlign: 'left',
  },
  dashaHeaderPlanet: {
    width: responsiveWidth('20'),
    color: '#23304D',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'left',
  },
  dashaHeaderSign: {
    width: responsiveWidth('20'),
    color: '#23304D',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'left',
  },
  dashaHeaderDegree: {
    width: responsiveWidth('40'),
    color: '#23304D',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'left',
  },
  dashaHeaderAwastha: {
    width: 100,
    color: '#23304D',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  dashaCellHouse: {
    width: responsiveWidth('15'),
    color: '#23304D',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'left',
    fontWeight: '400',
  },
  dashaCellPlanet: {
    width: responsiveWidth('20'),
    color: '#23304D',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'left',
    fontWeight: '400',
  },
  dashaCellSign: {
    width: responsiveWidth('20'),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  dashaSignIcon: {
    width: responsiveWidth('20'),
    color: '#23304D',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'left',
    fontWeight: '400',
  },
  dashaCellDegree: {
    width: responsiveWidth('40'),
    color: '#23304D',
    fontSize: 14,
    textAlign: 'left',
    fontWeight: '400',
    fontFamily: fontFamily.regular,
  },
  dashaCellAwastha: {
    width: 100,
    color: '#23304D',
    fontSize: 14,
    textAlign: 'left',
    fontWeight: '400',
    fontFamily: fontFamily.regular,
  },
  lastTableRow: {
    borderBottomWidth: 0,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDotWrapper: {
    padding: 8, // Increased touch area
    marginHorizontal: 2,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#23304D',
  },
  paginationDotActive: {
    backgroundColor: 'rgba(223, 138, 93, 1)',
    width: 12,
    height: 8,
    borderRadius: 4,
  },
  tableScrollContainer: {
    flex: 1,
  },
  tableScrollContent: {
    flexGrow: 1,
  },
});

