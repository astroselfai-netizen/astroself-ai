import moment from 'moment';

type DashaPeriod = {
  planet: string;
  start: string;
  end: string;
};

type AllDasha = {
  major?: { dasha_period?: DashaPeriod[] };
  minor?: { dasha_period?: DashaPeriod[] };
  sub_minor?: { dasha_period?: DashaPeriod[] };
};

export type CurrentTransitDashaOverviewItem = {
  key: string;
  label: string;
  planet: string;
  start: string;
  end: string;
};

const parseDashaDate = (dateStr: string) => {
  const [datePart, timePart] = dateStr.split('  ');
  const [day, month, year] = datePart.split('-');
  const [hour, minute] = (timePart || '0:0').split(':');
  return moment(`${year}-${month}-${day} ${hour}:${minute}`, 'YYYY-M-D H:m');
};

const isCurrentPeriod = (startDate: string, endDate: string) => {
  const now = moment();
  const start = parseDashaDate(startDate);
  const end = parseDashaDate(endDate);
  return now.isBetween(start, end, null, '[]');
};

const formatDashaRange = (startDate: string, endDate: string) => {
  const start = parseDashaDate(startDate).format('D-M-YYYY');
  const end = parseDashaDate(endDate).format('D-M-YYYY');
  return `${start} To ${end}`;
};

export const getCurrentTransitDashaOverview = (
  allDasha?: AllDasha | null,
): CurrentTransitDashaOverviewItem[] => {
  if (!allDasha) {
    return [];
  }

  const overview: CurrentTransitDashaOverviewItem[] = [];
  const levels: Array<{ key: string; label: string; data?: DashaPeriod[] }> = [
    { key: 'major', label: 'MahaDasha', data: allDasha.major?.dasha_period },
    { key: 'minor', label: 'AntarDasha', data: allDasha.minor?.dasha_period },
    {
      key: 'sub_minor',
      label: 'PratyantarDasha',
      data: allDasha.sub_minor?.dasha_period,
    },
  ];

  levels.forEach(level => {
    const active = level.data?.find(period =>
      isCurrentPeriod(period.start, period.end),
    );

    if (active) {
      overview.push({
        key: level.key,
        label: level.label,
        planet: active.planet,
        start: formatDashaRange(active.start, active.end),
        end: '',
      });
    }
  });

  return overview;
};
