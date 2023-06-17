// Library import
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import React from 'react';

// Local import
import ZText from './common/ZText';
import {moderateScale} from '../common/constants';
import {styles} from '../themes';

export default function SoundComponent({
  imgUrl,
  title,
  artist,
  time,
  totalViews,
  isforwadIcon = false,
  onPressSound = () => {},
}) {
  const colors = useSelector(state => state.theme.theme);
  return (
    <TouchableOpacity
      onPress={onPressSound}
      style={localStyles.renderItemCoontainer}>
      <Image
        source={{
          uri: imgUrl,
        }}
        style={localStyles.soundImage}
      />

      <View style={[styles.mh10, styles.flex]}>
        <ZText type="b18" numberOfLines={1}>
          {title}
        </ZText>
        <ZText
          type="m14"
          numberOfLines={2}
          color={colors.dark ? colors.grayScale3 : colors.grayScale7}
          style={styles.mt5}>
          {artist}
        </ZText>
        <ZText
          type="m14"
          numberOfLines={2}
          color={colors.dark ? colors.grayScale3 : colors.grayScale7}
          style={styles.mt5}>
          {time}
        </ZText>
      </View>
      <TouchableOpacity style={localStyles.rightContainer}>
        <ZText
          type="b14"
          color={colors.dark ? colors.grayScale3 : colors.grayScale7}
          style={styles.mr5}>
          {totalViews}
        </ZText>
        {!!isforwadIcon && (
          <Ionicons
            name="chevron-forward-outline"
            size={moderateScale(22)}
            color={colors.primary}
          />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const localStyles = StyleSheet.create({
  soundImage: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(10),
  },
  rightContainer: {
    ...styles.pl10,
    ...styles.rowCenter,
  },
  renderItemCoontainer: {
    ...styles.rowCenter,
    ...styles.mt15,
  },
});
