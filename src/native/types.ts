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

export interface LimitState {
  packageName: string;
  appLabel: string;
  allowanceSeconds: number;
  lockSeconds: number;
  remainingSeconds: number;
  lockedUntil: number;
  isActive: boolean;
}

export interface SyncLimitInput {
  packageName: string;
  appLabel: string;
  allowanceSeconds: number;
  lockSeconds: number;
  isActive: boolean;
}

export interface TrackingNativeModule {
  isAccessibilityEnabled(): Promise<boolean>;
  openAccessibilitySettings(): void;
  isServiceRunning(): Promise<boolean>;
  syncLimits(limits: SyncLimitInput[]): Promise<void>;
  getLimitState(): Promise<string>;
  setMonitoringEnabled(enabled: boolean): Promise<void>;
  isMonitoringEnabled(): Promise<boolean>;
  getCurrentForegroundApp(): Promise<string | null>;
}