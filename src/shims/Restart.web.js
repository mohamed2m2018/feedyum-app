/** Web shim for react-native-restart */
const RNRestart = { restart: () => { if (typeof window !== 'undefined') window.location.reload(); } };
export default RNRestart;
