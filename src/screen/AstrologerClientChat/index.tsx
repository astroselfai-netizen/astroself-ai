import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { SvgXml } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import AstrologerCombos, { ComboTab } from '../../components/AstrologerCombos';
import AstrologerChatMemberHeader from '../../components/AstrologerChatMemberHeader';
import AstrologerVedicCharts from '../../components/AstrologerVedicCharts';
import BuyQuestionsModal from '../../components/BuyQuestionsModal';
import PersonalDetailsRequiredModal from '../../components/PersonalDetailsRequiredModal';
import PaidPlanRequiredModal from '../../components/PaidPlanRequiredModal';
import StreamingMarkdownAnswer from '../../components/StreamingMarkdownAnswer';
import FormattedMarkdownText from '../../components/FormattedMarkdownText';
import TransitEditModal, { TransitEditPayload } from '../../components/TransitEditModal';
import { fontFamily, responsiveWidth } from '../../constant/theme';
import { useTheme } from '../../context/ThemeContext';
import { setUser } from '../../state/slices/appSlice';
import { RootState } from '../../state/store';
import UserService from '../../services/user/user.service';
import {
  streamAstrologerChat,
  getAstrologerPlanDisplayName,
  isAstrologerTokenLimitError,
  AstrologerChatFinalData,
} from '../../utils/astrologerChatStream';
import { parseMarkdownAnswer } from '../../utils/astrologerChatMarkdown';
import {
  getAstrologerCurrentTransitSession,
  saveAstrologerCurrentTransitSession,
} from '../../utils/astrologerCurrentTransitSession';
import {
  setAstrologerFreshChatConversationId,
  startAstrologerFreshChatSession,
} from '../../utils/astrologerFreshChat';
import { Api } from '../../types/api';
import { icons } from '../../assets';
import { resolveBottomSafeInset } from '../../utils/safeAreaInsets';
import { mergeUserProfile } from '../../utils/userRole';

const NAVY = '#1A3673';
const GOLD = '#C5A370';
const NEW_CHAT_SUGGESTIONS = [
  'When will I buy a house?',
  'When will I see a job change?',
  'When will I see an increase in my income?',
];
const TRANSIT_CHART_SIZE = responsiveWidth('86');
const TRANSIT_CHART_PADDING = responsiveWidth('3');
const TRANSIT_CHART_RENDER_SIZE = TRANSIT_CHART_SIZE - TRANSIT_CHART_PADDING * 2;

type TransitBirthplace = {
  place?: string;
  day?: number;
  month?: number;
  year?: number;
  hour?: number;
  min?: number;
  lat?: number;
  lon?: number;
  tzone?: number;
};

type TransitPlanetPosition = {
  name?: string;
  normDegree?: number;
  sign?: string;
  nakshatra?: string;
  nakshatra_pad?: number | string;
  isRetro?: string | boolean;
};

type TransitChartData = {
  Current_tansit?: string;
  Current_tansit_planets_positions?: TransitPlanetPosition[];
  date_place?: Array<{ birthplace?: TransitBirthplace }>;
};

const parseTransitDateFromApi = (birthplace?: TransitBirthplace) => {
  if (
    birthplace?.year == null ||
    birthplace?.month == null ||
    birthplace?.day == null
  ) {
    return null;
  }

  return new Date(
    birthplace.year,
    birthplace.month - 1,
    birthplace.day,
    birthplace.hour ?? 0,
    birthplace.min ?? 0,
  );
};

type ClientView = 'chat' | 'vedic' | 'transit' | 'combos' | 'personalized';

type PlanetRow = {
  planet: string;
  sign: string;
  degree: string;
  nakshatra: string;
};

const SAMPLE_TRANSIT_PLANETS: PlanetRow[] = [
  { planet: 'Sun', sign: 'Gemini', degree: '3.82°', nakshatra: 'Mrigshira - 4' },
  { planet: 'Moon', sign: 'Leo', degree: '1.53°', nakshatra: 'Magha - 1' },
  { planet: 'Mars', sign: 'Aries', degree: '28.94°', nakshatra: 'Krittika - 1' },
  { planet: 'Mercury', sign: 'Gemini', degree: '18.21°', nakshatra: 'Ardra - 4' },
  { planet: 'Jupiter', sign: 'Gemini', degree: '8.67°', nakshatra: 'Ardra - 1' },
  { planet: 'Venus', sign: 'Taurus', degree: '22.15°', nakshatra: 'Rohini - 4' },
];

const formatTransitDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
};

const formatTransitTime = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const mapTransitPlanetRows = (
  positions?: TransitPlanetPosition[],
): PlanetRow[] => {
  if (!positions?.length) {
    return SAMPLE_TRANSIT_PLANETS;
  }

  return positions
    .filter(item => Boolean(item.name))
    .map(item => {
      const isRetro = item.isRetro === 'true' || item.isRetro === true;
      return {
        planet: `${item.name}${isRetro ? ' (R)' : ''}`,
        sign: item.sign || '--',
        degree: item.normDegree != null ? `${item.normDegree.toFixed(2)}°` : '--',
        nakshatra:
          item.nakshatra && item.nakshatra_pad != null
            ? `${item.nakshatra} - ${item.nakshatra_pad}`
            : item.nakshatra || '--',
      };
    });
};

type ChatSection = {
  heading?: string;
  bullets?: string[];
  paragraph?: string;
};

type ThinkingStep = {
  id: string;
  label: string;
  status: 'idle' | 'running' | 'completed';
};

type ChatMessage =
  | {
      id: string;
      type: 'user';
      text: string;
      timeLabel: string;
    }
  | {
      id: string;
      type: 'assistant';
      timeLabel: string;
      title: string;
      sections?: ChatSection[];
      streamingText?: string;
      showThinking?: boolean;
      thinkingSteps?: ThinkingStep[];
      isStreaming?: boolean;
      errorText?: string;
    };

const CHAT_NODE_LABELS: Record<string, string> = {
  prepare: 'Understanding the question',
  query_understanding: 'Understanding the question',
  nosql_generation: 'Generating the query',
  validate_query: 'Validating the query',
  execute_query: 'Executing the query',
  format_answer: 'Formatting the answer',
  persist: 'Saving conversation',
};

const INITIAL_THINKING_STEPS: ThinkingStep[] = [
  { id: 'prepare', label: 'Understanding the question', status: 'running' },
  { id: 'nosql_generation', label: 'Generating the query', status: 'idle' },
  { id: 'validate_query', label: 'Validating the query', status: 'idle' },
  { id: 'execute_query', label: 'Executing the query', status: 'idle' },
];

const CHAT_NODE_ORDER = [
  'prepare',
  'query_understanding',
  'nosql_generation',
  'validate_query',
  'execute_query',
  'format_answer',
  'persist',
];

const getCurrentTimeLabel = () => 'Just now';

const isNoQuestionsRemainingMessage = (text?: string) => {
  const normalized = String(text || '').toLowerCase();
  return (
    normalized.includes('no questions remaining') ||
    normalized.includes('purchase questions to continue chatting')
  );
};

const formatHistoryTimeLabel = (createdAt: string) => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const mapChatHistoryToMessages = (
  history: Api.User.Res.AstrologerChatHistoryItem[],
): ChatMessage[] => {
  const sorted = [...history].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const messages: ChatMessage[] = [];

  sorted.forEach((item, index) => {
    const timeLabel = formatHistoryTimeLabel(item.created_at);
    const parsed = parseMarkdownAnswer(item.answer);
    const messageKey = `${item.conversation_id}-${item.created_at}-${index}`;

    messages.push({
      id: `${messageKey}-user`,
      type: 'user',
      text: item.question,
      timeLabel,
    });

    messages.push({
      id: `${messageKey}-assistant`,
      type: 'assistant',
      timeLabel,
      title: parsed.title,
      sections: parsed.sections,
      isStreaming: false,
    });
  });

  return messages;
};

const getActiveThinkingLabel = (_steps?: ThinkingStep[]) => 'thinking';

type RootStackParamList = {
  AstrologerClientChatScreen: {
    clientId: string;
    clientName: string;
    clients?: Api.User.Res.AstrologerClient[];
    initialView?: ClientView;
    initialComboTab?: ComboTab;
    predictionMode?: 'general' | 'personalized';
  };
  AstrologerChatHistoryScreen: {
    clientId: string;
    clientName: string;
  };
};

const SAMPLE_MESSAGES: ChatMessage[] = [];

const getClientInitials = (client: Api.User.Res.AstrologerClient) => {
  const first = client.first_name?.charAt(0) || '';
  const last = client.last_name?.charAt(0) || '';
  return `${first}${last}`.toUpperCase() || '?';
};

const getClientDisplayName = (client: Api.User.Res.AstrologerClient) =>
  client.full_name ||
  `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
  'Unknown Client';

const AstrologerClientChatScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AstrologerClientChatScreen'>>();
  const insets = useSafeAreaInsets();
  const { theme, colors } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.app.user);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef<TextInput>(null);
  const chatAbortRef = useRef<(() => void) | null>(null);
  const historyRequestIdRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);
  const lastLayoutRevisionRef = useRef(0);
  const prevMessageCountRef = useRef(0);
  const pendingChatScrollRef = useRef(false);
  const toolbarScrollRef = useRef<ScrollView | null>(null);
  const toolbarTabPositionsRef = useRef<Partial<Record<ClientView, number>>>({});
  const isFreshChatActiveRef = useRef(false);
  const streamStateRef = useRef<{
    buffers: Record<string, string>;
    rafIds: Record<string, number | null>;
    lastNodeUpdateAt: number;
  }>({
    buffers: {},
    rafIds: {},
    lastNodeUpdateAt: 0,
  });
  const userService = useMemo(() => new UserService(), []);
  const astrologerUserId = String(user?._id || '');

  const [activeView, setActiveView] = useState<ClientView>(() => {
    if (route.params?.initialView) {
      return route.params.initialView;
    }
    if (route.params?.predictionMode === 'personalized') {
      return 'personalized';
    }
    if (route.params?.predictionMode === 'general') {
      return 'combos';
    }
    return 'chat';
  });
  const [activeClientId, setActiveClientId] = useState(route.params?.clientId || '');
  const [activeClientName, setActiveClientName] = useState(route.params?.clientName || 'Client');
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_MESSAGES);
  const [conversationId, setConversationId] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingRevision, setTypingRevision] = useState(0);
  const [sidebarClients, setSidebarClients] = useState<Api.User.Res.AstrologerClient[]>(
    route.params?.clients ?? [],
  );
  const [transitLoading, setTransitLoading] = useState(false);
  const [transitChartSvg, setTransitChartSvg] = useState('');
  const [transitPlanetRows, setTransitPlanetRows] = useState<PlanetRow[]>(SAMPLE_TRANSIT_PLANETS);
  const [transitDate, setTransitDate] = useState(new Date());
  const [transitLocation, setTransitLocation] = useState('New Delhi, Delhi, India');
  const [transitLat, setTransitLat] = useState(28.6139298);
  const [transitLon, setTransitLon] = useState(77.2088282);
  const [transitTzone, setTransitTzone] = useState(5.5);
  const [showTransitEditModal, setShowTransitEditModal] = useState(false);
  const [showPlanLimitModal, setShowPlanLimitModal] = useState(false);
  const [showQuestionLimitConfirmModal, setShowQuestionLimitConfirmModal] = useState(false);
  const [showBuyQuestionsModal, setShowBuyQuestionsModal] = useState(false);
  const [showPersonalDetailsRequiredModal, setShowPersonalDetailsRequiredModal] =
    useState(false);
  const [showPaidPlanRequiredModal, setShowPaidPlanRequiredModal] =
    useState(false);
  const [memberDetails, setMemberDetails] =
    useState<Api.User.Res.AstrologerMemberDetailsResponse | null>(null);
  const [memberDetailsLoading, setMemberDetailsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const isKeyboardVisibleRef = useRef(false);
  const astrologerQuestionBalance = Math.max(
    0,
    Math.floor(Number((user as Record<string, unknown> | undefined)?.question_count ?? 0)),
  );

  const activeClient = useMemo(
    () => sidebarClients.find(c => String(c.id) === String(activeClientId)),
    [sidebarClients, activeClientId],
  );

  const isPaidPlan = useMemo(() => {
    const currentPlan = String(
      (user as Record<string, unknown> | null)?.current_plan ||
        (user as Record<string, unknown> | null)?.plan_name ||
        (user as Record<string, unknown> | null)?.plan ||
        '',
    )
      .toLowerCase()
      .trim();

    const isFree =
      !currentPlan ||
      currentPlan === 'free' ||
      currentPlan === 'basic' ||
      currentPlan.includes('free');

    const isSubActive =
      (user as Record<string, unknown> | null)?.is_paid === true ||
      (user as Record<string, unknown> | null)?.plan_status === 'active' ||
      (user as Record<string, unknown> | null)?.is_subscribed === true ||
      (!isFree && Boolean(currentPlan));

    return Boolean(isSubActive && !isFree);
  }, [user]);

  const handleViewPlans = useCallback(() => {
    setShowPaidPlanRequiredModal(false);
    (
      navigation as { navigate: (screen: string, params?: object) => void }
    ).navigate('AstrologerHome', {
      screen: 'PlanTab',
      params: { screen: 'AstrologerPlanScreen' },
    });
  }, [navigation]);

  const isPersonalizedActive = useMemo(() => {
    const clientRecord = (activeClient || memberDetails) as
      | (Api.User.Res.AstrologerClient & Record<string, unknown>)
      | (Api.User.Res.AstrologerMemberDetailsResponse & Record<string, unknown>)
      | undefined;
    if (!clientRecord) {
      return false;
    }
    return Boolean(
      clientRecord.personal_details ??
      clientRecord.personalizedDetails ??
      clientRecord.personalized_details ??
      clientRecord.is_personalized ??
      false,
    );
  }, [activeClient, memberDetails]);

  const parseMemberDashaPeriod = useCallback(
    (dashaObj?: Record<string, string[]>) => {
      if (!dashaObj) {
        return null;
      }
      const entries = Object.entries(dashaObj);
      if (!entries.length) {
        return null;
      }
      const [planet, ranges] = entries[0];
      return {
        planet,
        dateRange: String(ranges?.[0] || '')
          .replace(/\s+to\s+/i, ' → ')
          .replace(/\s*->\s*/g, ' → '),
      };
    },
    [],
  );

  const mahadashaPeriod = useMemo(
    () => parseMemberDashaPeriod(memberDetails?.dasha_result?.Mahadasha),
    [memberDetails?.dasha_result?.Mahadasha, parseMemberDashaPeriod],
  );
  const antardashaPeriod = useMemo(
    () => parseMemberDashaPeriod(memberDetails?.dasha_result?.Antardasha),
    [memberDetails?.dasha_result?.Antardasha, parseMemberDashaPeriod],
  );

  useEffect(() => {
    if (route.params?.initialView) {
      if (route.params.initialView === 'personalized') {
        if (!isPaidPlan) {
          setActiveView('combos');
          setShowPaidPlanRequiredModal(true);
        } else if (!isPersonalizedActive) {
          setActiveView('combos');
          setShowPersonalDetailsRequiredModal(true);
        } else {
          setActiveView('personalized');
        }
      } else {
        setActiveView(route.params.initialView);
      }
    } else if (route.params?.predictionMode) {
      if (route.params.predictionMode === 'personalized') {
        if (!isPersonalizedActive) {
          setActiveView('combos');
          setShowPersonalDetailsRequiredModal(true);
        } else {
          setActiveView('personalized');
        }
      } else {
        setActiveView('combos');
      }
    }
  }, [
    route.params?.clientId,
    route.params?.initialView,
    route.params?.predictionMode,
    isPersonalizedActive,
  ]);

  useEffect(() => {
    const streamState = streamStateRef.current;
    return () => {
      chatAbortRef.current?.();
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
      Object.values(streamState.rafIds).forEach(rafId => {
        if (rafId != null) {
          cancelAnimationFrame(rafId);
        }
      });
    };
  }, []);

  const scrollToBottom = useCallback((animated = true) => {
    if (scrollRafRef.current != null) {
      cancelAnimationFrame(scrollRafRef.current);
    }

    scrollRafRef.current = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
      scrollRafRef.current = null;
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      isKeyboardVisibleRef.current = true;
      setIsKeyboardVisible(true);
      scrollToBottom(false);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      isKeyboardVisibleRef.current = false;
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollToBottom]);

  // Scroll when a new message is added — retry after layout so thinking stays in view.
  useEffect(() => {
    if (messages.length === prevMessageCountRef.current) {
      return;
    }
    prevMessageCountRef.current = messages.length;
    pendingChatScrollRef.current = true;
    scrollToBottom(false);

    const retryTimeoutId = setTimeout(() => {
      scrollToBottom(true);
    }, 120);
    const clearPendingTimeoutId = setTimeout(() => {
      pendingChatScrollRef.current = false;
    }, 500);

    return () => {
      clearTimeout(retryTimeoutId);
      clearTimeout(clearPendingTimeoutId);
    };
  }, [messages.length, scrollToBottom]);

  // Chat FlatList unmounts on other tabs — scroll to bottom when returning to Chat.
  useEffect(() => {
    if (activeView !== 'chat') {
      pendingChatScrollRef.current = false;
      return;
    }

    pendingChatScrollRef.current = true;
    const scrollTimeoutId = setTimeout(() => {
      scrollToBottom(false);
    }, 150);
    const clearPendingTimeoutId = setTimeout(() => {
      pendingChatScrollRef.current = false;
    }, 500);

    return () => {
      clearTimeout(scrollTimeoutId);
      clearTimeout(clearPendingTimeoutId);
    };
  }, [activeView, scrollToBottom]);

  const astrologerId = user?._id || '';
  const astrologerPlanDisplayName = useMemo(
    () =>
      getAstrologerPlanDisplayName(
        (user as { current_plan?: string } | null)?.current_plan,
      ),
    [user],
  );

  const handleUpgradePlan = useCallback(() => {
    setShowPlanLimitModal(false);
    (
      navigation as { navigate: (screen: string, params?: object) => void }
    ).navigate('AstrologerHome', {
      screen: 'PlanTab',
      params: { screen: 'AstrologerPlanScreen' },
    });
  }, [navigation]);

  const refreshQuestionBalance = useCallback(async () => {
    if (!astrologerUserId) {
      return;
    }

    try {
      const response = await userService.getAstrologerClients(astrologerUserId, 0, 10);
      const incoming = response?.data?.user_details as Record<string, unknown> | undefined;
      if (!response.status || !incoming) {
        return;
      }

      const mergedUser = mergeUserProfile(
        user,
        incoming,
      ) as unknown as Api.User.Res.Detail;
      dispatch(setUser(mergedUser));
      await AsyncStorage.setItem('USER_DATA', JSON.stringify(mergedUser));
    } catch {
      // Keep the current balance if refresh fails.
    }
  }, [astrologerUserId, dispatch, user, userService]);

  const handleBuyQuestionsPress = useCallback(() => {
    setShowQuestionLimitConfirmModal(true);
  }, []);

  const handleConfirmOpenBuyQuestions = useCallback(() => {
    setShowQuestionLimitConfirmModal(false);
    setShowBuyQuestionsModal(true);
  }, []);

  const handleBuyQuestionsSuccess = useCallback(async () => {
    setMessages(prev =>
      prev.filter(
        message =>
          message.type !== 'assistant' ||
          !isNoQuestionsRemainingMessage(message.errorText),
      ),
    );
    await refreshQuestionBalance();
  }, [refreshQuestionBalance]);

  const updateAssistantMessage = useCallback(
    (messageId: string, updater: (message: Extract<ChatMessage, { type: 'assistant' }>) => Extract<ChatMessage, { type: 'assistant' }>) => {
      setMessages(prev =>
        prev.map(item => {
          if (item.id !== messageId || item.type !== 'assistant') {
            return item;
          }
          return updater(item);
        }),
      );
    },
    [],
  );

  const clearStreamingBuffer = useCallback((messageId: string) => {
    delete streamStateRef.current.buffers[messageId];
    const rafId = streamStateRef.current.rafIds[messageId];
    if (rafId != null) {
      cancelAnimationFrame(rafId);
    }
    delete streamStateRef.current.rafIds[messageId];
  }, []);

  const flushStreamingText = useCallback(
    (messageId: string) => {
      const text = streamStateRef.current.buffers[messageId] || '';
      updateAssistantMessage(messageId, message => ({
        ...message,
        // Keep thinking until first content arrives — avoids empty/blank card flash.
        showThinking: text.trim().length === 0 ? message.showThinking !== false : false,
        isStreaming: true,
        streamingText: text,
      }));
    },
    [updateAssistantMessage],
  );

  const scheduleStreamingFlush = useCallback(
    (messageId: string) => {
      if (streamStateRef.current.rafIds[messageId] != null) {
        return;
      }

      streamStateRef.current.rafIds[messageId] = requestAnimationFrame(() => {
        streamStateRef.current.rafIds[messageId] = null;
        flushStreamingText(messageId);
      });
    },
    [flushStreamingText],
  );

  const appendStreamingDelta = useCallback(
    (messageId: string, delta: string) => {
      streamStateRef.current.buffers[messageId] =
        `${streamStateRef.current.buffers[messageId] || ''}${delta}`;
      scheduleStreamingFlush(messageId);
    },
    [scheduleStreamingFlush],
  );

  const applyNodeUpdate = useCallback(
    (messageId: string, node: string, status: string) => {
      updateAssistantMessage(messageId, message => {
        const label = CHAT_NODE_LABELS[node] || node;
        let steps = [...(message.thinkingSteps || INITIAL_THINKING_STEPS)];
        const existingIndex = steps.findIndex(step => step.id === node);

        if (existingIndex === -1) {
          steps.push({
            id: node,
            label,
            status: status === 'completed' ? 'completed' : 'running',
          });
        } else {
          steps[existingIndex] = {
            ...steps[existingIndex],
            label,
            status: status === 'completed' ? 'completed' : 'running',
          };
        }

        const activeNodeIndex = CHAT_NODE_ORDER.indexOf(node);
        steps = steps.map(step => {
          const stepIndex = CHAT_NODE_ORDER.indexOf(step.id);
          if (stepIndex >= 0 && activeNodeIndex >= 0 && stepIndex < activeNodeIndex) {
            return { ...step, status: 'completed' };
          }
          return step;
        });

        return {
          ...message,
          showThinking: true,
          thinkingSteps: steps,
        };
      });
    },
    [updateAssistantMessage],
  );

  const finalizeAssistantMessage = useCallback(
    (messageId: string, finalData: AstrologerChatFinalData) => {
      const answer =
        finalData.answer || streamStateRef.current.buffers[messageId] || '';
      clearStreamingBuffer(messageId);
      const parsed = answer ? parseMarkdownAnswer(answer) : null;

      updateAssistantMessage(messageId, message => ({
        ...message,
        title: finalData.title || parsed?.title || message.title || '',
        streamingText: answer || undefined,
        showThinking: false,
        isStreaming: Boolean(answer),
        sections: parsed?.sections || message.sections,
        thinkingSteps: message.thinkingSteps?.map(step => ({
          ...step,
          status: 'completed' as const,
        })),
      }));

      if (finalData.conversation_id) {
        setConversationId(finalData.conversation_id);
        if (activeClientId) {
          setAstrologerFreshChatConversationId(
            activeClientId,
            finalData.conversation_id,
          );
        }
      }
    },
    [activeClientId, clearStreamingBuffer, updateAssistantMessage],
  );

  const handleTypewriterProgress = useCallback(() => {
    const now = Date.now();

    if (now - lastLayoutRevisionRef.current >= 100) {
      lastLayoutRevisionRef.current = now;
      setTypingRevision(revision => revision + 1);
    }
  }, []);

  const handleTypewriterComplete = useCallback(
    (messageId: string) => {
      updateAssistantMessage(messageId, message => {
        if (!message.isStreaming) {
          return message;
        }
        return {
          ...message,
          isStreaming: false,
          // Keep text visible until structured sections are ready — no blank gap.
          streamingText: message.sections?.length ? undefined : message.streamingText,
        };
      });
    },
    [updateAssistantMessage],
  );

  useEffect(() => {
    if (sidebarClients.length > 0) {
      return;
    }

    let isMounted = true;

    const loadClients = async () => {
      try {
        const userId = user?._id;
        if (!userId) {
          return;
        }

        const response = await userService.getAstrologerClients(userId, 0, 50);
        if (isMounted && response.status && response.data) {
          setSidebarClients(response.data.data || []);
        }
      } catch {
        // Sidebar stays empty if fetch fails.
      }
    };

    loadClients();

    return () => {
      isMounted = false;
    };
  }, [sidebarClients.length, user?._id, userService]);

  const filteredSidebarClients = useMemo(() => {
    const query = sidebarSearch.trim().toLowerCase();
    if (!query) {
      return sidebarClients;
    }
    return sidebarClients.filter(client => {
      const name = getClientDisplayName(client).toLowerCase();
      return name.includes(query);
    });
  }, [sidebarClients, sidebarSearch]);

  const openSidebar = () => setShowSidebar(true);
  const closeSidebar = () => {
    setShowSidebar(false);
    setSidebarSearch('');
  };

  const handleBackPress = useCallback(() => {
    if (showSidebar) {
      closeSidebar();
      return;
    }
    navigation.goBack();
  }, [showSidebar, navigation]);

  useEffect(() => {
    const onHardwareBackPress = () => {
      if (showSidebar) {
        closeSidebar();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBackPress,
    );
    return () => subscription.remove();
  }, [showSidebar]);

  const handleSelectClient = (client: Api.User.Res.AstrologerClient) => {
    chatAbortRef.current?.();
    chatAbortRef.current = null;
    streamStateRef.current.buffers = {};
    Object.values(streamStateRef.current.rafIds).forEach(rafId => {
      if (rafId != null) {
        cancelAnimationFrame(rafId);
      }
    });
    streamStateRef.current.rafIds = {};
    setIsSending(false);
    setActiveClientId(client.id);
    setActiveClientName(getClientDisplayName(client));
    setTransitChartSvg('');
    closeSidebar();
    setTimeout(() => scrollToBottom(false), 100);
  };

  const loadChatHistory = useCallback(
    async (clientId: string) => {
      if (!clientId) {
        return;
      }

      // Keep the empty New Chat until user leaves this screen.
      if (isFreshChatActiveRef.current) {
        setHistoryLoading(false);
        return;
      }

      const requestId = ++historyRequestIdRef.current;

      chatAbortRef.current?.();
      chatAbortRef.current = null;
      setIsSending(false);
      streamStateRef.current.buffers = {};
      Object.values(streamStateRef.current.rafIds).forEach(rafId => {
        if (rafId != null) {
          cancelAnimationFrame(rafId);
        }
      });
      streamStateRef.current.rafIds = {};

      setHistoryLoading(true);
      setMessages([]);
      setConversationId('');

      try {
        const response = await userService.getAstrologerChatHistory(clientId);
        if (requestId !== historyRequestIdRef.current || isFreshChatActiveRef.current) {
          return;
        }

        if (response?.data?.length) {
          setMessages(mapChatHistoryToMessages(response.data));
          const latest = [...response.data].sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )[0];
          setConversationId(latest?.conversation_id || '');
        }
      } catch {
        if (requestId !== historyRequestIdRef.current || isFreshChatActiveRef.current) {
          return;
        }
        setMessages([]);
        setConversationId('');
      } finally {
        if (requestId === historyRequestIdRef.current) {
          setHistoryLoading(false);
        }
      }
    },
    [userService],
  );

  useFocusEffect(
    useCallback(() => {
      // Returning to this screen always restores old full history.
      isFreshChatActiveRef.current = false;
      if (activeClientId) {
        loadChatHistory(activeClientId);
      }

      return () => {
        // Leaving the screen ends New Chat mode for the next visit.
        isFreshChatActiveRef.current = false;
      };
    }, [activeClientId, loadChatHistory]),
  );

  const handleStartNewChat = useCallback(async () => {
    if (!activeClientId || isSending) {
      return;
    }

    // Invalidate any in-flight history fetch before starting fresh chat.
    historyRequestIdRef.current += 1;
    isFreshChatActiveRef.current = true;

    await startAstrologerFreshChatSession(activeClientId);

    chatAbortRef.current?.();
    chatAbortRef.current = null;
    streamStateRef.current.buffers = {};
    Object.values(streamStateRef.current.rafIds).forEach(rafId => {
      if (rafId != null) {
        cancelAnimationFrame(rafId);
      }
    });
    streamStateRef.current.rafIds = {};

    setActiveView('chat');
    setIsSending(false);
    setHistoryLoading(false);
    setInputText('');
    setMessages([]);
    setConversationId('');
    setTypingRevision(prev => prev + 1);

    Toast.show({
      type: 'success',
      text1: 'New Chat',
      text2: 'Started a fresh chat for this client.',
    });
  }, [activeClientId, isSending]);

  const openChatHistory = useCallback(() => {
    if (!activeClientId) {
      return;
    }
    navigation.navigate('AstrologerChatHistoryScreen', {
      clientId: activeClientId,
      clientName: activeClientName,
    });
  }, [activeClientId, activeClientName, navigation]);

  const loadMemberDetails = useCallback(
    async (clientId: string) => {
      if (!clientId) {
        setMemberDetails(null);
        return;
      }

      setMemberDetailsLoading(true);
      try {
        const response = await userService.getAstrologerMemberDetails(clientId);
        setMemberDetails(response);
        const name =
          `${response.birth_details?.first_name || ''} ${response.birth_details?.last_name || ''}`.trim();
        if (name) {
          setActiveClientName(name);
        }
      } catch {
        setMemberDetails(null);
      } finally {
        setMemberDetailsLoading(false);
      }
    },
    [userService],
  );

  useEffect(() => {
    loadMemberDetails(activeClientId);
  }, [activeClientId, loadMemberDetails]);

  const handleOpenCharts = useCallback(() => {
    if (!activeClientId) {
      return;
    }

    (
      navigation as { navigate: (screen: string, params?: object) => void }
    ).navigate('AstrologerClientChartScreen', {
      clientId: activeClientId,
      clientName: activeClientName,
      clients: sidebarClients,
    });
  }, [navigation, activeClientId, activeClientName, sidebarClients]);

  const handleCheckTransitCombo = useCallback(() => {
    setActiveView('combos');
  }, []);

  const applyTransitResponse = useCallback((chartData: TransitChartData) => {
    const svg = String(chartData.Current_tansit || '');
    const positions = chartData.Current_tansit_planets_positions;
    const apiBirthplace = chartData.date_place?.[0]?.birthplace;
    const parsedDate = parseTransitDateFromApi(apiBirthplace);

    setTransitChartSvg(svg);

    if (parsedDate) {
      setTransitDate(parsedDate);
    }

    if (apiBirthplace?.place) {
      setTransitLocation(String(apiBirthplace.place));
    }

    if (apiBirthplace?.lat != null) {
      setTransitLat(apiBirthplace.lat);
    }

    if (apiBirthplace?.lon != null) {
      setTransitLon(apiBirthplace.lon);
    }

    if (apiBirthplace?.tzone != null) {
      setTransitTzone(apiBirthplace.tzone);
    }

    setTransitPlanetRows(mapTransitPlanetRows(positions));
  }, []);

  const getDefaultTransitPayload = useCallback((): TransitEditPayload => {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      hour: now.getHours(),
      min: now.getMinutes(),
      birthplace: activeClient?.birthplace || 'New Delhi, Delhi, India',
      lat: activeClient?.birth_data?.lat ?? 28.6139298,
      lon: activeClient?.birth_data?.lon ?? 77.2088282,
      tzone: activeClient?.birth_data?.tzone ?? 5.5,
    };
  }, [activeClient]);

  const fetchTransitChart = useCallback(
    async (payload?: TransitEditPayload, persistToSession = false) => {
      if (!activeClientId) {
        return;
      }

      setTransitLoading(true);

      try {
        const response = await userService.createAstrologerCurrentTransit(
          payload ?? getDefaultTransitPayload(),
        );

        console.log('response--->1160', response);

        if (response?.data) {
          applyTransitResponse(response.data as TransitChartData);
          if (persistToSession && astrologerUserId) {
            await saveAstrologerCurrentTransitSession(astrologerUserId, response.data);
          }
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        setTransitChartSvg('');
        setTransitPlanetRows(SAMPLE_TRANSIT_PLANETS);
        Toast.show({
          type: 'error',
          text1: 'Failed to update transit',
          text2: err.message || 'Please try again.',
        });
      } finally {
        setTransitLoading(false);
      }
    },
    [
      activeClientId,
      applyTransitResponse,
      astrologerUserId,
      getDefaultTransitPayload,
      userService,
    ],
  );

  const loadTransitChart = useCallback(async () => {
    if (!activeClientId) {
      return;
    }

    if (astrologerUserId) {
      const session = await getAstrologerCurrentTransitSession(astrologerUserId);
      if (session?.chartData) {
        applyTransitResponse(session.chartData as TransitChartData);
        return;
      }
    }

    await fetchTransitChart(getDefaultTransitPayload(), false);
  }, [
    activeClientId,
    applyTransitResponse,
    astrologerUserId,
    fetchTransitChart,
    getDefaultTransitPayload,
  ]);

  useEffect(() => {
    if (activeView === 'transit') {
      loadTransitChart();
    }
  }, [activeView, activeClientId, loadTransitChart]);

  const handleEditTransitDetails = () => {
    setShowTransitEditModal(true);
  };

  const handleTransitEditSave = (payload: TransitEditPayload) => {
    setShowTransitEditModal(false);
    fetchTransitChart(payload, true);
  };

  const screenBottomInset = useMemo(
    () =>
      resolveBottomSafeInset(insets.bottom, {
        keyboardVisible: isKeyboardVisible,
      }),
    [insets.bottom, isKeyboardVisible],
  );

  const inputBottomPadding = useMemo(() => {
    if (isKeyboardVisible) {
      return responsiveWidth('2');
    }

    // Screen already applies bottom safe inset on the root container.
    return responsiveWidth('2');
  }, [isKeyboardVisible]);

  const palette = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      isDark,
      screenBg: isDark ? '#202945' : '#F3F4F6',
      topHeaderBg: isDark ? '#2A3F58' : '#FFFFFF',
      topHeaderBorder: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB',
      toolbarBg: isDark ? '#2A3F58' : '#FFFFFF',
      toolbarBorder: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB',
      textPrimary: isDark ? colors.themeTextWhite : NAVY,
      textMuted: isDark ? '#B8B0A0' : '#9CA3AF',
      userBubbleBg: NAVY,
      assistantCardBg: isDark ? '#2A3F58' : '#FFFFFF',
      assistantCardBorder: isDark ? 'rgba(238, 229, 202, 0.22)' : '#E5E7EB',
      inputBarBg: isDark ? '#2A3F58' : '#FFFFFF',
      inputBg: isDark ? '#354D6A' : '#FFFFFF',
      inputBorder: isDark ? 'rgba(255,255,255,0.12)' : '#D1D5DB',
      iconGroupBg: isDark ? '#354D6A' : '#F3F4F6',
      sendBtnBg: isDark ? '#4B6280' : '#B8C4D4',
      sendBtnActiveBg: NAVY,
      sidebarBg: isDark ? '#0F1E33' : '#FFFFFF',
      sidebarBorder: isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB',
      sidebarInputBg: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
      sidebarBtnBg: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
      sidebarAvatarBg: isDark ? '#2A4365' : '#EEF4FB',
      sidebarAvatarText: isDark ? '#FFFFFF' : NAVY,
      sidebarSelectedBg: isDark ? 'rgba(197, 163, 112, 0.08)' : 'rgba(197, 163, 112, 0.12)',
      sidebarOverlayBg: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.3)',
    };
  }, [theme, colors]);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    if (isSending || historyLoading) {
      return;
    }
    setInputText(suggestion);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [historyLoading, isSending]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) {
      return;
    }

    if (!activeClientId) {
      return;
    }

    if (!astrologerId) {
      return;
    }

    const userMessageId = `${Date.now()}-user`;
    const assistantMessageId = `${Date.now()}-assistant`;

    setMessages(prev => [
      ...prev,
      {
        id: userMessageId,
        type: 'user',
        text: trimmed,
        timeLabel: getCurrentTimeLabel(),
      },
      {
        id: assistantMessageId,
        type: 'assistant',
        timeLabel: getCurrentTimeLabel(),
        title: '',
        showThinking: true,
        thinkingSteps: INITIAL_THINKING_STEPS.map((step, index) => ({
          ...step,
          status: index === 0 ? 'running' : 'idle',
        })),
        isStreaming: true,
        streamingText: '',
      },
    ]);
    setInputText('');
    setIsSending(true);
    pendingChatScrollRef.current = true;
    setTimeout(() => scrollToBottom(true), 90);
    setTimeout(() => scrollToBottom(true), 230);

    chatAbortRef.current?.();
    chatAbortRef.current = await streamAstrologerChat(
      {
        user_id: activeClientId,
        astrologer_id: astrologerId,
        // inr_budget: astrologerInrBudget,
        question: trimmed,
        conversation_id: conversationId,
      },
      {
        onNodeUpdate: (node, status) => {
          const now = Date.now();
          if (status !== 'completed' && now - streamStateRef.current.lastNodeUpdateAt < 150) {
            return;
          }
          streamStateRef.current.lastNodeUpdateAt = now;
          applyNodeUpdate(assistantMessageId, node, status);
        },
        onAnswerToken: delta => {
          appendStreamingDelta(assistantMessageId, delta);
        },
        onFinal: finalData => {
          finalizeAssistantMessage(assistantMessageId, finalData);
        },
        onError: error => {
          clearStreamingBuffer(assistantMessageId);
          if (isAstrologerTokenLimitError(error.message)) {
            setShowPlanLimitModal(true);
          }
          updateAssistantMessage(assistantMessageId, message => ({
            ...message,
            showThinking: false,
            isStreaming: false,
            title: '',
            errorText: error.message,
          }));
        },
        onDone: () => {
          setIsSending(false);
          chatAbortRef.current = null;
        },
      },
    );
  };

  const renderSection = (section: ChatSection, index: number, messageId: string) => (
    <View key={`${messageId}-section-${index}`} style={styles.sectionBlock}>
      {section.heading ? (
        <FormattedMarkdownText
          text={section.heading}
          color={palette.textPrimary}
          style={styles.sectionHeading}
        />
      ) : null}
      {section.paragraph ? (
        <FormattedMarkdownText
          text={section.paragraph}
          color={palette.textPrimary}
          style={styles.paragraphText}
        />
      ) : null}
      {section.bullets?.map((bullet, bulletIndex) => (
        <View key={`${messageId}-bullet-${bulletIndex}`} style={styles.bulletRow}>
          <Text style={[styles.bulletDot, { color: palette.textPrimary }]}>•</Text>
          <FormattedMarkdownText
            text={bullet}
            color={palette.textPrimary}
            style={styles.bulletText}
          />
        </View>
      ))}
    </View>
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.type === 'user') {
      return (
        <View style={styles.userMessageWrap}>
          <Text style={[styles.timeLabel, { color: palette.textMuted }]}>{item.timeLabel}</Text>
          <View style={[styles.userBubble, { backgroundColor: palette.userBubbleBg }]}>
            <Text style={styles.userBubbleText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    const hasStructuredSections = Boolean(item.sections?.length && !item.isStreaming);
    // Keep streamed text on screen even after typing ends if sections aren't ready yet.
    const showStreamingAnswer =
      Boolean(item.streamingText) && !hasStructuredSections;
    const isWaitingForStream =
      Boolean(item.isStreaming) && !item.streamingText && !item.errorText;
    const hasRichContent = hasStructuredSections || showStreamingAnswer;
    const isThinkingOnly =
      (Boolean(item.showThinking) || isWaitingForStream) &&
      !hasRichContent &&
      !item.errorText;

    if (isThinkingOnly) {
      return (
        <View style={styles.assistantMessageWrap}>
          <Text style={[styles.timeLabel, { color: palette.textMuted }]}>{item.timeLabel}</Text>
          <View style={styles.assistantRow}>
            <View style={styles.botAvatar}>
              <Image
                source={require('../../assets/icons/ic_launcher.png')}
                style={styles.botAvatarIcon}
              />
            </View>
            <View
              style={[
                styles.compactAssistantBubble,
                {
                  backgroundColor: palette.assistantCardBg,
                  borderColor: palette.assistantCardBorder,
                },
              ]}
            >
              <View style={styles.thinkingBubbleContent}>
                <ActivityIndicator size="small" color={palette.textMuted} />
                <Text style={[styles.thinkingBubbleText, { color: palette.textMuted }]}>
                  {getActiveThinkingLabel(item.thinkingSteps)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    const showBuyQuestionsAction = isNoQuestionsRemainingMessage(item.errorText);

    if (item.errorText && !hasRichContent) {
      return (
        <View style={styles.assistantMessageWrap}>
          <Text style={[styles.timeLabel, { color: palette.textMuted }]}>{item.timeLabel}</Text>
          <View style={styles.assistantRow}>
            <View style={styles.botAvatar}>
              <Image
                source={require('../../assets/icons/ic_launcher.png')}
                style={styles.botAvatarIcon}
              />
            </View>
            <View
              style={[
                styles.compactAssistantBubble,
                {
                  backgroundColor: palette.assistantCardBg,
                  borderColor: palette.assistantCardBorder,
                },
              ]}
            >
              <Text style={[styles.errorText, { color: '#EF4444' }]}>{item.errorText}</Text>
              {showBuyQuestionsAction ? (
                <TouchableOpacity
                  style={styles.buyQuestionsInlineBtn}
                  onPress={handleBuyQuestionsPress}
                  activeOpacity={0.85}
                >
                  <Text style={styles.buyQuestionsInlineBtnText}>Buy Questions</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.assistantMessageWrap}>
        <Text style={[styles.timeLabel, { color: palette.textMuted }]}>{item.timeLabel}</Text>
        <View style={styles.assistantRow}>
          <View style={styles.botAvatar}>
            <Image
              source={require('../../assets/icons/ic_launcher.png')}
              style={styles.botAvatarIcon}
            />
          </View>
          <View
            style={[
              styles.assistantCard,
              {
                backgroundColor: palette.assistantCardBg,
                borderColor: palette.assistantCardBorder,
              },
            ]}
          >
            <View style={[styles.assistantAccent, { backgroundColor: GOLD }]} />
            <View style={styles.assistantContent}>
              {item.errorText ? (
                <>
                  <Text style={[styles.errorText, { color: '#EF4444' }]}>{item.errorText}</Text>
                  {showBuyQuestionsAction ? (
                    <TouchableOpacity
                      style={styles.buyQuestionsInlineBtn}
                      onPress={handleBuyQuestionsPress}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.buyQuestionsInlineBtnText}>Buy Questions</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : null}

              {showStreamingAnswer ? (
                <StreamingMarkdownAnswer
                  text={item.streamingText || ''}
                  active={Boolean(item.isStreaming)}
                  textColor={palette.textPrimary}
                  onProgress={handleTypewriterProgress}
                  onComplete={
                    item.sections?.length
                      ? () => handleTypewriterComplete(item.id)
                      : undefined
                  }
                />
              ) : null}

              {hasStructuredSections
                ? item.sections?.map((section, index) => renderSection(section, index, item.id))
                : null}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const inactivePillBorder = palette.isDark ? 'rgba(255,255,255,0.35)' : NAVY;
  const inactivePillColor = palette.isDark ? '#FFFFFF' : NAVY;

  const scrollActiveToolbarTabIntoView = useCallback((view: ClientView) => {
    const tabX = toolbarTabPositionsRef.current[view];
    if (tabX == null) {
      return;
    }
    toolbarScrollRef.current?.scrollTo({
      x: Math.max(0, tabX - 8),
      animated: true,
    });
  }, []);

  useEffect(() => {
    scrollActiveToolbarTabIntoView(activeView);
  }, [activeView, scrollActiveToolbarTabIntoView]);

  const renderViewPill = (
    view: ClientView,
    label: string,
    icon?: React.ReactNode,
    onCustomPress?: () => void,
  ) => {
    const isActive = activeView === view;
    const activeBg = NAVY;

    if (isActive) {
      return (
        <View
          onLayout={event => {
            toolbarTabPositionsRef.current[view] = event.nativeEvent.layout.x;
            scrollActiveToolbarTabIntoView(view);
          }}
        >
          <View style={[styles.toolbarPill, styles.toolbarPillActive, { backgroundColor: activeBg }]}>
            {icon}
            <Text style={styles.toolbarPillTextActive}>{label}</Text>
          </View>
        </View>
      );
    }

    return (
      <View
        onLayout={event => {
          toolbarTabPositionsRef.current[view] = event.nativeEvent.layout.x;
        }}
      >
        <TouchableOpacity
          style={[styles.toolbarPill, styles.toolbarPillInactive, { borderColor: inactivePillBorder }]}
          onPress={() => {
            if (onCustomPress) {
              onCustomPress();
            } else {
              setActiveView(view);
            }
          }}
          activeOpacity={0.85}
        >
          {icon}
          <Text style={[styles.toolbarPillTextInactive, { color: inactivePillColor }]}>{label}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderVedicContent = () => (
    <ScrollView
      style={[styles.panelScroll, { backgroundColor: palette.screenBg }]}
      contentContainerStyle={styles.panelScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {activeClientId ? (
        <AstrologerVedicCharts
          key={activeClientId}
          clientId={activeClientId}
          cardBg={palette.toolbarBg}
          cardBorder={palette.toolbarBorder}
          textPrimary={palette.textPrimary}
          textMuted={palette.textMuted}
        />
      ) : (
        <View style={[styles.panelCard, { backgroundColor: palette.toolbarBg, borderColor: palette.toolbarBorder }]}>
          <Text style={[styles.panelEmptyText, { color: palette.textMuted }]}>
            Select a chart to view Vedic charts
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderTransitContent = () => (
    <ScrollView
      style={[styles.panelScroll, { backgroundColor: palette.screenBg }]}
      contentContainerStyle={styles.panelScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.transitChartCard,
          {
            backgroundColor: palette.toolbarBg,
            borderColor: palette.toolbarBorder,
          },
        ]}
      >
        {transitLoading ? (
          <View style={[styles.panelLoading, styles.transitChartLoading]}>
            <ActivityIndicator size="large" color={NAVY} />
          </View>
        ) : transitChartSvg ? (
          <View
            style={[
              styles.transitChartWrap,
              {
                width: TRANSIT_CHART_SIZE,
                minHeight: TRANSIT_CHART_SIZE,
              },
            ]}
          >
            <SvgXml
              xml={transitChartSvg}
              width={TRANSIT_CHART_RENDER_SIZE}
              height={TRANSIT_CHART_RENDER_SIZE}
              preserveAspectRatio="xMidYMid meet"
              viewBox="0 0 350 350"
            />
          </View>
        ) : (
          <View style={[styles.panelLoading, styles.transitChartLoading]}>
            <Text style={[styles.panelEmptyText, { color: palette.textMuted }]}>
              Transit chart unavailable
            </Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.transitSettingsCard,
          {
            backgroundColor: palette.toolbarBg,
            borderColor: palette.toolbarBorder,
          },
        ]}
      >
        <View style={styles.transitSettingsHeader}>
          <View style={styles.transitSettingsTitleRow}>
            <Text style={styles.transitSettingsIcon}>📅</Text>
            <Text style={[styles.transitSettingsTitle, { color: palette.textPrimary }]}>
              Transit Settings
            </Text>
          </View>
          <TouchableOpacity onPress={handleEditTransitDetails} activeOpacity={0.8}>
            <Text style={styles.transitEditText}>✎ Edit Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.transitMetaRow}>
          <Text style={[styles.transitMetaText, { color: palette.textMuted }]}>
            🕒 {formatTransitDate(transitDate)}
          </Text>
          <Text style={[styles.transitMetaText, { color: palette.textMuted }]}>
            {formatTransitTime(transitDate)}
          </Text>
        </View>
        <Text style={[styles.transitMetaText, { color: palette.textMuted }]}>
          📍 {transitLocation}
        </Text>
      </View>

      <View style={[styles.transitTableCard, { borderColor: palette.toolbarBorder }]}>
        <View style={styles.transitTableHeader}>
          <Text style={[styles.transitTableHeaderCell, styles.transitPlanetCol]}>PLANET</Text>
          <Text style={[styles.transitTableHeaderCell, styles.transitSignCol]}>SIGN</Text>
          <Text style={[styles.transitTableHeaderCell, styles.transitDegreeCol]}>DEGREE</Text>
          <Text style={[styles.transitTableHeaderCell, styles.transitNakshatraCol]}>NAKSHATRA</Text>
        </View>
        {transitPlanetRows.map((row, index) => (
          <View
            key={`${row.planet}-${index}`}
            style={[
              styles.transitTableRow,
              { borderTopColor: palette.toolbarBorder },
              index % 2 === 1 && styles.transitTableRowAlt,
            ]}
          >
            <Text style={[styles.transitTableCell, styles.transitPlanetCol, { color: palette.textPrimary }]}>
              {row.planet}
            </Text>
            <Text style={[styles.transitTableCell, styles.transitSignCol, { color: palette.textPrimary }]}>
              {row.sign}
            </Text>
            <Text style={[styles.transitTableCell, styles.transitDegreeCol, { color: palette.textPrimary }]}>
              {row.degree}
            </Text>
            <Text
              style={[styles.transitTableCell, styles.transitNakshatraCol, { color: palette.textPrimary }]}
              numberOfLines={1}
            >
              {row.nakshatra}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderToolbarTabs = () => (
    <View
      style={[
        styles.toolbarCard,
        {
          backgroundColor: palette.toolbarBg,
          borderColor: palette.toolbarBorder,
        },
      ]}
    >
      <ScrollView
        ref={toolbarScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolbarRight}
      >
        {renderViewPill(
          'chat',
          'Chat',
          <Image
            source={require('../../assets/icons/Chat-inactive.png')}
            style={
              activeView === 'chat'
                ? styles.toolbarPillIconActive
                : [styles.toolbarPillIconInactive, { tintColor: inactivePillColor }]
            }
          />,
        )}

        {renderViewPill(
          'combos',
          'General Predictions',
          <Text
            style={[
              styles.combosListIcon,
              { color: activeView === 'combos' ? '#FFFFFF' : inactivePillColor },
            ]}
          >
            🪐
          </Text>,
        )}

        {renderViewPill(
          'personalized',
          'Personalized Predictions',
          <Text
            style={[
              styles.combosListIcon,
              { color: activeView === 'personalized' ? '#FFFFFF' : inactivePillColor },
            ]}
          >
            {!isPaidPlan || !isPersonalizedActive ? '🔒' : '👤'}
          </Text>,
          !isPaidPlan
            ? () => setShowPaidPlanRequiredModal(true)
            : !isPersonalizedActive
            ? () => setShowPersonalDetailsRequiredModal(true)
            : undefined,
        )}

        {renderViewPill(
          'transit',
          'Transit',
          <Text
            style={[
              styles.transitSunIconInactive,
              { color: activeView === 'transit' ? '#FFFFFF' : inactivePillColor },
            ]}
          >
            ☀
          </Text>,
        )}

        {renderViewPill(
          'vedic',
          'Charts',
          <Image
            source={require('../../assets/icons/home/Chart.png')}
            style={
              activeView === 'vedic'
                ? [styles.toolbarPillIconActive, { tintColor: '#FFFFFF' }]
                : [styles.toolbarPillIconInactive, { tintColor: inactivePillColor }]
            }
          />,
        )}

        <TouchableOpacity
          style={[
            styles.toolbarPill,
            styles.toolbarPillInactive,
            { borderColor: inactivePillBorder },
          ]}
          onPress={openChatHistory}
          activeOpacity={0.85}
        >
          <Image
            source={require('../../assets/icons/history.png')}
            style={[styles.toolbarPillIconInactive, { tintColor: inactivePillColor }]}
          />
          <Text style={[styles.toolbarPillTextInactive, { color: inactivePillColor }]}>
            History
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderMemberHeader = () => (
    <AstrologerChatMemberHeader
      loading={memberDetailsLoading}
      memberDetails={memberDetails}
      fallbackName={activeClientName}
      isDark={palette.isDark}
      borderColor={palette.topHeaderBorder}
      backgroundColor={palette.topHeaderBg}
      onOpenSidebar={openSidebar}
      onOpenCharts={handleOpenCharts}
      onCheckTransitCombo={handleCheckTransitCombo}
    />
  );

  const renderCombosContent = () => (
    <ScrollView
      style={[styles.panelScroll, { backgroundColor: palette.screenBg }]}
      contentContainerStyle={styles.combosPanelContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {renderMemberHeader()}
      {renderToolbarTabs()}
      <View style={styles.combosPanelInner}>
        {activeClientId ? (
          <AstrologerCombos
            key={`${activeClientId}-${activeView}`}
            clientId={activeClientId}
            cardBg={palette.toolbarBg}
            cardBorder={palette.toolbarBorder}
            textPrimary={palette.textPrimary}
            textMuted={palette.textMuted}
            mode={activeView === 'personalized' ? 'personalized' : 'general'}
            onModeChange={mode =>
              setActiveView(mode === 'personalized' ? 'personalized' : 'combos')
            }
            initialTab={
              activeView === 'personalized'
                ? route.params?.initialComboTab || 'next_week'
                : route.params?.initialComboTab || 'antar_dasha'
            }
            useParentScroll
            mahadasha={mahadashaPeriod}
            antardasha={antardashaPeriod}
          />
        ) : (
          <View
            style={[
              styles.panelCard,
              { backgroundColor: palette.toolbarBg, borderColor: palette.toolbarBorder },
            ]}
          >
            <Text style={[styles.panelEmptyText, { color: palette.textMuted }]}>
              Select a chart to view combinations
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <View
      style={[
        styles.flex,
        {
          backgroundColor: palette.screenBg,
          paddingBottom: screenBottomInset,
        },
      ]}
    >
      <StatusBar
        barStyle={palette.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={palette.topHeaderBg}
      />

      <View
        style={[
          styles.topHeader,
          {
            backgroundColor: palette.topHeaderBg,
            borderBottomColor: palette.topHeaderBorder,
          },
        ]}
      >
        <View style={styles.headerSideLeft}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
          >
            <Image
              source={require('../../assets/icons/back.png')}
              style={[styles.headerBackIcon, { tintColor: palette.textPrimary }]}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Chat</Text>
        <View style={styles.headerSideRight}>
          {activeView === 'chat' ? (
            <TouchableOpacity
              onPress={handleStartNewChat}
              style={[
                styles.headerNewChatBtn,
                {
                  borderColor: palette.textPrimary,
                  backgroundColor: palette.isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                  opacity: !activeClientId || isSending ? 0.45 : 1,
                },
              ]}
              activeOpacity={0.75}
              disabled={!activeClientId || isSending}
            >
              <Text style={[styles.headerNewChatText, { color: palette.textPrimary }]}>
                + New Chat
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {activeView !== 'combos' && activeView !== 'personalized'
        ? renderMemberHeader()
        : null}

      {activeView !== 'combos' &&
      activeView !== 'personalized' &&
      !(activeView === 'chat' && isKeyboardVisible)
        ? renderToolbarTabs()
        : null}

      <Modal visible={showSidebar} animationType="slide" onRequestClose={closeSidebar}>
        <View
          style={[
            styles.sidebarPanel,
            {
              backgroundColor: palette.sidebarBg,
            },
          ]}
        >
            <View style={styles.sidebarHeader}>
              <Text style={[styles.sidebarTitle, { color: palette.textPrimary }]}>
                Astrologer Chat
              </Text>
              <TouchableOpacity
                style={[styles.sidebarCloseBtn, { borderColor: palette.sidebarBorder }]}
                onPress={closeSidebar}
                activeOpacity={0.7}
              >
                <Image
                  source={icons.Icclose}
                  style={[styles.sidebarCloseIcon, { tintColor: palette.textPrimary }]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.sidebarSearchRow}>
              <TouchableOpacity
                style={[
                  styles.sidebarBackBtn,
                  {
                    borderColor: palette.sidebarBorder,
                    backgroundColor: palette.sidebarBtnBg,
                  },
                ]}
                onPress={closeSidebar}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../assets/icons/back.png')}
                  style={[styles.sidebarBackIcon, { tintColor: palette.textPrimary }]}
                />
              </TouchableOpacity>

              <View
                style={[
                  styles.sidebarSearchInputWrap,
                  {
                    borderColor: palette.sidebarBorder,
                    backgroundColor: palette.sidebarInputBg,
                  },
                ]}
              >
                <Text style={[styles.sidebarSearchIcon, { color: palette.textMuted }]}>🔍</Text>
                <TextInput
                  style={[styles.sidebarSearchInput, { color: palette.textPrimary }]}
                  placeholder="Search Chart..."
                  placeholderTextColor={palette.textMuted}
                  value={sidebarSearch}
                  onChangeText={setSidebarSearch}
                />
              </View>
            </View>

            <Text style={[styles.sidebarSectionLabel, { color: palette.textMuted }]}>CHARTS</Text>

            <ScrollView
              style={styles.sidebarClientList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredSidebarClients.length ? (
                filteredSidebarClients.map(client => {
                  const isSelected = client.id === activeClientId;
                  const initials = getClientInitials(client);
                  const name = getClientDisplayName(client);

                  return (
                    <TouchableOpacity
                      key={client.id}
                      style={[
                        styles.sidebarClientItem,
                        isSelected && [
                          styles.sidebarClientItemSelected,
                          {
                            borderColor: GOLD,
                            backgroundColor: palette.sidebarSelectedBg,
                          },
                        ],
                      ]}
                      onPress={() => handleSelectClient(client)}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.sidebarClientAvatar,
                          {
                            backgroundColor: isSelected ? GOLD : palette.sidebarAvatarBg,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sidebarClientAvatarText,
                            { color: isSelected ? NAVY : palette.sidebarAvatarText },
                          ]}
                        >
                          {initials}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.sidebarClientName,
                          { color: palette.textPrimary },
                          isSelected && styles.sidebarClientNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={[styles.sidebarEmptyText, { color: palette.textMuted }]}>
                  No charts found
                </Text>
              )}
            </ScrollView>
        </View>
      </Modal>

      {activeView === 'chat' ? (
        (() => {
          const ChatWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
          const chatWrapperProps =
            Platform.OS === 'ios'
              ? { style: styles.chatContent, behavior: 'padding' as const }
              : { style: styles.chatContent };

          return (
            <ChatWrapper {...chatWrapperProps}>
              <FlatList
                ref={listRef}
                data={messages}
                extraData={typingRevision}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                style={[styles.messagesList, { backgroundColor: palette.screenBg }]}
                contentContainerStyle={[
                  styles.messagesContent,
                  messages.length === 0 ? styles.messagesContentEmpty : null,
                ]}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
                initialNumToRender={12}
                maxToRenderPerBatch={8}
                windowSize={7}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                onContentSizeChange={() => {
                  if (pendingChatScrollRef.current) {
                    scrollToBottom(false);
                    pendingChatScrollRef.current = false;
                  }
                }}
                ListFooterComponent={
                  messages.length === 0 ? null : (
                    <View
                      style={[
                        styles.messagesFooterSpacer,
                        isSending ? styles.messagesFooterSpacerThinking : null,
                      ]}
                    />
                  )
                }
                ListEmptyComponent={
                  historyLoading ? (
                    <View style={styles.historyLoadingWrap}>
                      <ActivityIndicator size="small" color={palette.textMuted} />
                      <Text style={[styles.historyLoadingText, { color: palette.textMuted }]}>
                        Loading chat history...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.emptyChatLogoWrap}>
                      <Image
                        source={require('../../assets/icons/Mask-chat.png')}
                        style={[
                          styles.emptyChatLogo,
                          palette.isDark ? styles.emptyChatLogoDark : null,
                        ]}
                        resizeMode="contain"
                      />
                    </View>
                  )
                }
              />

              <View
                style={[
                  styles.inputBar,
                  {
                    backgroundColor: palette.inputBarBg,
                    borderTopColor: palette.toolbarBorder,
                    paddingBottom: inputBottomPadding,
                  },
                ]}
              >
                {!historyLoading && messages.length === 0 ? (
                  <View
                    style={[
                      styles.suggestionWrap,
                      {
                        backgroundColor: palette.isDark
                          ? 'rgba(255,255,255,0.04)'
                          : '#F7F4EE',
                      },
                    ]}
                  >
                    {NEW_CHAT_SUGGESTIONS.map(suggestion => (
                      <TouchableOpacity
                        key={suggestion}
                        style={[
                          styles.suggestionChip,
                          {
                            backgroundColor: palette.isDark ? '#2A3F58' : '#FFFFFF',
                            borderColor: GOLD,
                          },
                        ]}
                        onPress={() => handleSelectSuggestion(suggestion)}
                        activeOpacity={0.8}
                        disabled={isSending}
                      >
                        <Text style={[styles.suggestionStar, { color: GOLD }]}>✦</Text>
                        <Text
                          style={[
                            styles.suggestionText,
                            { color: palette.isDark ? '#EEE5CA' : NAVY },
                          ]}
                        >
                          {suggestion}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: palette.inputBg,
                      borderColor: palette.inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    ref={inputRef}
                    style={[styles.textInput, { color: palette.textPrimary }]}
                    placeholder={isSending ? 'Waiting for response...' : 'Ask your questions...'}
                    placeholderTextColor={palette.textMuted}
                    value={inputText}
                    onChangeText={setInputText}
                    editable={!isSending && !historyLoading}
                    multiline
                    maxLength={500}
                    textAlignVertical="center"
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      {
                        backgroundColor:
                          inputText.trim() && !isSending && !historyLoading
                            ? palette.sendBtnActiveBg
                            : palette.sendBtnBg,
                        opacity: isSending || historyLoading ? 0.6 : inputText.trim() ? 1 : 0.55,
                      },
                    ]}
                    onPress={handleSend}
                    disabled={isSending || historyLoading || !inputText.trim()}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.sendIcon}>➤</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ChatWrapper>
          );
        })()
      ) : null}

      {activeView === 'vedic' ? renderVedicContent() : null}
      {activeView === 'transit' ? renderTransitContent() : null}
      {activeView === 'combos' || activeView === 'personalized'
        ? renderCombosContent()
        : null}

      <TransitEditModal
        visible={showTransitEditModal}
        saving={transitLoading}
        initialDay={transitDate.getDate()}
        initialMonth={transitDate.getMonth() + 1}
        initialYear={transitDate.getFullYear()}
        initialHour={transitDate.getHours()}
        initialMin={transitDate.getMinutes()}
        initialPlace={transitLocation}
        initialLat={transitLat}
        initialLon={transitLon}
        initialTzone={transitTzone}
        onClose={() => setShowTransitEditModal(false)}
        onSave={handleTransitEditSave}
      />

      <Modal
        visible={showQuestionLimitConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuestionLimitConfirmModal(false)}
      >
        <View style={styles.planLimitOverlay}>
          <ImageBackground
            source={require('../../assets/image/LightBackground.png')}
            style={[
              styles.planLimitCard,
              {
                backgroundColor: palette.isDark ? palette.assistantCardBg : '#FFFFFF',
                borderColor: palette.assistantCardBorder,
              },
            ]}
            imageStyle={styles.planLimitCardBg}
          >
            <Text style={[styles.planLimitTitle, { color: palette.textPrimary }]}>
              No Questions Left
            </Text>
            <Text style={[styles.planLimitMessage, { color: palette.textPrimary }]}>
              You have no question credits left. Do you want to buy more questions now?
            </Text>

            <View style={styles.planLimitActions}>
              <TouchableOpacity
                style={[styles.planLimitUpgradeBtn, { backgroundColor: NAVY }]}
                onPress={handleConfirmOpenBuyQuestions}
                activeOpacity={0.85}
              >
                <Text style={styles.planLimitUpgradeText}>Buy Questions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planLimitCancelBtn,
                  { borderColor: palette.isDark ? palette.textPrimary : NAVY },
                ]}
                onPress={() => setShowQuestionLimitConfirmModal(false)}
                activeOpacity={0.85}
              >
                <Text style={[styles.planLimitCancelText, { color: palette.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      </Modal>

      <BuyQuestionsModal
        visible={showBuyQuestionsModal}
        onClose={() => setShowBuyQuestionsModal(false)}
        questionBalance={astrologerQuestionBalance}
        onPurchaseSuccess={handleBuyQuestionsSuccess}
      />

      <Modal
        visible={showPlanLimitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlanLimitModal(false)}
      >
        <View style={styles.planLimitOverlay}>
          <ImageBackground
            source={require('../../assets/image/LightBackground.png')}
            style={[
              styles.planLimitCard,
              {
                backgroundColor: palette.isDark ? palette.assistantCardBg : '#FFFFFF',
                borderColor: palette.assistantCardBorder,
              },
            ]}
            imageStyle={styles.planLimitCardBg}
          >
            <Text style={[styles.planLimitTitle, { color: palette.textPrimary }]}>
              Plan Limit Reached
            </Text>
            <Text style={[styles.planLimitMessage, { color: palette.textPrimary }]}>
              You have reached the monthly token limit for your current plan (
              <Text style={styles.planLimitMessageBold}>{astrologerPlanDisplayName}</Text>
              ).
            </Text>

            <View style={styles.planLimitActions}>
              <TouchableOpacity
                style={[styles.planLimitUpgradeBtn, { backgroundColor: NAVY }]}
                onPress={handleUpgradePlan}
                activeOpacity={0.85}
              >
                <Text style={styles.planLimitUpgradeText}>Upgrade Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planLimitCancelBtn,
                  { borderColor: palette.isDark ? palette.textPrimary : NAVY },
                ]}
                onPress={() => setShowPlanLimitModal(false)}
                activeOpacity={0.85}
              >
                <Text style={[styles.planLimitCancelText, { color: palette.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      </Modal>

      <PersonalDetailsRequiredModal
        visible={showPersonalDetailsRequiredModal}
        onClose={() => setShowPersonalDetailsRequiredModal(false)}
        isDark={palette.isDark}
      />

      <PaidPlanRequiredModal
        visible={showPaidPlanRequiredModal}
        onClose={() => setShowPaidPlanRequiredModal(false)}
        onViewPlans={handleViewPlans}
        isDark={palette.isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? responsiveWidth('13') : responsiveWidth('10'),
    paddingBottom: responsiveWidth('3'),
    paddingHorizontal: responsiveWidth('4'),
    borderBottomWidth: 1,
  },
  headerSideLeft: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerSideRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  headerNewChatBtn: {
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerNewChatText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  headerBackIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  headerTitle: {
    flexShrink: 0,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    paddingHorizontal: 8,
  },
  toolbarCard: {
    marginHorizontal: responsiveWidth('3'),
    marginBottom: responsiveWidth('2'),
    paddingHorizontal: responsiveWidth('2.5'),
    paddingVertical: responsiveWidth('2.5'),
    marginTop: responsiveWidth('3'),
    borderRadius: 12,
    borderWidth: 1,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  toolbarIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarHamburger: {
    fontSize: 16,
    lineHeight: 18,
  },
  toolbarName: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.bold,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 2,
  },
  toolbarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
    flexShrink: 0,
  },
  toolbarPillActive: {},
  toolbarPillInactive: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  toolbarPillIconActive: {
    width: 13,
    height: 13,
    tintColor: '#FFFFFF',
    resizeMode: 'contain',
  },
  toolbarPillTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  toolbarPillIconInactive: {
    width: 13,
    height: 13,
    resizeMode: 'contain',
  },
  toolbarPillTextInactive: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  transitSunIconInactive: {
    fontSize: 12,
  },
  combosListIcon: {
    fontSize: 12,
    lineHeight: 14,
  },
  combosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: responsiveWidth('3'),
  },
  combosHeaderTextWrap: { flex: 1 },
  combosTitle: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    lineHeight: 22,
    marginBottom: 4,
  },
  combosAsOf: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
  },
  combosRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD,
  },
  combosRefreshIcon: {
    color: GOLD,
    fontSize: 14,
  },
  combosRefreshText: {
    color: GOLD,
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  combosTabScroll: {
    marginBottom: responsiveWidth('3'),
  },
  combosTabRow: {
    gap: 8,
    paddingRight: 8,
  },
  combosTabBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  combosTabBtnActive: {},
  combosTabBtnInactive: {
    borderWidth: 1,
    backgroundColor: '#F3F4F6',
  },
  combosTabText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  combosList: {
    gap: 10,
  },
  comboCard: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  comboCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  comboCardTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    lineHeight: 18,
  },
  comboChevron: {
    fontSize: 11,
  },
  comboCardBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 2,
  },
  comboBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingRight: 4,
  },
  comboBulletDot: {
    fontSize: 14,
    lineHeight: 20,
    marginRight: 8,
  },
  comboBulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  panelScroll: { flex: 1 },
  combosPanelContent: {
    flexGrow: 1,
    paddingBottom: responsiveWidth('6'),
  },
  combosPanelInner: {
    paddingHorizontal: responsiveWidth('3'),
    paddingTop: responsiveWidth('1'),
  },
  panelScrollContent: {
    paddingHorizontal: responsiveWidth('3'),
    paddingBottom: responsiveWidth('8'),
  },
  panelCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: responsiveWidth('2'),
    overflow: 'hidden',
  },
  panelLoading: {
    minHeight: responsiveWidth('50'),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveWidth('8'),
  },
  panelEmptyText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    paddingVertical: responsiveWidth('8'),
  },
  transitChartCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: responsiveWidth('4'),
    paddingHorizontal: responsiveWidth('3'),
    marginBottom: responsiveWidth('3'),
    alignItems: 'center',
    overflow: 'visible',
  },
  transitChartLoading: {
    minHeight: TRANSIT_CHART_SIZE + TRANSIT_CHART_PADDING * 2,
  },
  transitChartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: TRANSIT_CHART_PADDING,
    overflow: 'visible',
  },
  transitSettingsCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: responsiveWidth('3'),
    marginBottom: responsiveWidth('3'),
  },
  transitSettingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsiveWidth('2'),
  },
  transitSettingsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transitSettingsIcon: { fontSize: 14 },
  transitSettingsTitle: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
  },
  transitEditText: {
    color: GOLD,
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
  },
  transitMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 6,
  },
  transitMetaText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
  },
  transitTableCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: responsiveWidth('2'),
  },
  transitTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E8F0FA',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  transitTableHeaderCell: {
    color: NAVY,
    fontSize: 11,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.4,
  },
  transitTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  transitTableRowAlt: { backgroundColor: '#FAFBFD' },
  transitTableCell: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
  },
  transitPlanetCol: { flex: 1.1 },
  transitSignCol: { flex: 1 },
  transitDegreeCol: { flex: 0.9 },
  transitNakshatraCol: { flex: 1.4 },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  iconGroupBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGroupEmoji: {
    fontSize: 15,
  },
  messagesList: {
    flex: 1,
  },
  chatContent: {
    flex: 1,
    minHeight: 0,
  },
  messagesContent: {
    paddingHorizontal: responsiveWidth('3.5'),
    paddingTop: responsiveWidth('2'),
    paddingBottom: responsiveWidth('2'),
  },
  messagesContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesFooterSpacer: {
    height: responsiveWidth('6'),
  },
  messagesFooterSpacerThinking: {
    height: responsiveWidth('16'),
  },
  emptyChatLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    // paddingHorizontal: responsiveWidth('8'),
  },
  emptyChatLogo: {
    width: responsiveWidth('36'),
    height: responsiveWidth('36'),
    opacity: 0.4,
  },
  emptyChatLogoDark: {
    tintColor: '#EEE5CA',
    opacity: 0.28,
  },
  historyLoadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  historyLoadingText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
  },
  userMessageWrap: {
    alignItems: 'flex-end',
    marginBottom: responsiveWidth('3.5'),
  },
  assistantMessageWrap: {
    marginBottom: responsiveWidth('3.5'),
  },
  timeLabel: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    marginBottom: 6,
  },
  userBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    borderTopRightRadius: 4,
    paddingHorizontal: responsiveWidth('3.5'),
    paddingVertical: responsiveWidth('2.2'),
  },
  userBubbleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    overflow: 'hidden',
  },
  botAvatarIcon: {
    width: 32,
    height: 32,
    resizeMode: 'cover',
  },
  compactAssistantBubble: {
    flex: 1,
    maxWidth: '85%',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    paddingHorizontal: responsiveWidth('3.5'),
    paddingVertical: responsiveWidth('2.4'),
  },
  thinkingBubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thinkingBubbleText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  compactAssistantText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
  },
  assistantCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  assistantAccent: {
    width: 4,
  },
  assistantContent: {
    flex: 1,
    paddingHorizontal: responsiveWidth('3'),
    paddingVertical: responsiveWidth('2.5'),
  },
  thinkingStepsWrap: {
    marginBottom: responsiveWidth('2'),
    gap: 8,
  },
  thinkingStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingStepIcon: {
    width: 14,
    fontSize: 12,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  thinkingStepText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
  },
  streamingAnswerText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
    marginBottom: responsiveWidth('1.5'),
  },
  errorText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    marginBottom: responsiveWidth('1.5'),
  },
  buyQuestionsInlineBtn: {
    alignSelf: 'flex-start',
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 4,
  },
  buyQuestionsInlineBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
  },
  sectionBlock: {
    marginBottom: responsiveWidth('1.5'),
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    marginBottom: responsiveWidth('1'),
  },
  paragraphText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    marginBottom: responsiveWidth('1'),
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
    paddingRight: 4,
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 20,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  inputBar: {
    paddingHorizontal: responsiveWidth('3'),
    paddingTop: responsiveWidth('2'),
    borderTopWidth: 1,
  },
  suggestionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  suggestionStar: {
    fontSize: 12,
    marginRight: 6,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
    flexShrink: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 28,
    borderWidth: 1,
    paddingLeft: responsiveWidth('4'),
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    maxHeight: 96,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    paddingRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  sidebarPanel: {
    flex: 1,
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? responsiveWidth('12') : responsiveWidth('8'),
    paddingHorizontal: responsiveWidth('4'),
    paddingBottom: responsiveWidth('4'),
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsiveWidth('4'),
  },
  sidebarTitle: {
    fontSize: 22,
    fontFamily: fontFamily.semiBold,
  },
  sidebarCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarCloseIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
  sidebarSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: responsiveWidth('4'),
  },
  sidebarBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBackIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  sidebarSearchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  sidebarSearchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  sidebarSearchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
  },
  sidebarSectionLabel: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    letterSpacing: 1,
    marginBottom: responsiveWidth('2.5'),
  },
  sidebarClientList: {
    flex: 1,
  },
  sidebarClientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsiveWidth('2.2'),
    paddingHorizontal: responsiveWidth('2'),
    borderRadius: 10,
    marginBottom: 4,
    gap: 12,
  },
  sidebarClientItemSelected: {
    borderWidth: 1,
  },
  sidebarClientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarClientAvatarText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
  },
  sidebarClientName: {
    flex: 1,
    fontSize: 15,
    fontFamily: fontFamily.regular,
  },
  sidebarClientNameSelected: {
    fontFamily: fontFamily.semiBold,
  },
  sidebarEmptyText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    paddingVertical: 12,
  },
  planLimitOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth('6'),
  },
  planLimitCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: responsiveWidth('6'),
    paddingVertical: responsiveWidth('7'),
    overflow: 'hidden',
    alignItems: 'center',
  },
  planLimitCardBg: {
    opacity: 0.35,
  },
  planLimitTitle: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    marginBottom: 16,
  },
  planLimitMessage: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  planLimitMessageBold: {
    fontFamily: fontFamily.bold,
  },
  planLimitActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  planLimitUpgradeBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planLimitUpgradeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
  planLimitCancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  planLimitCancelText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
  },
});

export default AstrologerClientChatScreen;
