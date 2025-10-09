import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  responsiveHeight,
  responsiveWidth,
  fontFamily,
} from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface SliderData {
  id: number;
  image: any;
  quote: string;
  author: string;
  description: string;
}

const sliderData: SliderData[] = [
  {
    id: 1,
    image: require('../../assets/image/homeSliderImg/slider-1.png'),
    quote: 'Knowing yourself is the beginning of all wisdom.',
    author: 'Aristotle',
    description: '(Ancient Philosopher)',
  },
  {
    id: 2,
    image: require('../../assets/image/homeSliderImg/slider-2.png'),
    quote: 'The stars above us govern our conditions.',
    author: 'William Shakespeare',
    description: '(English Playwright)',
  },
  {
    id: 3,
    image: require('../../assets/image/homeSliderImg/slider-3.png'),
    quote:
      'Astrology is a language. If you understand this language, the sky speaks to you.',
    author: 'Dane Rudhyar',
    description: '(Astrologer & Philosopher)',
  },
  {
    id: 4,
    image: require('../../assets/image/homeSliderImg/slider-4.png'),
    quote: 'The cosmos is within us. We are made of star-stuff.',
    author: 'Carl Sagan',
    description: '(Astronomer & Author)',
  },
];

const HomeImageSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { colors } = useTheme();

  // Auto-scroll functionality
  useEffect(() => {
    const slideWidth = screenWidth - responsiveWidth('4%');
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % sliderData.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * slideWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const slideWidth = screenWidth - responsiveWidth('4%');

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / slideWidth);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const scrollToSlide = (index: number) => {
    const targetX = index * slideWidth;
    scrollViewRef.current?.scrollTo({
      x: targetX,
      animated: true,
    });
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={slideWidth}
        snapToAlignment="start"
        style={styles.scrollView}
      >
        {sliderData.map(item => (
          <View key={item.id} style={styles.slideContainer}>
            <ImageBackground
              source={item.image}
              style={styles.backgroundImage}
              imageStyle={styles.backgroundImageStyle}
            >
              <View style={styles.overlay} />
              <View style={styles.contentContainer}>
                <View style={styles.textContainer}>
                  <Text style={[styles.quoteText, { color: colors.white }]}>
                    "{item.quote}"
                  </Text>
                  <Text style={[styles.authorText, { color: colors.accent }]}>
                    {item.author}
                  </Text>
                  <Text
                    style={[styles.descriptionText, { color: colors.accent }]}
                  >
                    {item.description}
                  </Text>
                </View>
                {/* <View style={styles.imageContainer}>
                    <Image
                      source={item.image}
                      style={styles.characterImage}
                      resizeMode="contain"
                    />
                  </View> */}
              </View>

              {/* Navigation Dots inside the background image */}
            </ImageBackground>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dotsContainer}>
        {sliderData.map((_, dotIndex) => (
          <TouchableOpacity
            key={dotIndex}
            style={[
              styles.dot,
              {
                backgroundColor:
                  dotIndex === currentIndex
                    ? '#DF8A5D'
                    : 'rgba(255, 255, 255, 0.6)',
              },
            ]}
            onPress={() => scrollToSlide(dotIndex)}
            activeOpacity={0.7}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 212,
    // marginHorizontal: responsiveWidth('1%'),
    // marginTop: responsiveHeight('1%'),
    borderRadius: 20,
    overflow: 'hidden',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0.3,
    // shadowRadius: 8,
    // elevation: 8,
    marginBottom: responsiveHeight('1%'),
  },
  scrollView: {
    flex: 1,
  },
  slideContainer: {
    width: screenWidth - responsiveWidth('4%'),
    height: 212,
  },
  backgroundImage: {
    width: screenWidth - responsiveWidth('4%'),
    height: 212,
    justifyContent: 'center',
    alignItems: 'center',
    // opacity: 0.7,
  },
  backgroundImageStyle: {
    // borderRadius: 20,
    resizeMode: 'cover',
    width: '100%',
    // opacity: 0.9,
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    // borderRadius: 20,
  },
  contentContainer: {
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    // bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('5%'),
    // paddingTop: -responsiveWidth('15%'),
    // paddingBottom: responsiveHeight('12%'),
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: responsiveWidth('30%'),
    // paddingLeft: responsiveWidth('30%'),
    // paddingTop: -responsiveWidth('10%'),
    // alignItems: 'center',
    // paddingRight: responsiveWidth('3%'),
  },
  quoteText: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    fontWeight: '700',

    // lineHeight: 30,
    // marginBottom: responsiveHeight('1.5%'),
    textAlign: "center",
    letterSpacing: 0.3,
  },
  authorText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    textAlign: 'center',
  },
  imageContainer: {
    flex: 0.7,
    height: responsiveHeight('18%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: responsiveHeight('1%'),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: responsiveHeight('4%'),
    // marginLeft: -responsiveWidth('5%'),
    // alignItems: 'center',
    // paddingVertical: responsiveHeight('1.5%'),
    // paddingBottom: responsiveHeight('2%'),
    // backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginHorizontal: 6,
  },
});

export default HomeImageSlider;
