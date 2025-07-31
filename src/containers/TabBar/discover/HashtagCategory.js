// Library import
import {
  FlatList,
  I18nManager,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

// Local import
import {moderateScale} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import ReelComponent from '../../../components/ReelComponent';
import {StackNav, TabNav} from '../../../navigation/NavigationKeys';
import {useInfiniteQuery} from 'react-query';
import request from '../../../api/request';
import ZLoader from '../../../components/common/ZLoader';
import { useStorage } from '../../../utils/useStorage';
import images from '../../../assets/images';

export default function HashtagCategory({selectedTag}) {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const [userPage, setUserPage] = useState(1);
  const [limit] = useState(10);
  const [user] = useStorage('user');
  const {
    isLoading: isLoadingUsers,
    data: userPages,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    ['users', selectedTag, userPage],
    ({pageParam = 1}) =>
      request
        .get(`/user/tag/${selectedTag}`, {params: {page: pageParam, limit}})
        .then(res => res.data),
    {
      getNextPageParam: lastPage => lastPage?.currentPage + 1,
      enabled: !!selectedTag,
    },
  );


  const onPressUser = (id, userName, userImage) => {
    if (user?._id === id) {
      navigation.navigate(TabNav.Profile);
    } else {
      navigation.navigate(StackNav.ProfileDetail, {
        userName,
        userImage,
        id,
      });
    }
  };

  const onPressTrendingHashtag = item =>
    navigation.navigate(StackNav.TrendingHashtag, {item: item});
  const RenderSoundsItem = useCallback(
    ({item, index}) => {
      return (
        <View key={index} style={localStyles.hashtagContainer}>
          <TouchableOpacity
            onPress={()=>onPressUser( item?._id, item?.fullName, item?.avatar)}
            style={localStyles.renderItemCoontainer}>
            <View
              style={[
                localStyles.hashtagImgContainer,
                {
                  backgroundColor: colors.primaryTransparent,
                },
              ]}>
              <Image
                style={localStyles.hashtagImgContainer}
                source={item?.avatar? {uri: item?.avatar} : images.userDark}
              />
            </View>
            <View style={[styles.mh10, styles.flex]}>
              <View style={localStyles.chefNameContainer}>
                <ZText type="b18" numberOfLines={1} style={styles.flex}>
                  {item.fullName}
                </ZText>
                {/* Debug: Show user type */}
                {console.log('User type:', item.type, 'for user:', item.fullName)}
                {/* Visit Menu Button - Show for all users temporarily for testing */}
                <TouchableOpacity
                  style={[
                    localStyles.visitMenuButton,
                    {backgroundColor: colors.primary},
                  ]}
                  onPress={() => {
                    console.log('Menu button pressed for:', item.fullName);
                    navigation.navigate(StackNav.ChefMenu, {
                      chefId: item._id,
                      chefName: item.fullName,
                    });
                  }}
                  activeOpacity={0.8}>
                  <Ionicons
                    name="restaurant-outline"
                    size={moderateScale(14)}
                    color={colors.white}
                  />
                  <ZText style={localStyles.visitMenuText} color={colors.white}>
                    Menu
                  </ZText>
                </TouchableOpacity>
              </View>
              <ZText
                type="m14"
                numberOfLines={2}
                color={colors.dark ? colors.grayScale3 : colors.grayScale7}
                style={styles.mt5}>
                {item?.bio || 'Sharing delicious food content'}
              </ZText>
              {/* Food Reels Indicator */}
              <View style={localStyles.reelsIndicator}>
                <Ionicons
                  name="videocam"
                  size={moderateScale(12)}
                  color={colors.primary}
                />
                <ZText
                  type="m12"
                  color={colors.primary}
                  style={styles.ml5}>
                  Food Reels
                </ZText>
              </View>
            </View>
            <TouchableOpacity style={localStyles.rightContainer}>
              <Ionicons
                name={I18nManager.isRTL? "chevron-back-outline": "chevron-forward-outline"}
                size={moderateScale(22)}
                color={colors.primary}
              />
            </TouchableOpacity>
          </TouchableOpacity>
          <FlatList
            data={item.stories.slice(0,3)} // Display the first 3 stories for each user
            renderItem={({item: story, index}) => (
              <ReelComponent
                data={story?.views}
                reelUrl={
                  story?.poster?.replace(
                    'https://foodtokforever.s3.amazonaws.com',
                    'https://d1wfcrbbkg3bzd.cloudfront.net',
                  ) ||
                  story?.avatarUri?.replace(
                    'https://foodtokforever.s3.amazonaws.com',
                    'https://d1wfcrbbkg3bzd.cloudfront.net',
                  )
                }
                id={story?._id}
                profileId={item}
                item={story}
                isPlay={!story?.poster && !story?.avatarUri}
              />
            )}
            numColumns={3}
            keyExtractor={(story, index) => index.toString()}
            contentContainerStyle={localStyles.gridContainer}
            columnWrapperStyle={localStyles.gridRow}
          />
        </View>
      );
    },
    [colors, navigation, styles],
  );

  if (isLoadingUsers) {
    return  <ZLoader absolute height={80} top={300} />
  }
  return (
    <FlatList
      data={userPages?.pages?.flatMap(page => page.users)}
      renderItem={({item, index}) => (
        <RenderSoundsItem item={item} index={index} />
      )}
      showsVerticalScrollIndicator={false}
      bounces={false}
      keyExtractor={(item, index) => item._id.toString()}
      onEndReached={() => {
        if (hasNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
    />
  );
}

const localStyles = StyleSheet.create({
  hashtagContainer: {
    ...styles.mv10,
    ...styles.ph20,
  },
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
    ...styles.mv15,
  },
  hashtagImgContainer: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    ...styles.rowCenter,
  },
  chefNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  visitMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(15),
    gap: moderateScale(4),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  visitMenuText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  reelsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },
  gridContainer: {
    paddingHorizontal: moderateScale(8),
  },
  gridRow: {
    justifyContent: 'flex-start',
    paddingHorizontal: moderateScale(0),
  },
});
