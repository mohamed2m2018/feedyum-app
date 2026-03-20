/** Web shim for react-native-create-thumbnail */
export const createThumbnail = (options) => Promise.resolve({ path: options?.url || '', mime: 'image/jpeg' });
export default { createThumbnail };
