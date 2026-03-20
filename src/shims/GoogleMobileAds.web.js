/**
 * Web shim for react-native-google-mobile-ads
 * Ads are not shown on the chef web portal — this is a silent no-op.
 */
import React from 'react';
import { View } from 'react-native';

export const BannerAd = (props) => <View {...props} />;
export const InterstitialAd = {
  createForAdRequest: () => ({
    load: () => {},
    show: () => Promise.resolve(),
    addAdEventListener: () => () => {},
  }),
};
export const RewardedAd = InterstitialAd;
export const AppOpenAd = InterstitialAd;
export const AdEventType = { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' };
export const RewardedAdEventType = { EARNED_REWARD: 'earned_reward' };
export const BannerAdSize = { BANNER: 'BANNER', LARGE_BANNER: 'LARGE_BANNER', FULL_BANNER: 'FULL_BANNER' };
export const TestIds = { BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial', REWARDED: 'test-rewarded' };
export const MobileAds = () => ({
  initialize: () => Promise.resolve([]),
  setRequestConfiguration: () => Promise.resolve(),
});

export default MobileAds;
