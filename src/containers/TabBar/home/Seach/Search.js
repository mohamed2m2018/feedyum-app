// Library import
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import React, {memo, useState} from 'react';
import {useSelector} from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import debounce from 'lodash.debounce';
// Local import
import ZSafeAreaView from '../../../../components/common/ZSafeAreaView';
import ZInput from '../../../../components/common/ZInput';
import strings from '../../../../i18n/strings';
import {moderateScale} from '../../../../common/constants';
import {styles} from '../../../../themes';
import ZText from '../../../../components/common/ZText';
import SearchUser from './SearchUser';
import SearchVideo from './SearchVideo';
import {searchCategoryData} from '../../../../api/constant';
import {useInfiniteQuery, useQuery} from 'react-query';
import request from '../../../../api/request';

export default function Search() {
  const colors = useSelector(state => state.theme.theme);

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
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchIconStyle, setSearchIconStyle] = useState(BlurredIconStyle);
  const [isSelect, setIsSelect] = useState(0);

  const onSearchInput = text => {
    setSearch(text);
    debounce(() => {
      setDebouncedSearch(text);
    }, 300)();
  };

  const {data} = useQuery('user', () => request.get('/user'), {retry: 1});

  const user = data?.data?.user;

  const searchStory = ({pageParam = 1}) =>
    request.get(`/story/search?page=${pageParam}`, {
      params: {
        searchString: search,
      },
    });

  const {
    data: stories,
    fetchNextPage,
    isFetching: isFetchingsStories,
    isFetchingNextPage,
  } = useInfiniteQuery(['search_story', debouncedSearch], searchStory, {
    keepPreviousData: true,
    enabled: isSelect === 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage =
        lastPage?.data?.currentPage < lastPage?.data?.totalPages
          ? allPages.length + 1
          : undefined;
      return nextPage;
    },

    select: res => res?.pages.flatMap(page => page.data?.stories || []),
  });

  const searchUser = ({pageParam = 1}) =>
    request.get(`/user/search?page=${pageParam}`, {
      params: {
        searchString: search,
        currentUserId: user?._id,
      },
    });

  const {
    data: users,
    fetchNextPage: fetchNextPageUsers,
    isFetching: isFetchingUser,
    isFetchingNextPage: isFetchingNextPageUsers,
  } = useInfiniteQuery(['search_user', debouncedSearch], searchUser, {
    keepPreviousData: true,
    enabled: isSelect === 0,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage =
        lastPage?.data?.currentPage < lastPage?.data?.totalPages
          ? allPages.length + 1
          : undefined;
      return nextPage;
    },

    select: res => res?.pages.flatMap(page => page.data?.users || []),
  });

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

  // eslint-disable-next-line react/no-unstable-nested-components
  const HeaderCategory = memo(({item, index}) => {
    return (
      <TouchableOpacity
        key={index}
        onPress={() => {
          setIsSelect(index);
        }}
        style={[
          localStyles.root,
          {
            borderBottomColor:
              isSelect === index ? colors.primary : colors.dark3,
          },
        ]}>
        <ZText
          type={'s18'}
          align={'center'}
          style={styles.pb20}
          color={isSelect === index ? colors.primary : colors.grayScale7}>
          {item.title}
        </ZText>
      </TouchableOpacity>
    );
  });

  return (
    <ZSafeAreaView>
      <View style={{flex: 1, margin: 10}}>
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
          inputBoxStyle={localStyles.inputBoxStyle}
          _onFocus={onHighlightInput}
          onBlur={onUnHighlightInput}
        />
        <View style={{height: moderateScale(50)}}>
          <FlatList
            data={searchCategoryData}
            keyboardShouldPersistTaps={'always'}
            renderItem={({item, index}) => (
              <HeaderCategory item={item} index={index} />
            )}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={localStyles.mainContainer}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {isSelect === 0 && (
          <>
            <SearchUser
              users={isFetchingUser && !isFetchingNextPageUsers ? [] : users}
              onEndReachedThreshold={0.9}
              isFetching={isFetchingUser}
              onMomentumScrollBegin={fetchNextPageUsers}
              isFetchingNextPage={isFetchingNextPageUsers}
            />
            <Spinner
              visible={isFetchingUser && !isFetchingNextPageUsers}
              style={localStyles.loading}
              size={'large'}
            />
          </>
        )}
        {isSelect === 1 && (
          <View style={{flex: 1}}>
            <SearchVideo
              stories={isFetchingsStories && !isFetchingNextPage ? [] : stories}
              onEndReachedThreshold={0.9}
              isFetching={isFetchingsStories}
              isFetchingNextPage={isFetchingNextPage}
              onMomentumScrollBegin={fetchNextPage}
            />
            {isFetchingsStories && !isFetchingNextPage && (
              <ActivityIndicator style={localStyles.loading} size={'large'} />
            )}
          </View>
        )}
      </View>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  rootContainer: {
    ...styles.ph20,
  },
  inputContainerStyle: {
    borderRadius: moderateScale(15),
    borderWidth: moderateScale(1),
  },
  inputBoxStyle: {
    ...styles.ph15,
  },
  mainContainer: {
    ...styles.flexGrow,
    ...styles.mt15,
    height: moderateScale(50),
  },
  root: {
    borderBottomWidth: moderateScale(2),
    ...styles.ph25,
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
