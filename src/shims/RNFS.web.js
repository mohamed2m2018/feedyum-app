/** Web shim for react-native-fs — uses in-memory + fetch */
const RNFS = {
  DocumentDirectoryPath: '/documents',
  CachesDirectoryPath: '/caches',
  TemporaryDirectoryPath: '/tmp',
  ExternalDirectoryPath: '/external',
  MainBundlePath: '/',
  readFile: () => Promise.resolve(''),
  writeFile: () => Promise.resolve(),
  readDir: () => Promise.resolve([]),
  exists: () => Promise.resolve(false),
  unlink: () => Promise.resolve(),
  mkdir: () => Promise.resolve(),
  stat: () => Promise.resolve({ size: 0, isFile: () => true, isDirectory: () => false }),
  downloadFile: (options) => ({ promise: fetch(options.fromUrl).then(() => ({ statusCode: 200 })) }),
  copyFile: () => Promise.resolve(),
  moveFile: () => Promise.resolve(),
};
export default RNFS;
