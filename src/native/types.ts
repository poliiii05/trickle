export interface TrickleNativeModule {
  ping(): Promise<string>;
  getAndroidVersion(): Promise<number>;
}

export interface PermissionStatus {
  usageStats: boolean;
  overlay: boolean;
  batteryExempt: boolean;
}

export interface PermissionsNativeModule {
  hasUsageStatsPermission(): Promise<boolean>;
  openUsageAccessSettings(): void;
  canDrawOverlays(): Promise<boolean>;
  openOverlaySettings(): void;
  isIgnoringBatteryOptimizations(): Promise<boolean>;
  openBatteryOptimizationSettings(): void;
  getPermissionStatus(): Promise<PermissionStatus>;
}

export interface InstalledApp {
  packageName: string;
  appLabel: string;
  isSystemApp: boolean;
}

export interface UsageStat {
  packageName: string;
  appLabel: string;
  totalSeconds: number;
  lastTimeUsed: number;
}

export interface AppsNativeModule {
  getInstalledApps(): Promise<InstalledApp[]>;
  getAppIcon(packageName: string): Promise<string | null>;
  getUsageStats(startMs: number, endMs: number): Promise<UsageStat[]>;
}