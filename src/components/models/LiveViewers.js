// Library import
import {FlatList, StyleSheet, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import ActionSheet from 'react-native-actions-sheet';
import {useSelector} from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';

// Local import
import {moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import ZText from '../common/ZText';
import {userDetail} from '../../api/constant';
import strings from '../../i18n/strings';
import UserDetailComponent from '../UserDetailComponent';
import ZInput from '../common/ZInput';

export default function LiveViewers(props) {
  const colors = useSelector(state => state.theme.theme);
  const {SheetRef} = props;

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
  const [data, setData] = useState([]);
  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchIconStyle, setSearchIconStyle] = useState(BlurredIconStyle);

  useEffect(() => {
    setData(userDetail);
  }, []);

  useEffect(() => {
    filterData();
  }, [search]);

  const filterData = () => {
    if (!!search) {
      const filteredData = userDetail.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      );
      setData(filteredData);
    } else {
      setData(userDetail);
    }
  };

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

  return (
    <ActionSheet
      ref={SheetRef}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
      <View
        style={[
          localStyles.headerContainer,
          {
            borderBottomColor: colors.bColor,
          },
        ]}>
        <ZText type="b24" align={'center'} style={styles.mb20}>
          {'13K Viewers'}
        </ZText>
      </View>
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
      />
      <FlatList
        data={data}
        renderItem={({item, index}) => (
          <UserDetailComponent
            userName={item?.name}
            userImage={item?.imgUrl}
            isFollowed={item?.isFollow}
            key={index}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.pb40}
        showsVerticalScrollIndicator={false}
        bounces={false}
      />
    </ActionSheet>
  );
}

const localStyles = StyleSheet.create({
  actionSheetContainer: {
    ...styles.p20,
    height: '80%',
  },
  headerContainer: {
    ...styles.pb5,
    ...styles.mb5,
    borderBottomWidth: 1,
  },
  inputContainerStyle: {
    borderRadius: moderateScale(15),
    borderWidth: moderateScale(1),
  },
  inputBoxStyle: {
    ...styles.ph15,
  },
});
