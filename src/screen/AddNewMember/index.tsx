// BasicDeatil.tsx

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackActions } from '@react-navigation/native';
import { MainContainer } from '../../components/common/mainContainer';
import Toast from 'react-native-toast-message';
import { responsiveWidth, fontFamily, color } from '../../constant/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker from 'react-native-date-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserService from '../../services/user/user.service';
import serviceFactory from '../../services/serviceFactory';
import { useTheme } from '../../context/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { setMembersUpdated } from '../../state/slices/appSlice';
import { RootState } from '../../state/store';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
};

type BasicDeatilNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Register'
>;

const GOOGLE_MAPS_API_KEY = 'AIzaSyCRiOhv-8F7NUHE22gm9zres6rVFwlkXEE';

interface Place {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface DropdownItem {
  label: string;
  value: string;
  place_id: string;
}

const AddNewMember = () => {
  const navigation = useNavigation<BasicDeatilNavigationProp>();
  const { theme, colors } = useTheme();
  const dispatch = useDispatch();
  const userService = serviceFactory.get<UserService>('UserService');
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showPredictionTypeModal, setShowPredictionTypeModal] = useState(false);
 const members = useSelector((state: RootState) => state.app.members);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [iosTempDate, setIosTempDate] = useState<Date | null>(null);
  const [iosTempTime, setIosTempTime] = useState<Date | null>(null);
  const [tempHour, setTempHour] = useState(12);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempAmPm, setTempAmPm] = useState('AM');
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [isPlaceDropdownOpen, setIsPlaceDropdownOpen] = useState(false);

  const genderOptions = ['Male', 'Female', 'Other'];
  const predictionTypeOptions = ['Bullet', 'Paragraph'];

  // Search places using Google Places API
  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setPlaces([]);
      return;
    }

    try {
      const autoRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query,
        )}&key=${GOOGLE_MAPS_API_KEY}&types=geocode`,
      );

      const autoData = await autoRes.json();

      if (autoData.status === 'OK') {
        setPlaces(autoData.predictions); // 👉 Show list to user
      } else {
        setPlaces([]);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setPlaces([]);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlaces(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Convert places to dropdown format
  const getDropdownData = (): DropdownItem[] => {
    return places.map(place => ({
      label: place.structured_formatting.secondary_text
        ? `${place.structured_formatting.main_text}, ${place.structured_formatting.secondary_text}`
        : place.structured_formatting.main_text,
      value: place.structured_formatting.main_text,
      place_id: place.place_id,
    }));
  };

  // Filter places based on search
  const filteredPlaces = getDropdownData().filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const validationSchema = Yup.object().shape({
    firstName: Yup.string().trim().required('Please enter your first name'),
    lastName: Yup.string().trim().required('Please enter your last name'),
    gender: Yup.string().required('Please select your gender'),
    predictionType: Yup.string().required('Please select prediction type'),
    dateOfBirth: Yup.string().required('Please select your date of birth'),
    timeOfBirth: Yup.string().required('Please select your time of birth'),
    placeOfBirth: Yup.object()
      .shape({
        lat: Yup.number().required('Please enter your latitude'),
        lng: Yup.number().required('Please enter your longitude'),
      })
      .required('Please enter your place of birth'),
    placeOfBirthDisplay: Yup.string()
      .trim()
      .required('Please select your place of birth'),
    whatDoYouDo: Yup.string().trim(),
  });

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      gender: '',
      predictionType: '',
      dateOfBirth: '',
      timeOfBirth: '',
      placeOfBirth: null,
      placeOfBirthDisplay: '',
      whatDoYouDo: '',
    },
    validationSchema,
    onSubmit: async (values, helpers) => {
      try {
        helpers.setSubmitting(true);

        // Get current user data to extract userId
        const userDataString = await AsyncStorage.getItem('USER_DATA');
        if (!userDataString) {
          throw new Error('User data not found. Please login again.');
        }

        const userData = JSON.parse(userDataString);
        const userId = userData._id || userData.user_id;

        if (!userId) {
          throw new Error('User ID not found. Please login again.');
        }

        // Parse date and time from form values
        // The form stores formatted strings, so we need to parse them back to Date objects
        let dateObj: Date;
        let timeObj: Date;

        // Check if we have the actual Date objects stored in state
        if (selectedDate && selectedTime) {
          dateObj = selectedDate;
          timeObj = selectedTime;
        } else {
          // Fallback: try to parse the formatted strings
          // formatDate returns "Oct 10, 2010" format
          // formatTime returns "11:59 PM" format
          try {
            dateObj = new Date(values.dateOfBirth);
            timeObj = new Date(`1970-01-01 ${values.timeOfBirth}`);
          } catch (error) {
            throw new Error(
              'Invalid date or time format. Please select date and time again.',
            );
          }
        }

        // Validate that we have valid dates
        if (isNaN(dateObj.getTime()) || isNaN(timeObj.getTime())) {
          throw new Error(
            'Invalid date or time. Please select valid date and time.',
          );
        }

        // Extract coordinates from placeOfBirth
        const placeOfBirth = values.placeOfBirth as {
          lat: number;
          lng: number;
        } | null;
        const lat = placeOfBirth?.lat || 0;
        const lng = placeOfBirth?.lng || 0;

        // Prepare birth data for API
        const birthData = {
          userId,
          first_name: values.firstName,
          last_name: values.lastName,
          gender: values.gender.toLowerCase(),
          prediction_type: values.predictionType,
          birthplace: values.placeOfBirthDisplay,
          day: dateObj.getDate(),
          month: dateObj.getMonth() + 1, // getMonth() returns 0-11
          year: dateObj.getFullYear(),
          hour: timeObj.getHours(),
          min: timeObj.getMinutes(),
          what_do_you_do: values.whatDoYouDo,
          marital_status: 'single',
          children: 'no',
          health_issues_if_any: '-',
          main_source_of_finances: '-',
          lat: lat || 0,
          lon: lng || 0,
          tzone: 5.5, // Default timezone for India, you might want to make this dynamic
        };

        console.log('Form values:', values);
        console.log('Selected date:', selectedDate);
        console.log('Selected time:', selectedTime);
        console.log('Parsed date object:', dateObj);
        console.log('Parsed time object:', timeObj);
        console.log('Submitting birth data:', birthData);

        // Call the API to create birth data
        const response = await userService.createBirthData(birthData);

        console.log('Birth data creation response:', response);

        Toast.show({
          type: 'success',
          text1: 'Member Added Successfully',
          text2: 'New member has been added to your account.',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });

        // Set flag to indicate members data has been updated
        dispatch(setMembersUpdated(true));

        // Navigate to HomeScreen after adding a member
        navigation.dispatch(StackActions.replace('HomeScreen'));
      } catch (error: any) {
        console.error('Error submitting birth data:', error);
        const errorMessage = error?.message || 'Something went wrong.';
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Custom time picker functions
  const generateHours = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  const generateMinutes = () => {
    return Array.from({ length: 60 }, (_, i) => i);
  };

  const generateAmPm = () => {
    return ['AM', 'PM'];
  };

  const handleTimeConfirm = () => {
    let hour24 = tempHour;
    if (tempAmPm === 'PM' && tempHour !== 12) {
      hour24 = tempHour + 12;
    } else if (tempAmPm === 'AM' && tempHour === 12) {
      hour24 = 0;
    }

    const time = new Date();
    time.setHours(hour24, tempMinute, 0, 0);

    setSelectedTime(time);
    formik.setFieldValue('timeOfBirth', formatTime(time));
    setShowTimePicker(false);
  };

  const handleTimeCancel = () => {
    setShowTimePicker(false);
    // Reset to current time or selected time
    if (selectedTime) {
      const hour = selectedTime.getHours();
      const minute = selectedTime.getMinutes();
      setTempHour(hour === 0 ? 12 : hour > 12 ? hour - 12 : hour);
      setTempMinute(minute);
      setTempAmPm(hour >= 12 ? 'PM' : 'AM');
    }
  };

  const handlePlaceSelect = async (item: DropdownItem) => {
    console.log('item-->123', item);

    const placeId = item.place_id;

    // 2. Place Details request
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`,
    );

    const detailsData = await detailsRes.json();

    console.log('detailsData-->123', detailsData);

    const location = detailsData.result?.geometry?.location;

    console.log('location-->123', location);

    // Store the location object in formik
    formik.setFieldValue('placeOfBirth', location);

    // Also store the display name for the dropdown
    formik.setFieldValue('placeOfBirthDisplay', item.label);

    setSearchQuery('');
    setPlaces([]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
      enabled
    >
      <MainContainer>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
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
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
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
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Add New Member
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Form Container Title */}
            {/* {members?.length === 0 && ( */}
              {/* <View
                style={[
                  styles.formContainerTitle,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.cardBackground : colors.white,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.formContainerTitleText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Add your details to generate your charts
                </Text>
              </View> */}
            {/* )} */}

            {/* First Name */}
            <View style={[styles.inputContainer]}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.cardBackground : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
                placeholder="First Name"
                placeholderTextColor={
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy
                }
                value={formik.values.firstName}
                onChangeText={formik.handleChange('firstName')}
                onBlur={formik.handleBlur('firstName')}
              />
              {formik.touched.firstName && formik.errors.firstName && (
                <Text style={styles.errorText}>{formik.errors.firstName}</Text>
              )}
            </View>

            {/* Last Name */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.cardBackground : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
                placeholder="Last Name"
                placeholderTextColor={
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy
                }
                value={formik.values.lastName}
                onChangeText={formik.handleChange('lastName')}
                onBlur={formik.handleBlur('lastName')}
              />
              {formik.touched.lastName && formik.errors.lastName && (
                <Text style={styles.errorText}>{formik.errors.lastName}</Text>
              )}
            </View>

            {/* Gender */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.cardBackground : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                  },
                ]}
                onPress={() => setShowGenderModal(true)}
              >
                <Text
                  style={[
                    styles.inputText,
                    {
                      color: formik.values.gender
                        ? theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy
                        : theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                    },
                  ]}
                >
                  {formik.values.gender || 'Gender'}
                </Text>
                <Image
                  source={require('../../assets/icons/Dropdown.png')}
                  style={[
                    styles.dropdownIcon,
                    {
                      tintColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                    { marginRight: responsiveWidth('0') },
                  ]}
                />
              </TouchableOpacity>
              {formik.touched.gender && formik.errors.gender && (
                <Text style={styles.errorText}>{formik.errors.gender}</Text>
              )}
            </View>

            {/* Prediction Type */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.cardBackground : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                  },
                ]}
                onPress={() => setShowPredictionTypeModal(true)}
              >
                <Text
                  style={[
                    styles.inputText,
                    {
                      color: formik.values.predictionType
                        ? theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy
                        : theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                    },
                  ]}
                >
                  {formik.values.predictionType || 'Prediction Type'}
                </Text>
                <Image
                  source={require('../../assets/icons/Dropdown.png')}
                  style={[
                    styles.dropdownIcon,
                    {
                      tintColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                    { marginRight: responsiveWidth('0') },
                  ]}
                />
              </TouchableOpacity>
              {formik.touched.predictionType &&
                formik.errors.predictionType && (
                  <Text style={styles.errorText}>
                    {formik.errors.predictionType}
                  </Text>
                )}
            </View>

            {/* Date of Birth */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.cardBackground : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[
                    styles.inputText,
                    {
                      color: formik.values.dateOfBirth
                        ? theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy
                        : theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                    },
                  ]}
                >
                  {formik.values.dateOfBirth || 'Date of Birth'}
                </Text>
                <Image
                  source={require('../../assets/icons/date-pikar.png')}
                  style={[
                    styles.calendarIcon,
                    {
                      tintColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                />
              </TouchableOpacity>
              {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
                <Text style={styles.errorText}>
                  {formik.errors.dateOfBirth}
                </Text>
              )}
            </View>

            {/* Time of Birth */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.cardBackground : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                  },
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text
                  style={[
                    styles.inputText,
                    {
                      color: formik.values.timeOfBirth
                        ? theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy
                        : theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                    },
                  ]}
                >
                  {formik.values.timeOfBirth || 'Time of Birth'}
                </Text>
                <Image
                  source={require('../../assets/icons/time_piker.png')}
                  style={[
                    styles.clockIcon,
                    {
                      tintColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                />
              </TouchableOpacity>
              {formik.touched.timeOfBirth && formik.errors.timeOfBirth && (
                <Text style={styles.errorText}>
                  {formik.errors.timeOfBirth}
                </Text>
              )}
            </View>

            {/* Place of Birth */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[
                  styles.input,
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
                  setIsPlaceDropdownOpen(!isPlaceDropdownOpen);
                  if (!isPlaceDropdownOpen && searchQuery.trim()) {
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
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
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
                          : theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                      },
                    ]}
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
                      marginLeft: -responsiveWidth('5'),
                      tintColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                />
              </TouchableOpacity>

              {/* Custom Place Dropdown */}
              {isPlaceDropdownOpen && (
                <View
                  style={[
                    styles.dropdownListContainer,
                    {
                      backgroundColor:
                        theme === 'dark' ? colors.cardBackground : colors.white,
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
                        {
                          backgroundColor:
                            theme === 'dark'
                              ? colors.cardBackground
                              : colors.white,
                          borderColor:
                            theme === 'dark'
                              ? colors.themeBorderDropdown
                              : colors.borderColor,
                          borderBottomColor:
                            theme === 'dark'
                              ? 'rgba(73, 108, 168, 0.3)'
                              : colors.borderColor,
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                      placeholder="Search places..."
                      placeholderTextColor={
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy
                      }
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
                    nestedScrollEnabled={true}
                  >
                    {filteredPlaces.map((item, index) => (
                      <TouchableOpacity
                        key={item.value}
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
                        onPress={() => {
                          handlePlaceSelect(item);
                          setIsPlaceDropdownOpen(false);
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
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {formik.touched.placeOfBirth && formik.errors.placeOfBirth && (
                <Text style={styles.errorText}>
                  {formik.errors.placeOfBirth}
                </Text>
              )}
            </View>

            {/* What Do You Do */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textAreaInput,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.cardBackground : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
                placeholder="What do you do? (Tell us about your profession, studies, or occupation)"
                placeholderTextColor={
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy
                }
                value={formik.values.whatDoYouDo}
                onChangeText={formik.handleChange('whatDoYouDo')}
                onBlur={formik.handleBlur('whatDoYouDo')}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
              {formik.touched.whatDoYouDo && formik.errors.whatDoYouDo && (
                <Text style={styles.errorText}>
                  {formik.errors.whatDoYouDo}
                </Text>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor:
                    theme === 'dark'
                      ? colors.Orangeaccentcolor
                      : colors.Orangeaccentcolor,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeBorderDropdown
                      : colors.borderColor,
                },
              ]}
              onPress={formik.handleSubmit}
              disabled={formik.isSubmitting}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  {
                    color:
                      theme === 'dark' ? colors.themeTextWhite : colors.white,
                  },
                ]}
              >
                {formik.isSubmitting ? 'Saving...' : 'Add New Member'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </MainContainer>

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackdrop}
          onPress={() => setShowGenderModal(false)}
        >
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <View
              style={[
                styles.modalHandle,
                {
                  backgroundColor:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.borderColor,
                },
              ]}
            />
            <FlatList
              data={genderOptions}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formik.values.gender === item && styles.selectedModalItem,
                  ]}
                  onPress={() => {
                    formik.setFieldValue('gender', item);
                    setShowGenderModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                      formik.values.gender === item &&
                        styles.selectedModalItemText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View
                  style={[
                    styles.modalSeparator,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? 'rgba(34, 49, 73, 1)'
                          : colors.borderColor,
                    },
                  ]}
                />
              )}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Prediction Type Selection Modal */}
      <Modal
        visible={showPredictionTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPredictionTypeModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackdrop}
          onPress={() => setShowPredictionTypeModal(false)}
        >
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor:
                  theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <View
              style={[
                styles.modalHandle,
                {
                  backgroundColor:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.borderColor,
                },
              ]}
            />
            <FlatList
              data={predictionTypeOptions}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formik.values.predictionType === item &&
                      styles.selectedModalItem,
                  ]}
                  onPress={() => {
                    formik.setFieldValue('predictionType', item);
                    setShowPredictionTypeModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                      formik.values.predictionType === item &&
                        styles.selectedModalItemText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View
                  style={[
                    styles.modalSeparator,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? 'rgba(34, 49, 73, 1)'
                          : colors.borderColor,
                    },
                  ]}
                />
              )}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Native Date Picker for Android */}
      {showDatePicker && Platform.OS !== 'ios' && (
        <DatePicker
          modal
          open={showDatePicker}
          date={selectedDate || new Date()}
          mode="date"
          // textColor={theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy} // 👈 text ka color change
          // fadeToColor={theme === 'dark' ? colors.DarkNavy : colors.white} // 👈 background fade color
          // dividerColor={theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy} // 👈 wheel ke bich ka divider
          maximumDate={new Date()}
          theme={'light'}
          onConfirm={date => {
            setShowDatePicker(false);
            setSelectedDate(date);
            formik.setFieldValue('dateOfBirth', formatDate(date));
          }}
          onCancel={() => {
            setShowDatePicker(false);
          }}
        />
      )}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalSheet,
                {
                  backgroundColor: theme === 'dark' ? '#34495E' : colors.white,
                },
              ]}
            >
              <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
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
                  Select Date of Birth
                </Text>
              </View>
              <DateTimePicker
                value={iosTempDate || selectedDate || new Date()}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(event: any, date?: Date) => {
                  if (date) setIosTempDate(date);
                }}
                themeVariant={theme === 'dark' ? 'dark' : 'light'}
                style={{ alignSelf: 'stretch' }}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  padding: 16,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setShowDatePicker(false);
                    setIosTempDate(null);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const finalDate = iosTempDate || selectedDate || new Date();
                    setSelectedDate(finalDate);
                    formik.setFieldValue('dateOfBirth', formatDate(finalDate));
                    setShowDatePicker(false);
                    setIosTempDate(null);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker for Android */}
      {showTimePicker && Platform.OS !== 'ios' && (
        <DatePicker
          modal
          open={showTimePicker}
          date={selectedTime || new Date()}
          // textColor={theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy} // 👈 text ka color change
          // fadeToColor={theme === 'dark' ? colors.DarkNavy : colors.white} // 👈 background fade color
          // dividerColor={
          //   theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy
          // } // 👈 wheel ke bich ka divider
          mode="time"
          // is24Hour={false}
          theme={'light'}
          onConfirm={time => {
            setShowTimePicker(false);
            setSelectedTime(time);
            formik.setFieldValue('timeOfBirth', formatTime(time));
          }}
          onCancel={() => {
            setShowTimePicker(false);
          }}
        />
      )}
      {showTimePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalSheet,
                {
                  backgroundColor: theme === 'dark' ? '#34495E' : colors.white,
                },
              ]}
            >
              <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
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
                  Select Time of Birth
                </Text>
              </View>
              <DateTimePicker
                value={iosTempTime || selectedTime || new Date()}
                mode="time"
                display="spinner"
                is24Hour={false}
                onChange={(event: any, time?: Date) => {
                  if (time) setIosTempTime(time);
                }}
                themeVariant={'light'}
                style={{ alignSelf: 'stretch' }}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  padding: 16,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setShowTimePicker(false);
                    setIosTempTime(null);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const finalTime = iosTempTime || selectedTime || new Date();
                    setSelectedTime(finalTime);
                    formik.setFieldValue('timeOfBirth', formatTime(finalTime));
                    setShowTimePicker(false);
                    setIosTempTime(null);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C3E50',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    padding: 8,
    marginRight: 16,
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  topBarText: {
    fontSize: 24,
    fontFamily: fontFamily.regular,
    // fontWeight: '600',
    color: '#F6EFD9',
  },
  backIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#F6EFD9',
    // color: 'rgba(238, 229, 202, 1)',
    fontSize: 24,
    // fontWeight: '700',
    fontFamily: fontFamily.regular,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  formContainerTitle: {
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainerTitleText: {
    fontSize: 18,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(34, 49, 73, 1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: responsiveWidth('2.5'),
    borderWidth: 2,
    // fontWeight: '500',
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: color.themeTextWhite,
    borderColor: '#rgba(73, 108, 168, 1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textAreaInput: {
    backgroundColor: 'rgba(34, 49, 73, 1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: responsiveWidth('2.5'),
    borderWidth: 2,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: color.themeTextWhite,
    borderColor: '#rgba(73, 108, 168, 1)',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontFamily: fontFamily.regular,

    // fontWeight: '500',
    flex: 1,
  },
  placeholderText: {
    color: color.themeTextWhite,
  },
  dropdownIcon: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    marginRight: responsiveWidth('2'),
    resizeMode: 'contain',
    tintColor: color.themeTextWhite,
  },
  calendarIcon: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    resizeMode: 'contain',
    tintColor: color.themeTextWhite,
  },
  clockIcon: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    resizeMode: 'contain',
    tintColor: color.themeTextWhite,
  },
  saveButton: {
    backgroundColor: 'rgba(223, 138, 93, 1)',
    borderRadius: 10,
    paddingVertical: responsiveWidth('2.5'),
    alignItems: 'center',
    marginTop: responsiveWidth('3%'),
    marginBottom: responsiveWidth('20%'),
  },
  saveButtonText: {
    color: color.themeTextWhite,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.6,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: '600',
    fontFamily: fontFamily.regular,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 4,
    fontFamily: fontFamily.regular,
  },
  modalBackdrop: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.5)',

    //  bottom: 0,
    // marginBottom: -10,

    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    // paddingBottom: 16,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginVertical: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: fontFamily.regular,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  selectedModalItem: {
    backgroundColor: color.Orangeaccentcolor,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  selectedModalItemText: {
    fontWeight: '600',
    color: color.white,
  },
  modalSeparator: {
    height: 1,
    marginHorizontal: 20,
  },
  dropdownContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: 'rgba(34, 49, 73, 1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: responsiveWidth('3'),
    borderWidth: 2,
    borderColor: '#rgba(73, 108, 168, 1)',
    color: 'rgba(166, 168, 166, 1)',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(34, 49, 73, 1)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#rgba(73, 108, 168, 1)',
    marginTop: 4,
  },
  dropdownListContainer: {
    borderRadius: 10,
    borderWidth: 2,
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: 4,
    maxHeight: 250,
    overflow: 'hidden',
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownList: {
    maxHeight: 200, // Adjust as needed
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownSelectedItem: {
    padding: 16,
    backgroundColor: 'rgba(73, 108, 168, 0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  dropdownPlaceholder: {
    color: 'white',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    marginLeft: responsiveWidth('2'),
  },
  dropdownSelectedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    textAlign: 'left',
    backgroundColor: 'transparent',
    lineHeight: 24,
    letterSpacing: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
    shadowColor: 'transparent',
    textShadowColor: 'transparent',
  },
  dropdownInputSearch: {
    backgroundColor: 'rgba(34, 49, 73, 1)',
    color: 'white',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(73, 108, 168, 0.3)',
  },
  dropdownSearchInput: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  datePickerContainer: {
    paddingHorizontal: 20,
  },
  dateOption: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  dateOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  timePickerContainer: {
    paddingHorizontal: 20,

    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  timePickerLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    marginBottom: 10,
    fontWeight: '600',
  },
  timePickerWrapper: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  timePickerScroll: {
    height: 120,
    width: '100%',
  },
  timePickerContent: {
    paddingVertical: 40, // Add padding to center the first and last items
  },
  timePickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  timePickerItemSelected: {
    backgroundColor: 'rgba(34, 49, 73, 1)',
  },
  timePickerItemText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
  },
  timePickerItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  timeOption: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  timeOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(34, 49, 73, 1)',
    // backgroundColor: clo,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: 'rgba(34, 49, 73, 1)',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
  },
});

export default AddNewMember;
