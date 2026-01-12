import { Pressable, StyleSheet, View } from 'react-native';
import React, { useState } from 'react';
import { styles } from '../../../themes';
import ZText from '../../../components/common/ZText';
import { moderateScale } from '../../../common/constants';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useHandleAuth } from '../../../utils/useHandleAuth';

export const VideoItem = ({
  onPress,
  initialIsLiked,
  data,
  size,
  color,
  icon,
  id,
  likeRef,
  index,
}) => {
  const [isLiked, setisLiked] = useState(initialIsLiked);
  const colors = useSelector(state => state.theme.theme);
  const [likesNoLocally, setlikesNoLocally] = useState(data);
  const { handleAuthToast } = useHandleAuth();

  const handlePress = () => {
    if (handleAuthToast()) {
      return;
    }
    if (isLiked?._id || isLiked) {
      setisLiked(false);
      setlikesNoLocally(number => Number(number) - 1);
    } else {
      setisLiked(true);
      setlikesNoLocally(number => {
        return (number ? Number(number) : 0) + 1;
      });
    }
    onPress(id, isLiked);
  };
  React.useEffect(() => {
    if (likeRef?.current) {
      likeRef.current[index] = handlePress;
    }
  }, [index, isLiked]);

  if (icon === 'heart') {
    return (
      <Pressable onPress={handlePress} style={localStyles.renderIconContainer}>
        <View style={[localStyles.iconBackground, isLiked && localStyles.iconBackgroundActive]}>
          <Ionicons
            name={icon}
            size={size ? size : moderateScale(26)}
            color={isLiked ? color : colors.white}
            style={localStyles.iconShadow}
          />
        </View>
        {!!likesNoLocally && (
          <ZText
            type="m14"
            style={localStyles.countText}
            color={colors.white}
            numberOfLines={1}>
            {likesNoLocally}
          </ZText>
        )}
      </Pressable>
    );
  } else {
    return (
      <Pressable onPress={onPress} style={localStyles.renderIconContainer}>
        <View style={localStyles.iconBackground}>
          <Ionicons
            name={icon}
            size={size ? size : moderateScale(26)}
            color={color ? color : colors.white}
            style={localStyles.iconShadow}
          />
        </View>
        {!!data && (
          <ZText
            type="m14"
            style={localStyles.countText}
            color={colors.white}
            numberOfLines={1}>
            {data}
          </ZText>
        )}
      </Pressable>
    );
  }
};

const localStyles = StyleSheet.create({
  renderIconContainer: {
    ...styles.itemsCenter,
    marginTop: moderateScale(16),
  },
  iconBackground: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconBackgroundActive: {
    backgroundColor: 'rgba(255, 75, 100, 0.2)',
    borderColor: 'rgba(255, 75, 100, 0.3)',
  },
  iconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  countText: {
    marginTop: moderateScale(4),
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontWeight: '600',
  },
});
