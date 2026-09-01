import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fontFamily, responsiveWidth } from '../constant/theme';
import { ThemePalette } from '../theme/colors';

export const PROFESSION_OPTIONS = [
  'Student',
  'Working Professional',
  'Corporate Employee',
  'Government Employee',
  'Business Owner',
  'Entrepreneur',
  'Self-Employed',
  'Freelancer',
  'Consultant',
  'Homemaker',
  'Teacher',
  'Professor / Lecturer',
  'Doctor',
  'Surgeon',
  'Nurse / Healthcare Worker',
  'Therapist / Counselor',
  'Lawyer / Advocate',
  'Chartered Accountant / CA',
  'Banker / Finance Professional',
  'Stock Trader / Investor',
  'IT Professional',
  'Software Developer / Engineer',
  'Designer (Graphic / UI / UX / Fashion / Interior)',
  'Architect',
  'Engineer (Civil / Mechanical / Electrical / etc.)',
  'Scientist / Researcher',
  'Artist / Creative Professional',
  'Writer / Author',
  'Content Creator / Influencer',
  'Digital Marketer',
  'Sales Professional',
  'Marketing Professional',
  'HR Professional',
  'Real Estate Professional',
  'Property Dealer / Builder',
  'Retail Shop Owner',
  'Manufacturer',
  'Trader / Merchant',
  'Farmer / Agriculture Professional',
  'NGO / Social Worker',
  'Religious / Spiritual Professional',
  'Astrologer / Healer',
  'Fitness Trainer / Coach',
  'Sports Professional / Athlete',
  'Actor / Performer / Musician',
  'Photographer / Videographer',
  'Event Planner',
  'Hospitality Professional',
  'Chef / Food Business Owner',
  'Transport / Logistics Professional',
  'Defense / Police / Security Services',
  'Politician / Public Servant',
  'Retired',
  'Job Seeker',
  'Between Jobs',
  'Not Currently Working',
  'Other',
];

export const RELATIONSHIP_OPTIONS = [
  'Single',
  'Unmarried',
  'Married',
  'Engaged',
  'In a Relationship',
  'Separated',
  'Divorced',
  'Widowed',
  'Complicated',
  'Prefer Not to Say',
];

export const CHILDREN_OPTIONS = [
  'Have Children',
  'No Children',
  'Planning for Child',
  'Prefer Not to Say',
];

export const shouldShowChildrenQuestion = (status?: string) => {
  if (!status) return false;
  const s = status.toLowerCase();
  return (
    s === 'married' ||
    s === 'divorced' ||
    s === 'separated' ||
    s === 'engaged' ||
    s === 'in a relationship'
  );
};

export type PersonalDetailsValues = {
  whatDoYouDo: string;
  maritalStatus: string;
  children: string;
  currentFuturePlans: string;
  currentChallenges: string;
  anyOtherDetails: string;
};

type AstrologerPersonalDetailsFormProps = {
  values: PersonalDetailsValues;
  onChange: <K extends keyof PersonalDetailsValues>(
    field: K,
    value: PersonalDetailsValues[K],
  ) => void;
  palette: ThemePalette;
};

const AstrologerPersonalDetailsForm = ({
  values,
  onChange,
  palette,
}: AstrologerPersonalDetailsFormProps) => {
  const [showProfessionModal, setShowProfessionModal] = useState(false);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [professionSearch, setProfessionSearch] = useState('');

  const filteredProfessions = useMemo(() => {
    if (!professionSearch.trim()) return PROFESSION_OPTIONS;
    const query = professionSearch.toLowerCase().trim();
    return PROFESSION_OPTIONS.filter(p => p.toLowerCase().includes(query));
  }, [professionSearch]);

  const showChildren = shouldShowChildrenQuestion(values.maritalStatus);

  const inputBg = palette.isDark ? '#1C2638' : '#FFFFFF';
  const inputBorder = palette.isDark ? 'rgba(255,255,255,0.12)' : '#D1DEEE';

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.pencilIcon}>✏️</Text>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          Personal Details
        </Text>
      </View>

      {/* Info Callout Banner */}
      <View
        style={[
          styles.calloutCard,
          {
            backgroundColor: palette.isDark ? '#2B2418' : '#FFFDF7',
            borderColor: palette.isDark ? '#D97706' : '#FDE68A',
          },
        ]}
      >
        <View style={styles.calloutAccentLine} />
        <View style={styles.calloutTextWrap}>
          <Text
            style={[
              styles.calloutTitle,
              { color: palette.isDark ? '#FCD34D' : '#92400E' },
            ]}
          >
            Personalized predictions work best with clear context.
          </Text>
          <Text
            style={[
              styles.calloutSubtitle,
              { color: palette.isDark ? '#FDE68A' : '#B45309' },
            ]}
          >
            Choose the closest options and share what you want guidance for.
          </Text>
        </View>
      </View>

      {/* 1. What do you do currently? */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: palette.textPrimary }]}>
          What do you do currently?
        </Text>
        <TouchableOpacity
          style={[
            styles.selectInput,
            { backgroundColor: inputBg, borderColor: inputBorder },
          ]}
          onPress={() => setShowProfessionModal(true)}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.selectText,
              {
                color: values.whatDoYouDo
                  ? palette.textPrimary
                  : palette.textMuted,
              },
            ]}
            numberOfLines={1}
          >
            {values.whatDoYouDo || 'Search your work, study, or life role'}
          </Text>
          <Text style={[styles.chevronIcon, { color: palette.textMuted }]}>
            ▼
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. What is your relationship status? */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: palette.textPrimary }]}>
          What is your relationship status?
        </Text>
        <TouchableOpacity
          style={[
            styles.selectInput,
            { backgroundColor: inputBg, borderColor: inputBorder },
          ]}
          onPress={() => setShowRelationshipModal(true)}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.selectText,
              {
                color: values.maritalStatus
                  ? palette.textPrimary
                  : palette.textMuted,
              },
            ]}
            numberOfLines={1}
          >
            {values.maritalStatus || 'Select your current status'}
          </Text>
          <View style={styles.selectRightWrap}>
            {values.maritalStatus ? (
              <TouchableOpacity
                onPress={() => {
                  onChange('maritalStatus', '');
                  onChange('children', '');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearBtn}
              >
                <Text style={[styles.clearBtnText, { color: palette.textMuted }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            ) : null}
            <Text style={[styles.chevronIcon, { color: palette.textMuted }]}>
              ▼
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 3. Do you have children, or are you planning for children? (Conditional) */}
      {showChildren ? (
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: palette.textPrimary }]}>
            Do you have children, or are you planning for children?
          </Text>
          <View style={styles.childrenPillsRow}>
            {CHILDREN_OPTIONS.map(opt => {
              const isSelected = values.children === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.childPill,
                    {
                      borderColor: isSelected
                        ? palette.gold
                        : inputBorder,
                      backgroundColor: isSelected
                        ? palette.isDark
                          ? '#3A2E1A'
                          : '#FFFBEB'
                        : inputBg,
                    },
                  ]}
                  onPress={() => onChange('children', isSelected ? '' : opt)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.childPillText,
                      {
                        color: isSelected
                          ? palette.isDark
                            ? '#FCD34D'
                            : '#92400E'
                          : palette.textPrimary,
                        fontFamily: isSelected
                          ? fontFamily.bold
                          : fontFamily.regular,
                      },
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* 4. What are you focused on or planning next? */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: palette.textPrimary }]}>
          What are you focused on or planning next?
        </Text>
        <TextInput
          style={[
            styles.textAreaInput,
            { backgroundColor: inputBg, borderColor: inputBorder, color: palette.textPrimary },
          ]}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          placeholder="For example: career growth, marriage planning, business expansion, education goals, moving abroad, or building savings."
          placeholderTextColor={palette.textMuted}
          value={values.currentFuturePlans}
          onChangeText={text => onChange('currentFuturePlans', text)}
        />
      </View>

      {/* 5. What challenges are you facing right now? */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: palette.textPrimary }]}>
          What challenges are you facing right now?
        </Text>
        <TextInput
          style={[
            styles.textAreaInput,
            { backgroundColor: inputBg, borderColor: inputBorder, color: palette.textPrimary },
          ]}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          placeholder="For example: career issues, financial stress, relationship concerns, family pressure, health worries, confusion, delays, or uncertainty."
          placeholderTextColor={palette.textMuted}
          value={values.currentChallenges}
          onChangeText={text => onChange('currentChallenges', text)}
        />
      </View>

      {/* 6. Any Other Details */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: palette.textPrimary }]}>
          Any Other Details
        </Text>
        <TextInput
          style={[
            styles.textAreaInput,
            { backgroundColor: inputBg, borderColor: inputBorder, color: palette.textPrimary },
          ]}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          placeholder="Any Other Details"
          placeholderTextColor={palette.textMuted}
          value={values.anyOtherDetails}
          onChangeText={text => onChange('anyOtherDetails', text)}
        />
      </View>

      {/* Profession Selection Modal */}
      <Modal
        visible={showProfessionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfessionModal(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfessionModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.pickerModalContainer,
              { backgroundColor: palette.isDark ? palette.cardBg : '#FFFFFF' },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text
                style={[
                  styles.pickerTitle,
                  { color: palette.textPrimary },
                ]}
              >
                What do you do currently?
              </Text>
              <TouchableOpacity onPress={() => setShowProfessionModal(false)}>
                <Text style={[styles.pickerCloseText, { color: palette.textMuted }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.pickerSearchInput,
                {
                  backgroundColor: palette.isDark ? '#1C2638' : '#F1F5F9',
                  color: palette.textPrimary,
                  borderColor: inputBorder,
                },
              ]}
              placeholder="Search occupation..."
              placeholderTextColor={palette.textMuted}
              value={professionSearch}
              onChangeText={setProfessionSearch}
            />

            <FlatList
              data={filteredProfessions}
              keyExtractor={item => item}
              style={styles.pickerList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = values.whatDoYouDo === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      {
                        backgroundColor: isSelected
                          ? palette.isDark
                            ? '#2A3F58'
                            : '#EFF6FF'
                          : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      onChange('whatDoYouDo', item);
                      setShowProfessionModal(false);
                      setProfessionSearch('');
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        {
                          color: isSelected
                            ? (palette.isDark ? palette.gold : '#0B1B3D')
                            : palette.textPrimary,
                          fontFamily: isSelected
                            ? fontFamily.bold
                            : fontFamily.regular,
                        },
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected ? (
                      <Text style={styles.checkmarkIcon}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Relationship Status Selection Modal */}
      <Modal
        visible={showRelationshipModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRelationshipModal(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowRelationshipModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.pickerModalContainer,
              { backgroundColor: palette.isDark ? palette.cardBg : '#FFFFFF' },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text
                style={[
                  styles.pickerTitle,
                  { color: palette.textPrimary },
                ]}
              >
                What is your relationship status?
              </Text>
              <TouchableOpacity onPress={() => setShowRelationshipModal(false)}>
                <Text style={[styles.pickerCloseText, { color: palette.textMuted }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={RELATIONSHIP_OPTIONS}
              keyExtractor={item => item}
              style={styles.pickerList}
              renderItem={({ item }) => {
                const isSelected = values.maritalStatus === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      {
                        backgroundColor: isSelected
                          ? palette.isDark
                            ? '#2A3F58'
                            : '#EFF6FF'
                          : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      onChange('maritalStatus', item);
                      if (!shouldShowChildrenQuestion(item)) {
                        onChange('children', '');
                      }
                      setShowRelationshipModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        {
                          color: isSelected
                            ? (palette.isDark ? palette.gold : '#0B1B3D')
                            : palette.textPrimary,
                          fontFamily: isSelected
                            ? fontFamily.bold
                            : fontFamily.regular,
                        },
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected ? (
                      <Text style={styles.checkmarkIcon}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: responsiveWidth('3'),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: responsiveWidth('2.5'),
  },
  pencilIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
  },
  calloutCard: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: responsiveWidth('2.8'),
    marginBottom: responsiveWidth('3.5'),
    overflow: 'hidden',
  },
  calloutAccentLine: {
    width: 3.5,
    borderRadius: 2,
    backgroundColor: '#D97706',
    marginRight: responsiveWidth('2.5'),
  },
  calloutTextWrap: {
    flex: 1,
  },
  calloutTitle: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    marginBottom: 2,
    lineHeight: 18,
  },
  calloutSubtitle: {
    fontSize: 11.5,
    fontFamily: fontFamily.regular,
    lineHeight: 16,
  },
  fieldGroup: {
    marginBottom: responsiveWidth('3'),
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    marginBottom: responsiveWidth('1.5'),
  },
  selectInput: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 13.5,
    fontFamily: fontFamily.regular,
    flex: 1,
  },
  selectRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    padding: 2,
  },
  clearBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
  },
  chevronIcon: {
    fontSize: 10,
  },
  childrenPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  childPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  childPillText: {
    fontSize: 12,
  },
  textAreaInput: {
    minHeight: responsiveWidth('18'),
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContainer: {
    maxHeight: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  pickerTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    flex: 1,
  },
  pickerCloseText: {
    fontSize: 16,
    padding: 4,
  },
  pickerSearchInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    marginBottom: 10,
  },
  pickerList: {
    maxHeight: 320,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  pickerItemText: {
    fontSize: 14,
    flex: 1,
  },
  checkmarkIcon: {
    fontSize: 14,
    color: '#0B1B3D',
    fontWeight: 'bold',
  },
});

export default AstrologerPersonalDetailsForm;
