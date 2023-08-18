/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-undef */
import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Platform, View} from 'react-native';
import NativeAdView, {
  AdvertiserView,
  CallToActionView,
  HeadlineView,
  IconView,
  StarRatingView,
  StoreView,
  TaglineView,
} from 'react-native-admob-native-ads';
import {MediaView} from './MediaView';
import {Logger, adUnitIDs} from './utils';
import {useSelector} from 'react-redux';
import Typography from '../../../../themes/typography';
import {getHeight, moderateScale} from '../../../../common/constants';

export const AdView = React.memo(
  ({index, media, type, loadOnMount = true, layoutHeight}) => {
    const [aspectRatio, setAspectRatio] = useState(1.5);
    const [loading, setLoading] = useState(true);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const nativeAdRef = useRef();
    const colors = useSelector(state => state.theme.theme);

    const onAdFailedToLoad = event => {
      setError(true);
      setLoading(false);
      /**
       * Sometimes when you try to load an Ad, it will keep failing
       * and you will recieve this error: "The ad request was successful,
       * but no ad was returned due to lack of ad inventory."
       *
       * This error is not a bug or issue with our Library.
       * Just remove the app from your phone & clean your build
       * folders by running ./gradlew clean in /android folder
       * and for iOS clean the project in xcode. Hopefully the error will
       * be gone.
       *
       * [iOS] If you get this error: "Cannot find an ad network adapter with
       * the name(s): com.google.DummyAdapter". The ad inventory is empty in your
       * location. Try using a vpn to get ads in a different location.
       *
       * If you have recently created AdMob IDs for your ads, it might take
       * a few days until the ads will start showing.
       */
      Logger('AD', 'FAILED', event.message);
    };

    const onAdLoaded = () => {
      Logger('AD', 'LOADED', 'Ad has loaded successfully');
    };

    const onAdClicked = () => {
      Logger('AD', 'CLICK', 'User has clicked the Ad');
    };

    const onAdImpression = () => {
      Logger('AD', 'IMPRESSION', 'Ad impression recorded');
    };

    const onNativeAdLoaded = event => {
      Logger('AD', 'RECIEVED', 'Unified ad  Recieved', event);
      setLoading(false);
      setLoaded(true);
      setError(false);
      setAspectRatio(event.aspectRatio);
    };

    const onAdLeftApplication = () => {
      Logger('AD', 'LEFT', 'Ad left application');
    };

    useEffect(() => {
      if (!loaded) {
        nativeAdRef.current?.loadAd();
      } else {
        Logger('AD', 'LOADED ALREADY');
      }
    }, [loaded]);
    return (
      <NativeAdView
        ref={nativeAdRef}
        onAdLoaded={onAdLoaded}
        onAdFailedToLoad={onAdFailedToLoad}
        onAdLeftApplication={onAdLeftApplication}
        onAdClicked={onAdClicked}
        onAdImpression={onAdImpression}
        onNativeAdLoaded={onNativeAdLoaded}
        refreshInterval={60000 * 2}
        style={{
          width: '100%',
          alignSelf: 'center',
        }}
        videoOptions={{
          customControlsRequested: true,
        }}
        mediationOptions={{
          nativeBanner: true,
        }}
        adUnitID={
          Platform.OS === 'android'
            ? 'ca-app-pub-2374540952576524/6063023777'
            : 'ca-app-pub-2374540952576524/3227008227'
        } // REPLACE WITH NATIVE_AD_VIDEO_ID for video ads.
        // repository={type === 'image' ? 'imageAd' : 'videoAd'}
      >
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            height: layoutHeight || screenHeight,
          }}>
          {media ? (
            <MediaView layoutHeight={layoutHeight} aspectRatio={aspectRatio} />
          ) : null}

          <View
            style={{
              position: 'absolute',
              bottom: 10,
              left: 0,
              right: 0,
            }}>
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: colors.backgroundColor,
                position: 'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: !loading && !error && loaded ? 0 : 1,
                zIndex: !loading && !error && loaded ? 0 : 10,
              }}>
              {loading && (
                <ActivityIndicator size={28} color={colors.primary} />
              )}
            </View>

            <View
              style={{
                height: 140,
                width: '90%',
                alignSelf: 'center',
                alignItems: 'center',
                paddingHorizontal: 10,
                opacity: loading || error || !loaded ? 0 : 1,
                maxWidth: '100%',
              }}>
              <View style={{flexDirection: 'row', marginBottom: 15}}>
                <IconView
                  style={{
                    width: 60,
                    height: 60,
                  }}
                />
                <View
                  style={{
                    paddingHorizontal: 6,
                    flexShrink: 1,
                  }}>
                  <HeadlineView
                    hello="abc"
                    style={{
                      fontWeight: 'bold',
                      fontSize: 13,
                      flexWrap: 'wrap',
                      color: colors.textColor,
                      ...Typography.fontWeights.Medium,
                    }}
                  />
                  <TaglineView
                    numberOfLines={2}
                    style={{
                      fontSize: 11,
                      color: colors.textColor,
                      flexWrap: 'wrap',
                      ...Typography.fontWeights.Medium,
                    }}
                  />
                  <AdvertiserView
                    style={{
                      fontSize: 10,
                      flexWrap: 'wrap',
                      color: colors.textColor,
                      ...Typography.fontWeights.Medium,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <StoreView
                      style={{
                        fontSize: 12,
                        color: colors.textColor,
                      }}
                    />
                    <StarRatingView
                      starSize={12}
                      fullStarColor="orange"
                      emptyStarColor="gray"
                      style={{
                        width: 65,
                        marginLeft: 10,
                      }}
                    />
                  </View>
                </View>
              </View>
              <CallToActionView
                style={[
                  {
                    minHeight: 45,
                    paddingHorizontal: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 10,
                    width: 300,
                  },
                  Platform.OS === 'ios'
                    ? {
                        backgroundColor: colors.primary,
                        height: getHeight(50),
                        borderRadius: moderateScale(20),
                        borderWidth: moderateScale(1),
                        width: '100%',
                        alignSelf: 'center',
                      }
                    : {},
                ]}
                buttonAndroidStyle={{
                  backgroundColor: colors.primary,
                  height: getHeight(50),
                  borderRadius: moderateScale(20),
                  borderWidth: moderateScale(1),
                  width: '100%',
                  alignSelf: 'center',
                }}
                allCaps
                textStyle={{
                  fontSize: 14,
                  flexWrap: 'wrap',
                  textAlign: 'center',
                  color: colors.textColor,
                  ...Typography.fontWeights.Medium,
                }}
              />
            </View>
          </View>
        </View>
      </NativeAdView>
    );
  },
);
