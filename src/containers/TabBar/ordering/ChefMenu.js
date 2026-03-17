import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale, getHeight } from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import ZInput from '../../../components/common/ZInput';
import ZHeader from '../../../components/common/ZHeader';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZLoader from '../../../components/common/ZLoader';
import ZButton from '../../../components/common/ZButton';
import CartFloatingButton from '../../../components/common/CartFloatingButton';
import Locations from '../../../components/models/Locations';
import ShareOptionsSheet from '../../../components/models/ShareOptionsSheet';
import strings from '../../../i18n/strings';
import useChefMenu from './useChefMenu';
import ChefMenuHeader from './components/ChefMenuHeader';
import MenuDishCard from './components/MenuDishCard';
import CategoryBrowser from './components/CategoryBrowser';
import localStyles from './chefMenuStyles';

const ChefMenu = () => {
  const {
    chefId,
    chefName,
    user,
    menuData,
    isLoading,
    error,
    refetch,
    branchLocations,
    isChefClosed,
    openStatusData,
    deliveryData,
    cartItems,
    search,
    setSearch,
    debouncedSearch,
    setDebouncedSearch,
    isSearching,
    searchedDishes,
    onSearchInput,
    selectedCategory,
    handleQuantityChange,
    handleCartPress,
    handleRefresh,
    refreshing,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    flatListRef,
    searchInputRef,
    locationsSheetRef,
    shareSheetRef,
    selectedBranchId,
    setSelectedBranchId,
    colors,
  } = useChefMenu();

  const navigation = useNavigation();

  // ─── Compute data (must be before early returns — hooks rule) ──

  const getDisplayedDishes = () => {
    let dishes = (debouncedSearch ? searchedDishes : menuData?.dishes) || [];
    if (selectedCategory && !debouncedSearch) {
      dishes = dishes.filter(d => d.category === selectedCategory);
    }
    return dishes;
  };

  // Show category badge only when menu has 2+ distinct categories
  const hasMultipleCategories = useMemo(() => {
    const dishes = menuData?.dishes || [];
    const categories = new Set(dishes.map(d => d.category).filter(Boolean));
    return categories.size > 1;
  }, [menuData?.dishes]);

  // Track when the search+sections bar scrolls off-screen
  const [showStickyBar, setShowStickyBar] = useState(false);
  const searchBarYRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);

  const handleSearchBarLayout = useCallback((e) => {
    searchBarYRef.current = e.nativeEvent.layout.y;
  }, []);

  const handleScroll = useCallback((e) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const shouldShow = offsetY >= searchBarYRef.current;
    setShowStickyBar(prev => prev !== shouldShow ? shouldShow : prev);
  }, []);

  // Lock sticky bar toggle during programmatic scrolls (section taps)
  const handleProgrammaticScroll = useCallback(() => {
    isProgrammaticScrollRef.current = true;
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 600);
  }, []);

  // Lifted state for section selection — shared between header and sticky CategoryBrowser
  const [selectedSectionKey, setSelectedSectionKey] = useState(null);

  // Auto-select section based on visible dishes during manual scroll
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    // Skip during programmatic scroll (section tap)
    if (isProgrammaticScrollRef.current) return;
    if (!viewableItems || viewableItems.length === 0) return;

    // Get the first visible dish and its section key
    const firstDish = viewableItems[0]?.item;
    if (!firstDish) return;
    const sectionKey = firstDish.section?._id || firstDish.section || null;
    if (sectionKey) {
      setSelectedSectionKey(prev => prev !== sectionKey ? sectionKey : prev);
    }
  }).current;

  if (isLoading) {
    return (
      <ZSafeAreaView>
        <ZHeader title={chefName || strings.menu} showBack />
        <ZLoader />
      </ZSafeAreaView>
    );
  }

  if (error) {
    return (
      <ZSafeAreaView>
        <ZHeader title={chefName || strings.menu} showBack />
        <View style={localStyles.errorContainer}>
          <Ionicons name="restaurant-outline" size={moderateScale(64)} color={colors.grayScale7} />
          <ZText type="B16" align="center" color={colors.error} style={localStyles.errorTitle}>
            {strings.failedToLoadMenu}
          </ZText>
          <ZText type="M14" align="center" color={colors.grayScale7} style={localStyles.errorSubtitle}>
            {strings.menuLoadErrorSub}
          </ZText>
          <ZButton title={strings.retry} onPress={refetch} containerStyle={localStyles.retryButton} />
        </View>
      </ZSafeAreaView>
    );
  }

  if (menuData && (!menuData.dishes || menuData.dishes.length === 0)) {
    return (
      <ZSafeAreaView>
        <ZHeader title={chefName || strings.menu} showBack />
        <ChefMenuHeader
          menuData={menuData}
          chefId={chefId}
          chefName={chefName}
          isChefClosed={isChefClosed}
          openStatusData={openStatusData}
          branchLocations={branchLocations}
          deliveryData={deliveryData}
          locationsSheetRef={locationsSheetRef}
          user={user}
        />
        <View style={localStyles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={moderateScale(64)} color={colors.grayScale7} />
          <ZText type="B16" align="center" color={colors.textColor} style={localStyles.emptyTitle}>
            {strings.noDishesAvailable}
          </ZText>
          <ZText type="M14" align="center" color={colors.grayScale7} style={localStyles.emptySubtitle}>
            {strings.noDishesSub}
          </ZText>
        </View>
        <Locations
          SheetRef={locationsSheetRef}
          selectedGov={branchLocations}
          onClose={() => {}}
          selectedBranchId={selectedBranchId}
          onBranchSelect={(branch) => setSelectedBranchId(branch?._id)}
        />
      </ZSafeAreaView>
    );
  }

  // ─── List Header ────────────────────────────────────────

  const renderListHeader = () => (
    <View style={{ backgroundColor: colors.backgroundColor }}>
      <ChefMenuHeader
        menuData={menuData}
        chefId={chefId}
        chefName={chefName}
        isChefClosed={isChefClosed}
        openStatusData={openStatusData}
        branchLocations={branchLocations}
        deliveryData={deliveryData}
        locationsSheetRef={locationsSheetRef}
        user={user}
      />
    </View>
  );


  // Shared search + sections bar (used in header and as sticky overlay)
  const renderSearchAndSections = (isSticky = false) => (
    <View style={{ backgroundColor: colors.backgroundColor }}>
      <View style={{ paddingHorizontal: moderateScale(16), paddingTop: moderateScale(8), paddingBottom: moderateScale(4) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(10) }}>
          {isSticky && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ padding: moderateScale(4) }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name={require('react-native').I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'} size={moderateScale(22)} color={colors.textColor} />
            </TouchableOpacity>
          )}
          <ZText type="B20" color={colors.textColor}>{strings.menu || 'Menu'}</ZText>
          <View style={{ flex: 1 }}>
            <ZInput
              fieldRef={searchInputRef}
              _value={search}
              placeHolder={strings.searchDishes}
              toGetTextFieldValue={onSearchInput}
              blurOnSubmit={false}
              insideLeftIcon={() => (
                <Ionicons name="search" size={moderateScale(16)} color={colors.grayScale6} />
              )}
              inputContainerStyle={{ backgroundColor: colors.inputBg || colors.grayScale2, borderColor: colors.bColor || colors.grayScale3, height: getHeight(38) }}
              inputBoxStyle={{ color: colors.textColor, height: getHeight(38), paddingVertical: moderateScale(4) }}
              rightAccessory={() => (
                isSearching ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : search?.length > 0 ? (
                  <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
                    <Ionicons name="close-circle" size={moderateScale(18)} color={colors.grayScale6} />
                  </TouchableOpacity>
                ) : null
              )}
            />
          </View>
        </View>
        {debouncedSearch.length > 0 && isSearching && (
          <ZText type="M12" color={colors.grayScale7} style={{ marginTop: moderateScale(2) }}>
            {strings.searching}
          </ZText>
        )}
      </View>
      <CategoryBrowser dishes={menuData?.dishes} flatListRef={flatListRef} onScrollStart={handleProgrammaticScroll} selectedKey={selectedSectionKey} onSelectedKeyChange={setSelectedSectionKey} />
    </View>
  );

  // ─── Main Render ────────────────────────────────────────

  return (
    <ZSafeAreaView>
      <ZHeader
        title={menuData?.chef?.fullName || chefName || strings.menu}
        showBack
        rightIcon={
          <TouchableOpacity
            onPress={() => shareSheetRef.current?.show()}
            style={{ padding: moderateScale(8) }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="share-social-outline" size={moderateScale(24)} color={colors.textColor} />
          </TouchableOpacity>
        }
      />

      <FlatList
        ref={flatListRef}
        data={getDisplayedDishes()}
        renderItem={({ item: dish }) => (
          <MenuDishCard
            dish={dish}
            chefId={chefId}
            cartItems={cartItems}
            isChefClosed={isChefClosed}
            deliveryData={deliveryData}
            onQuantityChange={handleQuantityChange}
            user={user}
            hasMultipleCategories={hasMultipleCategories}
          />
        )}
        keyExtractor={item => item._id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={() => (
          <View>
            {renderListHeader()}
            <View onLayout={handleSearchBarLayout}>
              {menuData?.dishes?.length > 0 && renderSearchAndSections()}
            </View>
          </View>
        )}
        contentContainerStyle={localStyles.listContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        onScrollToIndexFailed={info => {
          try {
            if (flatListRef.current && Number.isFinite(info.averageItemLength)) {
              const approximateOffset = Math.max(0, info.averageItemLength * info.index);
              flatListRef.current.scrollToOffset({ offset: approximateOffset, animated: true });
              setTimeout(() => {
                try {
                  flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.1 });
                } catch (e2) { /* swallow */ }
              }, 250);
            }
          } catch (e) { /* swallow */ }
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => isFetchingNextPage ? <View style={{ padding: 20 }}><ZLoader /></View> : null}
      />

      {/* Sticky overlay — appears when search+sections scrolls off-screen */}
      {showStickyBar && menuData?.dishes?.length > 0 && (
        <View style={[stickyOverlayStyles.container, { backgroundColor: colors.backgroundColor }]}>
          {renderSearchAndSections(true)}
        </View>
      )}

      <CartFloatingButton onPress={handleCartPress} />

      {/* Branches Modal */}
      <Locations
        SheetRef={locationsSheetRef}
        selectedGov={branchLocations}
        onClose={() => {}}
        selectedBranchId={selectedBranchId}
        onBranchSelect={(branch) => setSelectedBranchId(branch?._id)}
      />

      {/* Share Menu Sheet */}
      <ShareOptionsSheet
        SheetRef={shareSheetRef}
        contentType="chefMenu"
        contentId={chefId}
        contentData={{
          title: menuData?.chef?.fullName || chefName,
          name: menuData?.chef?.fullName || chefName,
          avatar: menuData?.chef?.avatar,
          description: menuData?.chef?.bio,
        }}
      />
    </ZSafeAreaView>
  );
};

const stickyOverlayStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default ChefMenu;
