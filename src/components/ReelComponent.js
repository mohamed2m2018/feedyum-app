// Library import
import {
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import millify from 'millify';

// Local import
import images from '../assets/images';
import {getHeight, moderateScale} from '../common/constants';
import ZText from '../components/common/ZText';
import {styles} from '../themes';
import {StackNav} from '../navigation/NavigationKeys';
import request from '../api/request';
import {useQueryClient} from 'react-query';
import strings from '../i18n/strings';

const ReelComponent = ({
  data = 0,
  isPlay = false,
  reelUrl = '',
  style,
  id,
  profileId,
  item = {},
  isDeleteAllowed = false,
  setisLoadingSomething,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const onDeleteStory = async () => {
    try {
      setisLoadingSomething(true);
      await request.delete(`story/deleteById/${id}`);
      queryClient.invalidateQueries('stories');
      queryClient.invalidateQueries('user');
      await queryClient.invalidateQueries({queryKey: 'profile-stories'});
      queryClient.invalidateQueries({queryKey: 'stories_following'});
      queryClient.invalidateQueries({queryKey: 'search_user'});
      queryClient.invalidateQueries({queryKey: 'followStatistics'});
      setisLoadingSomething(false);
      // Handle success or show feedback to the user
    } catch (error) {
      setisLoadingSomething(false);
      // Handle error or show error message to the user
    }
  };

  const confirmDeleteStory = () => {
    Alert.alert(strings.deletePost, strings.areYouSure, [
      {
        text: strings.cancel,
        style: 'cancel',
      },
      {
        text: strings.delete,
        style: 'destructive',
        onPress: onDeleteStory,
      },
    ]);
  };

  const onPressReel = () => {
    navigation.navigate(StackNav.reelsOne, {
      storyId: id,
      profile: profileId,
    });
  };

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
        source={
          reelUrl
            ? {
                uri:
                  item.poster?.replace(
                    'https://foodtokforever.s3.amazonaws.com',
                    'https://d1wfcrbbkg3bzd.cloudfront.net',
                  ) ||
                  item?.avatarUri?.replace(
                    'https://foodtokforever.s3.amazonaws.com',
                    'https://d1wfcrbbkg3bzd.cloudfront.net',
                  ) ||
                  reelUrl?.replace(
                    'https://foodtokforever.s3.amazonaws.com',
                    'https://d1wfcrbbkg3bzd.cloudfront.net',
                  ),
              }
            : images.post
        }
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
        {!!data && (
          <View style={localStyles.playStyle}>
            <Ionicons
              name="eye"
              size={moderateScale(16)}
              color={colors.primary}
            />
            <ZText type="s14" style={styles.ml5} color={colors.white}>
              {data > 10 ? millify(data || 0) : data} views
            </ZText>
          </View>
        )}
      </ImageBackground>
      {isDeleteAllowed && (
        <TouchableOpacity
          onPress={confirmDeleteStory}
          style={localStyles.deleteIconStyle}
          activeOpacity={0.7}>
          <Ionicons
            name="trash"
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
      <View style={styles.textContainer}>
        <ZText style={[localStyles.titleText, {color: colors.textColor}]}>
          {item?.title}
        </ZText>
        {!!item?.price && (
          <ZText style={[localStyles.priceText, {color: colors.textColor}]}>
            {item?.price} LE
          </ZText>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(ReelComponent);

const localStyles = StyleSheet.create({
  postContainer: {
    width: '33%',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 7,
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
  },
  editIconStyle: {
    position: 'absolute',
    top: moderateScale(50),
    right: moderateScale(10),
  },
  titleText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  priceText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
});
