import { useEffect, useMemo, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type NetworkStatus = {
  isConnected: boolean;
  isInternetReachable: boolean;
  isOffline: boolean;
};

function normalize(state: NetInfoState | null): NetworkStatus {
  const isConnected = state?.isConnected ?? true;
  const isInternetReachable =
    state?.isInternetReachable ?? state?.isConnected ?? true;
  const isOffline = !isConnected || !isInternetReachable;
  return { isConnected, isInternetReachable, isOffline };
}

export function useNetworkStatus(): NetworkStatus {
  const [state, setState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(next => setState(next));
    NetInfo.fetch()
      .then(next => setState(next))
      .catch(() => {
        // If NetInfo fails, treat as "online" and let requests fail normally.
        setState(null);
      });
    return () => unsub();
  }, []);

  return useMemo(() => normalize(state), [state]);
}
