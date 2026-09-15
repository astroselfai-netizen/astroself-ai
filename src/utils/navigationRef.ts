import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

type PendingRoute = {
  name: string;
  params?: object;
  mode: 'navigate' | 'resetWithAstrologerHome';
};

let pendingRoute: PendingRoute | null = null;
let retryTimer: ReturnType<typeof setInterval> | null = null;

const AUTH_OR_BOOT_ROUTES = new Set([
  'SplashScreen',
  'Login',
  'ContinueWithOtp',
  'ForgotPassword',
  'ForgotPasswordOtp',
  'Register',
  'AstrologerRegister',
]);

const clearRetryTimer = () => {
  if (retryTimer) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
};

const dispatchPending = (next: PendingRoute) => {
  if (next.mode === 'resetWithAstrologerHome') {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'AstrologerHome' },
          { name: next.name, params: next.params },
        ],
      }),
    );
    return;
  }

  navigationRef.navigate(next.name as never, next.params as never);
};

export function flushPendingNavigation() {
  if (!pendingRoute || !navigationRef.isReady()) {
    return;
  }

  const next = pendingRoute;
  pendingRoute = null;
  clearRetryTimer();
  dispatchPending(next);
}

function startRetry() {
  if (retryTimer) {
    return;
  }

  retryTimer = setInterval(() => {
    if (pendingRoute && navigationRef.isReady()) {
      flushPendingNavigation();
    }
  }, 300);

  setTimeout(clearRetryTimer, 15000);
}

export function navigateWhenReady(name: string, params?: object) {
  if (navigationRef.isReady()) {
    pendingRoute = null;
    clearRetryTimer();
    navigationRef.navigate(name as never, params as never);
    return;
  }

  pendingRoute = { name, params, mode: 'navigate' };
  startRetry();
}

/** True when opening from cold start / auth screens so back must not return to Splash. */
export function shouldResetOntoAstrologerHome(): boolean {
  if (!navigationRef.isReady()) {
    return true;
  }

  const current = navigationRef.getCurrentRoute()?.name;
  if (current && AUTH_OR_BOOT_ROUTES.has(current)) {
    return true;
  }

  const rootRoutes = navigationRef.getRootState()?.routes || [];
  return !rootRoutes.some(route => route.name === 'AstrologerHome');
}

/**
 * Opens an astrologer root screen. From Splash/Login (push cold-start),
 * resets stack to AstrologerHome → target so Back lands on Your Charts.
 */
export function navigateAstrologerScreenWhenReady(
  name: string,
  params?: object,
) {
  if (!navigationRef.isReady()) {
    pendingRoute = { name, params, mode: 'resetWithAstrologerHome' };
    startRetry();
    return;
  }

  pendingRoute = null;
  clearRetryTimer();

  if (shouldResetOntoAstrologerHome()) {
    dispatchPending({ name, params, mode: 'resetWithAstrologerHome' });
    return;
  }

  navigationRef.navigate(name as never, params as never);
}

export function goToAstrologerHome() {
  if (!navigationRef.isReady()) {
    pendingRoute = {
      name: 'AstrologerHome',
      mode: 'navigate',
    };
    startRetry();
    return;
  }

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'AstrologerHome' }],
    }),
  );
}
