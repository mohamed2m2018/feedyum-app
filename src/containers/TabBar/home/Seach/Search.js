// Library import
import { FlatList, StyleSheet, TouchableOpacity, View, RefreshControl, I18nManager, Dimensions } from 'react-native';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import debounce from 'debounce';
import { TabView } from 'react-native-tab-view';
// Local import
import ZSafeAreaView from '../../../../components/common/ZSafeAreaView';
import ZInput from '../../../../components/common/ZInput';
import strings from '../../../../i18n/strings';
import { moderateScale } from '../../../../common/constants';
import { styles } from '../../../../themes';
import ZText from '../../../../components/common/ZText';
import SearchUser from './SearchUser';
import SearchVideo from './SearchVideo';
import SearchDishes from './SearchDishes';
import { useInfiniteQuery, useQuery } from 'react-query';
import request from '../../../../api/request';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useScreen } from '../../../../navigation/screenContext';
import { TabNav } from '../../../../navigation/NavigationKeys';
import ZLoader from '../../../../components/common/ZLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Memoized tab header item
const HeaderCategoryItem = memo(({ title, index, isSelected, onPress, colors }) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(index)}
      style={[
        localStyles.tabItem,
        {
          borderBottomColor: isSelected ? colors.primary : colors.dark3,
        },
      ]}>
      <ZText
        type={'s18'}
        align={'center'}
        style={styles.pb20}
        color={isSelected ? colors.primary : colors.grayScale7}>
        {title}
      </ZText>
    </TouchableOpacity>
  );
});

// Memoized tab bar component
const SearchTabBar = memo(({ navigationState, index, onIndexChange, colors }) => {
  const flatListRef = useRef(null);

  // Scroll to selected tab when index changes
  useEffect(() => {
    if (flatListRef.current && navigationState.routes.length > 0) {
      flatListRef.current.scrollToIndex({
        index: index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [index, navigationState.routes.length]);

  const renderItem = useCallback(({ item, index: itemIndex }) => (
    <HeaderCategoryItem
      title={item.title}
      index={itemIndex}
      isSelected={index === itemIndex}
      onPress={onIndexChange}
      colors={colors}
    />
  ), [index, onIndexChange, colors]);

  return (
    <View style={localStyles.tabBarContainer}>
      <FlatList
        ref={flatListRef}
        data={navigationState.routes}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={localStyles.tabBarContent}
        keyExtractor={(item, idx) => idx.toString()}
        keyboardShouldPersistTaps="always"
        onScrollToIndexFailed={info => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          });
        }}
      />
    </View>
  );
});

export default function Search() {
  const colors = useSelector(state => state.theme.theme);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const searchCategoryData = [
    { key: 'users', title: strings.user },
    { key: 'chefs', title: strings.chefs },
    { key: 'kitchenPosts', title: strings.kitchenPosts },
    { key: 'reviews', title: strings.reviews },
    { key: 'dishes', title: strings.dishes },
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

  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchIconStyle, setSearchIconStyle] = useState(BlurredIconStyle);
  const [tabState, setTabState] = useState({
    index: 0,
    routes: searchCategoryData,
  });
  const [useSemanticSearch, setUseSemanticSearch] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isFocused = useIsFocused();
  const { updateCurrentScreen } = useScreen();

  useEffect(() => {
    if (isFocused) {
      updateCurrentScreen(TabNav.Search);
    }
  }, [isFocused, updateCurrentScreen]);

  const onSearchInput = text => {
    setSearch(text);
    debounce(() => {
      setDebouncedSearch(text);
    }, 300)();
  };

  const { data } = useQuery('user', () => request.get('/user'), { retry: 1 });

  const user = data?.data?.user;

  // Search for Kitchen Posts (Chef Stories)
  const searchStory = ({ pageParam = null }) => {
    const endpoint = useSemanticSearch ? '/story/semantic-search' : '/story/search';
    const params = {
      searchString: debouncedSearch || '',
      authorType: 'chef',
      searchType: useSemanticSearch ? 'hybrid' : 'text',
      limit: 10,
      page: pageParam || 1,
    };

    return request.get(endpoint, { params });
  };

  const {
    data: stories,
    fetchNextPage,
    isFetching: isFetchingsStories,
    isFetchingNextPage,
    refetch: refetchStories,
    error: storiesError,
  } = useInfiniteQuery(['search_story', debouncedSearch, useSemanticSearch], searchStory, {
    keepPreviousData: true,
    enabled: tabState.index === 2 && !!user,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage =
        lastPage?.data?.data?.hasNextPage || lastPage?.data?.data?.pagination?.hasNextPage
          ? allPages.length + 1
          : undefined;
      return nextPage;
    },

    select: res => {
      const stories = res?.pages.flatMap(page => page.data?.data?.stories || []);
      return stories;
    },
  });

  // Search for User Posts (Reviews)
  const searchReviews = ({ pageParam = null }) => {
    const endpoint = useSemanticSearch ? '/story/semantic-search' : '/story/search';
    const params = {
      searchString: debouncedSearch || '',
      authorType: 'user',
      searchType: useSemanticSearch ? 'hybrid' : 'text',
      limit: 10,
      page: pageParam || 1,
    };

    return request.get(endpoint, { params });
  };

  const {
    data: reviews,
    fetchNextPage: fetchNextPageReviews,
    isFetching: isFetchingReviews,
    isFetchingNextPage: isFetchingNextPageReviews,
    refetch: refetchReviews,
    error: reviewsError,
  } = useInfiniteQuery(['search_reviews', debouncedSearch, useSemanticSearch], searchReviews, {
    keepPreviousData: true,
    enabled: tabState.index === 3 && !!user,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage =
        lastPage?.data?.data?.hasNextPage || lastPage?.data?.data?.pagination?.hasNextPage
          ? allPages.length + 1
          : undefined;
      return nextPage;
    },

    select: res => res?.pages.flatMap(page => page.data?.data?.stories || []),
  });

  const searchUser = ({ pageParam = null }) => {
    const endpoint = useSemanticSearch ? '/user/semantic-search' : '/user/search';
    const params = {
      searchString: debouncedSearch || '',
      currentUserId: user?._id,
      searchType: useSemanticSearch ? 'hybrid' : 'text',
      limit: 10,
      page: pageParam || 1,
      filters: JSON.stringify({
        type: { $ne: 'chef' }
      })
    };

    return request.get(endpoint, { params });
  };

  const searchChef = ({ pageParam = null }) => {
    const endpoint = useSemanticSearch ? '/user/semantic-search' : '/user/search';
    const params = {
      searchString: debouncedSearch || '',
      searchType: useSemanticSearch ? 'hybrid' : 'text',
      limit: 10,
      page: pageParam || 1,
      filters: JSON.stringify({
        type: 'chef'
      })
    };

    return request.get(endpoint, { params });
  };

  const {
    data: users,
    fetchNextPage: fetchNextPageUsers,
    isFetching: isFetchingUser,
    isFetchingNextPage: isFetchingNextPageUsers,
    refetch: refetchUsers,
    error: usersError,
  } = useInfiniteQuery(['search_user', debouncedSearch, useSemanticSearch], searchUser, {
    keepPreviousData: true,
    enabled: tabState.index === 0 && !!user?._id,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage =
        lastPage?.data?.currentPage < lastPage?.data?.totalPages ||
          lastPage?.data?.data?.pagination?.hasNextPage
          ? allPages.length + 1
          : undefined;
      return nextPage;
    },

    select: res => res?.pages.flatMap(page => page.data?.data?.users || []),
  });

  const {
    data: chefs,
    fetchNextPage: fetchNextPageChefs,
    isFetching: isFetchingChefs,
    isFetchingNextPage: isFetchingNextPageChefs,
    refetch: refetchChefs,
    error: chefsError,
  } = useInfiniteQuery(['search_chef', debouncedSearch, useSemanticSearch], searchChef, {
    keepPreviousData: true,
    enabled: tabState.index === 1 && !!user?._id,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage =
        lastPage?.data?.currentPage < lastPage?.data?.totalPages ||
          lastPage?.data?.data?.pagination?.hasNextPage
          ? allPages.length + 1
          : undefined;
      return nextPage;
    },

    select: res => res?.pages.flatMap(page => page.data?.data?.users || []),
  });

  const searchDishes = ({ pageParam = null }) => {
    const endpoint = useSemanticSearch ? '/dishes/semantic-search' : '/dishes/search';
    const params = {
      searchString: debouncedSearch || '',
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
    refetch: refetchDishes,
    error: dishesError,
  } = useInfiniteQuery(['search_dishes', debouncedSearch, useSemanticSearch], searchDishes, {
    keepPreviousData: true,
    enabled: tabState.index === 4,
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
        return page.data?.data?.dishes || [];
      });
      return dishes;
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      switch (tabState.index) {
        case 0:
          await refetchUsers();
          break;
        case 1:
          await refetchChefs();
          break;
        case 2:
          await refetchStories();
          break;
        case 3:
          await refetchReviews();
          break;
        case 4:
          await refetchDishes();
          break;
      }
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [tabState.index, refetchUsers, refetchChefs, refetchStories, refetchReviews, refetchDishes]);

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

  const handleIndexChange = useCallback((index) => {
    setTabState(prev => ({ ...prev, index }));
  }, []);

  const renderTabBar = useCallback((props) => (
    <SearchTabBar
      navigationState={tabState}
      index={tabState.index}
      onIndexChange={handleIndexChange}
      colors={colors}
    />
  ), [tabState, handleIndexChange, colors]);

  const renderScene = useCallback(({ route }) => {
    // Apply RTL transform to flip content back when in RTL mode
    const rtlStyle = I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : {};

    switch (route.key) {
      case 'users':
        return (
          <View style={[{ flex: 1 }, rtlStyle]}>
            <SearchUser
              users={users || []}
              currentUserId={user?._id}
              onEndReachedThreshold={0.5}
              isFetching={isFetchingUser}
              onEndReached={fetchNextPageUsers}
              isFetchingNextPage={isFetchingNextPageUsers}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
            {isFetchingUser && !isFetchingNextPageUsers && (
              <ZLoader height={100} top={260} />
            )}
          </View>
        );
      case 'chefs':
        return (
          <View style={[{ flex: 1 }, rtlStyle]}>
            <SearchUser
              users={chefs || []}
              currentUserId={user?._id}
              onEndReachedThreshold={0.5}
              isFetching={isFetchingChefs}
              onEndReached={fetchNextPageChefs}
              isFetchingNextPage={isFetchingNextPageChefs}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
            {isFetchingChefs && !isFetchingNextPageChefs && (
              <ZLoader height={100} top={260} />
            )}
          </View>
        );
      case 'kitchenPosts':
        return (
          <View style={[{ flex: 1 }, rtlStyle]}>
            <SearchVideo
              stories={stories || []}
              onEndReachedThreshold={0.9}
              isFetching={isFetchingsStories}
              isFetchingNextPage={isFetchingNextPage}
              onEndReached={fetchNextPage}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
            {isFetchingsStories && !isFetchingNextPage && (
              <ZLoader height={100} top={120} />
            )}
          </View>
        );
      case 'reviews':
        return (
          <View style={[{ flex: 1 }, rtlStyle]}>
            <SearchVideo
              stories={reviews || []}
              onEndReachedThreshold={0.9}
              isFetching={isFetchingReviews}
              isFetchingNextPage={isFetchingNextPageReviews}
              onEndReached={fetchNextPageReviews}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
            {isFetchingReviews && !isFetchingNextPageReviews && (
              <ZLoader height={100} top={120} />
            )}
          </View>
        );
      case 'dishes':
        return (
          <View style={[{ flex: 1 }, rtlStyle]}>
            <SearchDishes
              dishes={dishes || []}
              onEndReachedThreshold={0.9}
              isFetching={isFetchingDishes}
              isFetchingNextPage={isFetchingNextPageDishes}
              onEndReached={fetchNextPageDishes}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
            {isFetchingDishes && !isFetchingNextPageDishes && (
              <ZLoader height={100} top={120} />
            )}
          </View>
        );
      default:
        return null;
    }
  }, [
    users, chefs, stories, reviews, dishes,
    user, refreshing, handleRefresh,
    isFetchingUser, isFetchingNextPageUsers, fetchNextPageUsers,
    isFetchingChefs, isFetchingNextPageChefs, fetchNextPageChefs,
    isFetchingsStories, isFetchingNextPage, fetchNextPage,
    isFetchingReviews, isFetchingNextPageReviews, fetchNextPageReviews,
    isFetchingDishes, isFetchingNextPageDishes, fetchNextPageDishes,
  ]);

  return (
    <ZSafeAreaView>
      <View style={localStyles.container}>
        <ZInput
          placeHolder={strings.search}
          _value={search}
          keyBoardType={'default'}
          autoCapitalize={'none'}
          insideLeftIcon={() => <SearchIcon />}
          toGetTextFieldValue={onSearchInput}
          inputContainerStyle={[
            { backgroundColor: colors.inputBg },
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
              {strings.smartSearch}
            </ZText>
          </TouchableOpacity>
          <ZText
            type="s12"
            color={colors.grayScale6}
            style={localStyles.toggleDescription}
          >
            {useSemanticSearch ? strings.smartSearchDesc : strings.traditionalSearchDesc}
          </ZText>
        </View>

        <TabView
          navigationState={tabState}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
          onIndexChange={handleIndexChange}
          initialLayout={{ width: SCREEN_WIDTH }}
          lazy={true}
          lazyPreloadDistance={1}
          renderLazyPlaceholder={() => <ZLoader height={100} />}
          swipeEnabled={true}
          animationEnabled={true}
          // RTL support: flip the pager direction
          pagerStyle={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : {}}
        />
      </View>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 10,
  },
  inputContainerStyle: {
    borderRadius: moderateScale(15),
    borderWidth: moderateScale(1),
  },
  inputBoxStyle: {
    ...styles.ph15,
  },
  tabBarContainer: {
    height: moderateScale(50),
  },
  tabBarContent: {
    paddingHorizontal: moderateScale(10),
  },
  tabItem: {
    borderBottomWidth: moderateScale(2),
    paddingHorizontal: moderateScale(15),
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
