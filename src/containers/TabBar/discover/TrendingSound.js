// Library import
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import {getHeight, moderateScale} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import strings from '../../../i18n/strings';
import ReelComponent from '../../../components/ReelComponent';
import ZHeader from '../../../components/common/ZHeader';
import ZButton from '../../../components/common/ZButton';
import {videoData} from '../../../api/constant';
import UserDetailComponent from '../../../components/UserDetailComponent';

export default function TrendingSound({route}) {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const item = route?.params?.item;

  const RightIcon = () => {
    return (
      <TouchableOpacity>
        <Ionicons
          name="arrow-redo"
          size={moderateScale(26)}
          color={colors.textColor}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.trendingSounds} rightIcon={<RightIcon />} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={localStyles.soundContainer}>
        <TouchableOpacity style={localStyles.headerItemContainer}>
          <View>
            <Image
              source={{
                uri: item?.imgUrl,
              }}
              style={localStyles.soundImage}
            />
            <View style={localStyles.playIconStyle}>
              <Ionicons
                name="play-circle"
                size={moderateScale(28)}
                color={colors.white}
              />
            </View>
          </View>
          <View style={[styles.ml20, styles.flex]}>
            <ZText type="b24" numberOfLines={2}>
              {item?.title}
            </ZText>
            <ZText
              type="m14"
              numberOfLines={2}
              color={colors.dark ? colors.grayScale3 : colors.grayScale7}
              style={styles.mt10}>
              {item?.totalViews + ' ' + strings.video}
            </ZText>
          </View>
        </TouchableOpacity>
        <View style={localStyles.btnContainer}>
          <ZButton
            title={strings.playSong}
            color={colors.primary}
            textType="b14"
            style={styles.ml5}
            containerStyle={[
              localStyles.buttonContainer,
              {borderColor: colors.primary},
            ]}
            bgColor={colors.tranparent}
            frontIcon={
              <Ionicons
                name="play-circle-outline"
                size={moderateScale(18)}
                color={colors.primary}
              />
            }
          />
          <ZButton
            title={strings.AddFavorites}
            color={colors.primary}
            textType="b14"
            style={styles.ml5}
            containerStyle={[
              localStyles.buttonContainer,
              {borderColor: colors.primary},
            ]}
            bgColor={colors.tranparent}
            frontIcon={
              <Ionicons
                name="bookmark"
                size={moderateScale(18)}
                color={colors.primary}
              />
            }
          />
        </View>
        <UserDetailComponent
          userName={item?.artist}
          userImage={item?.artistUrl}
          userDescription={item?.artistDesc}
        />
        <FlatList
          data={videoData}
          renderItem={({item, index}) => (
            <ReelComponent
              data={item?.views}
              reelUrl={item?.poster}
              isPlay={true}
            />
          )}
          numColumns={3}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={[
            localStyles.renderItemCoontainer,
            {
              borderTopColor: colors.bColor,
            },
          ]}
        />
      </ScrollView>
      <ZButton
        title={strings.useThisSound}
        textType="b16"
        style={styles.ml5}
        color={colors.white}
        containerStyle={localStyles.bottomBtnContainer}
        bgColor={colors.primary}
        frontIcon={
          <Ionicons
            name="musical-notes"
            size={moderateScale(18)}
            color={colors.white}
            style={styles.mr5}
          />
        }
      />
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  soundContainer: {
    ...styles.mv10,
    ...styles.ph20,
  },
  soundImage: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(12),
  },
  playIconStyle: {
    ...styles.rowCenter,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  rightContainer: {
    ...styles.pl10,
    ...styles.rowCenter,
  },
  headerItemContainer: {
    ...styles.rowCenter,
  },
  btnContainer: {
    ...styles.flexRow,
    ...styles.justifyEvenly,
    ...styles.mv20,
  },
  buttonContainer: {
    ...styles.ph15,
    height: getHeight(40),
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    width: '46%',
  },
  renderItemCoontainer: {
    ...styles.pt20,
    ...styles.mt15,
    borderTopWidth: moderateScale(1),
  },
  bottomBtnContainer: {
    ...styles.mh30,
  },
});
