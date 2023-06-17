// Library import
import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useCallback} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

// Local import
import {
  getHeight,
  getVideoExtension,
  moderateScale,
} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import ReelComponent from '../../../components/ReelComponent';
import {StackNav} from '../../../navigation/NavigationKeys';
import {hashtagTreandingData, videoData} from '../../../api/constant';
import ZButton from '../../../components/common/ZButton';

export default function HashtagCategory() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  const onPressTrendingHashtag = item =>
    navigation.navigate(StackNav.TrendingHashtag, {item: item});

  const RenderSoundsItem = useCallback(
    ({item, index}) => {
      return (
        <View key={index} style={localStyles.hashtagContainer}>
          <TouchableOpacity
            onPress={() => onPressTrendingHashtag(item)}
            style={localStyles.renderItemCoontainer}>
            <View
              style={[
                localStyles.hashtagImgContainer,
                {
                  backgroundColor: colors.primaryTransparent,
                },
              ]}>
              <ZText type="s28" color={colors.primary} numberOfLines={1}>
                {'#'}
              </ZText>
            </View>
            <View style={[styles.mh10, styles.flex]}>
              <ZText type="b18" numberOfLines={1}>
                Order From صفاء للأكل البيتي
              </ZText>
              <ZText
                type="m14"
                numberOfLines={2}
                color={colors.dark ? colors.grayScale3 : colors.grayScale7}
                style={styles.mt5}>
                Arrives Tomorrow
              </ZText>
            </View>
            <TouchableOpacity style={localStyles.rightContainer}>
              <ZText
                type="b14"
                color={colors.dark ? colors.grayScale3 : colors.grayScale7}
                style={styles.mr5}>
                440EGP
              </ZText>
              <Ionicons
                name="chevron-forward-outline"
                size={moderateScale(22)}
                color={colors.primary}
              />
            </TouchableOpacity>
          </TouchableOpacity>
          <FlatList
            data={videoData.slice(0, 3)}
            ListFooterComponent={() => (
              <ZButton
                title={'Track Order'}
                textType={'b18'}
                color={colors.white}
                containerStyle={{
                  height: getHeight(50),
                  borderRadius: moderateScale(20),
                  borderWidth: moderateScale(1),
                  width: '100%',
                  marginTop: 20,
                  alignSelf: 'center',
                }}
                onPress={() => {}}
              />
            )}
            renderItem={({item, index}) => (
              <ReelComponent
                data={item?.views}
                reelUrl={item?.uri?.replace(
                  getVideoExtension(item?.uri),
                  'jpg',
                )}
              />
            )}
            numColumns={3}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      );
    },
    [hashtagTreandingData],
  );

  return (
    <FlatList
      data={hashtagTreandingData}
      renderItem={({item, index}) => (
        <RenderSoundsItem item={item} index={index} />
      )}
      showsVerticalScrollIndicator={false}
      bounces={false}
      keyExtractor={(item, index) => index.toString()}
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
});
