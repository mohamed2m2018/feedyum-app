// Library import
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

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

export default function TrendingHashtag({route}) {
  const colors = useSelector(state => state.theme.theme);
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
      <ZHeader title={strings.trendingHashtags} rightIcon={<RightIcon />} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={localStyles.soundContainer}>
        <View
          style={[
            localStyles.headerItemContainer,
            {
              borderBottomColor: colors.bColor,
            },
          ]}>
          <View
            style={[
              localStyles.hashtagContainer,
              {
                backgroundColor: colors.primaryTransparent,
              },
            ]}>
            <ZText type="s36" color={colors.primary} numberOfLines={1}>
              {'#'}
            </ZText>
          </View>
          <View style={[styles.ml20, styles.flex]}>
            <ZText type="b24" numberOfLines={1}>
              {item.title}
            </ZText>
            <ZText
              type="m14"
              numberOfLines={2}
              color={colors.dark ? colors.grayScale3 : colors.grayScale7}
              style={styles.mt10}>
              {item.totalHashTag + ' ' + strings.video}
            </ZText>
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
        </View>

        <FlatList
          data={videoData}
          renderItem={({item, index}) => (
            <ReelComponent
              data={item.views}
              reelUrl={item.poster}
              isPlay={true}
            />
          )}
          numColumns={3}
          keyExtractor={(item, index) => index.toString()}
        />
      </ScrollView>
      <ZButton
        title={strings.joinThisHashtag}
        textType="b16"
        style={styles.ml5}
        color={colors.white}
        containerStyle={localStyles.bottomBtnContainer}
        bgColor={colors.primary}
        frontIcon={
          <ZText type="s22" style={styles.mr5} color={colors.white}>
            {'#'}
          </ZText>
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
  hashtagContainer: {
    width: moderateScale(110),
    height: moderateScale(110),
    borderRadius: moderateScale(55),
    ...styles.rowCenter,
  },
  headerItemContainer: {
    ...styles.rowCenter,
    ...styles.pb20,
    ...styles.mb15,
    borderBottomWidth: moderateScale(1),
  },
  btnContainer: {
    ...styles.flexRow,
    ...styles.justifyEvenly,
    ...styles.mv20,
  },
  buttonContainer: {
    ...styles.ph15,
    ...styles.mt10,
    height: getHeight(40),
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    width: '75%',
  },
  bottomBtnContainer: {
    ...styles.mh30,
  },
});
