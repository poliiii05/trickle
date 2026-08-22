export interface TrickleNativeModule {
  ping(): Promise<string>;
  getAndroidVersion(): Promise<number>;
}