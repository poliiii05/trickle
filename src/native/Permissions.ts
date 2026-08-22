import { NativeModules } from 'react-native';
import type { PermissionsNativeModule } from './types';

const { PermissionsModule } = NativeModules;

export default PermissionsModule as PermissionsNativeModule;