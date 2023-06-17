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

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import {SoundIcon} from '../../../assets/svgs';
import {getHeight, moderateScale} from '../../../common/constants';
import {styles} from '../../../themes';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import images from '../../../assets/images';
import ReelComponent from '../../../components/ReelComponent';
import {useNavigation} from '@react-navigation/native';
import {StackNav} from '../../../navigation/NavigationKeys';

export default function Sound() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  const onPressSingerProfile = () =>
    navigation.navigate(StackNav.ProfileDetail);

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

  const RenderButton = ({title, icon}) => {
    return (
      <ZButton
        onPress={() => {}}
        title={title}
        type={'s16'}
        color={colors.primary}
        frontIcon={
          <Ionicons
            name={icon}
            size={moderateScale(20)}
            color={colors.primary}
            style={styles.mr5}
          />
        }
        bgColor={colors.tranparent}
        containerStyle={[
          localStyles.containerStyle,
          {borderColor: colors.primary},
        ]}
      />
    );
  };

  return (
    <ZSafeAreaView>
      <ZHeader rightIcon={<RightIcon />} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        bounces={false}
        style={styles.ph20}>
        <View style={localStyles.topContainer}>
          <SoundIcon />
          <View style={[styles.flex, styles.ml20]}>
            <ZText type={'B24'} numberOfLines={2}>
              {'Beautiful Girl by Sean Kingston'}
            </ZText>
            <ZText type={'m14'} numberOfLines={1} style={styles.mt20}>
              {'28,7M Videos'}
            </ZText>
          </View>
        </View>
        <View style={localStyles.btnContainer}>
          <RenderButton title={'Play'} icon={'play-circle-outline'} />
          <RenderButton title={'Add to Favorites'} icon={'bookmark'} />
        </View>
        <TouchableOpacity
          style={[
            localStyles.renderItemCoontainer,
            {borderBottomColor: colors.bColor},
          ]}
          onPress={onPressSingerProfile}>
          <View>
            <Image
              source={colors.dark ? images.userDark : images.userLight}
              style={localStyles.userImage}
            />
          </View>
          <View style={[styles.mh10, styles.flex]}>
            <ZText type="b18" numberOfLines={1}>
              {'Sean Kingston'}
            </ZText>
            <ZText type="m14" numberOfLines={2} style={styles.mt5}>
              {'Professional Singer'}
            </ZText>
          </View>
          <TouchableOpacity
            style={[localStyles.followBtn, {backgroundColor: colors.primary}]}>
            <ZText color={colors.textRevertColor} type="b14">
              {'Follow'}
            </ZText>
          </TouchableOpacity>
        </TouchableOpacity>

        <FlatList
          data={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
          renderItem={({item, index}) => <ReelComponent isPlay={true} />}
          numColumns={3}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.mt15}
        />
      </ScrollView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  topContainer: {
    ...styles.rowStart,
    ...styles.itemsCenter,
    ...styles.mt20,
  },
  btnContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  containerStyle: {
    width: '48%',
    height: getHeight(40),
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
  },
  renderItemCoontainer: {
    ...styles.rowCenter,
    ...styles.pv20,
    borderBottomWidth: moderateScale(1),
  },
  userImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
  },
  followBtn: {
    ...styles.ph20,
    ...styles.pv10,
    borderRadius: moderateScale(30),
  },
});
