import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  responsiveHeight,
  responsiveWidth,
  fontFamily,
} from '../constant/theme';
import { useTheme } from '../context/ThemeContext';

interface FreePointsModalProps {
  visible: boolean;
  onClose: () => void;
}

const FreePointsModal = ({ visible, onClose }: FreePointsModalProps) => {
  const { theme, colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor:
                theme === 'dark' ? colors.DarkNavy : colors.white,
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Title */}
            <Text
              style={[
                styles.title,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.DarkNavy,
                },
              ]}
            >
              Welcome! Check your predictions
            </Text>

            {/* Snapshot Predictions Section */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.Orangeaccentcolor
                        : colors.Orangeaccentcolor,
                  },
                ]}
              >
                Snapshot Predictions
              </Text>
              
              <Text
                style={[
                  styles.subSectionTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Free Version Covers (One time)
              </Text>

              {/* Bullet Points */}
              <View style={styles.bulletPointContainer}>
                <Text style={styles.bulletPoint}>•</Text>
                <View style={styles.bulletContent}>
                  <Text
                    style={[
                      styles.bulletTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    100 BNN Snapshot Predictions
                  </Text>
                  <Text
                    style={[
                      styles.bulletDescription,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Quick reflections showing the key themes and patterns active in your life.
                  </Text>
                </View>
              </View>

              <View style={styles.bulletPointContainer}>
                <Text style={styles.bulletPoint}>•</Text>
                <View style={styles.bulletContent}>
                  <Text
                    style={[
                      styles.bulletTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Detailed Personality Insights
                  </Text>
                  <Text
                    style={[
                      styles.bulletDescription,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Understand your soul desires, what makes you happy, what rejuvenates you, your natural energy flow, and your general nature — interpreted based on your sex.
                  </Text>
                </View>
              </View>

              <View style={styles.bulletPointContainer}>
                <Text style={styles.bulletPoint}>•</Text>
                <View style={styles.bulletContent}>
                  <Text
                    style={[
                      styles.bulletTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Potential Income & Wealth Pathways
                  </Text>
                  <Text
                    style={[
                      styles.bulletDescription,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    See the areas where you may naturally attract money, opportunities, or professional flow.
                  </Text>
                </View>
              </View>

              <View style={styles.bulletPointContainer}>
                <Text style={styles.bulletPoint}>•</Text>
                <View style={styles.bulletContent}>
                  <Text
                    style={[
                      styles.bulletTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Your Current Antardasha
                  </Text>
                  <Text
                    style={[
                      styles.bulletDescription,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Know which antardasha you are running right now and how it shapes your mindset, decisions, and experiences.
                  </Text>
                </View>
              </View>

              <View style={styles.bulletPointContainer}>
                <Text style={styles.bulletPoint}>•</Text>
                <View style={styles.bulletContent}>
                  <Text
                    style={[
                      styles.bulletTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Your Most Active Planet
                  </Text>
                  <Text
                    style={[
                      styles.bulletDescription,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Identify the planet currently dominating your chart and understand how its influence may show up in your day-to-day life.
                  </Text>
                </View>
              </View>

              <View style={styles.bulletPointContainer}>
                <Text style={styles.bulletPoint}>•</Text>
                <View style={styles.bulletContent}>
                  <Text
                    style={[
                      styles.bulletTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Strengths + Watch-Outs
                  </Text>
                  <Text
                    style={[
                      styles.bulletDescription,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Clear highlights of what is supporting you, and what patterns, tendencies, or impulses you need to be cautious about.
                  </Text>
                </View>
              </View>

              <View style={styles.bulletPointContainer}>
                <Text style={styles.bulletPoint}>•</Text>
                <View style={styles.bulletContent}>
                  <Text
                    style={[
                      styles.bulletTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Key Planetary Connections
                  </Text>
                  <Text
                    style={[
                      styles.bulletDescription,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    A focused look at whether Jupiter, Saturn, Rahu, or Ketu are forming any link with your active planet — and what that connection can mean for your inner state and external events.
                  </Text>
                </View>
              </View>

              {/* Transit Snapshot Section */}
              <View style={styles.transitSection}>
                <Text
                  style={[
                    styles.subSectionTitle,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                      },
                      { marginTop: responsiveWidth(4) },
                    ]}
                >
                  Transit Snapshot (Except Moon)
                </Text>
                <Text
                  style={[
                    styles.bulletDescription,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                    { marginTop: responsiveWidth(2) },
                  ]}
                >
                  We capture how current transits interact with your natal chart, especially:{'\n'}
                  – combinations that already existed and are now getting triggered{'\n'}
                  – how any transit planet (except the fast-moving Moon) is making contact with your natal planets{'\n\n'}
                  This gives you a grounded picture of what themes are lighting up right now in your life.
                </Text>
              </View>

              {/* Note Section */}
              <View style={styles.noteSection}>
                <Text
                  style={[
                    styles.noteText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.placeholderTextColor
                          : colors.themelightText,
                    },
                  ]}
                >
                  Please note that we don't generate analysis of children up to 15 years of age
                </Text>
              </View>
            </View>

            {/* One time Unlock Section */}
            {/* <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.Orangeaccentcolor
                        : colors.Orangeaccentcolor,
                  },
                ]}
              >
                Unlock Your Cosmic Path with AI Powered Predictions
              </Text>
              <Text
                style={[
                  styles.sectionDescription,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Receive deep insights, personalized guidance, and cosmic clarity.
                Embark on a Journey of self-discovery and transformation today.
              </Text>
            </View> */}

            {/* Personality Insights Section */}
            {/* <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.Orangeaccentcolor
                        : colors.Orangeaccentcolor,
                  },
                ]}
              >
                Personality Insights - Soul Goals & Mind Patterns Unlocked
              </Text>
              <Text
                style={[
                  styles.sectionDescription,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Discover your hidden drives, inner desires, and the deeper
                thought patterns guiding your choices. Get to know yourself on a
                deeper level and uncover the strengths you already carry.
              </Text>
            </View> */}

            {/* Free for 1 Member */}
            {/* <View style={styles.freeBadge}>
              <Text
                style={[
                  styles.freeBadgeText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.Orangeaccentcolor
                        : colors.Orangeaccentcolor,
                  },
                ]}
              >
                Free for 1 Member one time
              </Text>
            </View> */}

            {/* Disclaimer */}
            {/* <Text
              style={[
                styles.disclaimer,
                {
                  color:
                    theme === 'dark'
                      ? colors.placeholderTextColor
                      : colors.themelightText,
                },
              ]}
            >
              *Our system does not allow creating charts for users below 15 years
              of age
            </Text> */}

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.button,
                {
                  backgroundColor:
                    theme === 'dark'
                      ? colors.Orangeaccentcolor
                      : colors.Orangeaccentcolor,
                },
              ]}
            >
              <Text style={styles.buttonText}>Got it</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveWidth('5%'),
  },
  modalContent: {
    borderRadius: 20,
    padding: responsiveWidth('5%'),
    width: '90%',
    maxHeight: responsiveHeight('80%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollContent: {
    paddingBottom: responsiveWidth('2%'),
  },
  title: {
    fontSize: 22,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: responsiveWidth('5%'),
  },
  section: {
    marginBottom: responsiveWidth('4%'),
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    marginBottom: responsiveWidth('2%'),
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    textAlign: 'left',
  },
  subSectionTitle: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    marginTop: responsiveWidth('3%'),
    marginBottom: responsiveWidth('2%'),
  },
  bulletPointContainer: {
    flexDirection: 'row',
    marginBottom: responsiveWidth('3%'),
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: 16,
    marginRight: responsiveWidth('2%'),
    marginTop: 2,
    color: '#DF8A5D',
  },
  bulletContent: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    marginBottom: responsiveWidth('1%'),
    lineHeight: 20,
  },
  bulletDescription: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    textAlign: 'left',
  },
  transitSection: {
    marginTop: responsiveWidth('2%'),
  },
  noteSection: {
    marginTop: responsiveWidth('4%'),
    paddingTop: responsiveWidth('3%'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(223, 138, 93, 0.2)',
  },
  noteText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'left',
  },
  freeBadge: {
    backgroundColor: 'rgba(223, 138, 93, 0.1)',
    borderRadius: 10,
    padding: responsiveWidth('3%'),
    marginVertical: responsiveWidth('3%'),
    alignItems: 'center',
  },
  freeBadgeText: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: responsiveWidth('2%'),
    marginBottom: responsiveWidth('3%'),
  },
  button: {
    borderRadius: 10,
    paddingVertical: responsiveWidth('3%'),
    alignItems: 'center',
    marginTop: responsiveWidth('2%'),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
});

export default FreePointsModal;

