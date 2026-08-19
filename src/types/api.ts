export namespace Api {
  export namespace User {
    export namespace Res {
      export interface Detail {
        _id: string;
        email: string;
        first_name: string;
        last_name: string;
        role?: string;
        current_plan: string;
        next_plan?: string;
        complete_profile: boolean;
        members_allow: number;
        current_members: number;
        child_allow: number;
        current_child: number;
        age: string;
        birth_data: BirthData;
        birthplace: string;
        created_at: string;
        gender: string;
        user_id: string;
        question_count?: number;
      }

      export interface BirthData {
        [key: string]: any; // This can be expanded based on actual birth data structure
      }

      export interface ProfileDataResponse {
        status: boolean;
        message: string | null;
        data: {
          data: any[];
          user_details: Detail;
        };
      }

      export interface AstrologerClientBirthData {
        day: number;
        month: number;
        year: number;
        hour: number;
        min: number;
        lat?: number;
        lon?: number;
        tzone?: number;
        full_date?: string;
      }

      export interface AstrologerClient {
        id: string;
        userId: string;
        first_name: string;
        last_name: string;
        full_name: string;
        gender: string;
        birthplace: string;
        birth_data: AstrologerClientBirthData;
        created_at: string;
        about_client?: string;
      }

      export interface AstrologerClientsResponse {
        status: boolean;
        message: string | null;
        data: {
          data: AstrologerClient[];
          user_details: Detail & Record<string, unknown>;
        };
      }

      export interface AstrologerChatHistoryItem {
        created_at: string;
        question: string;
        answer: string;
        conversation_id: string;
      }

      export interface AstrologerChatHistoryResponse {
        status: boolean;
        count: number;
        data: AstrologerChatHistoryItem[];
      }

      export interface AstrologerChatHistoryMonth {
        total_questions: number;
        latest_created_at?: string;
        year: number;
        month: number;
        month_name: string;
        display: string;
      }

      export interface AstrologerChatHistoryMonthsResponse {
        status: boolean;
        user_id?: string;
        count?: number;
        data: AstrologerChatHistoryMonth[];
      }

      export interface AstrologerChatHistoryMonthDetailsResponse {
        status: boolean;
        user_id?: string;
        month: number;
        year: number;
        data: AstrologerChatHistoryItem[];
      }

      export interface AstrologerMemberDashaResult {
        Mahadasha?: Record<string, string[]>;
        Antardasha?: Record<string, string[]>;
        Pratyantardasha?: Record<string, string[]>;
      }

      export interface AstrologerMemberBirthDetails {
        first_name: string;
        last_name: string;
        gender: string;
        birthplace: string;
        birth_data: AstrologerClientBirthData;
      }

      export interface AstrologerMemberDetailsResponse {
        dasha_result: AstrologerMemberDashaResult;
        birth_details: AstrologerMemberBirthDetails;
      }

      export interface AstrologerUsageResponse {
        astrologer_id: string;
        inr_budget: number;
        limit: number;
        used: number;
        remaining: number;
        percent_used: number;
        percent_remaining: number;
        period_start?: string;
        period_end?: string;
      }

      export interface AstrologerDignityRuleSet {
        [key: string]: string;
      }

      export interface AstrologerDignityRuleGroup {
        D1_positive?: AstrologerDignityRuleSet;
        D1_positive_count?: number;
        D1_negative?: AstrologerDignityRuleSet;
        D1_negative_count?: number;
        D9_positive?: AstrologerDignityRuleSet;
        D9_positive_count?: number;
        D9_negative?: AstrologerDignityRuleSet;
        D9_negative_count?: number;
        D10_positive?: AstrologerDignityRuleSet;
        D10_positive_count?: number;
        D10_negative?: AstrologerDignityRuleSet;
        D10_negative_count?: number;
      }

      export interface AstrologerDignityPlanet {
        planet: string;
        ruling_house?: number[] | null;
        sitting_in_house?: number;
        sitting_house?: number;
        rules?: AstrologerDignityRuleGroup[];
      }

      export interface AstrologerDignityDivisionData {
        user_id: string;
        dignity: AstrologerDignityPlanet[];
      }

      export interface AstrologerDignitySummaryItem {
        name: string;
        house: number;
        normDegree: number;
        isRetro: string | boolean;
        sign: string;
        nakshatra: string;
        nakshatra_pad: number | string;
        d1_dignity: string;
        d9_sign: string;
        d9_dignity: string;
        d10_sign: string;
        d10_dignity: string;
      }

      export interface AstrologerDignityChartResponse {
        status: boolean;
        data: Array<{
          d1_data?: AstrologerDignityDivisionData;
          d1_chart?: string;
          d9_data?: AstrologerDignityDivisionData;
          d9_chart?: string;
          d10_data?: AstrologerDignityDivisionData;
          d10_chart?: string;
          summary?: AstrologerDignitySummaryItem[];
        }>;
        error?: unknown[];
      }
    }
  }

  // AI Response types for General Analysis and other topics
  export interface InsightItem {
    heading: string;
    insights: string[];
  }

  export interface GeneralSummaryData {
    "General Summary": InsightItem[];
  }

  export interface SnapshotPredictionData {
    "Snapshot Prediction": InsightItem[];
  }

  export interface AIResponseData {
    user_id: string;
    topic: string;
    house: number;
    sub_topic: string;
    level: string;
    base_topic: string;
    data: (GeneralSummaryData | SnapshotPredictionData)[];
  }

  export interface AIResponse {
    status?: boolean;
    message?: string;
    data: AIResponseData;
  }
}

// Dasha related types
export interface DashaPeriod {
  planet: string;
  planet_id: number;
  start: string;
  end: string;
}

export interface DashaTypeData {
  planet?: {
    major?: string;
    minor?: string;
    sub_minor?: string;
    sub_sub_minor?: string;
  };
  dasha_period: DashaPeriod[];
}

// New API response structure for individual dasha types
export interface DashaData {
  planet: string;
  start: string;
  end: string;
  path: string;
}

// New API response structure
export interface NewDashaResponse {
  MahaDasha?: DashaData;
  AntarDasha?: DashaData;
  PratyantarDasha?: DashaData;
  SookshmaDasha?: DashaData;
  PranDasha?: DashaData;
}

// Legacy structure for backward compatibility
export interface DashaDetails {
  major: DashaTypeData;
  minor: DashaTypeData;
  sub_minor: DashaTypeData;
  sub_sub_minor: DashaTypeData;
  sub_sub_sub_minor: DashaTypeData;
}

// Union type to support both old and new structures
export type DashaResponse = DashaDetails | NewDashaResponse;

export interface DashaScreenProps {
  dashaDetails: DashaResponse;
}

// Current Dasha Time API response types
export interface CurrentDashaTimeResponse {
  Mahadasha: {
    [planet: string]: string[];
  };
  Antardasha: {
    [planet: string]: string[];
  };
  "Mahadasha Refined Analysis": {
    [planet: string]: string[];
  };
  "Antardasha Refined Analysis": {
    [planet: string]: string[];
  };
}
