import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

import ZText from './common/ZText';
import {styles} from '../themes';
import {moderateScale} from '../common/constants';

export default function CommentComponent(props) {
  const {item} = props;
  const colors = useSelector(state => state.theme.theme);
  const [isLike, setIsLike] = React.useState(false);

  const onPressLike = () => setIsLike(!isLike);

  return (
    <View style={localStyles.rootContainer}>
      <TouchableOpacity style={localStyles.userItem}>
        <Image
          source={{
            uri: item?.imgUrl,
          }}
          style={localStyles.imageStyle}
        />
        <View style={localStyles.userDescription}>
          <ZText type="m14" numberOfLines={1}>
            {item?.name}
          </ZText>

          <ZText
            type="b18"
            style={styles.mt5}
            color={colors.dark ? colors.grayScale3 : colors.grayScale7}
            numberOfLines={1}>
            {item?.description}
          </ZText>
        </View>
        <View>
          <TouchableOpacity onPress={onPressLike}>
            <Ionicons
              name={isLike ? 'heart-outline' : 'heart'}
              size={moderateScale(20)}
              color={isLike ? colors.textColor : colors.primary}
            />
          </TouchableOpacity>
          <ZText
            type="m14"
            style={styles.mt5}
            color={colors.dark ? colors.grayScale3 : colors.grayScale7}
            numberOfLines={1}>
            {item?.commentLike}
          </ZText>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const localStyles = StyleSheet.create({
  rootContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt15,
    ...styles.flex,
  },
  userItem: {
    flex: 1,
    ...styles.rowCenter,
  },
  userDescription: {
    ...styles.mh10,
    ...styles.flex,
  },
  imageStyle: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    resizeMode: 'cover',
  },
});
