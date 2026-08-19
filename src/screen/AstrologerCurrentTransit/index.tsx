import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DatePicker from 'react-native-date-picker';
import Toast from 'react-native-toast-message';
import { MainContainer } from '../../components/common/mainContainer';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import UserService from '../../services/user/user.service';
import { saveAstrologerCurrentTransitSession } from '../../utils/astrologerCurrentTransitSession';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCRiOhv-8F7NUHE22gm9zres6rVFwlkXEE';

interface Place {
  place_id: string;
  description: string;
}

interface DropdownItem {
  label: string;
  value: string;
  place_id: string;
}

type RootStackParamList = {
  AstrologerCurrentTransitResultScreen: { chartData: Record<string, unknown> };
};

const validationSchema = Yup.object({
  dateOfBirth: Yup.string().required('Date is required'),
  timeOfBirth: Yup.string().required('Time is required'),
  placeOfBirth: Yup.object().nullable().required('Place is required'),
  placeOfBirthDisplay: Yup.string().trim().required('Place is required'),
});

const AstrologerCurrentTransitScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { theme, colors } = useTheme();
  const userService = useMemo(() => new UserService(), []);
  const user = useSelector((state: RootState) => state.app.user);
  const astrologerUserId = String(user?._id || '');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isPlaceDropdownOpen, setIsPlaceDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);

  const closeAllModals = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    setIsPlaceDropdownOpen(false);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const formik = useFormik({
    initialValues: {
      dateOfBirth: '',
      timeOfBirth: '',
      placeOfBirth: null as { lat: number; lng: number } | null,
      placeOfBirthDisplay: '',
    },
    validationSchema,
    onSubmit: async values => {
      if (!selectedDate || !selectedTime || !values.placeOfBirth) {
        Toast.show({
          type: 'error',
          text1: 'Missing details',
          text2: 'Please complete all required fields.',
        });
        return;
      }

      try {
        const payload = {
          day: selectedDate.getDate(),
          month: selectedDate.getMonth() + 1,
          year: selectedDate.getFullYear(),
          hour: selectedTime.getHours(),
          min: selectedTime.getMinutes(),
          birthplace: values.placeOfBirthDisplay,
          lat: values.placeOfBirth.lat,
          lon: values.placeOfBirth.lng,
          tzone: 5.5,
        };

        const response = await userService.createAstrologerCurrentTransit(payload);

        if (response?.data) {
          await saveAstrologerCurrentTransitSession(astrologerUserId, response.data);
          navigation.navigate('AstrologerCurrentTransitResultScreen', {
            chartData: response.data,
          });
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        Toast.show({
          type: 'error',
          text1: 'Failed to generate chart',
          text2: err.message || 'Please try again.',
        });
      }
    },
  });

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setPlaces([]);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query,
        )}&key=${GOOGLE_MAPS_API_KEY}&types=geocode`,
      );
      const data = await response.json();
      setPlaces(data.status === 'OK' ? data.predictions : []);
    } catch {
      setPlaces([]);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchPlaces(searchQuery);
      } else {
        setPlaces([]);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredPlaces: DropdownItem[] = places.map(place => ({
    label: place.description,
    value: place.description,
    place_id: place.place_id,
  }));

  const handlePlaceSelect = async (item: DropdownItem) => {
    try {
      const detailsRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=${GOOGLE_MAPS_API_KEY}`,
      );
      const detailsData = await detailsRes.json();
      const location = detailsData.result?.geometry?.location;

      if (!location) {
        return;
      }

      formik.setFieldValue('placeOfBirth', location);
      formik.setFieldValue('placeOfBirthDisplay', item.value);
      setSearchQuery('');
      setPlaces([]);
      setIsPlaceDropdownOpen(false);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to fetch place details.',
      });
    }
  };

  const inputThemeStyle = {
    backgroundColor: theme === 'dark' ? colors.cardBackground : colors.white,
    borderColor:
      theme === 'dark' ? colors.themeBorderDropdown : colors.borderColor,
    color: theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
  };

  const placeholderColor =
    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
      enabled
    >
      <MainContainer safeBottom>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          nestedScrollEnabled
        >
          <View style={styles.headerWrap}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Image
                source={require('../../assets/icons/back.png')}
                style={[
                  styles.backIcon,
                  {
                    tintColor:
                      theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  },
                ]}
              />
            </TouchableOpacity>
            <View style={styles.backIconWrap}>
              <Text
                style={[
                  styles.topBarText,
                  {
                    color:
                      theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  },
                ]}
              >
                Transit Chart
              </Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            {/* <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                },
              ]}
            >
              Transit Details
            </Text> */}

            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[styles.input, inputThemeStyle]}
                onPress={() => {
                  closeAllModals();
                  setShowDatePicker(true);
                }}
              >
                <Text
                  style={[
                    styles.inputText,
                    {
                      color: formik.values.dateOfBirth
                        ? theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy
                        : placeholderColor,
                    },
                  ]}
                >
                  {formik.values.dateOfBirth || 'Date'}
                </Text>
                <Image
                  source={require('../../assets/icons/date-pikar.png')}
                  style={[
                    styles.calendarIcon,
                    {
                      tintColor:
                        theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                    },
                  ]}
                />
              </TouchableOpacity>
              {formik.touched.dateOfBirth && formik.errors.dateOfBirth ? (
                <Text style={styles.errorText}>{formik.errors.dateOfBirth}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[styles.input, inputThemeStyle]}
                onPress={() => {
                  closeAllModals();
                  setShowTimePicker(true);
                }}
              >
                <Text
                  style={[
                    styles.inputText,
                    {
                      color: formik.values.timeOfBirth
                        ? theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy
                        : placeholderColor,
                    },
                  ]}
                >
                  {formik.values.timeOfBirth || 'Time'}
                </Text>
                <Image
                  source={require('../../assets/icons/time_piker.png')}
                  style={[
                    styles.clockIcon,
                    {
                      tintColor:
                        theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                    },
                  ]}
                />
              </TouchableOpacity>
              {formik.touched.timeOfBirth && formik.errors.timeOfBirth ? (
                <Text style={styles.errorText}>{formik.errors.timeOfBirth}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[styles.input, inputThemeStyle]}
                onPress={() => {
                  closeAllModals();
                  setIsPlaceDropdownOpen(true);
                  if (searchQuery.trim()) {
                    searchPlaces(searchQuery);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.inputContent}>
                  <Image
                    source={require('../../assets/icons/location.png')}
                    style={[
                      styles.dropdownIcon,
                      {
                        tintColor:
                          theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.inputText,
                      {
                        color: formik.values.placeOfBirthDisplay
                          ? theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy
                          : placeholderColor,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {formik.values.placeOfBirthDisplay || 'Place of Birth'}
                  </Text>
                </View>
                <Image
                  source={require('../../assets/icons/Dropdown.png')}
                  style={[
                    styles.dropdownIcon,
                    {
                      transform: [
                        { rotate: isPlaceDropdownOpen ? '180deg' : '0deg' },
                      ],
                      tintColor:
                        theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                    },
                  ]}
                />
              </TouchableOpacity>

              {isPlaceDropdownOpen ? (
                <View
                  style={[
                    styles.dropdownListContainer,
                    {
                      backgroundColor:
                        theme === 'dark' ? colors.DarkNavy : colors.white,
                      borderColor:
                        theme === 'dark'
                          ? colors.themeBorderDropdown
                          : colors.borderColor,
                    },
                  ]}
                >
                  <View style={styles.dropdownHeader}>
                    <TextInput
                      style={[
                        styles.dropdownSearchInput,
                        inputThemeStyle,
                        {
                          borderBottomColor:
                            theme === 'dark'
                              ? 'rgba(73, 108, 168, 0.3)'
                              : colors.borderColor,
                        },
                      ]}
                      placeholder="Search places..."
                      placeholderTextColor={placeholderColor}
                      value={searchQuery}
                      onChangeText={text => {
                        setSearchQuery(text);
                        if (text.trim()) {
                          searchPlaces(text);
                        }
                      }}
                      autoFocus
                    />
                  </View>

                  <ScrollView
                    style={styles.dropdownList}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    {filteredPlaces.map((item, index) => (
                      <TouchableOpacity
                        key={item.place_id}
                        style={[
                          styles.dropdownItem,
                          {
                            borderBottomColor:
                              theme === 'dark'
                                ? 'rgba(73, 108, 168, 0.3)'
                                : colors.borderColor,
                          },
                          index === filteredPlaces.length - 1 && {
                            borderBottomWidth: 0,
                          },
                        ]}
                        onPress={() => handlePlaceSelect(item)}
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
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {formik.touched.placeOfBirth && formik.errors.placeOfBirth ? (
                <Text style={styles.errorText}>
                  {String(formik.errors.placeOfBirth)}
                </Text>
              ) : null}
            </View>

            <View style={styles.footerActions}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    borderColor:
                      theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  },
                ]}
                onPress={() => navigation.goBack()}
                disabled={formik.isSubmitting}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    {
                      color:
                        theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.generateButton,
                  { backgroundColor: colors.Orangeaccentcolor },
                ]}
                onPress={() => formik.handleSubmit()}
                disabled={formik.isSubmitting}
                activeOpacity={0.85}
              >
                {formik.isSubmitting ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={[styles.generateButtonText, { color: colors.white }]}>
                    Generate Chart
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </MainContainer>

      <DatePicker
        modal
        open={showDatePicker}
        date={selectedDate || new Date()}
        mode="date"
        theme="light"
        onConfirm={date => {
          closeAllModals();
          setSelectedDate(date);
          formik.setFieldValue('dateOfBirth', formatDate(date));
          formik.setFieldTouched('dateOfBirth', true, false);
        }}
        onCancel={closeAllModals}
      />

      <DatePicker
        modal
        open={showTimePicker}
        date={selectedTime || new Date()}
        mode="time"
        theme="light"
        onConfirm={time => {
          closeAllModals();
          setSelectedTime(time);
          formik.setFieldValue('timeOfBirth', formatTime(time));
          formik.setFieldTouched('timeOfBirth', true, false);
        }}
        onCancel={closeAllModals}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollViewContent: { flexGrow: 1 },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
    marginBottom: 10,
    position: 'relative',
  },
  backBtn: { padding: 8, marginRight: 16 },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
  },
  topBarText: {
    fontSize: 22,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  subTitleText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
  backIconWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    marginBottom: responsiveWidth('3'),
  },
  inputContainer: { marginBottom: 10 },
  input: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: responsiveWidth('2.5'),
    borderWidth: 2,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  inputText: { fontSize: 16, fontFamily: fontFamily.regular, flex: 1 },
  dropdownIcon: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    marginRight: responsiveWidth('2'),
    resizeMode: 'contain',
  },
  calendarIcon: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    resizeMode: 'contain',
  },
  clockIcon: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    resizeMode: 'contain',
  },
  dropdownListContainer: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 2,
    maxHeight: 220,
    overflow: 'hidden',
  },
  dropdownHeader: { paddingHorizontal: 12, paddingTop: 12 },
  dropdownSearchInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    marginBottom: 8,
  },
  dropdownList: { maxHeight: 150 },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: { fontSize: 14, fontFamily: fontFamily.regular },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: responsiveWidth('4'),
    marginBottom: responsiveWidth('20%'),
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: responsiveWidth('3'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  generateButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: responsiveWidth('3'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: fontFamily.regular,
  },
});

export default AstrologerCurrentTransitScreen;
