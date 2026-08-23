import { NativeModules } from 'react-native';
import type { TrackingNativeModule, LimitState } from './types';

const { TrackingModule } = NativeModules;

const Tracking = TrackingModule as TrackingNativeModule;

export async function getLimitStateParsed(): Promise<LimitState[]> {
  try {
    const json = await Tracking.getLimitState();
    return JSON.parse(json) as LimitState[];
  } catch {
    return [];
  }
}

export default Tracking;