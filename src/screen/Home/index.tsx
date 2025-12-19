// HomeScreen.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ImageBackground,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import {
  responsiveHeight,
  responsiveWidth,
  font,
  fontFamily,
  color,
} from '../../constant/theme';
import { MainContainer } from '../../components/common/mainContainer';
import { Header } from '../../components/common/header';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// import MapView, { Marker } from 'react-native-maps';
// import { Dimensions } from 'react-native';
import serviceFactory from '../../services/serviceFactory';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import UserService from '../../services/user/user.service';
import { useProfileData } from '../../hooks/useProfileData';
import { useTheme } from '../../context/ThemeContext';
import HomeImageSlider from '../../components/HomeImageSlider';
import { baseURL } from '../../utils/http';
import LottieView from 'lottie-react-native';
import FreePointsModal from '../../components/FreePointsModal';
import { getCardIcon } from '../../utils/cardIconMapper';
// Removed BlurView to avoid external dependency for blur

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ContinueWithOtp: undefined;
  BasicDeatil: undefined;
  MemberManagement: undefined;
  ChatScreen: undefined;
  NotificationScreen: undefined;
  AddNewMember: undefined;
  ProfileScreen: undefined;
  ReportScreen: undefined;
  DashboardTasksScreen: undefined;
  PaidPlanScreen: undefined;
  NakshatraScreen: undefined;
  ResourcesScreen: undefined;
  SettingsScreen: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Register'
>;

// const PLANET_ICONS: { [key: string]: any } = {
//   Sun: require('../../assets/icons/Sun.png'),
//   Saturn: require('../../assets/icons/Saturn.png'),
//   Moon: require('../../assets/icons/Moon.png'),
//   Mercury: require('../../assets/icons/Moon.png'), // fallback, update as needed
//   Mars: require('../../assets/icons/Sun.png'), // fallback, update as needed
//   Jupiter: require('../../assets/icons/Sun.png'), // fallback, update as needed
//   Rahu: require('../../assets/icons/Saturn.png'), // fallback, update as needed
//   Ketu: require('../../assets/icons/Saturn.png'), // fallback, update as needed
// };

const CARDS_PER_GROUP = 3;

// SVG Icons - Loading SVG content
const birthCalendarSvg = `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.23737 20.5928C7.50917 20.5928 6.8108 20.882 6.29589 21.397C5.78098 21.9119 5.4917 22.6102 5.4917 23.3384V26.0841C5.4917 26.8123 5.78098 27.5107 6.29589 28.0256C6.8108 28.5405 7.50917 28.8298 8.23737 28.8298H10.983C11.7112 28.8298 12.4096 28.5405 12.9245 28.0256C13.4394 27.5107 13.7287 26.8123 13.7287 26.0841V23.3384C13.7287 22.6102 13.4394 21.9119 12.9245 21.397C12.4096 20.882 11.7112 20.5928 10.983 20.5928H8.23737ZM8.23737 23.3384V26.0841H10.983V23.3384H8.23737ZM16.4744 23.3384C16.4744 22.6102 16.7637 21.9119 17.2786 21.397C17.7935 20.882 18.4919 20.5928 19.2201 20.5928H21.9657C22.6939 20.5928 23.3923 20.882 23.9072 21.397C24.4221 21.9119 24.7114 22.6102 24.7114 23.3384V26.0841C24.7114 26.8123 24.4221 27.5107 23.9072 28.0256C23.3923 28.5405 22.6939 28.8298 21.9657 28.8298H19.2201C18.4919 28.8298 17.7935 28.5405 17.2786 28.0256C16.7637 27.5107 16.4744 26.8123 16.4744 26.0841V23.3384ZM19.2201 23.3384H21.9657V26.0841H19.2201V23.3384ZM30.2028 20.5928C29.4746 20.5928 28.7762 20.882 28.2613 21.397C27.7464 21.9119 27.4571 22.6102 27.4571 23.3384V26.0841C27.4571 26.8123 27.7464 27.5107 28.2613 28.0256C28.7762 28.5405 29.4746 28.8298 30.2028 28.8298H32.9484C33.6766 28.8298 34.375 28.5405 34.8899 28.0256C35.4048 27.5107 35.6941 26.8123 35.6941 26.0841V23.3384C35.6941 22.6102 35.4048 21.9119 34.8899 21.397C34.375 20.882 33.6766 20.5928 32.9484 20.5928H30.2028ZM30.2028 23.3384V26.0841H32.9484V23.3384H30.2028ZM5.4917 34.3211C5.4917 33.5929 5.78098 32.8946 6.29589 32.3797C6.8108 31.8647 7.50917 31.5755 8.23737 31.5755H10.983C11.7112 31.5755 12.4096 31.8647 12.9245 32.3797C13.4394 32.8946 13.7287 33.5929 13.7287 34.3211V37.0668C13.7287 37.795 13.4394 38.4934 12.9245 39.0083C12.4096 39.5232 11.7112 39.8125 10.983 39.8125H8.23737C7.50917 39.8125 6.8108 39.5232 6.29589 39.0083C5.78098 38.4934 5.4917 37.795 5.4917 37.0668V34.3211ZM10.983 34.3211V37.0668H8.23737V34.3211H10.983ZM19.2201 31.5755C18.4919 31.5755 17.7935 31.8647 17.2786 32.3797C16.7637 32.8946 16.4744 33.5929 16.4744 34.3211V37.0668C16.4744 37.795 16.7637 38.4934 17.2786 39.0083C17.7935 39.5232 18.4919 39.8125 19.2201 39.8125H21.9657C22.6939 39.8125 23.3923 39.5232 23.9072 39.0083C24.4221 38.4934 24.7114 37.795 24.7114 37.0668V34.3211C24.7114 33.5929 24.4221 32.8946 23.9072 32.3797C23.3923 31.8647 22.6939 31.5755 21.9657 31.5755H19.2201ZM21.9657 34.3211H19.2201V37.0668H21.9657V34.3211Z" fill="white"/>
<path d="M41.1854 36.3806C41.1854 36.0166 41.0407 35.6674 40.7833 35.4099C40.5258 35.1524 40.1766 35.0078 39.8125 35.0078C39.4484 35.0078 39.0992 35.1524 38.8418 35.4099C38.5843 35.6674 38.4397 36.0166 38.4397 36.3806V40.3811L40.2148 42.1562C40.4737 42.4062 40.8205 42.5446 41.1804 42.5415C41.5404 42.5384 41.8847 42.394 42.1392 42.1395C42.3938 41.8849 42.5382 41.5406 42.5413 41.1806C42.5444 40.8207 42.406 40.4739 42.156 40.215L41.1854 39.2444V36.3806Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.23702 1.37284C8.23702 1.00874 8.38166 0.659551 8.63911 0.402095C8.89657 0.144638 9.24576 0 9.60986 0C9.97395 0 10.3231 0.144638 10.5806 0.402095C10.8381 0.659551 10.9827 1.00874 10.9827 1.37284V8.23702C10.9827 8.60112 11.1273 8.9503 11.3848 9.20776C11.6422 9.46522 11.9914 9.60985 12.3555 9.60985C12.7196 9.60985 13.0688 9.46522 13.3263 9.20776C13.5837 8.9503 13.7284 8.60112 13.7284 8.23702V4.11851H27.4567V1.37284C27.4567 1.00874 27.6014 0.659551 27.8588 0.402095C28.1163 0.144638 28.4655 0 28.8296 0C29.1937 0 29.5429 0.144638 29.8003 0.402095C30.0578 0.659551 30.2024 1.00874 30.2024 1.37284V8.23702C30.2024 8.60112 30.347 8.9503 30.6045 9.20776C30.862 9.46522 31.2111 9.60985 31.5752 9.60985C31.9393 9.60985 32.2885 9.46522 32.546 9.20776C32.8034 8.9503 32.9481 8.60112 32.9481 8.23702V4.11851H37.0666C38.1589 4.11851 39.2064 4.55242 39.9788 5.32479C40.7512 6.09716 41.1851 7.14472 41.1851 8.23702V30.2985C43.5897 30.646 45.7734 31.8914 47.297 33.7839C48.8205 35.6764 49.5708 38.0757 49.3968 40.4991C49.2228 42.9224 48.1375 45.19 46.3593 46.8455C44.5811 48.501 42.2418 49.4216 39.8123 49.4221C38.2628 49.4234 36.7361 49.0494 35.3626 48.3322C33.9891 47.615 32.8098 46.5758 31.9253 45.3036H4.11851C3.02621 45.3036 1.97865 44.8697 1.20628 44.0973C0.433913 43.3249 0 42.2774 0 41.1851V8.23702C0 7.14472 0.433913 6.09716 1.20628 5.32479C1.97865 4.55242 3.02621 4.11851 4.11851 4.11851H8.23702V1.37284ZM30.2024 39.8123C30.2018 37.501 31.0342 35.2669 32.5471 33.5196C34.0599 31.7722 36.1519 30.6287 38.4394 30.2985V16.474H2.74567V41.1851C2.74567 41.5492 2.89031 41.8984 3.14777 42.1558C3.40522 42.4133 3.75441 42.5579 4.11851 42.5579H30.6005C30.3357 41.6668 30.2016 40.7419 30.2024 39.8123ZM46.6764 39.8123C46.6764 41.6327 45.9533 43.3787 44.666 44.666C43.3787 45.9532 41.6328 46.6764 39.8123 46.6764C37.9918 46.6764 36.2458 45.9532 34.9585 44.666C33.6713 43.3787 32.9481 41.6327 32.9481 39.8123C32.9481 37.9918 33.6713 36.2458 34.9585 34.9585C36.2458 33.6713 37.9918 32.9481 39.8123 32.9481C41.6328 32.9481 43.3787 33.6713 44.666 34.9585C45.9533 36.2458 46.6764 37.9918 46.6764 39.8123Z" fill="white"/>
</svg>`;

const predictionSvg = `<svg width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_8_331)">
<path d="M56.4867 19.4389L55.8158 20.9825C55.711 21.2338 55.5341 21.4485 55.3075 21.5995C55.0808 21.7506 54.8146 21.8311 54.5422 21.8311C54.2699 21.8311 54.0037 21.7506 53.777 21.5995C53.5504 21.4485 53.3735 21.2338 53.2687 20.9825L52.5978 19.4389C51.4183 16.7083 49.2581 14.519 46.5436 13.3029L44.4737 12.3784C44.2226 12.2629 44.0099 12.0778 43.8608 11.8451C43.7116 11.6123 43.6324 11.3417 43.6324 11.0653C43.6324 10.7889 43.7116 10.5183 43.8608 10.2855C44.0099 10.0528 44.2226 9.8677 44.4737 9.75219L46.4291 8.88224C49.2118 7.63153 51.4089 5.36121 52.5678 2.53896L53.2605 0.872696C53.3618 0.614585 53.5386 0.392991 53.7677 0.236801C53.9968 0.0806106 54.2677 -0.00292969 54.545 -0.00292969C54.8223 -0.00292969 55.0931 0.0806106 55.3222 0.236801C55.5514 0.392991 55.7281 0.614585 55.8294 0.872696L56.5194 2.53624C57.677 5.35901 59.8732 7.63031 62.6554 8.88224L64.6135 9.75492C64.8638 9.87076 65.0758 10.0558 65.2244 10.2883C65.3729 10.5207 65.4519 10.7908 65.4519 11.0667C65.4519 11.3425 65.3729 11.6126 65.2244 11.8451C65.0758 12.0775 64.8638 12.2626 64.6135 12.3784L62.5409 13.3002C59.8269 14.5175 57.6677 16.7078 56.4894 19.4389M24.544 5.45425C29.8419 5.45344 34.9591 7.38043 38.9405 10.8756C42.9219 14.3708 45.4955 19.1952 46.1809 24.4486L52.3169 34.0999C52.7205 34.7353 52.6387 35.6816 51.7033 36.0852L46.3609 38.3706V46.361C46.3609 47.8076 45.7863 49.1949 44.7634 50.2177C43.7405 51.2406 42.3532 51.8153 40.9067 51.8153H35.4552L35.4524 59.9966H10.9084V49.9226C10.9084 46.7046 9.71934 43.6584 7.51583 40.9095C4.94622 37.7011 3.33528 33.8321 2.86861 29.7481C2.40194 25.6641 3.09851 21.5314 4.87809 17.826C6.65768 14.1206 9.44785 10.9934 12.9272 8.80455C16.4065 6.61572 20.4334 5.45435 24.544 5.45425ZM24.544 10.9085C21.4612 10.9084 18.4411 11.7791 15.8315 13.4204C13.222 15.0618 11.1292 17.4069 9.79427 20.1856C8.45933 22.9644 7.93653 26.0637 8.2861 29.1266C8.63567 32.1895 9.84339 35.0914 11.7701 37.4979C14.7536 41.2177 16.3626 45.4529 16.3626 49.9226V54.5424H29.9982L30.0036 46.361H40.9067V34.7762L45.1337 32.9654L40.9258 26.3522L40.7703 25.1468C40.2546 21.2083 38.3239 17.5919 35.3383 14.9721C32.3527 12.3523 28.516 10.908 24.544 10.9085ZM53.1514 46.3419L57.6893 49.369C60.9813 44.4434 62.7337 38.6498 62.7236 32.7254C62.7218 30.8619 62.5572 29.0438 62.23 27.2712L56.9312 28.6348C57.1548 29.9674 57.2675 31.331 57.2694 32.7254C57.2775 37.5722 55.8441 42.312 53.1514 46.3419Z" fill="white"/>
</g>
<defs>
<clipPath id="clip0_8_331">
<rect width="65.4508" height="65.4508" fill="white"/>
</clipPath>
</defs>
</svg>`;

const lifeSvg = `<svg width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.1795 15.6502C13.8348 15.6502 14.4634 15.3899 14.9268 14.9264C15.3902 14.463 15.6506 13.8345 15.6506 13.1791C15.6506 12.5237 15.3902 11.8952 14.9268 11.4318C14.4634 10.9684 13.8348 10.708 13.1795 10.708C12.5241 10.708 11.8955 10.9684 11.4321 11.4318C10.9687 11.8952 10.7084 12.5237 10.7084 13.1791C10.7084 13.8345 10.9687 14.463 11.4321 14.9264C11.8955 15.3899 12.5241 15.6502 13.1795 15.6502ZM32.1312 11.5317C29.6586 11.5335 27.2628 12.3909 25.3505 13.9585C23.4383 15.526 22.1274 17.707 21.6405 20.1312L21.4494 21.0932C21.3986 21.3084 21.3917 21.5317 21.429 21.7496C21.4663 21.9675 21.5471 22.1758 21.6665 22.3618C21.786 22.5479 21.9417 22.708 22.1243 22.8326C22.307 22.9572 22.5129 23.0438 22.7297 23.0871C22.9465 23.1305 23.1698 23.1298 23.3864 23.085C23.6029 23.0402 23.8082 22.9523 23.99 22.8265C24.1719 22.7007 24.3265 22.5396 24.4448 22.3528C24.563 22.1659 24.6425 21.9572 24.6783 21.739L24.8727 20.7802C25.2379 18.9824 26.2573 17.3841 27.7335 16.2948C29.2097 15.2056 31.0376 14.7029 32.8631 14.8842C34.6887 15.0655 36.382 15.9178 37.6151 17.2761C38.8483 18.6344 39.5334 20.402 39.5379 22.2365C39.5384 23.2103 39.3469 24.1747 38.9746 25.0745C38.6022 25.9743 38.0562 26.7919 37.3678 27.4807C36.6793 28.1694 35.862 28.7158 34.9623 29.0885C34.0627 29.4613 33.0984 29.6532 32.1246 29.6532H8.23725C7.80033 29.6532 7.38131 29.8267 7.07236 30.1357C6.76341 30.4446 6.58984 30.8636 6.58984 31.3006C6.58984 31.7375 6.76341 32.1565 7.07236 32.4654C7.38131 32.7744 7.80033 32.948 8.23725 32.948H32.1246C34.9186 32.8795 37.5752 31.7217 39.5274 29.7217C41.4796 27.7217 42.5728 25.0379 42.5737 22.243C42.5745 19.4482 41.483 16.7637 39.532 14.7625C37.581 12.7613 34.9252 11.6019 32.1312 11.5317ZM51.0698 26.3583C48.8852 26.3583 46.79 27.2262 45.2453 28.7709C43.7006 30.3157 42.8327 32.4108 42.8327 34.5954C42.8327 35.0323 43.0063 35.4513 43.3152 35.7603C43.6242 36.0692 44.0432 36.2428 44.4801 36.2428C44.9171 36.2428 45.3361 36.0692 45.645 35.7603C45.954 35.4513 46.1275 35.0323 46.1275 34.5954C46.1275 33.6179 46.4174 32.6624 46.9604 31.8496C47.5035 31.0369 48.2754 30.4034 49.1784 30.0294C50.0815 29.6553 51.0752 29.5574 52.0339 29.7481C52.9926 29.9388 53.8732 30.4095 54.5644 31.1007C55.2556 31.7919 55.7263 32.6725 55.917 33.6312C56.1077 34.5899 56.0098 35.5836 55.6358 36.4867C55.2617 37.3897 54.6282 38.1616 53.8155 38.7047C53.0028 39.2477 52.0472 39.5376 51.0698 39.5376H8.23725C7.80033 39.5376 7.38131 39.7111 7.07236 40.0201C6.76341 40.329 6.58984 40.7481 6.58984 41.185C6.58984 41.6219 6.76341 42.0409 7.07236 42.3499C7.38131 42.6588 7.80033 42.8324 8.23725 42.8324H40.3616C41.4539 42.8346 42.5006 43.2706 43.2714 44.0445C44.0423 44.8184 44.4741 45.8668 44.4719 46.9591C44.4697 48.0514 44.0337 49.0981 43.2598 49.8689C42.4859 50.6398 41.4374 51.0716 40.3451 51.0694C39.3612 51.0701 38.4088 50.7224 37.6567 50.088C36.9047 49.4535 36.4016 48.5733 36.2365 47.6033L36.2201 47.5044C36.1904 47.2859 36.1173 47.0755 36.0048 46.8858C35.8924 46.6961 35.7431 46.5309 35.5656 46.4C35.3882 46.2691 35.1863 46.1751 34.9718 46.1237C34.7574 46.0722 34.5348 46.0644 34.3173 46.1006C34.0997 46.1367 33.8917 46.2162 33.7054 46.3343C33.5192 46.4524 33.3586 46.6066 33.2331 46.788C33.1075 46.9693 33.0197 47.1739 32.9747 47.3898C32.9298 47.6057 32.9286 47.8284 32.9714 48.0448L32.9878 48.1436C33.2808 49.883 34.1806 51.4622 35.5275 52.601C36.8744 53.7399 38.5813 54.3646 40.3451 54.3642C42.3131 54.3651 44.2009 53.5849 45.594 52.1949C46.987 50.8049 47.7715 48.9188 47.7749 46.9509C47.7749 45.4254 47.3137 44.0086 46.5262 42.8324H51.0698C53.2543 42.8324 55.3495 41.9646 56.8942 40.4198C58.4389 38.8751 59.3068 36.78 59.3068 34.5954C59.3068 32.4108 58.4389 30.3157 56.8942 28.7709C55.3495 27.2262 53.2543 26.3583 51.0698 26.3583ZM25.535 52.7168C25.535 53.3722 25.2746 54.0007 24.8112 54.4641C24.3478 54.9276 23.7193 55.1879 23.0639 55.1879C22.4085 55.1879 21.78 54.9276 21.3165 54.4641C20.8531 54.0007 20.5928 53.3722 20.5928 52.7168C20.5928 52.0614 20.8531 51.4329 21.3165 50.9695C21.78 50.5061 22.4085 50.2457 23.0639 50.2457C23.7193 50.2457 24.3478 50.5061 24.8112 50.9695C25.2746 51.4329 25.535 52.0614 25.535 52.7168ZM52.7172 18.945C53.3725 18.945 54.0011 18.6847 54.4645 18.2213C54.9279 17.7578 55.1883 17.1293 55.1883 16.4739C55.1883 15.8185 54.9279 15.19 54.4645 14.7266C54.0011 14.2632 53.3725 14.0028 52.7172 14.0028C52.0618 14.0028 51.4332 14.2632 50.9698 14.7266C50.5064 15.19 50.246 15.8185 50.246 16.4739C50.246 17.1293 50.5064 17.7578 50.9698 18.2213C51.4332 18.6847 52.0618 18.945 52.7172 18.945Z" fill="white"/>
</svg>`;

const lifeViewSvg = `<svg width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M59.9965 21.8139C59.996 21.3272 59.8652 20.8495 59.6178 20.4303C59.3703 20.0112 59.0152 19.666 58.5893 19.4304L33.9853 5.79481C33.5812 5.57133 33.1271 5.4541 32.6653 5.4541C32.2036 5.4541 31.7495 5.57133 31.3454 5.79481L6.86136 19.3213C6.43602 19.5568 6.08138 19.9018 5.83417 20.3204C5.58696 20.7391 5.45616 21.2162 5.45533 21.7024C5.45449 22.1886 5.58365 22.6662 5.82942 23.0857C6.0752 23.5052 6.42865 23.8513 6.85318 24.0883L31.4572 37.833C31.8627 38.0593 32.3193 38.1784 32.7836 38.1788C33.248 38.1793 33.7048 38.0612 34.1107 37.8357L58.5948 24.2001C59.0201 23.9636 59.3743 23.6176 59.6208 23.198C59.8673 22.7784 59.997 22.3005 59.9965 21.8139ZM32.7881 32.3269L13.7991 21.7212L32.6626 11.2981L51.6543 21.8221L32.7881 32.3269Z" fill="white"/>
<path d="M55.9468 30.3418L32.7254 43.2411L9.50399 30.3418L6.85596 35.1088L31.4 48.7444C31.8051 48.9693 32.2607 49.0874 32.724 49.0874C33.1873 49.0874 33.643 48.9693 34.048 48.7444L58.5921 35.1088L55.9468 30.3418Z" fill="white"/>
<path d="M55.9468 41.25L32.7254 54.1493L9.50399 41.25L6.85596 46.017L31.4 59.6526C31.8051 59.8775 32.2607 59.9956 32.724 59.9956C33.1873 59.9956 33.643 59.8775 34.048 59.6526L58.5921 46.017L55.9468 41.25Z" fill="white"/>
</svg>`;

const importantSvg = `<svg width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_15_255)">
<path d="M38.4392 8.23744C38.4392 9.69384 37.8607 11.0906 36.8308 12.1204C35.801 13.1502 34.4043 13.7288 32.9479 13.7288C31.4915 13.7288 30.0947 13.1502 29.0649 12.1204C28.0351 11.0906 27.4565 9.69384 27.4565 8.23744M38.4392 8.23744C38.4392 6.78104 37.8607 5.3843 36.8308 4.35447C35.801 3.32464 34.4043 2.74609 32.9479 2.74609C31.4915 2.74609 30.0947 3.32464 29.0649 4.35447C28.0351 5.3843 27.4565 6.78104 27.4565 8.23744M38.4392 8.23744H51.0693C52.817 8.23744 54.4931 8.9317 55.7289 10.1675C56.9647 11.4033 57.6589 13.0794 57.6589 14.8271V56.5613C57.6589 58.309 56.9647 59.9851 55.7289 61.2208C54.4931 62.4566 52.817 63.1509 51.0693 63.1509H14.8264C13.9611 63.1509 13.1042 62.9805 12.3047 62.6493C11.5052 62.3181 10.7788 61.8328 10.1669 61.2208C8.93108 59.9851 8.23682 58.309 8.23682 56.5613V14.8271C8.23682 13.9617 8.40726 13.1048 8.73842 12.3053C9.06958 11.5058 9.55497 10.7794 10.1669 10.1675C11.4027 8.9317 13.0788 8.23744 14.8264 8.23744H27.4565M19.2195 35.6942H30.2022M19.2195 27.4572H46.6762M19.2195 43.9312H24.7109M39.2794 37.8248L38.2443 41.9653C38.22 42.0614 38.1702 42.1492 38.1001 42.2193C38.03 42.2893 37.9423 42.3392 37.8462 42.3634L33.7057 43.3985C33.1511 43.5358 33.1511 44.3266 33.7057 44.4639L37.8462 45.499C37.9423 45.5232 38.03 45.573 38.1001 45.6431C38.1702 45.7132 38.22 45.801 38.2443 45.8971L39.2794 50.0376C39.4167 50.5922 40.2074 50.5922 40.3447 50.0376L41.3798 45.8971C41.4041 45.801 41.4539 45.7132 41.524 45.6431C41.5941 45.573 41.6818 45.5232 41.778 45.499L45.9184 44.4639C46.4731 44.3266 46.4731 43.5386 45.9184 43.3985L41.778 42.3634C41.6818 42.3392 41.5941 42.2893 41.524 42.2193C41.4539 42.1492 41.4041 42.0614 41.3798 41.9653L40.3447 37.8248C40.2074 37.2702 39.4167 37.2702 39.2794 37.8248Z" stroke="white" stroke-width="4.11851" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_15_255">
<rect width="65.8962" height="65.8962" fill="white"/>
</clipPath>
</defs>
</svg>`;

// Star icon SVG for report items
const starIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#DF8A5D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

// Star badge icon SVG
const starBadgeSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 1L12.5 6.5L18.5 7.5L14 11.5L15 17.5L10 14.5L5 17.5L6 11.5L1.5 7.5L7.5 6.5L10 1Z" fill="#FF8C42" stroke="#FF8C42" stroke-width="1"/>
</svg>`;

// Document icon SVG
const documentIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<path d="M14 2V8H20" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16 13H8" stroke="#4A90E2" stroke-width="2" stroke-linecap="round"/>
<path d="M16 17H8" stroke="#4A90E2" stroke-width="2" stroke-linecap="round"/>
<path d="M10 9H9H8" stroke="#4A90E2" stroke-width="2" stroke-linecap="round"/>
</svg>`;

// Person icon SVG
const personIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

// Clock icon SVG
const clockIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="10" stroke="#4A90E2" stroke-width="2" fill="none"/>
<path d="M12 6V12L16 14" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Report items data
const reportItemsData = [
  {
    id: 1,
    text: 'Antar Dasha Report: Current planetary period significance.',
  },
  {
    id: 2,
    text: 'Nakshatra Analysis: Deep traits revealed through star constellations.',
  },
  {
    id: 3,
    text: 'Lord-Based Analysis: How house lords shape your key life areas.',
  },
  {
    id: 4,
    text: 'Planet-Based Analysis: Planetary expression across 12 houses.',
  },
];

// Overlay data array
const overlayData = [
  {
    id: 1,
    iconSvg: birthCalendarSvg,
    heading: 'Enter Your Birth Details',
    instruction:
      'Enter your birth details to discover predictions curated by AI after analyzing your chart—including rising sign, conjunctions, lords connections and divisional charts.',
    image: require('../../assets/image/homeDetails/analysis-birth.jpg'),
  },
  {
    id: 2,
    iconSvg: predictionSvg,
    heading: 'Hyper Personalized Predictions',
    instruction:
      "Tell our AI agent what's spinning in your mind whether its relationships, business, career, your goals and more. AI combines your details that with your Natal Chart, Planets in transit and generates your predictions.",
    image: require('../../assets/image/homeDetails/analysis-prediction.jpg'),
  },
  {
    id: 3,
    iconSvg: lifeSvg,
    heading: 'Life Now',
    instruction:
      'Dynamic Predictions Predictions generated based on current Dasha and Antar Dasha, and intersection of various Transit planets with Antar Dasha lord and also Ai captures combinations made by Planets in Transit with the planets of your Natal Chart and generates transit based predictions',
    image: require('../../assets/image/homeDetails/analysis-life.jpg'),
  },
  {
    id: 4,
    iconSvg: lifeViewSvg,
    heading: 'Natal Chart Base line Predictions',
    instruction:
      'Had shared the details in whats App pls add that..just replicte the plan details and paste it here..',
    image: require('../../assets/image/homeDetails/analysis-view.jpg'),
  },
  {
    id: 5,
    iconSvg: importantSvg,
    heading: 'Most important',
    instruction:
      'Analysis captures your hidden strengths that you can leverage and also specific advice considering the challenges that might come your way along with some practical tasks recommended for you. Our Ai also captures some actions which you must after thinking twice.',
    image: require('../../assets/image/homeDetails/analysis-important.jpg'),
  },
];

// Helper to format date as 'MMM D, YYYY' (e.g., Jun 6, 2020) using moment.js
function formatDashaDate(dateStr: string) {
  if (!dateStr) return '';
  // Try both 'DD-MM-YYYY' and 'YYYY-MM-DD' formats
  let m = moment(dateStr, [
    'DD-MM-YYYY',
    'YYYY-MM-DD',
    'DD/MM/YYYY',
    'YYYY/MM/DD',
  ]);
  if (!m.isValid()) {
    // Try to extract and format if range is not standard
    return dateStr;
  }
  return m.format('MMM D, YYYY');
}

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const userService = serviceFactory.get<UserService>('UserService');
  const [_currentGroup, setCurrentGroup] = useState(0);
  const { membersData, loading, refreshProfileData } = useProfileData();
  const { theme, colors } = useTheme();
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [titleContainerLayout, setTitleContainerLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const titleContainerRef = useRef<View>(null);
  const [showFreePointsModal, setShowFreePointsModal] = useState(false);

  // Debug membersData whenever it changes
  useEffect(() => {
    console.log('membersData updated:', membersData);
    if (membersData && membersData.length > 0) {
      console.log('First member details:', membersData[0]);
      console.log(
        'All member names:',
        membersData.map((member: any) => ({
          name: member.name,
          first_name: member.first_name,
          full_name: member.full_name,
          primary_member: member.primary_member,
        })),
      );
    }
  }, [membersData]);

  // Get current user data as fallback
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem('USER_DATA');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setCurrentUser(userData);
          console.log('Current user data:', userData);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };
    getUserData();
  }, []);

  // Check if we need to navigate to ChatWithPrompts after login
  useEffect(() => {
    const checkAndNavigate = async () => {
      try {
        const navParamsStr = await AsyncStorage.getItem(
          'NAVIGATE_TO_CHAT_WITH_PROMPTS',
        );
        if (navParamsStr) {
          let navParams = JSON.parse(navParamsStr);

          console.log(
            'Navigating to ChatWithPrompts with params:',
            membersData,
          );
          navParams = { ...navParams, userId: membersData[0]?.id };
          console.log('Navigating to ChatWithPrompts with params:', navParams);

          // Clear the flag
          await AsyncStorage.removeItem('NAVIGATE_TO_CHAT_WITH_PROMPTS');

          // Navigate to ChatTab with ChatWithPrompts
          setTimeout(() => {
            const rootNavigation = navigation.getParent();
            if (rootNavigation) {
              (rootNavigation as any).navigate('ChatTab', {
                screen: 'ChatWithPrompts',
                params: navParams,
              });
            } else {
              navigation.navigate('ChatWithPrompts' as any, navParams);
            }
          }, 10);
        }
      } catch (error) {
        console.error('Error checking navigation flag:', error);
      }
    };

    checkAndNavigate();
  }, [navigation, membersData]);
  const [dashaData, setDashaData] = useState<any[]>([]);
  const [dashaLoading, setDashaLoading] = useState(false);
  const [_dashaError, setDashaError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Helper function to get primary member ID
  const getPrimaryMemberId = useCallback(() => {
    if (!membersData || membersData.length === 0) {
      return null;
    }

    // Look for a member with primary_member field set to true
    const primaryMember = membersData.find(
      (member: any) =>
        member.primary_mamber === 'True' || member.primary_mamber === true,
    );

    if (primaryMember) {
      return primaryMember.id || primaryMember._id;
    }

    // If no primary_member field found, assume first member is primary
    const firstMember = membersData[0];

    console.log('primaryMember===>123', firstMember);
    return firstMember?.id || firstMember?._id || null;
  }, [membersData]);

  // Helper function to get primary member name
  const getPrimaryMemberName = useCallback(() => {
    console.log('getPrimaryMemberName called with membersData:', membersData);
    console.log('Current user data:', currentUser);

    if (!membersData || membersData.length === 0) {
      console.log('No members data available, using current user');
      // Fallback to current user data
      if (currentUser) {
        const name =
          currentUser.name ||
          currentUser.first_name ||
          currentUser.full_name ||
          'User';
        console.log('Using current user name:', name);
        return name;
      }
      return 'User';
    }

    console.log('membersData===>123', membersData);

    // Look for a member with primary_member field set to true
    const primaryMember = membersData.find(
      (member: any) =>
        member.primary_mamber === 'True' || member.primary_mamber === true,
    );

    if (primaryMember) {
      const name =
        primaryMember.name ||
        primaryMember.first_name ||
        primaryMember.full_name ||
        'User';
      console.log('Using primary member name:', name);
      return name;
    }

    // If no primary_member field found, assume first member is primary
    const firstMember = membersData[0];
    console.log('Using first member as primary:', firstMember);
    const name =
      firstMember?.name ||
      firstMember?.first_name ||
      firstMember?.full_name ||
      'User';
    console.log('Using first member name:', name);
    return name;
  }, [membersData, currentUser]);

  // Helper function to get selected member name or fallback to primary member
  const getSelectedMemberName = useCallback(() => {
    if (selectedMemberId && membersData && membersData.length > 0) {
      const selectedMember = membersData.find(
        (member: any) => (member.id || member._id) === selectedMemberId,
      );
      if (selectedMember) {
        return (
          // selectedMember.full_name ||
          // selectedMember.name ||
          selectedMember.first_name || 'User'
        );
      }
    }
    return getPrimaryMemberName();
  }, [selectedMemberId, membersData, getPrimaryMemberName]);

  // Set selectedMemberId based on primary member from membersData (only initially)
  useEffect(() => {
    if (
      membersData &&
      Array.isArray(membersData) &&
      membersData.length > 0 &&
      !selectedMemberId // Only set if no member is currently selected
    ) {
      const primaryMemberId = getPrimaryMemberId();
      console.log(
        'Setting initial selection to primary member:',
        primaryMemberId,
      );
      setSelectedMemberId(primaryMemberId);
    }
  }, [membersData, selectedMemberId, getPrimaryMemberId]);

  // Function to fetch dasha data
  const fetchDasha = useCallback(async () => {
    try {
      setDashaLoading(true);
      setDashaError(null);

      const userDataStr = await AsyncStorage.getItem('USER_DATA');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      console.log('userData===>123', membersData);

      // Get selected member ID or fallback to primary member
      const primaryMemberId = getPrimaryMemberId();
      const memberId =
        selectedMemberId ||
        primaryMemberId ||
        userData?._id ||
        userData?.user_id;

      console.log('Primary member ID:', primaryMemberId);
      console.log('Using member ID for dasha:', memberId);

      if (!memberId) {
        setDashaError('No member ID found');
        return;
      }

      const apiRes = await userService.getDashaData(memberId);

      console.log('apiRes===>123', apiRes);

      // Parse new API response format to UI format
      const parsed: any[] = [];

      // Handle new flat structure with direct dasha types
      const dashaTypes = [
        'MahaDasha',
        'AntarDasha',
        'PratyantarDasha',
        'SookshmaDasha',
        'PranDasha',
      ];

      // Mapping for display names
      const dashaDisplayNames: { [key: string]: string } = {
        MahaDasha: 'Maha Dasha',
        AntarDasha: 'Antar Dasha',
        PratyantarDasha: 'Pratyantar Dasha',
        SookshmaDasha: 'Sookshma Dasha',
        PranDasha: 'Pran Dasha',
      };

      dashaTypes.forEach(dashaType => {
        if (apiRes[dashaType]) {
          const dashaInfo = apiRes[dashaType];
          parsed.push({
            icon: `${baseURL}/${dashaInfo.path}`,
            dashaname: dashaDisplayNames[dashaType] || dashaType,
            planetname: dashaInfo.planet,
            start: formatDashaDate(dashaInfo.start),
            end: formatDashaDate(dashaInfo.end),
          });
        }
      });

      setDashaData(parsed);
    } catch (e: any) {
      console.error('Error fetching dasha data:', e);
      setDashaError(e.message || 'Failed to fetch dasha data');
    } finally {
      setDashaLoading(false);
    }
  }, [membersData, userService, getPrimaryMemberId, selectedMemberId]);

  useEffect(() => {
    // Only fetch dasha if membersData is loaded and not in loading state
    if (!loading && membersData) {
      fetchDasha();
    }
  }, [membersData, userService, loading, fetchDasha]);

  // Check if free points modal should be shown after login
  useEffect(() => {
    const checkAndShowFreePointsModal = async () => {
      try {
        const shouldShow = await AsyncStorage.getItem('SHOW_FREE_POINTS_MODAL');
        if (shouldShow === 'true') {
          // Get current user ID
          const userDataStr = await AsyncStorage.getItem('USER_DATA');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            const userId = userData._id || userData.user_id || userData.id;
            if (userId) {
              // Mark this user as having seen the modal
              await AsyncStorage.setItem(
                `FREE_POINTS_MODAL_SEEN_${userId}`,
                'true',
              );

              // Show modal after a short delay to let the screen load
              setTimeout(() => {
                setShowFreePointsModal(true);
              }, 500);

              // Remove the temporary flag
              await AsyncStorage.removeItem('SHOW_FREE_POINTS_MODAL');
            }
          }
        }
      } catch (error) {
        console.error('Error checking free points modal flag:', error);
      }
    };
    checkAndShowFreePointsModal();
  }, []);

  // Refresh data every time the Home screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('Home screen focused - refreshing data');
      // Refresh profile data (which includes members data)
      refreshProfileData();

      // Also refresh current user data
      const getUserData = async () => {
        try {
          const userDataStr = await AsyncStorage.getItem('USER_DATA');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            setCurrentUser(userData);
            console.log('Refreshed current user data:', userData);
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      };
      getUserData();
    }, [refreshProfileData]),
  );

  // Refresh function to reload both profile and dasha data
  // const handleRefresh = async () => {
  //   try {
  //     await refreshProfileData();
  //   } catch (error) {
  //     console.error('Error refreshing profile data:', error);
  //   }
  // };

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const cardWidth = 120 + 16; // card width + marginRight
    const groupWidth = cardWidth * CARDS_PER_GROUP;
    const group = Math.round(x / groupWidth);
    setCurrentGroup(group);
  };

  const handleCardPress = (cardValue: string) => {
    console.log('Card pressed:', cardValue);
    
    switch (cardValue) {
      case 'task':
        navigation.navigate('DashboardTasksScreen');
        break;
      case 'chart':
        navigation.navigate('NakshatraScreen');
        break;
      case 'profile':
        navigation.navigate('ProfileScreen');
        break;
      case 'plans':
        navigation.navigate('PaidPlanScreen');
        break;
      case 'resources':
        navigation.navigate('ResourcesScreen');
        break;
      case 'report':
        navigation.navigate('ReportScreen');
        break;
      case 'settings':
        navigation.navigate('SettingsScreen');
        break;
      default:
        console.log('Unknown card value:', cardValue);
    }
  };

  const cardsData = [
    {
      id: 1,
      title: 'Tasks',
      value: 'task',
      icon: getCardIcon('Task', 'task'),
      subtitle: undefined,
    },
    {
      id: 2,
      title: 'Charts',
      value: 'chart',
      icon: getCardIcon('Chart', 'chart'),
      subtitle: undefined,
    },
    {
      id: 3,
      title: 'Profile',
      value: 'profile',
      icon: getCardIcon('Profile', 'profile'),
      subtitle: undefined,
    },
    {
      id: 4,
      title: 'Plans',
      value: 'plans',
      icon: getCardIcon('Plans', 'plans'),
      subtitle: undefined,
    },
    {
      id: 5,
      title: 'Resources',
      value: 'resources',
      icon: getCardIcon('Resources', 'resources'),
      subtitle: undefined,
    },
    {
      id: 6,
      title: 'Reports',
      value: 'report',
      icon: getCardIcon('Report', 'report'),
      subtitle: undefined,
    },
    {
      id: 7,
      title: 'Settings',
      value: 'settings',
      icon: getCardIcon('Settings', 'settings'),
      subtitle: undefined,
    },
  ];

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -84}
      >
        <MainContainer>
          {/* Sticky Header */}
          <View style={styles.headerContainer}>
            <ImageBackground
              source={colors.backgroundImage}
              // blurRadius={12}
              style={{}}
              imageStyle={{}}
            >
              <View style={{}} />
              <View style={{}}>
                <Header
                  title=""
                  rightIconContainerStyle={{}}
                  // rightIcon={require('../../assets/icons/Ic-ball.png')}
                  LeftIcon={colors.subtractIcon}
                  // onPressRight={() => navigation.navigate('NotificationScreen')}
                />
              </View>
            </ImageBackground>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Greeting Section */}
            <View style={styles.greetingContainer}>
              <Text
                style={[
                  styles.greetingText,
                  {
                    color:
                      theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
                  },
                ]}
              >
                Good Morning,{' '}
              </Text>
              <TouchableOpacity
                style={styles.memberNameContainer}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ProfileScreen')}
              >
                <Text style={[styles.memberNameText, { color: colors.accent }]}>
                  {getSelectedMemberName()}
                </Text>
              </TouchableOpacity>
            </View>
            {/* image slider section */}
            <View style={styles.imageSliderContainer}>
              <HomeImageSlider />
            </View>

            {/* overlay view */}
            {/* <View style={styles.overlayContainerTop}>
              <LinearGradient
                colors={['#FFF4E6', '#E8D5FF']}
                style={styles.overlayGradient}
              >
                <View style={styles.overlayGradientContent}>
            
                  <View style={styles.overlayBadge}>
                    <SvgXml
                      xml={starBadgeSvg}
                      width={responsiveWidth('4%')}
                      height={responsiveWidth('4%')}
                    />
                    <Text style={styles.overlayBadgeText}>
                      THE FUTURE OF ASTROLOGY
                    </Text>
                  </View>

           
                  <View style={styles.overlayTitleContainer}>
                    <Text style={styles.overlayTitleLine1}>
                      Where AI decodes
                    </Text>

                    {Platform.OS === 'ios' ? (
                      <View style={styles.overlayTitleLine3Container}>
                        <LinearGradient
                          colors={['#9B59B6', '#FF8C42']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.overlayBadgeGradient}
                        />
                        <Text style={styles.overlayTitleLine3}>
                          your Planetary Footprint on your Soul
                        </Text>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={['#9B59B6', '#FF8C42']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.overlayTitleGradient}
                      >
                        <Text
                          style={[
                            styles.overlayTitleLine2,
                            { color: color.white },
                          ]}
                        >
                          your Planetary Footprint on your Soul
                        </Text>
                      </LinearGradient>
                    )}
                    
                  </View>

                 
                  <Text style={styles.overlayIntroText}>
                    Create An Account And Explore 100 Free BNN Predictions In
                    Just 30 Seconds And Much More
                  </Text>

                 
                  <View style={styles.overlayFeatureButtons}>
                    <View style={styles.overlayFeatureButton}>
                      <SvgXml
                        xml={documentIconSvg}
                        width={responsiveWidth('5%')}
                        height={responsiveWidth('5%')}
                      />
                      <Text style={styles.overlayFeatureButtonText}>
                        100+ Predictions
                      </Text>
                    </View>
                    <View style={styles.overlayFeatureButton}>
                      <SvgXml
                        xml={personIconSvg}
                        width={responsiveWidth('5%')}
                        height={responsiveWidth('5%')}
                      />
                      <Text style={styles.overlayFeatureButtonText}>
                        Personality Analysis
                      </Text>
                    </View>
                    <View style={styles.overlayFeatureButton}>
                      <SvgXml
                        xml={clockIconSvg}
                        width={responsiveWidth('5%')}
                        height={responsiveWidth('5%')}
                      />
                      <Text style={styles.overlayFeatureButtonText}>
                        Analysis of your Current Time Period
                      </Text>
                    </View>
                  </View>

                
                  <Text style={styles.overlayBottomText}>
                    From Birth Chart To Life Chart - AI That Help You Knows Your
                    Path
                  </Text>

                  <TouchableOpacity
                    style={styles.overlayMainButton}
                    onPress={() => navigation.navigate('AddNewMember')}
                  >
                    <Text style={styles.overlayMainButtonText}>
                      Create Chart & See Free Predictions
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View> */}

            {/* Mahadasha Card */}
            <ImageBackground
              source={
                theme === 'dark'
                  ? require('../../assets/image/DarkBackground.png')
                  : require('../../assets/image/LightBackground.png')
              }
              blurRadius={12}
              style={[
                styles.mahadashaCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.cardBackground : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.borderColor
                      : colors.surfaceOpacity,
                },
              ]}
              imageStyle={[
                styles.mahadashaBgImage,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.borderColor
                      : colors.surfaceOpacity,
                },
              ]}
            >
              <View
                style={[
                  styles.mahadashaOverlay,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.transparent : colors.white,
                  },
                ]}
              />
              <View
                style={[
                  styles.mahadashaInner,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.surface : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.borderColor
                        : colors.surfaceOpacity,
                  },
                ]}
              >
                <View
                  ref={titleContainerRef}
                  style={styles.mahadashaTitleContainer}
                  onLayout={() => {
                    titleContainerRef.current?.measureInWindow(
                      (x, y, width, height) => {
                        setTitleContainerLayout({ x, y, width, height });
                      },
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.mahadashaTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.textPrimary
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Dasha Overview
                  </Text>
                  <TouchableOpacity
                    style={styles.arrowIconContainer}
                    onPress={() => {
                      // Measure position before opening dropdown
                      setTimeout(() => {
                        titleContainerRef.current?.measureInWindow(
                          (x, y, width, height) => {
                            setTitleContainerLayout({ x, y, width, height });
                          },
                        );
                      }, 100);
                      setIsMemberDropdownOpen(!isMemberDropdownOpen);
                    }}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={require('../../assets/icons/Dropdown.png')}
                      style={[
                        styles.arrowIcon as any,
                        {
                          transform: [
                            {
                              rotate: isMemberDropdownOpen ? '180deg' : '0deg',
                            },
                          ],
                          marginRight: -responsiveWidth('1.5%'),
                          tintColor:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                {/* Modal Overlay with Dropdown positioned below title */}
                <Modal
                  visible={isMemberDropdownOpen}
                  transparent={true}
                  animationType="none"
                  onRequestClose={() => setIsMemberDropdownOpen(false)}
                >
                  <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsMemberDropdownOpen(false)}
                  >
                    <View
                      style={[
                        styles.modalDropdownWrapper,
                        titleContainerLayout && {
                          top:
                            titleContainerLayout.y +
                            titleContainerLayout.height +
                            (Platform.OS === 'ios' ? responsiveWidth('3') : 5),
                          left: titleContainerLayout.x,
                          width: titleContainerLayout.width,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.dropdownContainer,
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
                        {membersData && membersData.length > 0 ? (
                          <FlatList
                            data={membersData}
                            keyExtractor={item =>
                              (item.id || item._id).toString()
                            }
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setSelectedMemberId(item.id || item._id);
                                  setIsMemberDropdownOpen(false);
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
                                  {item.full_name}
                                </Text>
                              </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={true}
                            bounces={false}
                            keyboardShouldPersistTaps="handled"
                            style={styles.flatListStyle}
                            removeClippedSubviews={false}
                            scrollEventThrottle={16}
                          />
                        ) : (
                          <Text style={styles.noResultsText}>
                            No members found
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </Modal>

                {/* Dasha Data */}
                {membersData?.length > 0 ? (
                  <>
                    {dashaLoading ? (
                      <View style={styles.dashaLoadingContainer}>
                        <LottieView
                          source={require('../../assets/lottie/loader-Animation-1.json')}
                          autoPlay
                          loop
                          style={styles.dashaLottieAnimation}
                        />
                      </View>
                    ) : (
                      <ScrollView
                        ref={scrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.carouselContainer}
                        pagingEnabled={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                      >
                        {dashaData.map((item, idx) => (
                          <View
                            key={item?.planetname + idx}
                            style={[
                              styles.carouselCard,
                              {
                                backgroundColor:
                                  theme === 'dark'
                                    ? colors.DarkNavy
                                    : colors.white,
                                boxShadow:
                                  theme === 'dark' ? '' : '0px 0px 5px #DF8A5D',

                                shadowColor: theme === 'dark' ? '#000' : '',
                                shadowOffset: {
                                  width: theme === 'dark' ? 0 : 0,
                                  height: theme === 'dark' ? 2 : 0,
                                },
                                shadowOpacity: theme === 'dark' ? 0.4 : 0,
                                shadowRadius: theme === 'dark' ? 3 : 0,
                                elevation: theme === 'dark' ? 3 : 0,
                                // borderColor:
                                //   theme === 'dark'
                                //     ? colors.themeBorderDropdown
                                //     : colors.borderColor,
                              },
                            ]}
                          >
                            <Image
                              source={{ uri: item.icon }}
                              style={styles.planetIcon}
                            />
                            <Text
                              style={[
                                styles.planetName,
                                {
                                  color:
                                    theme === 'dark'
                                      ? colors.textPrimary
                                      : colors.DarkNavy,
                                },
                              ]}
                            >
                              {item.dashaname}
                            </Text>
                            <Text
                              style={[
                                styles.planetName,
                                {
                                  fontWeight: '400',
                                  color:
                                    theme === 'dark'
                                      ? colors.textPrimary
                                      : colors.DarkNavy,
                                },
                              ]}
                            >
                              {item.planetname}
                            </Text>
                            <Text
                              style={[
                                styles.planetDate,
                                {
                                  color:
                                    theme === 'dark'
                                      ? colors.textPrimary
                                      : colors.DarkNavy,
                                },
                              ]}
                            >
                              {item.start}
                            </Text>
                            <Text
                              style={[
                                styles.planetDate,
                                {
                                  color:
                                    theme === 'dark'
                                      ? colors.textPrimary
                                      : colors.DarkNavy,
                                },
                              ]}
                            >
                              {item.end}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                    {/* Dots indicator (grouped by 3) */}
                    {/* <View style={styles.dotsContainer}>
                      {Array.from({ length: numGroups }).map((_, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.dot,
                            { opacity: currentGroup === idx ? 1 : 0.4 },
                          ]}
                        />
                      ))}
                    </View> */}
                  </>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <View style={styles.emptyStateContent}>
                      <Text
                        style={[
                          styles.emptyStateTitle,
                          {
                            textAlign: 'left' as const,
                            marginTop: -responsiveWidth('4'),
                            color:
                              theme === 'dark'
                                ? colors.textPrimary
                                : colors.DarkNavy,
                          },
                        ]}
                      >
                        Add your details to generate your charts
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.emptyStateButton,
                          {
                            borderColor:
                              theme === 'dark'
                                ? colors.borderColor
                                : colors.primaryBlue,
                          },
                        ]}
                        // activeOpacity={0.7}
                        onPress={() => navigation.navigate('AddNewMember')}
                      >
                        <Text
                          style={[
                            styles.emptyStateButtonText,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.borderColor
                                  : colors.primaryBlue,
                            },
                          ]}
                        >
                          Add New Member
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Image
                      source={require('../../assets/image/emptyStateImage.png')}
                      style={styles.emptyStateImage}
                    />
                  </View>
                )}
              </View>
            </ImageBackground>
            {/* overlay view */}
            {/* <View style={styles.overlayContainer}>
              
              <Text
                style={[
                  styles.overlayTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.Orangeaccentcolor
                        : colors.Orangeaccentcolor,
                  },
                ]}
              >
                How to Read Your AI-Powered Birth Analysis
              </Text>

             
              <Text
                style={[
                  styles.overlayIntroText,
                  {
                    color:
                      theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
                  },
                ]}
              >
                Your unique birth chart holds the map of your life—built from 12
                Houses, 12 Zodiac Signs, 9 Planets, 27 Nakshatras and 108
                Nakshatra Padas. Our Agentic AI interprets these layers to give
                you deep, personalized insights. Getting started is simple, with
                just a few easy steps.
              </Text>

             
              {overlayData.map(item => (
                <React.Fragment key={item.id}>
                  <View style={styles.overlayIconSection}>
                    <View
                      style={[
                        styles.overlayIconContainer,
                        {
                          backgroundColor: colors.primaryBlue,
                        },
                      ]}
                    >
                      <SvgXml
                        xml={item.iconSvg}
                        width={responsiveWidth('6%')}
                        height={responsiveWidth('6%')}
                      />
                    </View>
                    <View style={styles.overlayHeadingContainer}>
                      <Text
                        style={[
                          styles.overlayHeading,
                          {
                            color:
                              theme === 'dark'
                                ? colors.textPrimary
                                : colors.DarkNavy,
                          },
                        ]}
                      >
                        {item.heading}
                      </Text>
                      <Text
                        style={[
                          styles.overlayInstructionText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.textPrimary
                                : colors.DarkNavy,
                          },
                        ]}
                      >
                        {item.instruction}
                      </Text>
                    </View>
                  </View>

                
                  <View
                    style={[
                      styles.overlayTabletContainer,
                      {
                        backgroundColor:
                          theme === 'dark' ? colors.DarkNavy : colors.white,
                        borderColor:
                          theme === 'dark'
                            ? colors.borderColor
                            : colors.surfaceOpacity,
                      },
                    ]}
                  >
                    <Image
                      source={item.image}
                      style={styles.overlayTabletImage}
                    />
                  </View>
                </React.Fragment>
              ))}
            </View> */}
            {/* daily actions Card */}
            {/* <View
              style={[
                styles.astroCard,
                {
                  borderWidth: 0.2,
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.borderColor
                      : colors.surfaceOpacity,
                },
              ]}
            >
              <View
                style={[
                  styles.astroContent,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.transparentBg : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.borderColor
                        : colors.surfaceOpacity,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.astroTitle,
                    {
                      color:
                        theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
                    },
                  ]}
                >
                  Level up your Karma with simple daily actions.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.astroButton,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? colors.transparentBg
                          : colors.Orangeaccentcolor,
                      borderColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.Orangeaccentcolor,
                    },
                  ]}
                  // activeOpacity={0.7}
                  onPress={() => navigation.navigate('DashboardTasksScreen')}
                >
                  <Text
                    style={[
                      styles.astroButtonText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.white,
                      },
                    ]}
                  >
                    Dashboard
                  </Text>
                </TouchableOpacity>
              </View>
              <Image
                source={require('../../assets/icons/Dashboard-daliy-action.png')}
                style={styles.astroImage}
              />
            </View> */}
            {/* Report Card */}
            {/* <View
              style={[
                styles.astroCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.surfaceOpacity,
                },
              ]}
            >
              <View style={styles.astroContent}>
                <Text
                  style={[
                    styles.astroTitle,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Get your personalized report instantly
                </Text>
                <TouchableOpacity
                  style={[
                    styles.astroButton,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? colors.transparentBg
                          : colors.Orangeaccentcolor,
                      borderColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.Orangeaccentcolor,
                    },
                  ]}
                  // activeOpacity={0.7}
                  onPress={() => navigation.navigate('ReportScreen')}
                >
                  <Text
                    style={[
                      styles.astroButtonText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.white,
                      },
                    ]}
                  >
                    View Reports
                  </Text>
                </TouchableOpacity>
              </View>
              <Image
                source={require('../../assets/image/report-icon.png')}
                style={styles.reportImage}
              />
            </View> */}
            {/* Astro AI Chat Card */}
            {/* <View
              style={[
                styles.astroCard,

                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.borderColor
                      : colors.surfaceOpacity,
                  borderWidth: 0.2,
                },
              ]}
            >
              <View style={styles.astroContent}>
                <Text
                  style={[
                    styles.astroTitle,
                    {
                      color:
                        theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
                    },
                  ]}
                >
                  Gain clarity on your life, career & relationships
                </Text>
                <TouchableOpacity
                  style={[
                    styles.astroButton,
                    { backgroundColor: colors.Orangeaccentcolor },
                  ]}
                  // activeOpacity={0.7}
                  onPress={() => {
                    const rootNavigation = navigation.getParent();
                    if (rootNavigation) {
                      (rootNavigation as any).navigate('ChatTab', {
                        screen: 'ChatScreen',
                      });
                    } else {
                      navigation.navigate('ChatScreen' as any);
                    }
                  }}
                >
                  <Text
                    style={[styles.astroButtonText, { color: colors.white }]}
                  >
                    See Predictions
                  </Text>
                </TouchableOpacity>
              </View>
              <Image
                source={require('../../assets/image/Ai-robot.png')}
                style={styles.astroImage}
              />
            </View> */}
            {/* Manage Members Card */}
            {/* <View
              style={[
                styles.membersCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.surfaceOpacity,
                },
              ]}
            >
              <View style={styles.membersInner}>
                <View style={styles.membersContent}>
                  <Text
                    style={[
                      styles.membersTitle,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.DarkNavy,
                      },
                    ]}
                  >
                    Add your loved ones to generate their charts
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.membersButton,
                      {
                        backgroundColor:
                          theme === 'dark'
                            ? colors.transparentBg
                            : colors.Orangeaccentcolor,
                        borderColor:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.Orangeaccentcolor,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('MemberManagement')}
                  >
                    <Text
                      style={[
                        styles.membersButtonText,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.white,
                        },
                      ]}
                    >
                      Manage Members
                    </Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={require('../../assets/image/Manage-Members.png')}
                  style={styles.membersImage}
                />
              </View>
            </View> */}
            {/* Report Card - Detailed Reports Section */}
            {/* <View
              style={[
                styles.reportCardContainer,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.borderColor,
                  borderWidth: 0.2,
                },
              ]}
            >
              <Text
                style={[
                  styles.reportCardTitle,
                  {
                    color:
                      theme === 'dark'
                        ? colors.themeTextWhite
                        : colors.themeTextWhite,
                  },
                ]}
              >
                Specific detailed Reports Prepared for You
              </Text>

              <Text
                style={[
                  styles.reportCardIntroText,
                  {
                    color:
                      theme === 'dark'
                        ? colors.textPrimary
                        : colors.textPrimary,
                  },
                ]}
              >
                Mailed directly to you based on the details shared. We don't
                just give you data, we give you a narrative of your life's
                potential.
              </Text>

             
              <View style={styles.reportItemsContainer}>
                {reportItemsData.map(item => (
                  <View
                    key={item.id}
                    style={[
                      styles.reportItem,
                      {
                        backgroundColor:
                          theme === 'dark'
                            ? colors.transparentBg
                            : colors.white,
                        borderColor:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.borderColor,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <SvgXml
                      xml={starIconSvg}
                      width={responsiveWidth('5%')}
                      height={responsiveWidth('5%')}
                    />
                    <Text
                      style={[
                        styles.reportItemText,
                        {
                          color:
                            theme === 'dark'
                              ? colors.textPrimary
                              : colors.textPrimary,
                        },
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View> */}
            {/* plan and membership card */}
            {/* <View
              style={[
                styles.astroCard,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.surfaceOpacity,
                },
              ]}
            >
              <View style={styles.astroContent}>
                <Text
                  style={[
                    styles.astroTitle,
                    {
                      color:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.DarkNavy,
                    },
                  ]}
                >
                  Unlock exclusive benefits, explore now
                </Text>
                <TouchableOpacity
                  style={[
                    styles.astroButton,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? colors.transparentBg
                          : colors.Orangeaccentcolor,
                      borderColor:
                        theme === 'dark'
                          ? colors.themeTextWhite
                          : colors.Orangeaccentcolor,
                    },
                  ]}
                  // activeOpacity={0.7}
                  onPress={() => navigation.navigate('PaidPlanScreen')}
                >
                  <Text
                    style={[
                      styles.astroButtonText,
                      {
                        color:
                          theme === 'dark'
                            ? colors.themeTextWhite
                            : colors.white,
                      },
                    ]}
                  >
                    View Plans
                  </Text>
                </TouchableOpacity>
              </View>
              <Image
                source={require('../../assets/image/View-Plans.png')}
                style={styles.ViewPlansImage}
              />
            </View>
          
            <View
              style={[
                styles.lifeIsNotStaticContainer,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.DarkNavy : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeTextWhite
                      : colors.borderColor,
                  borderWidth: theme === 'dark' ? 0.2 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.lifeIsNotStaticText,
                  {
                    color:
                      theme === 'dark' ? colors.textPrimary : colors.DarkNavy,
                  },
                ]}
              >
                Life is not static, nor should predictions be. Our Dynamic
                Predictions segment captures transits at regular intervals and
                pushes updates for your consumption.
              </Text>
            </View> */}
            {/* Example MapView (add inside your main render/return, adjust as needed) */}
            {/*
            <MapView
              style={{ width: Dimensions.get('window').width, height: 300 }}
              initialRegion={{
                latitude: 28.6139, // Example: New Delhi
                longitude: 77.209,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              <Marker
                coordinate={{ latitude: 28.6139, longitude: 77.209 }}
                title={'New Delhi'}
                description={'Marker in New Delhi'}
              />
            </MapView>
            */}

            {/* new home screen content */}

            <View
              style={[
                styles.newHomeContainer,
                {
                  backgroundColor:
                    theme === 'dark' ? colors.primary : colors.white,
                  borderColor:
                    theme === 'dark'
                      ? colors.themeBorderDropdown
                      : colors.borderColor,
                },
              ]}
            >
              <View style={styles.content}>
                <View style={styles.cardsGrid}>
                  {cardsData.map(card => (
                    <TouchableOpacity
                      key={card.id}
                      style={[
                        styles.card,
                        {
                          backgroundColor:
                            theme === 'dark' ? colors.DarkNavy : colors.surface,
                          borderColor:
                            theme === 'dark'
                              ? colors.themeBorderDropdown
                              : colors.borderColor,
                          // boxShadow: theme === 'dark' ? '' : '0px 0px 10px rgba(0, 0, 0, 0.35) inset',
                        },
                      ]}
                      onPress={() => handleCardPress(card.value)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardIconContainer}>
                        {/* <Image source={card.icon} style={styles.cardIcon} /> */}
                      </View>
                      <Text
                        style={[
                          styles.cardText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.themeTextWhite
                                : colors.DarkNavy,
                          },
                        ]}
                      >
                        {card.title}
                      </Text>
                      {card.subtitle && (
                        <Text
                          style={[
                            styles.cardSubtitle,
                            {
                              color:
                                theme === 'dark'
                                  ? colors.themeTextWhite
                                  : colors.DarkNavy,
                            },
                          ]}
                        >
                          {card.subtitle}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </MainContainer>
      </KeyboardAvoidingView>

      {/* Free Points Modal */}
      <FreePointsModal
        visible={showFreePointsModal}
        onClose={async () => {
          setShowFreePointsModal(false);

          // Navigate to ChatWithPrompts after modal closes
          try {
            // Navigate to ChatTab with ChatWithPrompts
            setTimeout(() => {
              const rootNavigation = navigation.getParent();
              if (rootNavigation) {
                (rootNavigation as any).navigate('ChatTab', {
                  screen: 'ChatWithPrompts',
                  params: {
                    userId: membersData[0]?.id,
                    cardTitles: 'Snapshot Prediction',
                    tab: 'LifeNow',
                    planet: null,
                  },
                });
              } else {
                navigation.navigate('ChatWithPrompts' as any, {
                  userId: membersData[0]?.id,
                  cardTitles: 'Snapshot Prediction',
                  tab: 'LifeNow',
                  planet: null,
                });
              }
            }, 10);
          } catch (error) {
            console.error('Error navigating to ChatWithPrompts:', error);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '100%',
    // backgroundColor: '#202945',
    // paddingTop: Platform.OS === 'android' ? 0 : 70, // Add padding for sticky header
    paddingBottom: Platform.OS === 'android' ? 35 : 32,
  },
  headerContainer: {
    // position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    // backgroundColor: '#202945',
    // backgroundColor:  color.DarkNavy,
  },
  greetingContainer: {
    marginLeft: responsiveWidth('3%'),
    flexDirection: 'row',
    // marginTop:
    //   Platform.OS === 'android'
    //     ? responsiveHeight('0%')
    //     : responsiveWidth('0%'),
  },
  greetingText: {
    // ...font.labelLarge,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
    fontStyle: 'normal' as const,

    lineHeight: 30,

    letterSpacing: -0.14,
    textAlignVertical: 'center' as const,
  },
  memberNameContainer: {
    // Inline style for text within text
  },
  memberNameText: {
    // ...font.labelLarge,
    fontSize: 26,
    fontFamily: fontFamily.regular,

    fontWeight: '600' as const,
    fontStyle: 'normal' as const,

    lineHeight: 34,
    letterSpacing: -0.14,
    textAlignVertical: 'center' as const,
  },
  imageSliderContainer: {
    marginTop: responsiveHeight('1.5%'),
    marginHorizontal: responsiveWidth('2%'),
  },
  mahadashaCard: {
    borderRadius: 20,
    marginHorizontal: 8,
    marginTop: responsiveWidth('3%'),
    borderWidth: 0.2,
    // opacity: 0.7,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 3,
    // },
    // shadowOpacity: 0.3,
    // shadowRadius: 4,
    // elevation: 5,
  },
  mahadashaCardHeder: {
    // borderRadius: 20,
    // marginHorizontal: 8,
    // marginTop: responsiveWidth('3%'),
    // borderWidth: 0.2,
    // borderColor: '#EEE5CA',
    // overflow: 'hidden',
  },
  mahadashaBgImage: {
    borderRadius: 20,
    opacity: 0.7,
  },
  mahadashaBgImageHeder: {
    // borderRadius: 20,
    // opacity: 0.7,
  },
  mahadashaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.7,
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  mahadashaInner: {
    padding: responsiveWidth('3'),
    position: 'relative',
    zIndex: 1,
  },
  mahadashaTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: responsiveWidth('1'),
    // marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  mahadashaTitle: {
    // ...font.label,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    marginBottom: 12,
  },
  arrowIcon: {
    width: responsiveWidth('7%'),
    height: responsiveWidth('7%'),
    resizeMode: 'contain',
    marginRight: responsiveWidth('5%'),
    tintColor: color.themeTextWhite,
    // transform: [{ rotate: '270deg' }],
  },
  arrowIconContainer: {
    marginRight: responsiveWidth(2),
  },
  // absolute: {
  //   position: 'absolute',
  //   height:responsiveWidth("100%"),
  //   width:responsiveWidth("100%"),
  //   top: 0,
  //   left: 0,
  //   bottom: 0,
  //   right: 0,
  // },
  dashaLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveHeight('3'),
    minHeight: responsiveHeight('15'),
  },
  dashaLottieAnimation: {
    width: 120,
    height: 120,
  },
  carouselContainer: {
    flexDirection: 'row',
    // overflow: 'hidden',
    padding: responsiveWidth('1'),
    // borderWidth: 1,
    // paddingVertical: responsiveWidth('5'),
  },
  carouselCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: responsiveWidth('1'),
    paddingVertical: responsiveWidth('3'),
    marginRight: 16,
    width: responsiveWidth('37%'),

    // shadowColor: '#ff0000',
    // borderWidth: 1,
    // shadowOffset: {
    //   width: 0,

    //   height: 0,
    // },

    // shadowOpacity: 0.3,
    // shadowRadius: 16,
    // elevation: 16,
  },
  planetIcon: {
    width: responsiveWidth('10'),
    height: responsiveWidth('10'),
    resizeMode: 'contain',
    borderRadius: 100,
    marginBottom: responsiveWidth('2'),
  },
  planetName: {
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    // ...font.mini,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  planetDate: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginTop: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 2,
  },
  astroCard: {
    borderRadius: 16,
    marginHorizontal: 8,
    overflow: 'hidden',
    borderWidth: 0.2,
    marginTop: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  astroContent: {
    flex: 1,

    padding: responsiveWidth('3'),
    // paddingBottom: responsiveWidth('2'),
  },
  astroTitle: {
    // ...font.subtitleLarge,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    lineHeight: 30,
    marginBottom: responsiveWidth('2'),
    // paddingBottom: responsiveWidth('2'),
    // letterSpacing: -0.14,
    textAlignVertical: 'center',
  },
  astroButton: {
    borderRadius: 10,
    paddingVertical: 14,
    justifyContent: 'center',
    borderWidth: 1,
    alignItems: 'center',
    // width: responsiveHeight('15'),
    paddingHorizontal: 14,
    marginTop: responsiveWidth('1'),
    alignSelf: 'flex-start',
    width: responsiveWidth('38%'),
  },
  astroButtonText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
  },
  ViewPlansImage: {
    width: responsiveWidth('28%'),
    height: responsiveWidth('28%'),
    resizeMode: 'contain',
    marginVertical: 10,
    // marginRight: responsiveWidth('2'),
    // marginLeft: responsiveWidth('4'),
    // marginRight: responsiveWidth('2'),
  },
  astroImage: {
    width: responsiveWidth('30%'),
    height: responsiveWidth('30%'),
    resizeMode: 'contain',
    // marginLeft: responsiveWidth('4'),
    marginRight: responsiveWidth('2'),
  },
  reportImage: {
    width: responsiveWidth('30%'),
    height: responsiveWidth('30%'),
    resizeMode: 'contain',
    // marginLeft: responsiveWidth('4'),
    // marginRight: responsiveWidth('2'),
  },

  membersCard: {
    borderRadius: 16,
    marginHorizontal: 8,
    marginTop: responsiveWidth('5%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // marginBottom: responsiveWidth('15%'),
    paddingVertical: Platform.OS === 'android' ? 10 : responsiveWidth('1'),
    paddingHorizontal: responsiveWidth('3'),
    // paddingTop:  Platform.OS === 'android' ? responsiveWidth('1') : responsiveWidth('0'),
    // paddingVertical:
    //   Platform.OS === 'android' ? responsiveWidth('0') : responsiveWidth('0'),
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  membersBgImage: {
    borderRadius: 16,
    opacity: 0.7,
  },
  membersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  membersInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'android' ? 10 : 7,

    // justifyContent: 'space-between',
    // alignSelf: 'center',
    // paddingTop: Platform.OS === 'android' ? responsiveWidth('0.5') : responsiveWidth('0'),
    // paddingVertical:
    //   Platform.OS === 'android' ? responsiveWidth('0') : responsiveWidth('0'),
    // paddingHorizontal: responsiveWidth('3'),
  },
  membersContent: {
    flex: 1,
    // width: '70%',

    // justifyContent: 'center',
    // alignItems: 'center',
  },
  membersTitle: {
    // ...font.subtitleLarge,
    fontSize: 18,
    fontFamily: fontFamily.regular,
    // lineHeight: 32,
    letterSpacing: -0.14,
    marginTop: -10,
    marginBottom: 10,
    textAlignVertical: 'center',
  },
  membersButton: {
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    // width: responsiveHeight('15'),
    paddingVertical: 14,
    paddingHorizontal: 14,
    // marginTop: responsiveWidth('0.5'),
    alignSelf: 'flex-start',
    width: responsiveWidth('38%'),
  },
  membersButtonText: {
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
    fontSize: 12,
  },
  membersImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    // marginLeft: responsiveWidth('5'),
    // marginRight: 5,
  },
  // Empty state styles
  emptyStateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingVertical: responsiveWidth('1'),
  },
  emptyStateContent: {
    flex: 1,
  },
  emptyStateTitle: {
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    // ...font.h6,
    fontSize: 14,
    lineHeight: 30,
    letterSpacing: -0.14,
    textAlignVertical: 'center',
  },
  emptyStateSubtitle: {
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    fontSize: 18,
    // fontFamily: fontFamily.regular,
    lineHeight: 30,
    letterSpacing: -0.14,
    color: color.themeTextWhite,
    textAlignVertical: 'center',
  },
  emptyStateButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop:
      Platform.OS === 'android' ? responsiveWidth('2') : responsiveWidth('1'),
    alignSelf: 'flex-start',
  },
  emptyStateButtonText: {
    fontFamily: fontFamily.regular,
    fontWeight: '600' as const,
    fontSize: 12,
  },
  emptyStateImage: {
    width: responsiveWidth('27%'),
    height: responsiveWidth('27%'),
    resizeMode: 'contain',
    marginLeft: 10,
  },
  // Loading and Error states
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: responsiveWidth('5'),
  },
  loadingText: {
    color: '#F6EFD9',
    ...font.labelLarge,
    fontFamily: fontFamily.regular,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: responsiveWidth('5'),
  },
  errorText: {
    color: '#FF6B6B',
    ...font.bodySmall,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: responsiveWidth('3'),
  },
  retryButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: '#FF6B6B',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  // Dropdown styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalDropdownWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 0 : responsiveWidth('25'),
    left: responsiveWidth('4'),
    right: responsiveWidth('4'),
    alignItems: 'flex-start',
  },
  dropdownContainer: {
    width: '100%',
    backgroundColor: '#223149',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#496CA8',
    maxHeight: 150,
    elevation: 10,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  flatListStyle: {
    maxHeight: 150,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#496CA8',
  },
  dropdownItemText: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  noResultsText: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    paddingVertical: 10,
  },
  // overlayContainerTop
  // Overlay styles
  overlayContainerTop: {
    marginHorizontal: responsiveWidth('2%'),
    marginTop: responsiveWidth('5%'),
    borderRadius: 20,
    // width: '100%',
    // height: "50%",
    // backgroundColor: 'red',
    overflow: 'hidden',
  },
  overlayContainer: {
    marginHorizontal: responsiveWidth('2%'),
    marginTop: responsiveWidth('5%'),
    paddingBottom: responsiveWidth('5%'),
    borderRadius: 20,
    // width: '100%',
    // height: "50%",
    // backgroundColor: 'red',
    // overflow: 'hidden',
  },
  overlayGradient: {
    padding:
      Platform.OS === 'ios' ? responsiveWidth('0%') : responsiveWidth('5%'),
    // paddingVertical: responsiveWidth('6%'),

    alignItems: 'center',
    // marginBottom: responsiveWidth('5%'),
  },
  overlayGradientContent: {
    margin:
      Platform.OS === 'ios' ? responsiveWidth('5%') : responsiveWidth('0%'),
    // paddingVertical: responsiveWidth('6%'),

    alignItems: 'center',
    // marginBottom: responsiveWidth('5%'),
  },
  overlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.white,
    borderRadius: 20,
    paddingHorizontal: responsiveWidth('3%'),
    paddingVertical: responsiveWidth('1.5%'),
    marginBottom: responsiveWidth('4%'),
    gap: responsiveWidth('2%'),
  },
  overlayBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: color.black,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overlayTitleContainer: {
    alignItems: 'center',
    marginBottom: responsiveWidth('4%'),
  },
  overlayTitleLine1: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: color.black,
    marginBottom: responsiveWidth('2%'),
    textAlign: 'center',
  },
  overlayTitleLine2: {
    fontSize: Platform.OS === 'ios' ? 28 : 32,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: color.black,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: Platform.OS === 'ios' ? 36 : 40,
  },
  overlayTitleLine3: {
    fontSize: Platform.OS === 'ios' ? 28 : 32,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: color.white,
    textAlign: 'center',
    fontStyle: 'italic',
    position: 'absolute',
    top: 13,
    // left: 0,
    paddingHorizontal: responsiveWidth('5%'),
    // right: 0,
    // bottom: 0,
    lineHeight: Platform.OS === 'ios' ? 36 : 40,
  },
  overlayTitleGradient: {
    borderRadius: 12,
    paddingHorizontal: responsiveWidth('5%'),
    paddingVertical: responsiveWidth('2%'),
    marginTop: responsiveWidth('2%'),
    marginBottom: responsiveWidth('4%'),
    width: '100%',
    alignItems: 'center',
  },
  overlayTitleLine3Container: {
    // position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // top: 0,
    // left: 0,
    // right: 0,
    // bottom: 0,
  },
  overlayBadgeGradient: {
    // alignItems: 'center',
    // justifyContent: 'center',
    borderRadius: 12,
    // paddingHorizontal: responsiveWidth('5%'),
    // paddingVertical: responsiveWidth('2%'),
    // marginTop: responsiveWidth('2%'),
    // marginBottom: responsiveWidth('4%'),
    width: responsiveWidth('92%'),
    height: responsiveWidth('51'),
    // flex: 1,
    position: 'relative',
    paddingTop: 110,
    marginTop: -110,
    paddingLeft: 15,
    // paddingRight: 10,
    // top: 0,
  },
  overlayIntroText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: responsiveWidth('5%'),
    color: '#FF8C42',
    paddingHorizontal: responsiveWidth('2%'),
  },
  overlayFeatureButtons: {
    width: '100%',
    gap: responsiveWidth('3%'),
    marginBottom: responsiveWidth('5%'),
    alignItems: 'center',
  },
  overlayFeatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: color.white,
    borderRadius: 12,
    paddingHorizontal: responsiveWidth('4%'),
    paddingVertical: responsiveWidth('3%'),
    gap: responsiveWidth('3%'),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: '90%',
  },
  overlayFeatureButtonText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: color.black,
    flex: 1,
  },
  overlayBottomText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    color: '#333333',
    marginBottom: responsiveWidth('5%'),
    paddingHorizontal: responsiveWidth('2%'),
  },
  overlayMainButton: {
    backgroundColor: '#223149',
    borderRadius: 12,
    paddingVertical: responsiveWidth('4%'),
    paddingHorizontal:
      Platform.OS === 'ios' ? responsiveWidth('4%') : responsiveWidth('6%'),
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayMainButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    textAlign: 'center',
    color: color.white,
  },
  // Old overlay styles (for the second overlay section)
  overlayTitle: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    alignSelf: 'center',
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: responsiveWidth('3%'),
    letterSpacing: -0.5,
  },
  overlayIconSection: {
    // alignItems: 'center',
    marginBottom: responsiveWidth('4%'),
    marginTop: responsiveWidth('4%'),
  },
  overlayIconContainer: {
    width: responsiveWidth('12%'),
    height: responsiveWidth('12%'),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    // alignSelf: 'center',
    padding: responsiveWidth('2%'),
  },
  overlayIcon: {
    width: responsiveWidth('10%'),
    height: responsiveWidth('10%'),
    tintColor: color.white,
  },
  overlayHeadingContainer: {
    flex: 1,
  },
  overlayHeading: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    fontWeight: '700' as const,
    marginTop: responsiveWidth('2%'),
    marginBottom: responsiveWidth('2%'),
    lineHeight: 24,
  },
  overlayInstructionText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    opacity: 0.8,
  },
  overlayTabletContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: responsiveWidth('2%'),
    height: responsiveHeight('20%'),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overlayTabletContent: {
    // flexDirection: 'row',
    height: responsiveHeight('20%'),
    width: '100%',
    // padding: responsiveWidth('3%'),
    // minHeight: responsiveHeight('20%'),
  },
  overlayTabletImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlayInputSection: {
    flex: 1,
    marginRight: responsiveWidth('2%'),
  },
  overlayInputField: {
    height: responsiveHeight('5%'),
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: responsiveWidth('2%'),
    paddingHorizontal: responsiveWidth('2%'),
    justifyContent: 'center',
  },
  overlayInputLabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    opacity: 0.6,
  },
  overlayChartPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayChartContainer: {
    width: '100%',
    height: responsiveHeight('15%'),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  overlayChartText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    opacity: 0.6,
  },
  overlayAIBadge: {
    position: 'absolute',
    top: responsiveWidth('2%'),
    right: responsiveWidth('2%'),
    width: responsiveWidth('8%'),
    height: responsiveWidth('8%'),
    borderRadius: responsiveWidth('4%'),
    backgroundColor: color.Orangeaccentcolor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayAIText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    fontWeight: '700' as const,
    color: color.white,
  },
  // Report Card styles
  reportCardContainer: {
    borderRadius: 16,
    marginHorizontal: responsiveWidth('2%'),
    marginTop: responsiveWidth('5%'),
    overflow: 'hidden',
    // borderWidth: 1,
    // borderColor: colors.borderColor,
    padding: responsiveWidth('4%'),
    paddingVertical: responsiveWidth('5%'),
  },
  reportCardTitle: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: responsiveWidth('3%'),
    textAlign: 'center',
  },
  reportCardIntroText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    marginBottom: responsiveWidth('5%'),
    textAlign: 'center',
    opacity: 0.9,
  },
  reportItemsContainer: {
    gap: responsiveWidth('3%'),
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: responsiveWidth('3%'),
    paddingVertical: responsiveWidth('3.5%'),
    gap: responsiveWidth('3%'),
  },
  reportItemText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  lifeIsNotStaticContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: responsiveWidth('2%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,

    marginTop: responsiveWidth('4%'),
    marginBottom: responsiveWidth('15%'),
    padding: responsiveWidth('4%'),
  },
  lifeIsNotStaticText: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    lineHeight: 24,
    textAlign: 'center',
  },
  newHomeContainer: {
    flex: 1,
    backgroundColor: 'rgba(238, 229, 202, 1)',
    paddingHorizontal: responsiveWidth(3),
    marginHorizontal: responsiveWidth(2),
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(7),
    paddingTop: responsiveHeight(1.5),
    borderRadius: 12,
  },

  content: {
    position: 'relative',
    zIndex: 1,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    // paddingHorizontal: responsiveWidth(2),
    // paddingTop: responsiveHeight(1),
  },
  card: {
    backgroundColor: '#223149',
    borderRadius: 20,
    padding: responsiveWidth(2),
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    height: responsiveHeight(9),
    marginBottom: responsiveHeight(1.5),
  },
  cardIconContainer: {
    marginBottom: responsiveHeight(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    width: responsiveWidth(15),
    height: responsiveWidth(15),
  },
  cardText: {
    color: color.themeTextWhite,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardSubtitle: {
    color: color.themeTextWhite,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: -0.14,
  },
});

export default HomeScreen;
