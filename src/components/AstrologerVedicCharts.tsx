import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { fontFamily, responsiveWidth } from '../constant/theme';
import UserService from '../services/user/user.service';

const NAVY = '#1A3673';
const GOLD = '#C5A370';
const TAB_ACTIVE_BG = '#E8D4B0';
const CHART_SIZE = responsiveWidth('86');
const CHART_PADDING = responsiveWidth('3');
const CHART_RENDER_SIZE = CHART_SIZE - CHART_PADDING * 2;

const VEDIC_CHART_TABS = [
  'D1',
  'D9',
  'D10',
  'D60',
  'chalit',
  'SUN',
  'MOON',
  'D2',
  'D3',
  'D4',
  'D5',
  'D7',
  'D8',
  'D12',
  'D16',
  'D20',
  'D24',
  'D27',
  'D30',
  'D40',
  'D45',
] as const;

type VedicChartTab = (typeof VEDIC_CHART_TABS)[number];

type PlanetPosition = {
  name?: string;
  sign?: string;
  normDegree?: number;
  nakshatra?: string;
  nakshatra_pad?: number | string;
  isRetro?: string | boolean;
};

type PlanetSummary = {
  name?: string;
  d1_dignity?: string;
  d9_sign?: string;
  d9_dignity?: string;
};

type AstrologerVedicChartsProps = {
  clientId: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textMuted: string;
};

const getTabLabel = (tab: VedicChartTab) => (tab === 'chalit' ? 'CHALIT' : tab);

const formatPlanetName = (name?: string, isRetro?: string | boolean) => {
  if (!name) {
    return '--';
  }
  const retro = isRetro === 'true' || isRetro === true;
  return `${name}${retro ? ' (R)' : ''}`;
};

const formatDegree = (value?: number) =>
  value != null ? `${value.toFixed(2)}°` : '--';

const formatNakshatra = (nakshatra?: string, pad?: number | string) => {
  if (!nakshatra) {
    return '--';
  }
  if (pad == null || pad === '') {
    return nakshatra;
  }
  return `${nakshatra} - ${pad}`;
};

const AstrologerVedicCharts = ({
  clientId,
  cardBg,
  cardBorder,
  textPrimary,
  textMuted,
}: AstrologerVedicChartsProps) => {
  const userService = useMemo(() => new UserService(), []);
  const [activeTab, setActiveTab] = useState<VedicChartTab>('D1');
  const [loading, setLoading] = useState(false);
  const [chartSvg, setChartSvg] = useState('');
  const [planetsPositions, setPlanetsPositions] = useState<PlanetPosition[]>([]);
  const [summaryRows, setSummaryRows] = useState<PlanetSummary[]>([]);

  const loadChart = useCallback(
    async (chartType: VedicChartTab) => {
      if (!clientId) {
        return;
      }

      setLoading(true);
      try {
        const response = await userService.getAstrologerMemberBirthChart(
          clientId,
          chartType,
        );

        setChartSvg(String(response.chart || ''));

        if (chartType === 'D1') {
          setPlanetsPositions(
            (response.planets_positions as PlanetPosition[] | undefined) || [],
          );
          setSummaryRows((response.summary as PlanetSummary[] | undefined) || []);
        } else {
          setPlanetsPositions([]);
          setSummaryRows([]);
        }
      } catch {
        setChartSvg('');
        setPlanetsPositions([]);
        setSummaryRows([]);
      } finally {
        setLoading(false);
      }
    },
    [clientId, userService],
  );

  useEffect(() => {
    loadChart(activeTab);
  }, [activeTab, loadChart]);

  const showD1Tables = activeTab === 'D1';

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {VEDIC_CHART_TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                { borderColor: cardBorder },
                isActive && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? NAVY : textMuted },
                  isActive && styles.tabTextActive,
                ]}
              >
                {getTabLabel(tab)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      ) : chartSvg ? (
        <View style={styles.chartWrap}>
          <SvgXml
            xml={chartSvg}
            width={CHART_RENDER_SIZE}
            height={CHART_RENDER_SIZE}
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 350 350"
          />
        </View>
      ) : (
        <View style={styles.loadingWrap}>
          <Text style={[styles.emptyText, { color: textMuted }]}>Chart unavailable</Text>
        </View>
      )}

      {showD1Tables && !loading ? (
        <View style={styles.tablesWrap}>
          <View style={[styles.tableCard, { borderColor: cardBorder }]}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.planetCol]}>PLANET</Text>
              <Text style={[styles.tableHeaderCell, styles.signCol]}>SIGN</Text>
              <Text style={[styles.tableHeaderCell, styles.degreeCol]}>DEGREE</Text>
              <Text style={[styles.tableHeaderCell, styles.nakshatraCol]}>NAKSHATRA</Text>
            </View>
            {planetsPositions.map((row, index) => (
              <View
                key={`${row.name}-${index}`}
                style={[
                  styles.tableRow,
                  { borderTopColor: cardBorder },
                  index % 2 === 1 && styles.tableRowAlt,
                ]}
              >
                <Text style={[styles.tableCell, styles.planetCol, { color: textPrimary }]}>
                  {formatPlanetName(row.name, row.isRetro)}
                </Text>
                <Text style={[styles.tableCell, styles.signCol, { color: textPrimary }]}>
                  {row.sign || '--'}
                </Text>
                <Text style={[styles.tableCell, styles.degreeCol, { color: textPrimary }]}>
                  {formatDegree(row.normDegree)}
                </Text>
                <Text
                  style={[styles.tableCell, styles.nakshatraCol, { color: textPrimary }]}
                  numberOfLines={1}
                >
                  {formatNakshatra(row.nakshatra, row.nakshatra_pad)}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.tableCard, { borderColor: cardBorder }]}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.planetCol]}>PLANET</Text>
              <Text style={[styles.tableHeaderCell, styles.dignityCol]}>DIGNITY-D1</Text>
              <Text style={[styles.tableHeaderCell, styles.signCol]}>D9 SIGN</Text>
              <Text style={[styles.tableHeaderCell, styles.dignityCol]}>DIGNITY-D9</Text>
            </View>
            {summaryRows.map((row, index) => (
              <View
                key={`${row.name}-${index}`}
                style={[
                  styles.tableRow,
                  { borderTopColor: cardBorder },
                  index % 2 === 1 && styles.tableRowAlt,
                ]}
              >
                <Text style={[styles.tableCell, styles.planetCol, { color: textPrimary }]}>
                  {row.name || '--'}
                </Text>
                <Text style={[styles.tableCell, styles.dignityCol, { color: textPrimary }]}>
                  {row.d1_dignity || '--'}
                </Text>
                <Text style={[styles.tableCell, styles.signCol, { color: textPrimary }]}>
                  {row.d9_sign || '--'}
                </Text>
                <Text style={[styles.tableCell, styles.dignityCol, { color: textPrimary }]}>
                  {row.d9_dignity || '--'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: responsiveWidth('3'),
    overflow: 'hidden',
  },
  tabsRow: {
    paddingHorizontal: responsiveWidth('2'),
    gap: 8,
    paddingBottom: responsiveWidth('3'),
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  tabBtnActive: {
    backgroundColor: TAB_ACTIVE_BG,
    borderColor: GOLD,
  },
  tabText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
  },
  tabTextActive: {
    fontFamily: fontFamily.bold,
  },
  loadingWrap: {
    minHeight: CHART_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveWidth('8'),
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  chartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: CHART_PADDING,
    minHeight: CHART_SIZE,
  },
  tablesWrap: {
    paddingHorizontal: responsiveWidth('2'),
    paddingTop: responsiveWidth('2'),
    gap: responsiveWidth('3'),
    paddingBottom: responsiveWidth('2'),
  },
  tableCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E8F0FA',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: NAVY,
    fontSize: 10,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  tableRowAlt: {
    backgroundColor: '#FAFBFD',
  },
  tableCell: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
  },
  planetCol: { flex: 1.1 },
  signCol: { flex: 1 },
  degreeCol: { flex: 0.9 },
  nakshatraCol: { flex: 1.4 },
  dignityCol: { flex: 1 },
});

export default AstrologerVedicCharts;
