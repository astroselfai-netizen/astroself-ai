// BasicDeatil.tsx

import React, { useState } from 'react';
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
import { MainContainer } from '../../components/common/mainContainer';
import Toast from 'react-native-toast-message';
import { responsiveWidth, fontFamily } from '../../constant/theme';

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

const BasicDeatil = () => {
  const navigation = useNavigation<BasicDeatilNavigationProp>();
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showOccupationModal, setShowOccupationModal] = useState(false);

  const genderOptions = ['Male', 'Female', 'Other'];
  const occupationOptions = [
    'Student',
    'Employee',
    'Business Owner',
    'Freelancer',
    'Retired',
    'Other'
  ];

  const validationSchema = Yup.object().shape({
    firstName: Yup.string().trim().required('Please enter your first name'),
    lastName: Yup.string().trim().required('Please enter your last name'),
    gender: Yup.string().required('Please select your gender'),
    dateOfBirth: Yup.string().required('Please select your date of birth'),
    timeOfBirth: Yup.string().required('Please select your time of birth'),
    placeOfBirth: Yup.string().trim().required('Please enter your place of birth'),
    occupation: Yup.string().required('Please select your occupation'),
  });

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
      timeOfBirth: '',
      placeOfBirth: '',
      occupation: '',
    },
    validationSchema,
    onSubmit: async (values, helpers) => {
      try {
        helpers.setSubmitting(true);
        
        // Here you would typically save the basic details
        // For now, we'll just show a success message
        Toast.show({
          type: 'success',
          text1: 'Details Saved',
          text2: 'Your basic details have been saved successfully.',
          position: 'top',
          topOffset: 60,
          visibilityTime: 3000,
        });

        // Navigate to next screen or go back
        navigation.goBack();
        
      } catch (error: any) {
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
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
                style={styles.backIcon}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Details</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* First Name */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor="#8E8E93"
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
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor="#8E8E93"
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
                style={styles.input}
                onPress={() => setShowGenderModal(true)}
              >
                <Text
                  style={[
                    styles.inputText,
                    !formik.values.gender && styles.placeholderText,
                  ]}
                >
                  {formik.values.gender || 'Select gender'}
                </Text>
                <Image
                  source={require('../../assets/icons/Edit.png')}
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
              {formik.touched.gender && formik.errors.gender && (
                <Text style={styles.errorText}>{formik.errors.gender}</Text>
              )}
            </View>

            {/* Date of Birth */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[
                    styles.inputText,
                    !formik.values.dateOfBirth && styles.placeholderText,
                  ]}
                >
                  {formik.values.dateOfBirth || 'Select date'}
                </Text>
                <Image
                  source={require('../../assets/icons/Edit.png')}
                  style={styles.calendarIcon}
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
                style={styles.input}
                onPress={() => setShowTimePicker(true)}
              >
                <Text
                  style={[
                    styles.inputText,
                    !formik.values.timeOfBirth && styles.placeholderText,
                  ]}
                >
                  {formik.values.timeOfBirth || 'Select time'}
                </Text>
                <Image
                  source={require('../../assets/icons/Edit.png')}
                  style={styles.clockIcon}
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
              <TextInput
                style={styles.input}
                placeholder="Enter your place of birth"
                placeholderTextColor="#8E8E93"
                value={formik.values.placeOfBirth}
                onChangeText={formik.handleChange('placeOfBirth')}
                onBlur={formik.handleBlur('placeOfBirth')}
              />
              {formik.touched.placeOfBirth && formik.errors.placeOfBirth && (
                <Text style={styles.errorText}>
                  {formik.errors.placeOfBirth}
                </Text>
              )}
            </View>

            {/* Occupation */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowOccupationModal(true)}
              >
                <Text
                  style={[
                    styles.inputText,
                    !formik.values.occupation && styles.placeholderText,
                  ]}
                >
                  {formik.values.occupation || 'Select occupation'}
                </Text>
                <Image
                  source={require('../../assets/icons/Edit.png')}
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
              {formik.touched.occupation && formik.errors.occupation && (
                <Text style={styles.errorText}>{formik.errors.occupation}</Text>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={formik.handleSubmit}
              disabled={formik.isSubmitting}
            >
              <Text style={styles.saveButtonText}>
                {formik.isSubmitting ? 'Saving...' : 'Save'}
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
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <FlatList
              data={genderOptions}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formik.values.gender === item && styles.selectedModalItem
                  ]}
                  onPress={() => {
                    formik.setFieldValue('gender', item);
                    setShowGenderModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formik.values.gender === item && styles.selectedModalItemText
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View style={styles.modalSeparator} />
              )}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackdrop}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.datePickerContainer}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => {
                  const date = new Date();
                  date.setFullYear(date.getFullYear() - 25);
                  formik.setFieldValue('dateOfBirth', formatDate(date));
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.dateOptionText}>25 years ago</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => {
                  const date = new Date();
                  date.setFullYear(date.getFullYear() - 30);
                  formik.setFieldValue('dateOfBirth', formatDate(date));
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.dateOptionText}>30 years ago</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateOption}
                onPress={() => {
                  const date = new Date();
                  date.setFullYear(date.getFullYear() - 35);
                  formik.setFieldValue('dateOfBirth', formatDate(date));
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.dateOptionText}>35 years ago</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackdrop}
          onPress={() => setShowTimePicker(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.timePickerContainer}>
              <Text style={styles.modalTitle}>Select Time of Birth</Text>
              <TouchableOpacity
                style={styles.timeOption}
                onPress={() => {
                  const date = new Date();
                  date.setHours(6, 0, 0, 0);
                  formik.setFieldValue('timeOfBirth', formatTime(date));
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.timeOptionText}>6:00 AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeOption}
                onPress={() => {
                  const date = new Date();
                  date.setHours(12, 0, 0, 0);
                  formik.setFieldValue('timeOfBirth', formatTime(date));
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.timeOptionText}>12:00 PM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeOption}
                onPress={() => {
                  const date = new Date();
                  date.setHours(18, 0, 0, 0);
                  formik.setFieldValue('timeOfBirth', formatTime(date));
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.timeOptionText}>6:00 PM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Occupation Selection Modal */}
      <Modal
        visible={showOccupationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOccupationModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackdrop}
          onPress={() => setShowOccupationModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <FlatList
              data={occupationOptions}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formik.values.occupation === item && styles.selectedModalItem
                  ]}
                  onPress={() => {
                    formik.setFieldValue('occupation', item);
                    setShowOccupationModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formik.values.occupation === item && styles.selectedModalItemText
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View style={styles.modalSeparator} />
              )}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  headerTitle: {
    color: '#F6EFD9',
    // color: '#FFFFFF',
    fontSize: 24,
    // fontWeight: '600',
    fontFamily: fontFamily.regular,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(34, 49, 73, 1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: responsiveWidth('3'),
    borderWidth: 2,

    borderColor: '#rgba(73, 108, 168, 1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.regular,
    flex: 1,
  },
  placeholderText: {
    color: '#8E8E93',
  },
  dropdownIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#5DADE2',
  },
  calendarIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#5DADE2',
  },
  clockIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#5DADE2',
  },
  saveButton: {
    backgroundColor: 'rgba(223, 138, 93, 1)',
    borderRadius: 10,
    paddingVertical: responsiveWidth("3"),
    alignItems: 'center',
    marginTop: responsiveWidth("3%"),
    marginBottom: responsiveWidth("20%"),
  },
  saveButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#34495E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: 16,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5DADE2',
    marginVertical: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
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
    backgroundColor: '#FF8C00',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  modalItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  selectedModalItemText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#5DADE2',
    marginHorizontal: 20,
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
});

export default BasicDeatil;
