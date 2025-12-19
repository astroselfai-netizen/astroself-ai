import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  responsiveWidth,
  fontFamily,
  color,
} from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';

interface AddNewMemberCardProps {
  profileData: any;
  selectedMemberCount: number;
  setSelectedMemberCount: (count: number) => void;
  isProcessingPayment: boolean;
  handleAddMemberPayment: () => void;
  navigation: any;
}

const AddNewMemberCard: React.FC<AddNewMemberCardProps> = ({
  profileData,
  selectedMemberCount,
  setSelectedMemberCount,
  isProcessingPayment,
  handleAddMemberPayment,
  navigation,
}) => {
  const { theme, colors } = useTheme();

  return (
    <ImageBackground
      source={
        theme === 'dark'
          ? require('../../assets/image/DarkBackground.png')
          : require('../../assets/image/LightBackground.png')
      }
      blurRadius={12}
      style={[
        styles.newMembersCard,
        {
          backgroundColor:
            theme === 'dark' ? colors.cardBackground : colors.white,
          borderColor:
            theme === 'dark' ? colors.borderColor : colors.borderColor,
        },
      ]}
      imageStyle={[
        styles.newMembersBgImage,
        styles.newMembersCardImage,
        {
          backgroundColor:
            theme === 'dark' ? colors.cardBackground : colors.white,
        },
      ]}
    >
      <View
        style={[
          styles.newMmembersOverlay,
          {
            backgroundColor:
              theme === 'dark' ? colors.transparent : colors.white,
          },
        ]}
      >
        <Text
          style={[
            styles.addMemberTitle,
            {
              color:
                theme === 'dark'
                  ? colors.themeTextWhite
                  : colors.DarkNavy,
            },
          ]}
        >
          Go premium and see your life in a whole new light.
        </Text>
        <View
          style={[
            styles.addMemberCard,
            {
              backgroundColor:
                theme === 'dark' ? colors.transparent : colors.white,
            },
          ]}
        >
          <View style={styles.addMemberCardLeft}>
            {/* Member Count Selector */}
            <View style={styles.memberCountContainer}>
              <TouchableOpacity
                style={[
                  styles.countButton,
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
                  selectedMemberCount <= 1 &&
                    styles.countButtonDisabled,
                ]}
                onPress={() => {
                  if (selectedMemberCount > 1) {
                    setSelectedMemberCount(selectedMemberCount - 1);
                  }
                }}
                disabled={selectedMemberCount <= 1}
              >
                <Text
                  style={[
                    styles.countButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.white,
                    },
                    selectedMemberCount <= 1 &&
                      styles.countButtonTextDisabled,
                  ]}
                >
                  -
                </Text>
              </TouchableOpacity>

              <View style={styles.memberCountDisplay}>
                <Text
                  style={[
                    styles.memberCountNumber,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  {selectedMemberCount.toString().padStart(2, '0')}
                </Text>
                <Text
                  style={[
                    styles.memberCountLabel,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Member{selectedMemberCount > 1 ? 's' : ''}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.countButton,
                  {
                    backgroundColor:
                      theme === 'dark'
                        ? colors.Orangeaccentcolor
                        : colors.Orangeaccentcolor,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.themeBorderDropdown,
                  },
                ]}
                onPress={() => {
                  setSelectedMemberCount(selectedMemberCount + 1);
                }}
              >
                <Text
                  style={[
                    styles.countButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.surface,
                    },
                  ]}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3D Human Figures Icon */}
          <View style={styles.addMemberCardRight}>
            <Image
              source={require('../../assets/icons/AddUser.png')}
              style={styles.addUserIcon3D}
            />
          </View>
        </View>

        {/* Available Plans Section */}
        <View style={styles.availablePlansContainer}>
          <View
            style={[
              styles.availablePlansCard,
              {
                backgroundColor:
                  theme === 'dark'
                    ? colors.transparentBg
                    : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.themeTextWhite
                    : colors.borderColor,
              },
            ]}
          >
            <View style={styles.plansCountRow}>
              <Text
                style={[
                  styles.plansCountText,
                  {
                    color: theme === 'dark' ? colors.white : colors.DarkNavy,
                  },
                ]}
              >
                Member: {String(profileData?.members_allow ? profileData.members_allow - profileData.current_members : 0).padStart(2, '0')}
              </Text>
              <Text
                style={[
                  styles.plansCountText,
                  {
                    color: theme === 'dark' ? colors.white : colors.DarkNavy,
                  },
                ]}
              >
                Children: {String(profileData?.child_allow ? profileData.child_allow - profileData.current_child : 0).padStart(2, '0')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.priceContainer}>
          {(() => {
            // Get plan price from subscription or use default
            const planPrice = 999;
            const originalPrice = selectedMemberCount * planPrice;
            const hasDiscount = selectedMemberCount >= 5;
            const discountPercent = hasDiscount ? 10 : 0;
            const discountAmount = hasDiscount
              ? (originalPrice * discountPercent) / 100
              : 0;
            const totalPrice = originalPrice - discountAmount;

            return (
              <>
                {hasDiscount && (
                  <View style={styles.discountRow}>
                    <Text
                      style={[
                        styles.originalPriceLabel,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      Original Price :
                    </Text>
                    <Text
                      style={[
                        styles.originalPriceValue,
                        {
                          color:
                            theme === 'dark'
                              ? colors.grayText || '#999'
                              : colors.grayText || '#999',
                        },
                      ]}
                    >
                      ₹{originalPrice}
                    </Text>
                  </View>
                )}
                {hasDiscount && (
                  <View style={styles.discountRow}>
                    <Text
                      style={[
                        styles.discountLabel,
                        {
                          color:
                            theme === 'dark'
                              ? colors.Orangeaccentcolor
                              : colors.Orangeaccentcolor,
                        },
                      ]}
                    >
                      Discount ({discountPercent}%) :
                    </Text>
                    <Text
                      style={[
                        styles.discountValue,
                        {
                          color:
                            theme === 'dark'
                              ? colors.Orangeaccentcolor
                              : colors.Orangeaccentcolor,
                        },
                      ]}
                    >
                      - ₹{discountAmount}
                    </Text>
                  </View>
                )}
                <View style={styles.priceRow}>
                  <Text
                    style={[
                      styles.totalPriceLabel,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Total Amount :
                  </Text>
                  <Text
                    style={[
                      styles.totalPriceValue,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    {''} ₹{totalPrice}
                  </Text>
                </View>
              </>
            );
          })()}
        </View>

        <View style={styles.buttonContainer}>
          {/* Buy Button on Right */}
          <TouchableOpacity
            onPress={handleAddMemberPayment}
            style={[
              styles.actionButton,
              styles.addButton,
              {
                backgroundColor:
                  theme === 'dark'
                    ? '#DF8A5D'
                    : colors.Orangeaccentcolor,
                borderColor:
                  theme === 'dark'
                    ? '#DF8A5D'
                    : colors.Orangeaccentcolor,
              },
            ]}
            disabled={isProcessingPayment}
          >
            <Text
              style={[
                styles.actionButtonText,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.white,
                },
              ]}
            >
              {isProcessingPayment ? 'Processing...' : 'Buy'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('MemberPlanManagement')}
            style={[
              styles.actionButton,
              styles.createButton,
              {
                backgroundColor:
                  theme === 'dark' ? 'transparent' : colors.white,
                borderColor:
                  theme === 'dark'
                    ? colors.themeTextWhite
                    : colors.primaryBlue,
              },
            ]}
            disabled={isProcessingPayment}
          >
            <Text
              style={[
                styles.actionButtonText,
                {
                  color:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.primaryBlue,
                },
              ]}
            >
              Manage Plan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  newMembersCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: responsiveWidth('5%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
  },
  newMembersCardImage: {
    borderRadius: 16,
  },
  newMembersBgImage: {
    borderRadius: 16,
    opacity: 0.7,
  },
  newMmembersOverlay: {
    padding: responsiveWidth('4'),
  },
  addMemberTitle: {
    color: color.themeTextWhite,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    lineHeight: 24,
    letterSpacing: -0.14,
    textAlignVertical: 'center',
    textAlign: 'left',
  },
  addMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addMemberCardLeft: {
    flex: 1,
    paddingRight: 20,
  },
  addMemberCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  countButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2994A',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 1,
    elevation: 2,
  },
  countButtonDisabled: {
    backgroundColor: '#666666',
    borderColor: 'transparent',
  },
  countButtonText: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: fontFamily.regular,
  },
  countButtonTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  memberCountDisplay: {
    alignItems: 'center',
    width: responsiveWidth('18'),
  },
  memberCountNumber: {
    color: color.themeTextWhite,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    fontWeight: '700',
  },
  memberCountLabel: {
    color: color.themeTextWhite,
    fontSize: 13,
    fontFamily: fontFamily.regular,
  },
  addUserIcon3D: {
    width: responsiveWidth('25'),
    height: responsiveWidth('25'),
    resizeMode: 'contain',
  },
  availablePlansContainer: {
    paddingHorizontal: 14,
  },
  availablePlansCard: {
    borderRadius: 8,
    paddingHorizontal: responsiveWidth('3'),
    paddingVertical: responsiveWidth('2'),
    marginBottom: responsiveWidth('3'),
    borderWidth: 0.4,
    overflow: 'hidden',
  },
  plansCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('4'),
  },
  plansCountText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
  },
  priceContainer: {
    flex: 1,
    paddingLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalPriceLabel: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as '600',
  },
  totalPriceValue: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '700' as '700',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  originalPriceLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '400' as const,
    marginRight: 8,
  },
  originalPriceValue: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '400' as const,
    textDecorationLine: 'line-through',
  },
  discountLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
    marginRight: 8,
  },
  discountValue: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
  },
  buttonContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 10,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#DF8A5D',
    borderWidth: 1,
    borderColor: '#DF8A5D',
  },
  createButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: color.themeTextWhite,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: fontFamily.regular,
    color: color.themeTextWhite,
  },
});

export default AddNewMemberCard;

