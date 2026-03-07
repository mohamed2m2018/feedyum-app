// Library imports
import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    I18nManager,
    FlatList,
    Image,
    ActivityIndicator,
} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useQuery } from 'react-query';

// Local imports
import ZText from '../common/ZText';
import { moderateScale } from '../../common/constants';
import { styles as globalStyles } from '../../themes';
import strings from '../../i18n/strings';
import request from '../../api/request';
import { getCategoryEmoji } from '../../utils/categoryEmojis';

const FILTER_TOGGLES = [
    {
        key: 'reviewsOnly',
        labelKey: 'reviewsOnlyFilter',
        fallback: 'Reviews Only',
        icon: 'star',
        iconOutline: 'star-outline',
    },
    {
        key: 'chefsOnly',
        labelKey: 'fromChefsFilter',
        fallback: 'From Chefs',
        icon: 'restaurant',
        iconOutline: 'restaurant-outline',
    },
    {
        key: 'hasDishes',
        labelKey: 'orderableFilter',
        fallback: 'Orderable',
        icon: 'cart',
        iconOutline: 'cart-outline',
    },
];

const SORT_OPTIONS = [
    { key: 'default', labelKey: 'sortDefault', fallback: 'Default', icon: 'sparkles-outline' },
    { key: 'trending', labelKey: 'sortTrending', fallback: 'Trending', icon: 'trending-up-outline' },
    { key: 'nearby', labelKey: 'sortNearby', fallback: 'Nearby', icon: 'location-outline' },
];

export default function ReelFiltersSheet({
    sheetRef,
    filters = {},
    categoryIds = [],
    onApplyFilters,
    onApplyCategories,
}) {
    const colors = useSelector(state => state.theme.theme);

    // Local state mirroring props, committed on Apply
    const [localFilters, setLocalFilters] = useState(filters);
    const [localCategoryIds, setLocalCategoryIds] = useState(categoryIds);

    // Sync props → local state when props change
    useEffect(() => {
        setLocalFilters(filters);
        setLocalCategoryIds(categoryIds);
    }, [filters, categoryIds]);

    // Also sync on every sheet open (handles case where user dismissed without applying)
    const handleSheetOpen = useCallback(() => {
        setLocalFilters(filters);
        setLocalCategoryIds(categoryIds);
    }, [filters, categoryIds]);

    // Fetch categories
    const { data: categories = [], isFetching: isFetchingCategories } = useQuery(
        'categories',
        () => request.get('/categories').then(res => res.data),
        { retry: 0, staleTime: 1000 * 60 * 30 },
    );

    // Toggle a boolean filter
    const toggleFilter = useCallback(key => {
        setLocalFilters(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    // Set sort option
    const setSortBy = useCallback(key => {
        setLocalFilters(prev => ({ ...prev, sortBy: key }));
    }, []);

    // Toggle a category
    const toggleCategory = useCallback(id => {
        setLocalCategoryIds(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
        );
    }, []);

    // Count active filters (excluding default sort)
    const activeCount =
        FILTER_TOGGLES.filter(f => localFilters[f.key]).length +
        (localFilters.sortBy && localFilters.sortBy !== 'default' ? 1 : 0) +
        localCategoryIds.length;

    // Apply
    const handleApply = () => {
        onApplyFilters?.(localFilters);
        onApplyCategories?.([...localCategoryIds]);
        sheetRef.current?.hide();
    };

    // Reset
    const handleReset = () => {
        setLocalFilters({});
        setLocalCategoryIds([]);
    };

    // Category chip
    const renderCategoryChip = useCallback(
        ({ item }) => {
            const displayName = I18nManager.isRTL
                ? item?.nameArabic || item?.name
                : item?.name;
            const isSelected = localCategoryIds.includes(item?._id);
            const emoji = getCategoryEmoji(item?.name);

            return (
                <TouchableOpacity
                    onPress={() => toggleCategory(item?._id)}
                    activeOpacity={0.7}
                    style={[
                        localStyles.categoryChip,
                        {
                            backgroundColor: isSelected
                                ? colors.primary + '20'
                                : colors.dark
                                    ? colors.inputBg
                                    : colors.grayScale2,
                            borderColor: isSelected ? colors.primary : 'transparent',
                        },
                    ]}>
                    {item?.image ? (
                        <Image
                            source={{ uri: item.image }}
                            style={localStyles.categoryImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <ZText type="m14">{emoji}</ZText>
                    )}
                    <ZText
                        type={isSelected ? 'b12' : 'm12'}
                        color={isSelected ? colors.primary : colors.textColor}
                        style={globalStyles.ml5}
                        numberOfLines={1}>
                        {displayName}
                    </ZText>
                    {isSelected && (
                        <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={colors.primary}
                            style={globalStyles.ml5}
                        />
                    )}
                </TouchableOpacity>
            );
        },
        [localCategoryIds, colors, toggleCategory],
    );

    return (
        <ActionSheet
            ref={sheetRef}
            gestureEnabled={true}
            onBeforeShow={handleSheetOpen}
            containerStyle={[
                localStyles.container,
                { backgroundColor: colors.backgroundColor },
            ]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={localStyles.scrollContent}>
                {/* Header */}
                <View style={localStyles.header}>
                    <View style={localStyles.handle} />
                    <View style={localStyles.headerRow}>
                        <ZText type="b20">{strings.reelFilters || 'Filters'}</ZText>
                        {activeCount > 0 && (
                            <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
                                <ZText type="m14" color={colors.primary}>
                                    {strings.resetFilters || 'Reset'}
                                </ZText>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Filter Toggles */}
                <ZText
                    type="b14"
                    color={colors.grayScale7}
                    style={localStyles.sectionTitle}>
                    {strings.filterBy || 'Filter By'}
                </ZText>
                <View style={localStyles.toggleRow}>
                    {FILTER_TOGGLES.map(ft => {
                        const isActive = !!localFilters[ft.key];
                        return (
                            <TouchableOpacity
                                key={ft.key}
                                onPress={() => toggleFilter(ft.key)}
                                activeOpacity={0.7}
                                style={[
                                    localStyles.toggleChip,
                                    {
                                        backgroundColor: isActive
                                            ? colors.primary
                                            : colors.dark
                                                ? colors.inputBg
                                                : colors.grayScale2,
                                        borderColor: isActive
                                            ? colors.primary
                                            : colors.dark
                                                ? colors.grayScale8
                                                : colors.grayScale3,
                                    },
                                ]}>
                                <Ionicons
                                    name={isActive ? ft.icon : ft.iconOutline}
                                    size={16}
                                    color={isActive ? colors.white : colors.grayScale5}
                                />
                                <ZText
                                    type={isActive ? 'b12' : 'm12'}
                                    color={isActive ? colors.white : colors.textColor}
                                    style={globalStyles.ml5}>
                                    {strings[ft.labelKey] || ft.fallback}
                                </ZText>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Sort Options */}
                <ZText
                    type="b14"
                    color={colors.grayScale7}
                    style={localStyles.sectionTitle}>
                    {strings.sortByLabel || 'Sort By'}
                </ZText>
                <View style={localStyles.toggleRow}>
                    {SORT_OPTIONS.map(opt => {
                        const isActive = (localFilters.sortBy || 'default') === opt.key;
                        return (
                            <TouchableOpacity
                                key={opt.key}
                                onPress={() => setSortBy(opt.key)}
                                activeOpacity={0.7}
                                style={[
                                    localStyles.toggleChip,
                                    {
                                        backgroundColor: isActive
                                            ? colors.primary
                                            : colors.dark
                                                ? colors.inputBg
                                                : colors.grayScale2,
                                        borderColor: isActive
                                            ? colors.primary
                                            : colors.dark
                                                ? colors.grayScale8
                                                : colors.grayScale3,
                                    },
                                ]}>
                                <Ionicons
                                    name={opt.icon}
                                    size={16}
                                    color={isActive ? colors.white : colors.grayScale5}
                                />
                                <ZText
                                    type={isActive ? 'b12' : 'm12'}
                                    color={isActive ? colors.white : colors.textColor}
                                    style={globalStyles.ml5}>
                                    {strings[opt.labelKey] || opt.fallback}
                                </ZText>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Categories */}
                <ZText
                    type="b14"
                    color={colors.grayScale7}
                    style={localStyles.sectionTitle}>
                    {strings.categories || 'Categories'}
                </ZText>
                {isFetchingCategories ? (
                    <ActivityIndicator
                        size="small"
                        color={colors.primary}
                        style={globalStyles.mt10}
                    />
                ) : (
                    <FlatList
                        data={categories}
                        renderItem={renderCategoryChip}
                        keyExtractor={item => item?._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={localStyles.categoryList}
                    />
                )}
            </ScrollView>

            {/* Apply Button */}
            <View
                style={[
                    localStyles.applyWrapper,
                    {
                        backgroundColor: colors.dark
                            ? colors.backgroundColor + 'F0'
                            : '#ffffffF0',
                    },
                ]}>
                <TouchableOpacity onPress={handleApply} activeOpacity={0.8}>
                    <LinearGradient
                        colors={[colors.primary, colors.lightRed || '#FF7B8E']}
                        style={localStyles.applyBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}>
                        <ZText type="b16" color="#fff">
                            {strings.applyFilters || 'Apply Filters'}
                            {activeCount > 0 ? ` (${activeCount})` : ''}
                        </ZText>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </ActionSheet>
    );
}

const localStyles = StyleSheet.create({
    container: {
        paddingTop: moderateScale(8),
        height: '65%',
        borderTopLeftRadius: moderateScale(24),
        borderTopRightRadius: moderateScale(24),
    },
    scrollContent: {
        paddingHorizontal: moderateScale(20),
        paddingBottom: moderateScale(100),
    },
    header: {
        alignItems: 'center',
        marginBottom: moderateScale(16),
    },
    handle: {
        width: moderateScale(40),
        height: moderateScale(4),
        borderRadius: moderateScale(2),
        backgroundColor: 'rgba(128, 128, 128, 0.3)',
        marginBottom: moderateScale(16),
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    sectionTitle: {
        marginTop: moderateScale(20),
        marginBottom: moderateScale(10),
    },
    toggleRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: moderateScale(8),
    },
    toggleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(14),
        paddingVertical: moderateScale(10),
        borderRadius: moderateScale(20),
        borderWidth: 1,
    },
    categoryList: {
        paddingVertical: moderateScale(4),
        gap: moderateScale(8),
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(8),
        borderRadius: moderateScale(16),
        borderWidth: 1.5,
    },
    categoryImage: {
        width: moderateScale(20),
        height: moderateScale(20),
        borderRadius: moderateScale(10),
    },
    applyWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: moderateScale(20),
        paddingTop: moderateScale(12),
        paddingBottom: moderateScale(30),
    },
    applyBtn: {
        height: moderateScale(50),
        borderRadius: moderateScale(25),
        alignItems: 'center',
        justifyContent: 'center',
    },
});
