/** Web shim for react-native-compressor */
export const Image = { compress: (uri) => Promise.resolve(uri) };
export const Video = { compress: (uri) => Promise.resolve(uri) };
export const Audio = { compress: (uri) => Promise.resolve(uri) };
export default { Image, Video, Audio };
