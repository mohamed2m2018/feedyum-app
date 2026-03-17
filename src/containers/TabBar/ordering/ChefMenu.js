import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
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

  // ─── Loading / Error / Empty States ─────────────────────

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

  // ─── Compute Displayed Dishes ───────────────────────────

  const getDisplayedDishes = () => {
    let dishes = (debouncedSearch ? searchedDishes : menuData?.dishes) || [];
    if (selectedCategory && !debouncedSearch) {
      dishes = dishes.filter(d => d.category === selectedCategory);
    }
    return dishes;
  };

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

      {/* Menu Search Bar */}
      {menuData?.dishes?.length > 0 && (
        <View style={{ paddingHorizontal: moderateScale(16), paddingTop: moderateScale(12), paddingBottom: moderateScale(4) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(10) }}>
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
            <ZText type="M12" color={colors.grayScale7} style={{ marginTop: moderateScale(4) }}>
              {strings.searching}
            </ZText>
          )}
        </View>
      )}

      {/* Category Browser */}
      <CategoryBrowser dishes={menuData?.dishes} flatListRef={flatListRef} />
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
          />
        )}
        keyExtractor={item => item._id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={localStyles.listContainer}
        showsVerticalScrollIndicator={false}
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

export default ChefMenu;
