declare module 'react-native-version-check' {
  export type NeedUpdateOption = {
    currentVersion?: string;
    latestVersion?: string;
    depth?: number;
    ignoreErrors?: boolean;
    packageName?: string;
    provider?: string;
    country?: string;
  };

  export type NeedUpdateResult = {
    isNeeded: boolean;
    storeUrl: string;
    currentVersion: string;
    latestVersion: string;
  };

  export type GetPlayStoreUrlOption = {
    packageName?: string;
    ignoreErrors?: boolean;
  };

  const VersionCheck: {
    needUpdate(option?: NeedUpdateOption): Promise<NeedUpdateResult | void>;
    getCurrentVersion(): string;
    getPlayStoreUrl(option?: GetPlayStoreUrlOption): Promise<string>;
  };

  export default VersionCheck;
}
