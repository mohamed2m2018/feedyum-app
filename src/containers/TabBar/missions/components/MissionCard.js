import React from 'react';
import {StyleSheet, TouchableOpacity, View, Image} from 'react-native';
import {useSelector} from 'react-redux';
import Animated, {FadeInUp} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

import ZText from '../../../../components/common/ZText';
import {moderateScale} from '../../../../common/constants';
import {commonColor} from '../../../../themes/colors';
import {styles as themeStyles} from '../../../../themes';
import CountdownTimer from './CountdownTimer';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const MissionCard = ({mission, onPress, index = 0}) => {
  const colors = useSelector(state => state.theme.theme);

  const renderThumbnail = () => {
    if (mission?.coverImage) {
      return (
        <Image
          source={{uri: mission.coverImage}}
          style={localStyles.thumbnail}
          resizeMode="cover"
        />
      );
    }
    return (
      <View
        style={[
          localStyles.thumbnail,
          localStyles.placeholderThumbnail,
          {backgroundColor: commonColor.primaryTransparent},
        ]}>
        <Ionicons
          name="map-outline"
          size={moderateScale(32)}
          color={commonColor.primary}
        />
      </View>
    );
  };

  return (
    <AnimatedTouchable
      entering={FadeInUp.delay(index * 100).duration(400)}
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        localStyles.card,
        {backgroundColor: colors.dark2 || colors.backgroundColor2 || colors.inputBg},
      ]}>
      {renderThumbnail()}

      <View style={localStyles.content}>
        <ZText type="b16" numberOfLines={1} color={colors.textColor}>
          {mission?.title || mission?.targetRestaurantName || 'Mission'}
        </ZText>

        {!!(mission?.targetArea || mission?.targetRestaurantAddress) && (
          <ZText
            type="r13"
            numberOfLines={1}
            color={colors.grayScale5}
            style={localStyles.locationText}>
            {mission?.targetArea || mission?.targetRestaurantAddress}
          </ZText>
        )}

        {!!(mission?.rewards?.commissionPercentage) && (
          <View
            style={[
              localStyles.rewardPill,
              {backgroundColor: commonColor.primaryTransparent},
            ]}>
            <ZText type="s12" color={commonColor.primary}>
              {mission.rewards.commissionPercentage}% commission per order
            </ZText>
          </View>
        )}

        <View style={localStyles.bottomRow}>
          {(mission?.currentParticipants > 0) && (
            <View style={localStyles.participantInfo}>
              <Ionicons
                name="people-outline"
                size={moderateScale(14)}
                color={colors.grayScale5 || commonColor.grayScale5}
              />
              <ZText
                type="r12"
                color={colors.grayScale5 || commonColor.grayScale5}
                style={localStyles.participantCount}>
                {mission.currentParticipants}
              </ZText>
            </View>
          )}
          <CountdownTimer endDate={mission?.endDate} />
        </View>
      </View>
    </AnimatedTouchable>
  );
};

const localStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    marginBottom: moderateScale(12),
    marginHorizontal: moderateScale(2),
  },
  thumbnail: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  placeholderThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: moderateScale(12),
    justifyContent: 'center',
  },
  locationText: {
    marginTop: moderateScale(2),
  },
  rewardPill: {
    alignSelf: 'flex-start',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    marginTop: moderateScale(6),
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(6),
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  participantCount: {
    marginLeft: moderateScale(4),
  },
});

export default MissionCard;
