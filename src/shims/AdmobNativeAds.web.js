/** Web shim for react-native-admob-native-ads */
import React from 'react';
import { View } from 'react-native';

const NativeAdView = ({ children, ...props }) => <View {...props}>{children}</View>;
export const AdBadge = (props) => <View {...props} />;
export const HeadlineView = (props) => <View {...props} />;
export const TaglineView = (props) => <View {...props} />;
export const AdvertiserView = (props) => <View {...props} />;
export const ImageView = (props) => <View {...props} />;
export const MediaView = (props) => <View {...props} />;
export const CallToActionView = (props) => <View {...props} />;
export const IconView = (props) => <View {...props} />;
export const StarRatingView = (props) => <View {...props} />;
export const StoreView = (props) => <View {...props} />;
export const PriceView = (props) => <View {...props} />;
export default NativeAdView;
