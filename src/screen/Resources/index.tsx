// ResourcesScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
  Image,
  ImageBackground,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {
  fontFamily,
  responsiveWidth,
  responsiveHeight,
} from '../../constant/theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainContainer } from '../../components/common/mainContainer';
import { useTheme } from '../../context/ThemeContext';
import BooksService, { Book } from '../../services/books/books.service';
import LottieView from 'lottie-react-native';
import { baseURL } from '../../utils/http';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  ForgotPasswordOtp: undefined;
};

type ResourcesScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

const ResourcesScreen = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<ResourcesScreenNavigationProp>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await BooksService.getBooks(0, 10, 10, 0);
      if (response.data) {
        setBooks(response.data.data);
        // Initialize image loading states for all books
        const initialImageStates: {[key: string]: boolean} = {};
        response.data.data.forEach((book: Book) => {
          initialImageStates[book.id] = true; // true means loading
        });
        setImageLoadingStates(initialImageStates);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (bookId: string) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [bookId]: false // false means loaded
    }));
  };

  const handleImageError = (bookId: string) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [bookId]: false // false means error occurred, stop loading
    }));
  };

   const handleBookPress = (item: Book) => {
     navigation.navigate('ResourcesDetailsScreen', { book: item });
   };
   

  const renderBookCard = ({ item, index }: { item: Book; index: number }) => {

   

    return (
      <TouchableOpacity
        style={[
          styles.bookCard,
          { boxShadow: '0px 5px 5px 0px rgba(0, 0, 0, 0.35)' },
        ]}
        activeOpacity={0.8}
        onPress={() => handleBookPress(item)}
      >
        {/* Top Section with Image and Title */}
        <View style={styles.cardTopSection}>
          {imageLoadingStates[item.id] && (
            <View style={styles.imageLoaderContainer}>
              <LottieView
                source={require('../../assets/lottie/loader-Animation-1.json')}
                autoPlay
                loop
                style={styles.imageLottieAnimation}
              />
            </View>
          )}
          <Image
            source={{
              uri: `${baseURL}/${item.image_path}`,
            }}
            style={[
              styles.bookImage,
              imageLoadingStates[item.id] && styles.hiddenImage,
            ]}
            resizeMode="cover"
            onLoad={() => handleImageLoad(item.id)}
            onError={() => handleImageError(item.id)}
          />
          {/* <Text style={[styles.cardTitle, { color: textColor }]}>
            {item.title.toUpperCase()}
          </Text>
          {item.slogan && (
            <Text style={[styles.cardSlogan, { color: textColor }]}>
              {item.slogan.toUpperCase()}
            </Text>
          )} */}
        </View>

        {/* Bottom Section with White Background */}
        <View style={styles.cardBottomSection}>
          <Text style={styles.bottomTitle}>{item.title}</Text>
          {item.slogan && (
            <Text style={styles.bottomSlogan}>{item.slogan}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={
        theme === 'dark'
          ? require('../../assets/image/DarkBackground.png')
          : require('../../assets/image/LightBackground.png')
      }
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />

      <MainContainer>
        {/* Header */}
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
              Resources
            </Text>
          </View>
        </View>

        {/* Books Grid */}
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
          <View style={styles.contentContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <LottieView
                  source={require('../../assets/lottie/loader-Animation-1.json')}
                  autoPlay
                  loop
                  style={styles.lottieAnimation}
                />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text
                  style={[
                    styles.errorText,
                    {
                      color:
                        theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
                    },
                  ]}
                >
                  {error}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    {
                      borderColor:
                        theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
                    },
                  ]}
                  onPress={fetchBooks}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.retryButtonText,
                      {
                        color:
                          theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
                      },
                    ]}
                  >
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={books}
                renderItem={renderBookCard}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.booksGrid}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </MainContainer>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:
      Platform.OS === 'android'
        ? responsiveHeight('0.5%')
        : responsiveWidth('12%'),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    position: 'relative',
    minHeight: 50,
  },
  backBtn: {
    //  position: 'absolute',
    left: responsiveWidth('5'),
    // padding: 8,
    // top:
    //   Platform.OS === 'android'
    //     ? responsiveWidth('11.5%')
    //     : responsiveWidth('2%'),
    // zIndex: 1,
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
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
    borderRadius: 8,
    flex: 1,
    marginHorizontal: responsiveWidth('4'),
    marginTop: responsiveWidth('2%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    // justifyContent: 'center',
    // alignItems: 'center',
    overflow: 'hidden',
    marginBottom: responsiveWidth('5%'),
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: responsiveWidth('2'),
    paddingTop: responsiveWidth('2'),
  },
  booksGrid: {
    // paddingBottom: responsiveWidth('5'),
    margin: responsiveWidth('1'),
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: responsiveWidth('3'),
  },
  bookCard: {
    width: responsiveWidth(41.5),
    height: responsiveHeight(34),
    // margin: responsiveWidth('2'),
    // margin: responsiveWidth('5'),
    // width: responsiveWidth('45'),
    // height: responsiveHeight('25'),
    borderRadius: 12,
    overflow: 'hidden',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  cardTopSection: {
    flex: 1,
    // padding: responsiveWidth('2'),
    // width:"100%",
    // height:"100%",
    // padding: responsiveWidth('3'),
    // justifyContent: 'center',
    // alignItems: 'center',
    // position: 'relative',
  },
  bookImage: {
    // width: responsiveWidth('100%'),
    // height: "auto",
    width: '100%',
    resizeMode: 'contain',
    height: '100%',
    // borderRadius: responsiveWidth('7.5'),
    // marginBottom: responsiveWidth('2'),
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: responsiveWidth('1'),
    lineHeight: 20,
  },
  cardSlogan: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 16,
    // opacity: 0.9,
  },
  cardBottomSection: {
    backgroundColor: '#FFFFFF',
    // padding: responsiveWidth('3'),
    paddingVertical: responsiveWidth('1'),
    paddingHorizontal: responsiveWidth('1'),
    // maxHeight: responsiveHeight('7'),
    minHeight: responsiveHeight('6'),
    justifyContent: 'center',
    alignItems: 'center',
    // borderRadius: 12,
    // borderWidth: 0.2,
    // borderColor: '#EEE5CA',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  bottomTitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    // marginBottom: responsiveWidth('0.5'),
  },
  bottomSlogan: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // paddingVertical: responsiveWidth('10'),
  },
  lottieAnimation: {
    width: responsiveWidth('87'),
    height: responsiveWidth('87'),
  },
  imageLoaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  imageLottieAnimation: {
    width: responsiveWidth('20'),
    height: responsiveWidth('20'),
  },
  hiddenImage: {
    opacity: 0,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    marginTop: responsiveWidth('2'),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveWidth('10'),
  },
  errorText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: responsiveWidth('3'),
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: responsiveWidth('3'),
    paddingHorizontal: responsiveWidth('6'),
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
});

export default ResourcesScreen;
