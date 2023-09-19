// Library import
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

// Local import
import images from '../assets/images';
import {getHeight, moderateScale} from '../common/constants';
import ZText from '../components/common/ZText';
import {styles} from '../themes';
import {ImageBackground} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNav} from '../navigation/NavigationKeys';

export default function LiveComponent({
  reelUrl = '',
  user = '',
  userName = '',
  id,
  userId,
}) {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  const onPressReel = () =>
    navigation.navigate(StackNav.reelsOne, {
      storyId: id,
      profile: {_id: userId},
    });

  return (
    <View style={localStyles.postContainer}>
      <TouchableOpacity onPress={onPressReel}>
        <ImageBackground
          source={reelUrl ? {uri: reelUrl} : images.post}
          style={localStyles.postImgStyle}
          imageStyle={{borderRadius: moderateScale(10)}}>
          {!!user && (
            <View style={localStyles.playIconStyle}>
              <View
                style={[
                  localStyles.liveContainerStyle,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}>
                <ZText type="s12" color={colors.textColor}>
                  {'LIVE'}
                </ZText>
              </View>
              <View
                style={[
                  localStyles.userContainer,
                  {
                    backgroundColor: colors.gray,
                  },
                ]}>
                <Ionicons
                  name="people"
                  size={moderateScale(16)}
                  color={colors.white}
                  style={styles.mr5}
                />
                <ZText type="s12" color={colors.textColor}>
                  {user}
                </ZText>
              </View>
            </View>
          )}
        </ImageBackground>
      </TouchableOpacity>

      <TouchableOpacity style={localStyles.userDetailContainer}>
        <ZText
          align={'center'}
          type="s14"
          style={styles.ml5}
          color={colors.textColor}>
          {userName}
        </ZText>
      </TouchableOpacity>
    </View>
  );
}

const localStyles = StyleSheet.create({
  postContainer: {
    width: '50%',
    flex: 1,
  },
  postImgStyle: {
    height: getHeight(280),
    ...styles.mt15,
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
    left: 10,
    top: 10,
  },
  liveContainerStyle: {
    ...styles.ph10,
    ...styles.pv5,
    borderRadius: moderateScale(5),
  },
  userContainer: {
    ...styles.rowCenter,
    ...styles.ph10,
    ...styles.pv5,
    ...styles.ml5,
    borderRadius: moderateScale(12),
  },
  userImage: {
    height: moderateScale(24),
    width: moderateScale(24),
    borderRadius: moderateScale(12),
  },
  userDetailContainer: {
    // ...styles.flexRow,
    // ...styles.itemsCenter,
    // ...styles.selfStart,
    ...styles.mt10,
    // ...styles.ml10,
  },
});
