// Library import
import {
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

// Local import
import images from '../assets/images';
import {getHeight, moderateScale} from '../common/constants';
import ZText from '../components/common/ZText';
import {styles} from '../themes';
import {StackNav, TabNav} from '../navigation/NavigationKeys';
import request from '../api/request';
import {useQueryClient} from 'react-query';

export default function ReelComponent({
  data = {},
  isPlay = false,
  reelUrl = '',
  style,
  id,
  item = {},
  isDeleteAllowed = false,
}) {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const onDeleteStory = async () => {
    try {
      await request.delete(`story/deleteById/${id}`);
      queryClient.invalidateQueries('stories'); // Invalidate the 'stories' query to trigger a refetch
      queryClient.invalidateQueries('user');
      queryClient.invalidateQueries({queryKey: 'profile-stories'});
      queryClient.invalidateQueries({queryKey: 'stories_following'});
      queryClient.invalidateQueries({queryKey: 'search_user'});
      queryClient.invalidateQueries({queryKey: 'followStatistics'});
      // Handle success or show feedback to the user
    } catch (error) {
      // Handle error or show error message to the user
    }
  };

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
      {isDeleteAllowed && (
        <TouchableOpacity
          onPress={onDeleteStory}
          style={localStyles.deleteIconStyle}
          activeOpacity={0.7}>
          <FontAwesome
            name="trash-o"
            size={moderateScale(24)}
            color={colors.white}
          />
        </TouchableOpacity>
      )}

      {isDeleteAllowed && (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate(StackNav.PostDetail, {
              postDataToBeEdited: item,
            });
          }}
          style={localStyles.editIconStyle}
          activeOpacity={0.7}>
          <Ionicons
            name="pencil"
            size={moderateScale(24)}
            color={colors.white}
          />
        </TouchableOpacity>
      )}
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
  deleteIconStyle: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
    zIndex: 1,
  },
  editIconStyle: {
    position: 'absolute',
    bottom: moderateScale(100),
    right: moderateScale(10),
  },
});
