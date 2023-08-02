import {Pressable, StyleSheet} from 'react-native';
import React, {useState} from 'react';
import {styles} from '../../../themes';
import ZText from '../../../components/common/ZText';
import {moderateScale} from '../../../common/constants';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

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

  const handlePress = () => {
    if (isLiked === true) {
      setisLiked(false);
      setlikesNoLocally(number => number - 1);
    } else {
      setisLiked(true);
      setlikesNoLocally(number => Number(number) + 1);
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
        <Ionicons
          name={icon}
          size={size ? size : moderateScale(30)}
          color={isLiked ? color : colors.white}
        />
        {!!likesNoLocally && (
          <ZText
            type="m14"
            style={styles.flex}
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
        <Ionicons
          name={icon}
          size={size ? size : moderateScale(30)}
          color={color ? color : colors.white}
        />
        {!!data && (
          <ZText
            type="m14"
            style={styles.flex}
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
    ...styles.mt20,
  },
});
