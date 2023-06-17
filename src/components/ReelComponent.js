// Library import
import {
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

// Local import
import images from '../assets/images';
import {getHeight, moderateScale} from '../common/constants';
import ZText from '../components/common/ZText';
import {styles} from '../themes';
import {useNavigation} from '@react-navigation/native';
import {TabNav} from '../navigation/NavigationKeys';

export default function ReelComponent({
  data = {},
  isPlay = false,
  reelUrl = '',
  style,
  id,
}) {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  const onPressReel = () =>
    navigation.navigate(TabNav.Home, {
      storyId: id,
    });

  return (
    <TouchableOpacity
      onPress={onPressReel}
      style={[
        localStyles.postContainer,
        {
          ...style,
        },
      ]}>
      <ImageBackground
        source={reelUrl ? {uri: reelUrl} : images.post}
        style={localStyles.postImgStyle}
        resizeMode="cover"
        imageStyle={{borderRadius: moderateScale(10)}}>
        {!!isPlay && (
          <View style={localStyles.playIconStyle}>
            <Ionicons
              name="play-circle"
              size={moderateScale(28)}
              color={colors.white}
            />
          </View>
        )}
        {data.length > 0 && (
          <View style={localStyles.playStyle}>
            <Ionicons
              name="play-circle"
              size={moderateScale(18)}
              color={colors.primary}
            />
            <ZText type="s16" style={styles.ml5} color={colors.white}>
              {data}
            </ZText>
          </View>
        )}
      </ImageBackground>
    </TouchableOpacity>
  );
}

const localStyles = StyleSheet.create({
  postContainer: {
    width: '33%',
  },
  postImgStyle: {
    ...styles.mt5,
    height: getHeight(190),
    marginHorizontal: '3%',
  },
  playStyle: {
    ...styles.rowCenter,
    position: 'absolute',
    bottom: getHeight(10),
    left: moderateScale(10),
  },
  playIconStyle: {
    ...styles.rowCenter,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
});
