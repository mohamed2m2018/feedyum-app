// Library import
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import strings from '../../../i18n/strings';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import ZInput from '../../../components/common/ZInput';
import {Control} from '../../../assets/svgs';
import ZText from '../../../components/common/ZText';
import {messageDataList, recenltyDataList} from '../../../api/constant';
import {StackNav} from '../../../navigation/NavigationKeys';

export default function Message({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [search, setSearch] = useState('');
  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchIconStyle, setSearchIconStyle] = useState(BlurredIconStyle);

  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.btnColor1,
  };
  const FocusedStyle = {
    backgroundColor: colors.inputFocusColor,
    borderColor: colors.primary,
  };

  const BlurredIconStyle = colors.placeHolderColor;
  const FocusedIconStyle = colors.primary;

  const onHighlightInput = () => {
    setSearchInputStyle(FocusedStyle);
    setSearchIconStyle(FocusedIconStyle);
  };
  const onUnHighlightInput = () => {
    setSearchInputStyle(BlurredStyle);
    setSearchIconStyle(BlurredIconStyle);
  };

  const onSearchInput = text => setSearch(text);

  const SearchIcon = () => {
    return (
      <Ionicons
        name="search-outline"
        size={moderateScale(20)}
        color={searchIconStyle}
      />
    );
  };

  const RightIcon = () => {
    return (
      <View style={styles.rowCenter}>
        <TouchableOpacity style={styles.pr10}>
          <Ionicons
            name="add-circle-outline"
            size={moderateScale(30)}
            color={colors.textColor}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons
            name="ellipsis-horizontal-circle-outline"
            size={moderateScale(30)}
            color={colors.textColor}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const RenderHeader = ({title}) => {
    return (
      <View>
        <ZText type="b20" style={styles.mt20}>
          {title}
        </ZText>
      </View>
    );
  };

  const RenderStroyItem = memo(({item}) => {
    return (
      <TouchableOpacity
        style={localStyles.storyContainer}
        onPress={() => onPressMessage(item)}>
        <Image
          source={{uri: item?.imageUrl}}
          style={[
            localStyles.userImage,
            {
              borderColor: colors.dark ? colors.primary : colors.grayScale4,
            },
          ]}
        />
        <ZText
          type="s14"
          align={'center'}
          nunberOfLines={1}
          style={styles.mt5}
          color={colors.textColor}>
          {item.name.length > 10
            ? item.name.substring(0, 10) + '...'
            : item.name}
        </ZText>
      </TouchableOpacity>
    );
  });

  const RenderMessageItem = memo(({item}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressMessage(item)}
        style={localStyles.renderItemCoontainer}>
        <Image
          source={{uri: item?.imageUrl}}
          style={localStyles.userMsgImage}
        />
        <View style={styles.flex}>
          <View style={localStyles.userName}>
            <ZText type="b18" numberOfLines={1}>
              {item?.name}
            </ZText>
            {item?.pending !== 0 && (
              <View
                style={[
                  localStyles.pendingContainer,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}>
                <ZText type="m14" numberOfLines={2} color={colors.white}>
                  {item?.pending.length > 9
                    ? item?.pending.substring(0, 9) + '...'
                    : item?.pending}
                </ZText>
              </View>
            )}
          </View>
          <View style={localStyles.userName}>
            <ZText type="m14" color={colors.grayScale5} numberOfLines={1}>
              {item?.message}
            </ZText>
            <ZText type="m14" color={colors.grayScale5}>
              {item?.time}
            </ZText>
          </View>
        </View>
      </TouchableOpacity>
    );
  });

  const onPressMessage = item =>
    navigation.navigate(StackNav.Chat, {
      userName: item.name,
      userImage: item.imageUrl,
    });

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.messages} rightIcon={<RightIcon />} />
      <ScrollView
        style={styles.ph20}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pb20}
        bounces={false}>
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
          inputBoxStyle={styles.ph15}
          _onFocus={onHighlightInput}
          onBlur={onUnHighlightInput}
          rightAccessory={() => <Control />}
        />
        <RenderHeader title={strings.recently} />
        <FlatList
          data={recenltyDataList}
          renderItem={({item, index}) => (
            <RenderStroyItem item={item} key={index} />
          )}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={localStyles.flatListStoryContainer}
        />

        <FlatList
          data={messageDataList}
          renderItem={({item, index}) => (
            <RenderMessageItem item={item} key={index} />
          )}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          bounces={false}
          ListHeaderComponent={() => <RenderHeader title={strings.message} />}
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
  userImage: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderWidth: moderateScale(2),
    borderRadius: moderateScale(32),
  },
  flatListStoryContainer: {
    ...styles.mt20,
    ...styles.mb10,
  },
  storyContainer: {
    ...styles.mr15,
    ...styles.nonFlexCenter,
  },
  renderItemCoontainer: {
    ...styles.rowCenter,
    ...styles.mt20,
  },
  userMsgImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
  },
  userName: {
    ...styles.mh10,
    ...styles.flex,
    ...styles.rowSpaceBetween,
  },
  pendingContainer: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: 20,
  },
});
