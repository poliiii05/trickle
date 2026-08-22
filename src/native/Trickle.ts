import { NativeModules, Platform } from 'react-native';
import type { TrickleNativeModule } from './types';

const { TrickleModule } = NativeModules;

if (Platform.OS === 'android' && !TrickleModule) {
  throw new Error(
    'Hindi mahanap ang TrickleModule. ' +
    'Nag-rebuild ka ba (npm run android) pagkatapos idagdag ang native files?'
  );
}

export default TrickleModule as TrickleNativeModule;