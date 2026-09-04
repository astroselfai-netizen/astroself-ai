export type AstrologerDashaPeriod = {
  planet: string;
  planet_id?: number;
  start: string;
  end: string;
};

export type AstrologerDashaDateRange = {
  start_date?: string;
  end_date?: string;
};

export type AstrologerDashaDetailsResponse = {
  status?: boolean;
  message?: string;
  level?: string;
  md?: string;
  ad?: string;
  pd?: string;
  sd?: string;
  md_date?: AstrologerDashaDateRange;
  ad_date?: AstrologerDashaDateRange;
  pd_date?: AstrologerDashaDateRange;
  sd_date?: AstrologerDashaDateRange;
  data?: AstrologerDashaPeriod[] | Record<string, unknown>;
  all_dasha?: Record<string, unknown>;
  dasha?: Record<string, unknown>;
};

const LEVEL_TO_ALL_DASHA_KEY: Record<string, string> = {
  mahadasha: 'major',
  antardasha: 'minor',
  pratyantardasha: 'sub_minor',
  sookshmadasha: 'sub_sub_minor',
  prandasha: 'sub_sub_sub_minor',
};

const asPeriodList = (value: unknown): AstrologerDashaPeriod[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const record = item as Record<string, unknown>;
      const planet = String(record.planet || '').trim();
      const start = String(record.start || '').trim();
      const end = String(record.end || '').trim();
      if (!planet || !start || !end) {
        return null;
      }
      return {
        planet,
        planet_id:
          typeof record.planet_id === 'number' ? record.planet_id : index,
        start,
        end,
      };
    })
    .filter((item): item is AstrologerDashaPeriod => Boolean(item));
};

const upsertPlanetPeriod = (
  periods: unknown,
  planet: string,
  start: string,
  end: string,
) => {
  const next = Array.isArray(periods) ? [...periods] : [];
  const index = next.findIndex(
    item =>
      item &&
      typeof item === 'object' &&
      String((item as { planet?: string }).planet || '').toLowerCase() ===
        planet.toLowerCase(),
  );
  const updated = {
    ...(index >= 0 && typeof next[index] === 'object' ? next[index] : {}),
    planet,
    start,
    end,
  };

  if (index >= 0) {
    next[index] = updated;
  } else {
    next.unshift(updated);
  }

  return next;
};

export const mergeDashaDetailsIntoAllDasha = (
  prevAllDasha: Record<string, any> | undefined,
  response: AstrologerDashaDetailsResponse,
) => {
  if (response.all_dasha && typeof response.all_dasha === 'object') {
    return response.all_dasha;
  }
  if (response.dasha && typeof response.dasha === 'object') {
    return response.dasha;
  }

  const next: Record<string, any> = { ...(prevAllDasha || {}) };
  const levelKey = LEVEL_TO_ALL_DASHA_KEY[String(response.level || '')];
  const periods = asPeriodList(response.data);

  if (levelKey && periods.length) {
    next[levelKey] = {
      ...(next[levelKey] || {}),
      dasha_period: periods,
    };
  }

  const applyParentPeriod = (
    key: string,
    planet?: string,
    date?: AstrologerDashaDateRange,
  ) => {
    if (!planet || !date?.start_date || !date?.end_date) {
      return;
    }
    next[key] = {
      ...(next[key] || {}),
      dasha_period: upsertPlanetPeriod(
        next[key]?.dasha_period,
        planet,
        date.start_date,
        date.end_date,
      ),
    };
  };

  applyParentPeriod('major', response.md, response.md_date);
  applyParentPeriod('minor', response.ad, response.ad_date);
  applyParentPeriod('sub_minor', response.pd, response.pd_date);
  applyParentPeriod('sub_sub_minor', response.sd, response.sd_date);

  return next;
};
