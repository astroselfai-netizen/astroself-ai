import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  responsiveWidth,
  font,
  // fontSize,
  fontFamily,
  color,
} from '../../constant/theme';
import { DashaScreenProps, DashaPeriod } from '../../types/api';
import moment from 'moment';
import { useTheme } from '../../context/ThemeContext';
import { baseURL } from '../../utils/http';

// Planet icon mapping (fallback)
const planetIcons: { [key: number]: any } = {
  0: require('../../assets/icons/Sun.png'),
  1: require('../../assets/icons/Moon.png'),
  2: require('../../assets/icons/Saturn.png'), // Mars - using Saturn as placeholder
  3: require('../../assets/icons/Saturn.png'), // Mercury - using Saturn as placeholder
  4: require('../../assets/icons/Saturn.png'), // Jupiter - using Saturn as placeholder
  5: require('../../assets/icons/Sun.png'), // Venus - using Sun as placeholder
  6: require('../../assets/icons/Saturn.png'),
  7: require('../../assets/icons/Saturn.png'), // Rahu - using Saturn as placeholder
  8: require('../../assets/icons/Saturn.png'), // Ketu - using Saturn as placeholder
};

// Planet name to ID mapping
const planetNameToId: { [key: string]: number } = {
  Sun: 0,
  Moon: 1,
  Mars: 2,
  Mercury: 3,
  Jupiter: 4,
  Venus: 5,
  Saturn: 6,
  Rahu: 7,
  Ketu: 8,
};

// Dasha type options
const dashaTypes = [
  { key: 'major', label: 'Maha dasha', level: 'mahadasha', param: 'md' as const },
  { key: 'minor', label: 'Antar dasha', level: 'antardasha', param: 'ad' as const },
  {
    key: 'sub_minor',
    label: 'Pratyantar dasha',
    level: 'pratyantardasha',
    param: 'pd' as const,
  },
  {
    key: 'sub_sub_minor',
    label: 'Sookshma dasha',
    level: 'sookshmadasha',
    param: 'sd' as const,
  },
  { key: 'sub_sub_sub_minor', label: 'Pran dasha', level: 'prandasha', param: null },
];

export type AstrologerDashaSelection = {
  level: string;
  md: string;
  ad: string;
  pd: string;
  sd: string;
  clickedPlanet: string;
};

interface DashaTableItem {
  id: number;
  planet: string;
  planet_id: number;
  icon: any;
  from: string;
  to: string;
  isActive: boolean;
}

interface DashaScreenPropsWithIcons extends DashaScreenProps {
  planets_icon?: Array<{
    id: number;
    name: string;
    path: string;
  }>;
  hideCurrentDashaOverview?: boolean;
  astrologerClientMode?: boolean;
  onAstrologerDashaRowPress?: (
    selection: AstrologerDashaSelection,
  ) => void | Promise<void>;
}

const DashaScreen = ({
  dashaDetails,
  planets_icon,
  hideCurrentDashaOverview = false,
  astrologerClientMode = false,
  onAstrologerDashaRowPress,
}: DashaScreenPropsWithIcons) => {
  const { theme, colors } = useTheme();
  const [selectedDashaType, setSelectedDashaType] = useState('major');
  const [currentDashaData, setCurrentDashaData] = useState<DashaTableItem[]>(
    [],
  );
  const [selectedPlanets, setSelectedPlanets] = useState({
    md: '',
    ad: '',
    pd: '',
    sd: '',
  });
  const hasSetInitialValue = useRef(true);
  const hasInitializedAstrologerSelections = useRef(false);

  console.log('all_dasha===>', dashaDetails);

  // Set initial selectedDashaType based on available data
  useEffect(() => {
    console.log('useEffect triggered with dashaDetails:', dashaDetails);

    // Only run this effect once when dashaDetails first becomes available
    if (
      dashaDetails &&
      Object.keys(dashaDetails).length > 0 &&
      !hasSetInitialValue.current
    ) {
      console.log('Available keys in dashaDetails:', Object.keys(dashaDetails));

      // Check for new API structure first
      if ('MahaDasha' in dashaDetails) {
        setSelectedDashaType('major');
        hasSetInitialValue.current = true;
        return;
      }

      // Fallback to old structure - find the first key that has data
      const availableKeys = Object.keys(dashaDetails);
      for (const key of availableKeys) {
        const keyData = (dashaDetails as any)[key];
        console.log(`Checking key ${key}:`, keyData);
        if (
          keyData &&
          keyData.dasha_period &&
          keyData.dasha_period.length > 0
        ) {
          console.log(
            `Setting initial selectedDashaType to: ${key} with ${keyData.dasha_period.length} periods`,
          );
          setSelectedDashaType(key);
          hasSetInitialValue.current = true; // Mark that we've set the initial value
          break;
        }
      }
    }
  }, [dashaDetails]); // Only depend on dashaDetails, not selectedDashaType

  // Function to parse date string from dasha data
  const parseDashaDate = (dateStr: string): moment.Moment => {
    // Parse date format like "22-4-1973  0:1" or "21-4-2016  18:1"
    const [datePart, timePart] = dateStr.split('  ');
    const [day, month, year] = datePart.split('-');
    const [hour, minute] = timePart.split(':');

    // Create moment object (month is 0-indexed in moment)
    return moment(`${year}-${month}-${day} ${hour}:${minute}`, 'YYYY-M-D H:m');
  };

  // Function to check if current time is within dasha period
  const isCurrentPeriod = useCallback(
    (startDate: string, endDate: string): boolean => {
      const now = moment();
      const start = parseDashaDate(startDate);
      const end = parseDashaDate(endDate);

      return now.isBetween(start, end, null, '[]'); // '[]' includes the boundary dates
    },
    [],
  );

  // Function to format date for display
  const formatDateForDisplay = (dateStr: string): string => {
    const date = parseDashaDate(dateStr);
    return date.format('DD-MM-YYYY');
  };

  // Function to get planet icon from planets_icon array
  const getPlanetIconFromAPI = useCallback(
    (planetId: number, planetName: string) => {
      if (!planets_icon || !Array.isArray(planets_icon)) {
        return planetIcons[planetId] || planetIcons[6]; // Fallback to Saturn
      }

      // First try to find by planet_id
      let planetIcon = planets_icon.find((icon: any) => icon.id === planetId);

      // If not found by id, try to find by name
      if (!planetIcon) {
        planetIcon = planets_icon.find(
          (icon: any) => icon.name.toLowerCase() === planetName.toLowerCase(),
        );
      }

      if (planetIcon && planetIcon.path) {
        // Return the path as a URI for remote images
        return { uri: `${baseURL}/${planetIcon.path}` };
      }

      return planetIcons[planetId] || planetIcons[6]; // Fallback icon
    },
    [planets_icon],
  );

  // Get current dasha data based on selection
  const getCurrentDashaData = useCallback((): DashaTableItem[] => {
    if (!dashaDetails) return [];

    // Handle new API response structure - check if it's the new format first
    if ('MahaDasha' in dashaDetails) {
      const dashaTypeMapping: { [key: string]: string } = {
        major: 'MahaDasha',
        minor: 'AntarDasha',
        sub_minor: 'PratyantarDasha',
        sub_sub_minor: 'SookshmaDasha',
        sub_sub_sub_minor: 'PranDasha',
      };

      const selectedDashaKey = dashaTypeMapping[selectedDashaType];
      if (!selectedDashaKey || !(dashaDetails as any)[selectedDashaKey])
        return [];

      const dashaData = (dashaDetails as any)[selectedDashaKey];
      const isActive = isCurrentPeriod(dashaData.start, dashaData.end);
      const planetId = planetNameToId[dashaData.planet] || 0;

      return [
        {
          id: 0,
          planet: dashaData.planet,
          planet_id: planetId,
          icon: getPlanetIconFromAPI(planetId, dashaData.planet),
          from: dashaData.start,
          to: dashaData.end,
          isActive: isActive,
        },
      ];
    }

    // Fallback to old structure for backward compatibility
    const oldDashaDetails = dashaDetails as any;
    if (!oldDashaDetails[selectedDashaType as keyof typeof oldDashaDetails])
      return [];

    const dashaTypeData =
      oldDashaDetails[selectedDashaType as keyof typeof oldDashaDetails];
    if (!dashaTypeData.dasha_period) return [];

    return dashaTypeData.dasha_period.map(
      (period: DashaPeriod, index: number) => {
        const isActive = isCurrentPeriod(period.start, period.end);
        return {
          id: index,
          planet: period.planet,
          planet_id: period.planet_id,
          icon: getPlanetIconFromAPI(period.planet_id, period.planet),
          from: period.start,
          to: period.end,
          isActive: isActive,
        };
      },
    );
  }, [dashaDetails, selectedDashaType, isCurrentPeriod, getPlanetIconFromAPI]);

  const getActivePlanetForType = useCallback(
    (typeKey: string): string => {
      if (!dashaDetails) return '';

      if ('MahaDasha' in dashaDetails) {
        const dashaTypeMapping: { [key: string]: string } = {
          major: 'MahaDasha',
          minor: 'AntarDasha',
          sub_minor: 'PratyantarDasha',
          sub_sub_minor: 'SookshmaDasha',
          sub_sub_sub_minor: 'PranDasha',
        };
        const dashaKey = dashaTypeMapping[typeKey];
        const dashaData = dashaKey ? (dashaDetails as any)[dashaKey] : null;
        return dashaData?.planet || '';
      }

      const oldDashaDetails = dashaDetails as any;
      const dashaTypeData = oldDashaDetails[typeKey];
      if (!dashaTypeData?.dasha_period?.length) return '';

      const active = dashaTypeData.dasha_period.find((period: DashaPeriod) =>
        isCurrentPeriod(period.start, period.end),
      );
      return active?.planet || dashaTypeData.dasha_period[0]?.planet || '';
    },
    [dashaDetails, isCurrentPeriod],
  );

  useEffect(() => {
    if (!astrologerClientMode || !dashaDetails) return;
    if (hasInitializedAstrologerSelections.current) return;

    setSelectedPlanets({
      md: getActivePlanetForType('major'),
      ad: getActivePlanetForType('minor') || getActivePlanetForType('major'),
      pd:
        getActivePlanetForType('sub_minor') ||
        getActivePlanetForType('minor') ||
        getActivePlanetForType('major'),
      sd:
        getActivePlanetForType('sub_sub_minor') ||
        getActivePlanetForType('sub_minor') ||
        getActivePlanetForType('minor') ||
        getActivePlanetForType('major'),
    });
    hasInitializedAstrologerSelections.current = true;
  }, [astrologerClientMode, dashaDetails, getActivePlanetForType]);

  useEffect(() => {
    setCurrentDashaData(getCurrentDashaData());
  }, [dashaDetails, selectedDashaType, getCurrentDashaData]);

  // Function to get the next dasha type in hierarchy
  const getNextDashaType = useCallback((currentType: string): string | null => {
    const typeIndex = dashaTypes.findIndex(type => type.key === currentType);
    if (typeIndex === -1 || typeIndex === dashaTypes.length - 1) {
      return null; // Already at the last level
    }
    return dashaTypes[typeIndex + 1].key;
  }, []);

  // Function to handle active row click
  const handleActiveRowClick = useCallback((item: DashaTableItem) => {
    if (item.isActive) {
      const nextDashaType = getNextDashaType(selectedDashaType);
      if (nextDashaType) {
        setSelectedDashaType(nextDashaType);
      }
    }
  }, [selectedDashaType, getNextDashaType]);

  const handleAstrologerRowClick = useCallback(
    async (item: DashaTableItem) => {
      const dashaType = dashaTypes.find(type => type.key === selectedDashaType);
      if (!dashaType) return;

      const nextSelections = { ...selectedPlanets };
      if (dashaType.param) {
        nextSelections[dashaType.param] = item.planet;
      }
      setSelectedPlanets(nextSelections);

      const nextDashaType = getNextDashaType(selectedDashaType);
      if (nextDashaType) {
        setSelectedDashaType(nextDashaType);
      }

      const selection: AstrologerDashaSelection = {
        level: dashaType.level,
        md: nextSelections.md,
        ad: nextSelections.ad,
        pd: nextSelections.pd,
        sd: nextSelections.sd,
        clickedPlanet: item.planet,
      };

      try {
        await onAstrologerDashaRowPress?.(selection);
      } catch {
        // Parent shows error toast.
      }
    },
    [
      selectedDashaType,
      selectedPlanets,
      onAstrologerDashaRowPress,
      getNextDashaType,
    ],
  );

  // const currentDashaData = getCurrentDashaData();
  const selectedDashaLabel =
    dashaTypes.find(type => type.key === selectedDashaType)?.label ||
    'Maha dasha';

  const getDashaSummaryForType = useCallback(
    (typeKey: string): { planet: string; start: string; end: string } | null => {
      if (!dashaDetails) return null;

      // New API structure
      if ('MahaDasha' in (dashaDetails as any)) {
        const dashaTypeMapping: { [key: string]: string } = {
          major: 'MahaDasha',
          minor: 'AntarDasha',
          sub_minor: 'PratyantarDasha',
          sub_sub_minor: 'SookshmaDasha',
          sub_sub_sub_minor: 'PranDasha',
        };
        const selectedDashaKey = dashaTypeMapping[typeKey];
        const dashaData = selectedDashaKey ? (dashaDetails as any)[selectedDashaKey] : null;
        if (!dashaData) return null;
        return {
          planet: dashaData.planet || '--',
          start: dashaData.start || '--',
          end: dashaData.end || '--',
        };
      }

      // Old structure: dashaDetails[typeKey].dasha_period[]
      const oldDashaDetails = dashaDetails as any;
      const dashaTypeData = oldDashaDetails[typeKey];
      if (!dashaTypeData || !Array.isArray(dashaTypeData.dasha_period)) return null;
      const periods: DashaPeriod[] = dashaTypeData.dasha_period;
      if (periods.length === 0) return null;

      const active = periods.find(p => isCurrentPeriod(p.start, p.end));
      const p = active || periods[0];
      return {
        planet: p.planet || '--',
        start: p.start || '--',
        end: p.end || '--',
      };
    },
    [dashaDetails, isCurrentPeriod],
  );

  const dashaSelectorData = dashaTypes.map((type, index) => {
    const summary = getDashaSummaryForType(type.key);
    const selectedPlanet =
      astrologerClientMode && type.param
        ? selectedPlanets[type.param]
        : summary?.planet || '--';
    const planetName = selectedPlanet || summary?.planet || '--';
    const planetId = planetNameToId[planetName] ?? 0;
    return {
      id: `${type.key}-${index}`,
      key: type.key,
      type: type.label,
      planet: planetName,
      startDate: summary?.start || '--',
      endDate: summary?.end || '--',
      icon: getPlanetIconFromAPI(planetId, planetName),
    };
  });

  console.log('currentDashaData===>', currentDashaData);
  console.log('selectedDashaLabel===>', selectedDashaLabel);

  return (
    <View>
      {!hideCurrentDashaOverview ? (
      <ImageBackground
        source={
          theme === 'dark'
            ? require('../../assets/image/DarkBackground.png')
            : require('../../assets/image/LightBackground.png')
        }
        blurRadius={12}
        style={[
          styles.membersCard,
          {
            backgroundColor:
              theme === 'dark' ? colors.transparent : colors.white,
            borderColor: colors.borderColor,
          },
        ]}
        imageStyle={styles.membersBgImage}
      >
        <View style={styles.membersOverlay} />
        <View
          style={[
            styles.dashaContainer,
            {
              backgroundColor:
                theme === 'dark' ? colors.transparent : colors.white,
              borderColor: colors.borderColor,
            },
          ]}
        >
          <Text
            style={[
              styles.dashaTitle,
              {
                color:
                  theme === 'dark' ? colors.themeTextWhite : colors.DarkNavy,
              },
            ]}
          >
            Current Dasha Overview
          </Text>
          <View style={styles.dashaCardsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled={false}
              contentContainerStyle={styles.scrollContent}
            >
              {dashaSelectorData.map(dasha => {
                const selected = selectedDashaType === dasha.key;
                return (
                  <TouchableOpacity
                    key={dasha.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedDashaType(dasha.key)}
                    style={[
                      styles.dashaCard,
                      {
                        backgroundColor:
                          theme === 'dark' ? colors.DarkNavyBlue : colors.white,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected
                          ? colors.Orangeaccentcolor
                          : theme === 'dark'
                            ? colors.themeBorderDropdown
                            : colors.borderColor,
                      },
                    ]}
                  >
                    <Image source={dasha.icon} style={styles.dashaIcon} />
                    <Text
                      style={[
                        styles.dashaType,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      {dasha.type}
                    </Text>
                    <Text
                      style={[
                        styles.dashaPlanet,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {dasha.planet}
                    </Text>
                    <Text
                      style={[
                        styles.dashaDates,
                        {
                          color:
                            theme === 'dark'
                              ? colors.themeTextWhite
                              : colors.DarkNavy,
                        },
                      ]}
                    >
                      {dasha.startDate}
                      {'\n'}
                      {dasha.endDate}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </ImageBackground>
      ) : null}

      {/* Dasha Table */}

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
            backgroundColor: theme === 'dark' ? colors.surface : colors.white,
            borderColor:
              theme === 'dark' ? colors.borderColor : colors.borderColor,
          },
        ]}
        imageStyle={styles.newMembersBgImage}
      >
        <View style={styles.newMmembersOverlay} />
        <View
          style={[
            styles.container,
            {
              backgroundColor:
                theme === 'dark' ? colors.DarkNavy : colors.DarkNavy,
              borderColor:
                theme === 'dark'
                  ? colors.themeBorderDropdown
                  : colors.borderColor,
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              {
                color: theme === 'dark' ? colors.themeTextWhite : colors.white,
              },
            ]}
          >
            {selectedDashaLabel}
          </Text>

          {/* Current Time Display */}
          {/* <View style={styles.currentTimeContainer}>
            <Text style={styles.currentTimeLabel}>Current Time:</Text>
            <Text style={styles.currentTimeText}>{moment().format('DD MMM YYYY, HH:mm:ss')}</Text>
          </View>
          */}
          {/* tableBox for dasha table */}
          <View style={styles.tableBox}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tableScrollContainer}
              contentContainerStyle={styles.tableScrollContent}
            >
              <View
                style={[
                  styles.dashaTable,
                  {
                    backgroundColor:
                      theme === 'dark' ? colors.surface : colors.white,
                    borderColor:
                      theme === 'dark'
                        ? colors.themeBorderDropdown
                        : colors.borderColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.dashaTableHeader,
                    {
                      backgroundColor:
                        theme === 'dark'
                          ? colors.tabaleHeder
                          : colors.tabaleHeder,
                      borderColor:
                        theme === 'dark'
                          ? colors.themeBorderDropdown
                          : colors.borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dashaHeaderPlanet,
                      {
                        color: theme === 'dark' ? '#23304D' : colors.white,
                      },
                    ]}
                  >
                    Planet
                  </Text>
                  <View style={styles.dashaHeaderDateCell}>
                    <Text
                      style={[
                        styles.dashaHeaderFrom,
                        {
                          color: theme === 'dark' ? '#23304D' : colors.white,
                        },
                      ]}
                    >
                      From
                    </Text>
                  </View>
                  <View style={styles.dashaHeaderDateCell}>
                    <Text
                      style={[
                        styles.dashaHeaderTo,
                        {
                          color: theme === 'dark' ? '#23304D' : colors.white,
                        },
                      ]}
                    >
                      To
                    </Text>
                  </View>
                </View>
                <View style={styles.tableBody}>
                  {currentDashaData.length > 0 ? (
                    currentDashaData.map((item: DashaTableItem) => {
                      const dashaType = dashaTypes.find(
                        type => type.key === selectedDashaType,
                      );
                      const isSelectedRow =
                        astrologerClientMode && dashaType?.param
                          ? selectedPlanets[dashaType.param] === item.planet
                          : item.isActive;
                      const isRowClickable = astrologerClientMode
                        ? Boolean(onAstrologerDashaRowPress)
                        : item.isActive;
                      const RowComponent = isRowClickable
                        ? TouchableOpacity
                        : View;
                      const rowProps = isRowClickable
                        ? {
                            onPress: () =>
                              astrologerClientMode
                                ? handleAstrologerRowClick(item)
                                : handleActiveRowClick(item),
                            activeOpacity: 0.7,
                          }
                        : {};

                      return (
                        <RowComponent
                          key={item.id}
                          {...rowProps}
                          style={[
                            styles.dashaTableRow,
                            {
                              backgroundColor:
                                theme === 'dark' ? '#EFE6D0' : colors.white,
                              borderBottomColor:
                                theme === 'dark' ? '#CFCFCF' : colors.borderColor,
                            },
                            isSelectedRow && styles.activeTableRow,
                            item.id === currentDashaData.length - 1 &&
                              styles.lastTableRow,
                          ]}
                        >
                          {/* {item.isActive && (
                             <View style={styles.activeIndicator} />
                           )} */}
                          <View style={styles.dashaCellPlanet}>
                            {/* <Image source={item.icon} style={styles.dashaPlanetIcon} /> */}
                            <Text
                              style={[
                                styles.dashaCellPlanetText,
                                {
                                  color:
                                    theme === 'dark' ? '#23304D' : colors.DarkNavy,
                                },
                                isSelectedRow && styles.activeText,
                              ]}
                            >
                              {item.planet}
                            </Text>
                          </View>
                          <View style={styles.dashaRowDateCell}>
                            <Text
                              style={[
                                styles.dashaCellFrom,
                                {
                                  color:
                                    theme === 'dark'
                                      ? '#23304D'
                                      : colors.DarkNavy,
                                },
                                isSelectedRow && styles.activeText,
                              ]}
                            >
                              {formatDateForDisplay(item.from)}
                            </Text>
                          </View>
                          <View style={styles.dashaRowDateCell}>
                            <Text
                              style={[
                                styles.dashaCellTo,
                                {
                                  color:
                                    theme === 'dark'
                                      ? '#23304D'
                                      : colors.DarkNavy,
                                },
                                isSelectedRow && styles.activeText,
                              ]}
                            >
                              {formatDateForDisplay(item.to)}
                            </Text>
                          </View>
                        </RowComponent>
                      );
                    })
                  ) : (
                    <View style={styles.noDataContainer}>
                      <Text
                        style={[
                          styles.noDataText,
                          {
                            color:
                              theme === 'dark'
                                ? colors.themeTextWhite
                                : colors.DarkNavy,
                          },
                        ]}
                      >
                        {!dashaDetails
                          ? 'Loading dasha data...'
                          : 'No dasha data available for selected type'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor: '#202945',
    // borderRadius: 18,
    // padding: responsiveWidth('4%'),
    // margin: responsiveWidth('3%'),
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.2,
    // shadowRadius: 8,
    // elevation: 4,
  },
  dropdownContainer: {
    marginHorizontal: responsiveWidth('2.5%'),
    // marginTop: responsiveWidth('1'),
    marginBottom: responsiveWidth('2'),
  },
  // ---- Dasha selector (same pattern as Nakshatra) ----
  dashaContainer: {
    padding:
      Platform.OS === 'android'
        ? responsiveWidth('2%')
        : responsiveWidth('2'),
  },
  membersCard: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: responsiveWidth('2%'),
    marginHorizontal: responsiveWidth('3'),
    marginBottom: 24,
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
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
  },
  dashaTitle: {
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    fontSize: 18,
    letterSpacing: -0.14,
    textAlignVertical: 'center',
  },
  dashaCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('2'),
    paddingVertical: responsiveWidth('2'),
  },
  dashaCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: responsiveWidth('1'),
    paddingVertical: responsiveWidth('3'),
    marginRight: 16,
    width: responsiveWidth('37%'),
  },
  dashaIcon: {
    width: responsiveWidth('10'),
    height: responsiveWidth('10'),
    marginBottom: 8,
    resizeMode: 'contain',
    borderRadius: 100,
  },
  dashaType: {
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  dashaPlanet: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  dashaDates: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 23,
  },
  dropdown: {
    backgroundColor: '#1B294B',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: color.themeBorderDropdown,
    paddingHorizontal: responsiveWidth('3'),
    paddingVertical: responsiveWidth('2'),
    // minHeight: responsiveWidth(6),
  },
  placeholderStyle: {
    color: color.themeTextWhite,
    fontFamily: fontFamily.regular,
    // fontWeight: '600',
    fontSize: 16,
  },
  selectedTextStyle: {
    color: color.themeTextWhite,
    fontFamily: fontFamily.regular,
    // fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.14,
  },
  iconStyle: {
    width: 20,
    height: 20,
    tintColor: color.themeTextWhite,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    color: color.themeTextWhite,
    backgroundColor: '#1B294B',
  },
  dropdownContainerStyle: {
    backgroundColor: '#1B294B',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: color.themeBorderDropdown,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItemContainer: {
    // backgroundColor: '#1B294B',
    // borderBottomWidth: 1,
    // marginTop: responsiveWidth(5),
    borderRadius: 10,
    // borderBottomColor: color.themeBorderDropdown,
    paddingVertical: responsiveWidth(2.5),
    // marginVertical: responsiveWidth(5),
    // paddingHorizontal: responsiveWidth(2),
    marginHorizontal: responsiveWidth(2),
  },
  dropdownItemText: {
    color: color.themeTextWhite,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    // fontWeight: '500',
  },
  title: {
    color: color.themeTextWhite,
    fontSize: 18,
    marginLeft: responsiveWidth('4'),
    marginVertical: responsiveWidth('3'),
    marginBottom: responsiveWidth('3'),
    fontFamily: fontFamily.regular,
    // marginBottom: 18,
  },
  tableBox: {
    // backgroundColor: '#F6E0A9',
    // borderRadius: 14,
    overflow: 'hidden',
    // borderWidth: 1,
    // borderColor: '#E5D3A1',
  },
  dashaTable: {
    // backgroundColor: 'rgba(215, 190, 138, 1)',
    // borderRadius: 14,
    // overflow: 'hidden',
    // borderWidth: 1,
    // borderColor: '#E5D3A1',
    flex: 1,
  },
  dashaTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D6C295',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: responsiveWidth('100'),
  },
  dashaHeaderPlanet: {
    flexGrow: 0,
    flexShrink: 1,
    marginRight: 6,
    minWidth: responsiveWidth(25),
    color: 'rgba(34, 49, 73, 1)',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: fontFamily.regular,
    textAlign: 'left',
  },
  /** Equal fixed width so From/To align; text uses 100% width for real centering */
  dashaHeaderDateCell: {
    minWidth: responsiveWidth(30),
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  dashaHeaderFrom: {
    width: '100%',
    color: '#223149',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    ...Platform.select({
      android: { includeFontPadding: false as const },
    }),
  },
  dashaHeaderTo: {
    width: '100%',
    color: '#223149',
    fontSize: 14,

    fontWeight: 'bold',
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    ...Platform.select({
      android: { includeFontPadding: false as const },
    }),
  },
  tableBody: {
    // Table body container
    backgroundColor: 'rgba(238, 229, 202, 1)',
  },
  dashaTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CFCFCF',
    backgroundColor: '#EFE6D0',
    minWidth: responsiveWidth('100'),
  },
  activeTableRow: {
    backgroundColor: '#496CA8',
    borderTopColor: '#496CA8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dashaCellPlanet: {
    flexGrow: 0,
    flexShrink: 1,
    marginRight: 6,
    minWidth: responsiveWidth(25),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dashaPlanetIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginRight: responsiveWidth('6'),
    marginLeft: -responsiveWidth('7'),
  },
  dashaCellPlanetText: {
    color: '#223149',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    textAlign: 'left',
    flexShrink: 1,
  },
  dashaRowDateCell: {
    minWidth: responsiveWidth(30),
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  dashaCellFrom: {
    width: '100%',
    color: '#223149',
    fontSize: font.labelSmall.fontSize,
    fontFamily: font.labelSmall.fontFamily,
    fontWeight: 500,
    textAlign: 'center',
    ...Platform.select({
      android: { includeFontPadding: false as const },
    }),
  },
  dashaCellTo: {
    width: '100%',
    color: '#223149',
    fontSize: font.labelSmall.fontSize,
    fontFamily: font.labelSmall.fontFamily,
    fontWeight: 500,
    textAlign: 'center',
    ...Platform.select({
      android: { includeFontPadding: false as const },
    }),
  },
  activeText: {
    color: '#F6EFD9',
    fontWeight: 700,
  },

  newMembersCard: {
    borderRadius: 16,
    // padding: responsiveWidth('4'),
    marginBottom: responsiveWidth('5'),
    marginTop: responsiveWidth('4%'),
    margin: responsiveWidth('3%'),
    borderWidth: 0.2,
    borderColor: '#EEE5CA',
    overflow: 'hidden',
  },
  newMembersBgImage: {
    borderRadius: 16,
    opacity: 0.7,
  },
  newMmembersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4, // Adjust as needed for the indicator width
    backgroundColor: '#F6EFD9', // Indicator color
    borderRadius: 2,
  },
  currentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B294B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#496CA8',
    paddingVertical: responsiveWidth('2'),
    paddingHorizontal: responsiveWidth('5'),
    marginHorizontal: responsiveWidth('2.5%'),
    marginBottom: 18,
  },
  currentTimeLabel: {
    color: '#F6EFD9',
    fontSize: font.labelLarge.fontSize,
    fontFamily: font.labelLarge.fontFamily,
    fontWeight: '500',
    marginRight: 10,
  },
  currentTimeText: {
    color: '#F6EFD9',
    fontSize: font.labelLarge.fontSize,
    fontFamily: font.labelLarge.fontFamily,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: -0.14,
  },
  dropdownIcon: {
    width: responsiveWidth('7'),
    height: responsiveWidth('7'),
    tintColor: '#F6EFD9',
    marginRight: -responsiveWidth('2'),
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveWidth('5'),
  },
  noDataText: {
    color: '#F6EFD9',
    fontFamily: fontFamily.regular,
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'left',
    paddingLeft: 12,
  },
  lastTableRow: {
    borderBottomWidth: 0,
  },
  dropdownFocused: {
    borderColor: '#496CA8',
  },
  tableScrollContainer: {
    flex: 1,
  },
  tableScrollContent: {
    flexGrow: 1,
  },
});

export default DashaScreen;
