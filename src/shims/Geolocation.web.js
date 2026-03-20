/** Web shim for @react-native-community/geolocation */
const Geolocation = {
  getCurrentPosition: (success, error, options) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error, options);
    } else if (error) { error({ code: 2, message: 'Geolocation not available' }); }
  },
  watchPosition: (success, error, options) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return navigator.geolocation.watchPosition(success, error, options);
    }
    return 0;
  },
  clearWatch: (id) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(id);
    }
  },
  setRNConfiguration: () => {},
  requestAuthorization: () => Promise.resolve('granted'),
};
export default Geolocation;
