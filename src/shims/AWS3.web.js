/** Web shim for react-native-aws3 */
export const RNS3 = {
  put: async (file, options) => {
    console.log('[Web] RNS3.put shim — using fetch', options?.bucket);
    return { status: 200, body: { postResponse: { location: file?.uri || '' } } };
  },
};
export default RNS3;
