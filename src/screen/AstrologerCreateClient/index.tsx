import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DatePicker from 'react-native-date-picker';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { MainContainer } from '../../components/common/mainContainer';
import { color, fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import UserService from '../../services/user/user.service';
import { RootState } from '../../state/store';
import { Api } from '../../types/api';

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

const genderOptions = ['Male', 'Female'];

const validationSchema = Yup.object({
  firstName: Yup.string().trim().required('First name is required'),
  lastName: Yup.string().trim().required('Last name is required'),
  gender: Yup.string().required('Gender is required'),
  dateOfBirth: Yup.string().required('Date of birth is required'),
  timeOfBirth: Yup.string().required('Time of birth is required'),
  placeOfBirth: Yup.object().nullable().required('Place of birth is required'),
  placeOfBirthDisplay: Yup.string().trim().required('Place of birth is required'),
  aboutClient: Yup.string().trim(),
});

import {
  AstrologerCreateClientNavParams,
} from '../../utils/resolveAstrologerPostAuthNavigation';

type RootStackParamList = {
  AstrologerCreateClientScreen: AstrologerCreateClientNavParams | undefined;
  AstrologerHome: undefined;
  AstrologerClientChatScreen: {
    clientId: string;
    clientName: string;
    clients?: Api.User.Res.AstrologerClient[];
    initialView?: 'chat' | 'vedic' | 'transit' | 'combos';
  };
};

const AstrologerCreateClientScreen = () => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, 'AstrologerCreateClientScreen'>>();
  const hideBackButton =
    route.params?.fromRegistration === true ||
    route.params?.fromLoginNoClients === true;
  const shouldOpenChatAfterCreate = route.params?.fromYourCharts === true;
  const { theme, colors } = useTheme();
  const user = useSelector((state: RootState) => state.app.user);
  const userService = useMemo(() => new UserService(), []);

  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isPlaceDropdownOpen, setIsPlaceDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);

  const astrologerUserId = String(user?._id || '');

  useEffect(() => {
    if (!hideBackButton) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [hideBackButton]);

  const closeAllModals = () => {
    setShowGenderModal(false);
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
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
      timeOfBirth: '',
      placeOfBirth: null as { lat: number; lng: number } | null,
      placeOfBirthDisplay: '',
      aboutClient: '',
    },
    validationSchema,
    onSubmit: async values => {
      if (!astrologerUserId) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'User ID not found.' });
        return;
      }

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
          first_name: values.firstName.trim(),
          last_name: values.lastName.trim(),
          gender: values.gender,
          isDeactivated: false,
          day: String(selectedDate.getDate()).padStart(2, '0'),
          month: String(selectedDate.getMonth() + 1).padStart(2, '0'),
          year: String(selectedDate.getFullYear()),
          hour: selectedTime.getHours(),
          min: selectedTime.getMinutes(),
          birthplace: values.placeOfBirthDisplay,
          lat: values.placeOfBirth.lat,
          lon: values.placeOfBirth.lng,
          tzone: 5.5,
          personalizedDetails: false,
          about_client: values.aboutClient.trim(),
          isTransit: false,
          prediction_type: 'bullet',
          userId: astrologerUserId,
        };

        const createResponse = await userService.createAstrologerClient(
          astrologerUserId,
          payload,
        );

        const createdData = (createResponse?.data || createResponse) as Record<
          string,
          unknown
        >;
        const nestedData =
          (createdData?.data as Record<string, unknown> | undefined) || createdData;

        let clientId = String(
          nestedData?.id ||
            nestedData?._id ||
            nestedData?.birth_id ||
            nestedData?.client_id ||
            '',
        );

        let clients: Api.User.Res.AstrologerClient[] = [];
        try {
          const clientsResponse = await userService.getAstrologerClients(
            astrologerUserId,
            0,
            50,
          );
          clients = clientsResponse?.data?.data || [];

          if (!clientId) {
            const firstName = values.firstName.trim().toLowerCase();
            const lastName = values.lastName.trim().toLowerCase();
            const newestFirst = [...clients].sort((a, b) => {
              const aTime = new Date(a.created_at || 0).getTime();
              const bTime = new Date(b.created_at || 0).getTime();
              return bTime - aTime;
            });
            const matched = newestFirst.find(
              client =>
                String(client.first_name || '').trim().toLowerCase() === firstName &&
                String(client.last_name || '').trim().toLowerCase() === lastName,
            );
            clientId = String(matched?.id || newestFirst[0]?.id || '');
          }
        } catch {
          // Keep clientId from create response if clients fetch fails.
        }

        const clientName =
          `${values.firstName.trim()} ${values.lastName.trim()}`.trim() || 'Client';

        Toast.show({
          type: 'success',
          text1: 'Chart Created',
          text2: 'New chart has been added successfully.',
        });

        if (clientId && shouldOpenChatAfterCreate) {
          navigation.replace('AstrologerClientChatScreen', {
            clientId,
            clientName,
            clients,
            initialView: 'chat',
          });
        } else {
          // Clear Create Account / OTP / Create Chart so device back cannot return
          navigation.reset({
            index: 0,
            routes: [{ name: 'AstrologerHome' }],
          });
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        Toast.show({
          type: 'error',
          text1: 'Failed to create chart',
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

  const getDropdownData = (): DropdownItem[] =>
    places.map(place => ({
      label: place.description,
      value: place.description,
      place_id: place.place_id,
    }));

  const filteredPlaces = getDropdownData();

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
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
        >
          <View style={styles.headerWrap}>
            {hideBackButton ? (
              <View style={styles.backBtnPlaceholder} />
            ) : (
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
            )}
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
                Create Chart
              </Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, inputThemeStyle]}
                placeholder="First Name"
                placeholderTextColor={placeholderColor}
                value={formik.values.firstName}
                onChangeText={formik.handleChange('firstName')}
                onBlur={formik.handleBlur('firstName')}
                onFocus={() => isPlaceDropdownOpen && setIsPlaceDropdownOpen(false)}
              />
              {formik.touched.firstName && formik.errors.firstName ? (
                <Text style={styles.errorText}>{formik.errors.firstName}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, inputThemeStyle]}
                placeholder="Last Name"
                placeholderTextColor={placeholderColor}
                value={formik.values.lastName}
                onChangeText={formik.handleChange('lastName')}
                onBlur={formik.handleBlur('lastName')}
                onFocus={() => isPlaceDropdownOpen && setIsPlaceDropdownOpen(false)}
              />
              {formik.touched.lastName && formik.errors.lastName ? (
                <Text style={styles.errorText}>{formik.errors.lastName}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[styles.input, inputThemeStyle]}
                onPress={() => {
                  closeAllModals();
                  setShowGenderModal(true);
                }}
              >
                <Text
                  style={[
                    styles.inputText,
                    {
                      color: formik.values.gender
                        ? theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy
                        : placeholderColor,
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
                        theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                    },
                  ]}
                />
              </TouchableOpacity>
              {formik.touched.gender && formik.errors.gender ? (
                <Text style={styles.errorText}>{formik.errors.gender}</Text>
              ) : null}
            </View>

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
                  {formik.values.dateOfBirth || 'Date of Birth'}
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
                  {formik.values.timeOfBirth || 'Time of Birth'}
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
                      autoCorrect={false}
                      autoCapitalize="none"
                      autoComplete="off"
                      importantForAutofill="no"
                      spellCheck={false}
                      returnKeyType="search"
                      blurOnSubmit={false}
                    />
                  </View>

                  <ScrollView
                    style={styles.dropdownList}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="none"
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
                        onPress={() => {
                          Keyboard.dismiss();
                          handlePlaceSelect(item);
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
              ) : null}

              {formik.touched.placeOfBirth && formik.errors.placeOfBirth ? (
                <Text style={styles.errorText}>
                  {String(formik.errors.placeOfBirth)}
                </Text>
              ) : null}
            </View>

            <View
              style={[
                styles.personalDetailsCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.cardBackground : '#FFF9F1',
                  borderColor:
                    theme === 'dark' ? colors.themeBorderDropdown : '#F5E6D8',
                },
              ]}
            >
              <Text
                style={[
                  styles.personalDetailsSectionTitle,
                  {
                    color:
                      theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  },
                ]}
              >
                Personal Details
              </Text>

              <Text
                style={[
                  styles.fieldLabel,
                  {
                    color:
                      theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                  },
                ]}
              >
                About chart
              </Text>
              <TextInput
                style={[
                  styles.textAreaInput,
                  styles.personalDetailsTextArea,
                  inputThemeStyle,
                ]}
                placeholder="Enter details about the chart, their focus, or upcoming plans."
                placeholderTextColor={colors.grayText}
                value={formik.values.aboutClient}
                onChangeText={formik.handleChange('aboutClient')}
                onBlur={formik.handleBlur('aboutClient')}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.Orangeaccentcolor,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeBorderDropdown
                      : colors.borderColor,
                },
              ]}
              onPress={() => formik.handleSubmit()}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={[styles.saveButtonText, { color: colors.white }]}>
                  Submit
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </MainContainer>

      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
        onRequestClose={closeAllModals}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackdrop}
          onPress={closeAllModals}
        >
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme === 'dark' ? colors.DarkNavy : colors.white,
              },
            ]}
          >
            <View
              style={[
                styles.modalHandle,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.themeTextWhite : colors.borderColor,
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
                    formik.setFieldTouched('gender', true, false);
                    closeAllModals();
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
                      },
                      formik.values.gender === item && styles.selectedModalItemText,
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
                        theme === 'dark' ? 'rgba(34, 49, 73, 1)' : colors.borderColor,
                    },
                  ]}
                />
              )}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <DatePicker
        modal
        open={showDatePicker}
        date={selectedDate || new Date()}
        mode="date"
        maximumDate={new Date()}
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
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
    marginBottom: 10,
    position: 'relative',
  },
  backBtn: {
    padding: 8,
    marginRight: 16,
  },
  backBtnPlaceholder: {
    width: responsiveWidth(5) + 16,
    marginRight: 16,
  },
  backIcon: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    resizeMode: 'contain',
  },
  topBarText: {
    fontSize: 24,
    fontFamily: fontFamily.regular,
  },
  backIconWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 10,
  },
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
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inputText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    flex: 1,
  },
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
  dropdownHeader: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  dropdownSearchInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    marginBottom: 8,
  },
  dropdownList: {
    maxHeight: 150,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  personalDetailsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: responsiveWidth(3),
    marginBottom: responsiveWidth(3),
    marginTop: responsiveWidth(1),
  },
  personalDetailsSectionTitle: {
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    fontWeight: '700',
    marginBottom: responsiveWidth(2.5),
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    marginBottom: responsiveWidth(1.5),
  },
  textAreaInput: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: responsiveWidth('2.5'),
    borderWidth: 2,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  personalDetailsTextArea: {
    marginBottom: responsiveWidth(1),
    minHeight: responsiveWidth(28),
  },
  saveButton: {
    borderRadius: 10,
    paddingVertical: responsiveWidth('2.5'),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    // marginBottom: responsiveWidth('20%'),
    borderWidth: 1,
  },
  saveButtonText: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.6,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: fontFamily.regular,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: '50%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  selectedModalItem: {
    backgroundColor: 'rgba(223, 138, 93, 0.15)',
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  selectedModalItemText: {
    fontWeight: '600',
    color: color.Orangeaccentcolor,
  },
  modalSeparator: {
    height: 1,
    marginHorizontal: 16,
  },
});

export default AstrologerCreateClientScreen;
