/** Web shim for react-native-audio-record */
const AudioRecord = {
  init: () => {},
  start: () => Promise.resolve(''),
  stop: () => Promise.resolve(''),
  on: () => ({ remove: () => {} }),
};
export default AudioRecord;
