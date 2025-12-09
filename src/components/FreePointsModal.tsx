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
  font,
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
              Welcome! Free Points Available
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
                  styles.sectionDescription,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.DarkNavy,
                  },
                ]}
              >
                Quick, powerful insights into what's happening in your life right
                now. Get instant clarity on immediate influences shaping your
                career, relationships, health, and finances.
              </Text>
            </View>

            {/* One time Unlock Section */}
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
            </View>

            {/* Personality Insights Section */}
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
            </View>

            {/* Free for 1 Member */}
            <View style={styles.freeBadge}>
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
            </View>

            {/* Disclaimer */}
            <Text
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
            </Text>

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

