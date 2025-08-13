// Library import
import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {memo, useCallback, useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import debounce from 'debounce';
// Local import
import ZSafeAreaView from '../../../../components/common/ZSafeAreaView';
import ZInput from '../../../../components/common/ZInput';
import strings from '../../../../i18n/strings';
import {moderateScale} from '../../../../common/constants';
import {styles} from '../../../../themes';
import ZText from '../../../../components/common/ZText';
import SearchUser from './SearchUser';
import SearchVideo from './SearchVideo';
import SearchDishes from './SearchDishes';
import {useInfiniteQuery, useQuery} from 'react-query';
import request from '../../../../api/request';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {useScreen} from '../../../../navigation/screenContext';
import {TabNav} from '../../../../navigation/NavigationKeys';
import ZLoader from '../../../../components/common/ZLoader';

export default function Search() {
  const colors = useSelector(state => state.theme.theme);

  const searchCategoryData = [
    {
      id: 0,
      title: strings.user,
    },
    {
      id: 1,
      title: strings.posts,
    },
    {
      id: 2,
      title: strings.reviews,
    },
    {
      id: 3,
      title: strings.dishes,
    },
  ];

  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.btnColor1,
  };
  const FocusedStyle = {
    backgroundColor: colors.inputFocusColor,
    borderColor: colors.primary,
  };

  const BlurredIconStyle = colors.grayScale4;
  const FocusedIconStyle = colors.primary;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchIconStyle, setSearchIconStyle] = useState(BlurredIconStyle);
  const [isSelect, setIsSelect] = useState(0);
  const [useSemanticSearch, setUseSemanticSearch] = useState(true); // Toggle for semantic search

  const isFocused = useIsFocused();
  const {updateCurrentScreen} = useScreen();

  useEffect(() => {
    if (isFocused) {
      updateCurrentScreen(TabNav.Search);
    }
  }, [isFocused, updateCurrentScreen]);

  const onSearchInput = text => {
    console.log('Search: User typed:', text);
    setSearch(text);
    debounce(() => {
      console.log('Search: Debounced search term:', text);
      console.log('Search: Using', useSemanticSearch ? 'semantic search' : 'traditional search');
      setDebouncedSearch(text);
    }, 300)();
  };

  const {data} = useQuery('user', () => request.get('/user'), {retry: 1});

  const user = data?.data?.user;

  const searchStory = ({pageParam = null}) => {
    const endpoint = useSemanticSearch ? '/story/semantic-search' : '/story/search';
    const params = {
      searchString: debouncedSearch || '',
      excludeReviews: 'true', // Only regular posts, exclude reviews
      searchType: useSemanticSearch ? 'hybrid' : 'text',
      limit: 10,
    };
    
    // Add cursor for semantic search, page for traditional search
    if (useSemanticSearch && pageParam) {
      params.cursor = pageParam;
    } else if (!useSemanticSearch && pageParam) {
      params.page = pageParam;
    }
    
    return request.get(endpoint, { params });
  };

  const {
    data: stories,
    fetchNextPage,
    isFetching: isFetchingsStories,
    isFetchingNextPage,
    error: storiesError,
  } = useInfiniteQuery(['search_story', debouncedSearch, useSemanticSearch], searchStory, {
    keepPreviousData: true,
    enabled: isSelect === 1 && !!user,
    getNextPageParam: (lastPage, allPages) => {
      if (useSemanticSearch) {
        // For semantic search, use cursor-based pagination
        return lastPage?.data?.data?.pagination?.hasMore 
          ? lastPage?.data?.data?.pagination?.nextCursor 
          : undefined;
      } else {
        // For traditional search, use page-based pagination
        const nextPage =
          lastPage?.data?.data?.currentPage < lastPage?.data?.data?.totalPages
            ? allPages.length + 1
            : undefined;
        return nextPage;
      }
    },

    select: res => {
      const stories = res?.pages.flatMap(page => page.data?.data?.stories || []);
      return stories;
    },
  });

  // New search for review posts only
  const searchReviews = ({pageParam = null}) => {
    const endpoint = useSemanticSearch ? '/story/semantic-search' : '/story/search';
    const params = {
      searchString: debouncedSearch || '',
      reviewsOnly: 'true', // Only review posts
      searchType: useSemanticSearch ? 'hybrid' : 'text',
      limit: 10,
    };
    
    if (useSemanticSearch && pageParam) {
      params.cursor = pageParam;
    } else if (!useSemanticSearch && pageParam) {
      params.page = pageParam;
    }
    
    return request.get(endpoint, { params });
  };

  const {
    data: reviews,
    fetchNextPage: fetchNextPageReviews,
    isFetching: isFetchingReviews,
    isFetchingNextPage: isFetchingNextPageReviews,
    error: reviewsError,
  } = useInfiniteQuery(['search_reviews', debouncedSearch, useSemanticSearch], searchReviews, {
    keepPreviousData: true,
    enabled: isSelect === 2 && !!user,
    getNextPageParam: (lastPage, allPages) => {
      if (useSemanticSearch) {
        return lastPage?.data?.data?.pagination?.hasMore 
          ? lastPage?.data?.data?.pagination?.nextCursor 
          : undefined;
      } else {
        const nextPage =
          lastPage?.data?.data?.currentPage < lastPage?.data?.data?.totalPages
            ? allPages.length + 1
            : undefined;
        return nextPage;
      }
    },

    select: res => res?.pages.flatMap(page => page.data?.data?.stories || []),
  });

  const searchUser = ({pageParam = null}) => {
    const endpoint = useSemanticSearch ? '/user/semantic-search' : '/user/search';
    const params = {
      searchString: debouncedSearch || '',
      currentUserId: user?._id,
      searchType: useSemanticSearch ? 'hybrid' : 'text',
      limit: 10,
    };
    
    if (useSemanticSearch && pageParam) {
      params.cursor = pageParam;
    } else if (!useSemanticSearch && pageParam) {
      params.page = pageParam;
    }
    
    return request.get(endpoint, { params });
  };

  const {
    data: users,
    fetchNextPage: fetchNextPageUsers,
    isFetching: isFetchingUser,
    isFetchingNextPage: isFetchingNextPageUsers,
    error: usersError,
  } = useInfiniteQuery(['search_user', debouncedSearch, useSemanticSearch], searchUser, {
    keepPreviousData: true,
    enabled: isSelect === 0 && !!user?._id,
    getNextPageParam: (lastPage, allPages) => {
      if (useSemanticSearch) {
        return lastPage?.data?.data?.pagination?.hasMore 
          ? lastPage?.data?.data?.pagination?.nextCursor 
          : undefined;
      } else {
        const nextPage =
          lastPage?.data?.data?.currentPage < lastPage?.data?.data?.totalPages
            ? allPages.length + 1
            : undefined;
        return nextPage;
      }
    },

    select: res => res?.pages.flatMap(page => page.data?.data?.users || []),
  });

  const searchDishes = ({pageParam = null}) => {
    const endpoint = useSemanticSearch ? '/dishes/semantic-search' : '/dishes/search';
    const params = {
      searchString: debouncedSearch || '', // Use debouncedSearch and allow empty string
      searchType: useSemanticSearch ? 'hybrid' : 'text',
      limit: 10,
    };
    
    if (useSemanticSearch && pageParam) {
      params.cursor = pageParam;
    } else if (!useSemanticSearch && pageParam) {
      params.page = pageParam;
    }
    
    return request.get(endpoint, { params });
  };

  const {
    data: dishes,
    fetchNextPage: fetchNextPageDishes,
    isFetching: isFetchingDishes,
    isFetchingNextPage: isFetchingNextPageDishes,
    error: dishesError,
  } = useInfiniteQuery(['search_dishes', debouncedSearch, useSemanticSearch], searchDishes, {
    keepPreviousData: true,
    enabled: isSelect === 3, // Allow dishes search without authentication
    getNextPageParam: (lastPage, allPages) => {
      if (useSemanticSearch) {
        return lastPage?.data?.data?.pagination?.hasMore 
          ? lastPage?.data?.data?.pagination?.nextCursor 
          : undefined;
      } else {
        const nextPage =
          lastPage?.data?.data?.pagination?.hasNextPage
            ? allPages.length + 1
            : undefined;
        return nextPage;
      }
    },

    select: res => {
      const dishes = res?.pages.flatMap(page => {
        console.log('Search: Raw page data:', page.data);
        console.log('Search: Dishes found:', page.data?.data?.dishes?.length || 0);
        return page.data?.data?.dishes || [];
      });
      console.log('Search: Total dishes after flatMap:', dishes.length);
      return dishes;
    },
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
            height: '100%',
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
        
        {/* Semantic Search Toggle */}
        <View style={localStyles.semanticToggleContainer}>
          <TouchableOpacity
            style={[
              localStyles.toggleButton,
              { backgroundColor: useSemanticSearch ? colors.primary : colors.grayScale5 }
            ]}
            onPress={() => setUseSemanticSearch(!useSemanticSearch)}
          >
            <ZText
              type="s14"
              color={useSemanticSearch ? colors.white : colors.grayScale7}
              style={localStyles.toggleText}
            >
              🤖 Smart Search
            </ZText>
          </TouchableOpacity>
          <ZText
            type="s12"
            color={colors.grayScale6}
            style={localStyles.toggleDescription}
          >
            {useSemanticSearch ? 'Smart search (AI understands Arabic & English)' : 'Traditional keyword search only'}
          </ZText>
        </View>
        
        <View style={{height: moderateScale(70), alignSelf: 'flex-start'}}>
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
              users={users || []}
              onEndReachedThreshold={0.5}
              isFetching={isFetchingUser}
              onMomentumScrollBegin={fetchNextPageUsers}
              isFetchingNextPage={isFetchingNextPageUsers}
            />
            {isFetchingUser && !isFetchingNextPageUsers && (
              <ZLoader height={100} top={260} />
            )}
          </>
        )}
        {isSelect === 1 && (
          <View style={{flex: 1}}>
            <SearchVideo
              stories={stories || []}
              onEndReachedThreshold={0.9}
              isFetching={isFetchingsStories}
              isFetchingNextPage={isFetchingNextPage}
              onMomentumScrollBegin={fetchNextPage}
            />
            {isFetchingsStories && !isFetchingNextPage && (
              <ZLoader height={100} top={120} />
            )}
          </View>
        )}
        {isSelect === 2 && (
          <View style={{flex: 1}}>
            <SearchVideo
              stories={reviews || []}
              onEndReachedThreshold={0.9}
              isFetching={isFetchingReviews}
              isFetchingNextPage={isFetchingNextPageReviews}
              onMomentumScrollBegin={fetchNextPageReviews}
            />
            {isFetchingReviews && !isFetchingNextPageReviews && (
              <ZLoader height={100} top={120} />
            )}
          </View>
        )}
        {isSelect === 3 && (
          <View style={{flex: 1}}>
            <SearchDishes
              dishes={dishes || []}
              onEndReachedThreshold={0.9}
              isFetching={isFetchingDishes}
              isFetchingNextPage={isFetchingNextPageDishes}
              onMomentumScrollBegin={fetchNextPageDishes}
            />
            {isFetchingDishes && !isFetchingNextPageDishes && (
              <ZLoader height={100} top={120} />
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
  semanticToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(10),
    marginBottom: moderateScale(5),
  },
  toggleButton: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(10),
  },
  toggleText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  toggleDescription: {
    fontSize: moderateScale(10),
    fontStyle: 'italic',
  },
  
});
