// Library import
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

// Local import
import {getHeight, moderateScale} from '../../../common/constants';
import strings from '../../../i18n/strings';
import ZHeader from '../../../components/common/ZHeader';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZInput from '../../../components/common/ZInput';
import {styles} from '../../../themes';
import {Control} from '../../../assets/svgs';
import UserDetailComponent from '../../../components/UserDetailComponent';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import {findFriendsData, userDetail} from '../../../api/constant';
import {useNavigation} from '@react-navigation/native';
import {StackNav} from '../../../navigation/NavigationKeys';

export default function FindFriends() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.btnColor1,
  };
  const FocusedStyle = {
    backgroundColor: colors.inputFocusColor,
    borderColor: colors.primary,
  };

  const BlurredIconStyle = colors.grayScale5;
  const FocusedIconStyle = colors.primary;

  const [search, setSearch] = useState('');
  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchIconStyle, setSearchIconStyle] = useState(BlurredIconStyle);

  const onSearchInput = text => setSearch(text);

  const SearchIcon = () => {
    return (
      <Feather name="search" size={moderateScale(20)} color={searchIconStyle} />
    );
  };

  const onHighlightInput = () => {
    setSearchInputStyle(FocusedStyle);
    setSearchIconStyle(FocusedIconStyle);
  };
  const onUnHighlightInput = () => {
    setSearchInputStyle(BlurredStyle);
    setSearchIconStyle(BlurredIconStyle);
  };

  const onPressScanIcon = () => {
    navigation.navigate(StackNav.QrCode);
  };

  const RightIcon = () => {
    return (
      <TouchableOpacity onPress={onPressScanIcon}>
        <Ionicons
          name="scan-outline"
          size={moderateScale(26)}
          color={colors.textColor}
        />
      </TouchableOpacity>
    );
  };

  const RenderHeaderItem = ({item, index}) => {
    return (
      <View style={localStyles.rootContainer}>
        <TouchableOpacity style={localStyles.userItem}>
          <View
            style={[
              localStyles.imageStyle,
              {
                backgroundColor: colors.primaryTransparent,
              },
            ]}>
            <Ionicons
              name={item?.icon}
              size={moderateScale(24)}
              color={colors.grayScale5}
            />
          </View>
          <View style={{...styles.mh10, ...styles.flex}}>
            <ZText type="b18" numberOfLines={1}>
              {item?.title}
            </ZText>
            <ZText
              type="m14"
              style={styles.mt5}
              color={colors.dark ? colors.grayScale3 : colors.grayScale7}
              numberOfLines={1}>
              {item?.description}
            </ZText>
          </View>
        </TouchableOpacity>
        <ZButton
          title={item?.btn}
          color={colors.white}
          textType="b14"
          containerStyle={[
            localStyles.buttonContainer,
            {borderColor: colors.primary},
          ]}
          bgColor={colors.primary}
        />
      </View>
    );
  };

  const UserItemTitle = ({title}) => {
    return (
      <ZText type="b20" numberOfLines={1} style={localStyles.headerTitle}>
        {title}
      </ZText>
    );
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.findFriends} rightIcon={<RightIcon />} />
      <ScrollView style={styles.ph20}>
        <ZInput
          placeHolder={strings.search}
          _value={search}
          keyBoardType={'default'}
          autoCapitalize={'none'}
          insideLeftIcon={() => <SearchIcon />}
          toGetTextFieldValue={onSearchInput}
          inputContainerStyle={[
            {backgroundColor: colors.inputBg},
            localStyles.inputContainerStyle,
            searchInputStyle,
          ]}
          inputBoxStyle={[localStyles.inputBoxStyle]}
          _onFocus={onHighlightInput}
          onBlur={onUnHighlightInput}
          rightAccessory={() => <Control />}
        />
        <FlatList
          data={findFriendsData}
          renderItem={RenderHeaderItem}
          keyExtractor={(item, index) => index.toString()}
          bounces={false}
          showsVerticalScrollIndicator={false}
        />
        <FlatList
          data={userDetail}
          renderItem={({item, index}) => (
            <UserDetailComponent
              userName={item.name}
              userImage={item.imgUrl}
              userDescription={item.description}
              isFollowed={item.isFollow}
              key={index}
            />
          )}
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={() => <UserItemTitle title={'User'} />}
          showsVerticalScrollIndicator={false}
        />
      </ScrollView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  inputContainerStyle: {
    borderRadius: moderateScale(15),
    borderWidth: moderateScale(1),
  },
  inputBoxStyle: {
    ...styles.ph15,
  },
  rootContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt15,
    ...styles.flex,
  },
  userItem: {
    flex: 1,
    ...styles.rowCenter,
  },
  imageStyle: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    ...styles.center,
  },
  buttonContainer: {
    ...styles.ph15,
    height: getHeight(35),
    borderRadius: moderateScale(17),
    borderWidth: moderateScale(1),
  },
  headerTitle: {
    ...styles.ml5,
    ...styles.mt20,
  },
});
