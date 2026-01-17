// Library import
import React, { useMemo, useCallback } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    I18nManager,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useInfiniteQuery } from 'react-query';

// Local imports
import ZText from '../../../../components/common/ZText';
import { moderateScale } from '../../../../common/constants';
import { styles as globalStyles } from '../../../../themes';
import strings from '../../../../i18n/strings';
import request from '../../../../api/request';
import KitchenWithDishesCard from '../../../../components/KitchenWithDishesCard';

/**
 * DishSearchTab - Tab 1: "Discover"
 * Uses shared search query from parent
 */
export default function DishSearchTab({
    searchQuery = '',
    useSemanticSearch = true,
    userLocation,
    rtlStyle,
}) {
    const colors = useSelector(state => state.theme.theme);

    // Fetch kitchens with dishes matching search
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
    } = useInfiniteQuery(
        ['search_dishes_kitchens', searchQuery, useSemanticSearch, userLocation?.lat],
        async ({ pageParam = 1 }) => {
            // Browse mode - get popular/all dishes when no search query
            if (!searchQuery || searchQuery.trim().length < 2) {
                const response = await request.get('/dishes', {
                    params: {
                        page: pageParam,
                        limit: 15,
                        sortBy: 'popularity',
                        ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng }),
                    },
                });
                return response.data;
            }

            // Search mode
            const endpoint = useSemanticSearch
                ? '/dishes/semantic-search'
                : '/dishes/search';

            const response = await request.get(endpoint, {
                params: {
                    searchString: searchQuery.trim(),
                    page: pageParam,
                    limit: 10,
                    ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng }),
                },
            });

            return response.data;
        },
        {
            getNextPageParam: lastPage =>
                lastPage?.data?.pagination?.hasMore || lastPage?.data?.pagination?.hasNextPage
                    ? (lastPage?.data?.pagination?.currentPage || 1) + 1
                    : undefined,
            staleTime: 1000 * 60 * 5,
        },
    );

    // Group dishes by chef/kitchen
    const groupedResults = useMemo(() => {
        if (!data?.pages) return [];

        const allDishes = data.pages.flatMap(page => {
            return page?.data?.dishes || page?.dishes || page?.results || [];
        });

        const kitchenMap = new Map();

        allDishes.forEach(dish => {
            const kitchen = dish.user || dish.chef;
            if (!kitchen?._id) return;

            if (!kitchenMap.has(kitchen._id)) {
                kitchenMap.set(kitchen._id, {
                    kitchen,
                    dishes: [],
                });
            }
            kitchenMap.get(kitchen._id).dishes.push(dish);
        });

        return Array.from(kitchenMap.values());
    }, [data]);

    const handleAddToCart = useCallback(dish => {
        console.log('Added to cart:', dish.name);
    }, []);

    const renderKitchenCard = ({ item }) => (
        <KitchenWithDishesCard
            kitchen={item.kitchen}
            dishes={item.dishes.slice(0, 5)}
            onAddToCart={handleAddToCart}
        />
    );

    const renderEmpty = () => {
        if (isLoading) return null;

        // No results found
        return (
            <View style={localStyles.emptyContainer}>
                <View style={[localStyles.emptyIconBg, { backgroundColor: colors.grayScale2 }]}>
                    <Ionicons name="restaurant-outline" size={40} color={colors.grayScale5} />
                </View>
                <ZText type="b18" color={colors.textColor} style={globalStyles.mt20}>
                    {searchQuery?.length >= 2
                        ? (strings.noResultsFound || 'No Results')
                        : (strings.noDishesYet || 'No Dishes Yet')}
                </ZText>
                <ZText
                    type="m14"
                    color={colors.grayScale5}
                    style={[globalStyles.mt10, localStyles.emptyText]}
                    align="center">
                    {searchQuery?.length >= 2
                        ? (strings.tryDifferentSearch || 'Try a different search term')
                        : (strings.checkBackLater || 'Check back later for delicious dishes')}
                </ZText>
            </View>
        );
    };

    const renderFooter = () => {
        if (isFetchingNextPage) {
            return (
                <View style={localStyles.footerLoader}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            );
        }
        return null;
    };

    return (
        <View style={[{ flex: 1 }, rtlStyle]}>
            <FlatList
                data={groupedResults}
                renderItem={renderKitchenCard}
                keyExtractor={(item, index) => item.kitchen?._id || `kitchen-${index}`}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                onEndReached={() => hasNextPage && fetchNextPage()}
                onEndReachedThreshold={0.5}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={localStyles.listContent}
                refreshing={isLoading}
                onRefresh={refetch}
                keyboardShouldPersistTaps="handled"
            />
        </View>
    );
}

const localStyles = StyleSheet.create({
    listContent: {
        paddingHorizontal: moderateScale(16),
        paddingTop: moderateScale(8),
        paddingBottom: moderateScale(100),
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: moderateScale(60),
        paddingHorizontal: moderateScale(40),
    },
    emptyIconBg: {
        width: moderateScale(80),
        height: moderateScale(80),
        borderRadius: moderateScale(40),
        backgroundColor: '#FF4D6710',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        lineHeight: moderateScale(22),
    },
    footerLoader: {
        paddingVertical: moderateScale(20),
    },
});
