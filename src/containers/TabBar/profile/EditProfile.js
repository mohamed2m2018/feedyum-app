// Library import
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo} from 'react';
import {useSelector} from 'react-redux';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import images from '../../../assets/images';
import ZText from '../../../components/common/ZText';
import {SectionList} from 'react-native';
import {editProfileData} from '../../../api/constant';
import {StackNav} from '../../../navigation/NavigationKeys';
import strings from '../../../i18n/strings';
import {useRoute} from '@react-navigation/native';

export default function EditProfile({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  const route = useRoute();
  const {user} = route.params;

  const onPressEditProfile = () =>
    navigation.navigate(StackNav.SetUpProfile, {title: strings.editProfile});

  // eslint-disable-next-line react/no-unstable-nested-components
  const RenderInfoItem = memo(({item}) => {
    return (
      <TouchableOpacity
        style={localStyles.infoContainer}
        onPress={onPressEditProfile}>
        <View style={styles.rowCenter}>
          <Ionicons
            name={item.icon}
            size={moderateScale(26)}
            color={colors.textColor}
            style={styles.mr10}
          />
          <ZText type="s18">{item.type}</ZText>
        </View>
        <View style={[styles.flexRow, styles.flex]}>
          <ZText
            type="s18"
            numberOfLines={1}
            align="right"
            style={[styles.flex, styles.mh10]}>
            {item.value}
          </ZText>
          <Ionicons
            name="chevron-forward-outline"
            size={moderateScale(20)}
            color={colors.textColor}
          />
        </View>
      </TouchableOpacity>
    );
  });

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.editProfile} />
      <ScrollView
        contentContainerStyle={styles.ph20}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View
          style={[
            localStyles.userImageContainer,
            {borderBottomColor: colors.bColor},
          ]}>
          <TouchableOpacity onPress={onPressEditProfile} style={styles.mt40}>
            <Image
              source={
                user?.avatar
                  ? {uri: user?.avatar}
                  : colors.dark
                  ? images.userDark
                  : images.userLight
              }
              style={localStyles.userImage}
            />
            <MaterialIcon
              name="pencil-box"
              size={moderateScale(30)}
              color={colors.primary}
              style={localStyles.editIcon}
            />
          </TouchableOpacity>
        </View>
        <SectionList
          sections={editProfileData(user?.fullName, user?.email)}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => <RenderInfoItem item={item} key={item.id} />}
          renderSectionHeader={({section: {title}}) => (
            <View
              style={[
                localStyles.titleContainer,
                {borderTopColor: colors.bColor},
              ]}>
              <ZText type={'b20'}>{title}</ZText>
            </View>
          )}
          stickyHeaderHiddenOnScroll={true}
          bounces={false}
          showsVerticalScrollIndicator={false}
        />
      </ScrollView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  userImageContainer: {
    ...styles.flexRow,
    ...styles.justifyCenter,
    ...styles.pb30,
  },
  userImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  infoContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mb25,
  },
  titleContainer: {
    ...styles.pt30,
    ...styles.mb30,
    borderTopWidth: moderateScale(1),
  },
});
