import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../../utils/http';

export interface SubTab {
  id: number;
  title: string;
}

/** Analysis section: tab_type = horizontal tab, sub_tab = cards */
export interface AnalysisTabSection {
  tab_type: string;
  sub_tab: SubTab[];
}

/** @deprecated Use AnalysisTabSection / SubTab */
export type SubCard = SubTab;

/** @deprecated Use AnalysisTabSection */
export interface CardDataItem {
  tab_type: string;
  sub_tab: SubTab[];
  card_type: string;
  sub_card: SubTab[];
}

export interface PredictionHeadingsResponse {
  status: boolean;
  type?: 'lifenow' | 'lifeview' | 'staticpredictions' | 'dynamicpredictions';
  data: unknown[];
  message?: string;
}

function normalizeSubTabs(raw: unknown): SubTab[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item: any, index: number) => ({
      id: typeof item?.id === 'number' ? item.id : index + 1,
      title: String(item?.title ?? item?.name ?? '').trim(),
    }))
    .filter(item => item.title.length > 0);
}

export function normalizePredictionSections(raw: unknown): AnalysisTabSection[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item: any) => {
      const tab_type = String(
        item?.tab_type ??
          item?.card_type ??
          item?.cardType ??
          item?.title ??
          '',
      ).trim();
      const sub_tab = normalizeSubTabs(
        item?.sub_tab ??
          item?.sub_card ??
          item?.sub_cards ??
          item?.subCards,
      );
      return { tab_type, sub_tab };
    })
    .filter(item => item.tab_type.length > 0);
}

function toLegacyCardDataItem(section: AnalysisTabSection): CardDataItem {
  return {
    tab_type: section.tab_type,
    sub_tab: section.sub_tab,
    card_type: section.tab_type,
    sub_card: section.sub_tab,
  };
}

class HouseService {
  async getPredictionHeadings(
    userId: string,
    type: 'lifenow' | 'lifeview' | 'staticpredictions' | 'dynamicpredictions',
  ): Promise<CardDataItem[]> {
    try {
      const token = await AsyncStorage.getItem('USER_TOKEN');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const axiosResponse = await http.post<PredictionHeadingsResponse>(
        'house/prediction/headings',
        {
          user_id: userId,
          // type,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Prediction headings response:', axiosResponse.data);

      const body: any = axiosResponse.data;
      const isFailure =
        body?.status === false ||
        body?.status === 'false' ||
        body?.status === 0;
      if (isFailure) {
        throw new Error(body?.message || 'Failed to load prediction headings');
      }

      const rawData = body?.data ?? body?.result ?? body;
      const sections = normalizePredictionSections(rawData);

      if (sections.length > 0) {
        return sections.map(toLegacyCardDataItem);
      }

      throw new Error('Invalid response format from prediction headings API');
    } catch (error: any) {
      console.error('Get prediction headings error in service:', error);

      if (error.response?.status === 400) {
        throw new Error('Invalid request parameters.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('Prediction headings not found for this user.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  /** Returns all tab_type / sub_tab sections from the API (new format). */
  async getAnalysisPredictionHeadings(
    userId: string,
  ): Promise<AnalysisTabSection[]> {
    const types: Array<'staticpredictions' | 'lifenow'> = [
      'staticpredictions',
      'lifenow',
    ];

    let bestMatch: AnalysisTabSection[] = [];
    let lastError: Error | null = null;

    for (const requestType of types) {
      try {
        const legacy = await this.getPredictionHeadings(userId, requestType);
        const sections: AnalysisTabSection[] = legacy.map(item => ({
          tab_type: item.tab_type,
          sub_tab: item.sub_tab ?? [],
        }));

        const withSubTabs = sections.filter(s => s.sub_tab.length > 0);
        const candidate = withSubTabs.length > 0 ? withSubTabs : sections;

        if (candidate.length > bestMatch.length) {
          bestMatch = candidate;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (bestMatch.length > 0) {
      return bestMatch;
    }

    if (lastError) {
      throw lastError;
    }

    throw new Error('Analysis categories not available for this member.');
  }
}

export default new HouseService();
