// Library import
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import ZText from '../../../components/common/ZText';

export default function Call({route}) {
  const userName = route.params?.userName;
  const userImage = route.params?.userImage;

  const colors = useSelector(state => state.theme.theme);

  const RenderIconList = ({icon, color}) => {
    return (
      <TouchableOpacity
        style={[
          localStyles.iconStyle,
          {
            backgroundColor: color,
          },
        ]}>
        <Ionicons name={icon} size={moderateScale(40)} color={colors.white} />
      </TouchableOpacity>
    );
  };
  return (
    <ZSafeAreaView>
      <ZHeader />
      <View style={localStyles.rootContainer}>
        <Image
          source={{
            uri: userImage,
          }}
          style={[
            localStyles.imageStyle,
            {
              borderColor: colors.primary,
            },
          ]}
        />
        <ZText color={colors.grayScale6} style={styles.mt30} type="b32">
          {userName}
        </ZText>
      </View>
      <View style={localStyles.iconContainer}>
        <RenderIconList icon="close" color={colors.primary} />
        <RenderIconList icon="videocam-outline" color={colors.blue} />
        <RenderIconList icon="volume-high" color={colors.orange} />
      </View>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  rootContainer: {
    ...styles.flex,
    ...styles.center,
    ...styles.ph20,
  },
  imageStyle: {
    width: moderateScale(180),
    height: moderateScale(180),
    borderRadius: moderateScale(90),
    borderWidth: moderateScale(8),
  },
  iconContainer: {
    ...styles.flexRow,
    ...styles.justifyEvenly,
    ...styles.mt20,
    ...styles.mh30,
  },
  iconStyle: {
    height: moderateScale(76),
    width: moderateScale(76),
    borderRadius: moderateScale(38),
    ...styles.center,
  },
});
