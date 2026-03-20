/** Web shim for @segment/analytics-react-native */

const noopTrack = () => {};

const client = {
  track: noopTrack,
  identify: noopTrack,
  screen: noopTrack,
  group: noopTrack,
  alias: noopTrack,
  reset: noopTrack,
  flush: () => Promise.resolve(),
};

export const createClient = (_config) => client;

export const useAnalytics = () => ({
  track: noopTrack,
  identify: noopTrack,
  screen: noopTrack,
  group: noopTrack,
  alias: noopTrack,
  reset: noopTrack,
  flush: () => Promise.resolve(),
});

export const AnalyticsProvider = ({ children }) => children;

export default { createClient, useAnalytics, AnalyticsProvider };
