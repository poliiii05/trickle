import { NativeModules } from 'react-native';
import type { AppsNativeModule } from './types';

const { AppsModule } = NativeModules;

export default AppsModule as AppsNativeModule;