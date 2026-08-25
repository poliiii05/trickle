import { NativeModules } from 'react-native';

interface FilesNativeModule {
  shareCsv(filename: string, content: string): Promise<void>;
}

export default NativeModules.FileModule as FilesNativeModule;