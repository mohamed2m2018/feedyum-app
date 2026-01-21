import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    I18nManager,
    Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { moderateScale } from '../common/constants';
import ZText from './common/ZText';
import request from '../api/request';
import images from '../assets/images';
import strings from '../i18n/strings';

const DishSelector = ({
    restaurant,
    onDishSelect,
    selectedDish = null,
    onClear,
}) => {
    const colors = useSelector(state => state.theme.theme);
    const [dishName, setDishName] = useState(selectedDish?.name || '');
    const [showMenu, setShowMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const isPartner = restaurant?.type === 'partner';

    // Fetch menu dishes if partner chef
    const {
        data: menuData,
        isLoading: menuLoading,
    } = useQuery(
        ['chef-menu-dishes', restaurant?.chefId],
        async () => {
            const menuResponse = await request.get(`/menus/chef/${restaurant.chefId}`);
            const menuId = menuResponse?.data?._id;
            if (menuId) {
                const dishesResponse = await request.get(`/dishes/menu/${menuId}`);
                return dishesResponse?.data || [];
            }
            return [];
        },
        {
            enabled: isPartner && !!restaurant?.chefId,
        }
    );

    const dishes = menuData || [];

    // Filter dishes based on search query
    const filteredDishes = searchQuery.trim()
        ? dishes.filter(dish => {
            const name = (dish.title || dish.name || '').toLowerCase();
            return name.includes(searchQuery.toLowerCase().trim());
        })
        : dishes;

    const handleDishPress = (dish) => {
        setDishName(dish.title || dish.name);
        setShowMenu(false);
        setSearchQuery(''); // Clear search when dish is selected
        onDishSelect({
            id: dish._id,
            name: dish.title || dish.name,
            price: dish.price,
            image: dish.image,
            type: 'menu',
            dishId: dish._id,
        });
    };

    const handleTextChange = (text) => {
        setDishName(text);
        if (!isPartner && text.trim()) {
            onDishSelect({
                name: text.trim(),
                type: 'manual',
            });
        }
    };

    const handleClear = () => {
        setDishName('');
        setShowMenu(false);
        if (onClear) {
            onClear();
        }
    };

    // If a dish is already selected (and not manual entry)
    if (selectedDish && selectedDish.type !== 'manual' && !showMenu) {
        return (
            <View style={localStyles.selectedContainer}>
                <View style={[localStyles.selectedCard, { backgroundColor: colors.inputBg, borderColor: colors.primary }]}>
                    <View style={localStyles.selectedContent}>
                        {selectedDish.image ? (
                            <Image
                                source={{ uri: selectedDish.image }}
                                style={localStyles.dishImage}
                            />
                        ) : (
                            <View style={[localStyles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                                <MaterialIcons name="restaurant" size={20} color={colors.primary} />
                            </View>
                        )}
                        <View style={localStyles.selectedTextContainer}>
                            <ZText type="B16" color={colors.textColor} numberOfLines={1}>
                                {selectedDish.name}
                            </ZText>
                            {selectedDish.price && (
                                <ZText type="M12" color={colors.primary}>
                                    EGP {selectedDish.price}
                                </ZText>
                            )}
                        </View>
                        <TouchableOpacity onPress={handleClear} style={localStyles.clearButton}>
                            <Ionicons name="close-circle" size={22} color={colors.grayScale5} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={localStyles.container}>
            {isPartner ? (
                // Partner chef: show menu selector
                <>
                    <TouchableOpacity
                        style={[localStyles.selectButton, { backgroundColor: colors.inputBg, borderColor: colors.bColor }]}
                        onPress={() => setShowMenu(!showMenu)}
                    >
                        <MaterialIcons name="restaurant-menu" size={20} color={colors.grayScale5} />
                        <ZText type="M14" color={dishName ? colors.textColor : colors.grayScale5} style={localStyles.selectText}>
                            {dishName || 'Select from menu...'}
                        </ZText>
                        <Ionicons name={showMenu ? 'chevron-up' : 'chevron-down'} size={20} color={colors.grayScale5} />
                    </TouchableOpacity>

                    <ZText type="M12" color={colors.grayScale5} style={localStyles.helperText}>
                        Select from the menu so others can order it.
                    </ZText>

                    {showMenu && (
                        <View style={[localStyles.menuContainer, { backgroundColor: colors.backgroundColor, borderColor: colors.bColor }]}>
                            {/* Search Input */}
                            <View style={[localStyles.searchContainer, { backgroundColor: colors.inputBg, borderBottomColor: colors.bColor }]}>
                                <Ionicons name="search" size={18} color={colors.grayScale5} style={localStyles.searchIcon} />
                                <TextInput
                                    style={[localStyles.searchInput, { color: colors.textColor }]}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder={strings.searchDishPlaceholder || 'Search dishes...'}
                                    placeholderTextColor={colors.grayScale5}
                                    textAlign={I18nManager.isRTL ? 'right' : 'left'}
                                    autoFocus={dishes.length > 5}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')} style={localStyles.clearSearchButton}>
                                        <Ionicons name="close-circle" size={18} color={colors.grayScale5} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Dish count indicator */}
                            {dishes.length > 0 && (
                                <View style={[localStyles.countContainer, { borderBottomColor: colors.bColor }]}>
                                    <ZText type="M11" color={colors.grayScale5}>
                                        {searchQuery.trim()
                                            ? `${filteredDishes.length} / ${dishes.length} ${strings.dishes || 'dishes'}`
                                            : `${dishes.length} ${strings.dishes || 'dishes'}`
                                        }
                                    </ZText>
                                </View>
                            )}

                            {menuLoading ? (
                                <View style={localStyles.loaderContainer}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <ZText type="M12" color={colors.grayScale5} style={localStyles.loaderText}>
                                        Loading menu...
                                    </ZText>
                                </View>
                            ) : filteredDishes.length > 0 ? (
                                <FlatList
                                    data={filteredDishes}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[localStyles.menuItem, { borderBottomColor: colors.bColor }]}
                                            onPress={() => handleDishPress(item)}
                                        >
                                            {item.image ? (
                                                <Image source={{ uri: item.image }} style={localStyles.menuDishImage} />
                                            ) : (
                                                <View style={[localStyles.menuDishPlaceholder, { backgroundColor: colors.grayScale2 }]}>
                                                    <MaterialIcons name="restaurant" size={16} color={colors.grayScale5} />
                                                </View>
                                            )}
                                            <View style={localStyles.menuItemText}>
                                                <ZText type="B14" color={colors.textColor} numberOfLines={1}>
                                                    {item.title || item.name}
                                                </ZText>
                                                <ZText type="M12" color={colors.primary}>
                                                    EGP {item.price}
                                                </ZText>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                    keyExtractor={item => item._id}
                                    style={localStyles.menuList}
                                    keyboardShouldPersistTaps="handled"
                                    nestedScrollEnabled={true}
                                />
                            ) : dishes.length > 0 ? (
                                <View style={localStyles.emptyContainer}>
                                    <ZText type="M14" color={colors.grayScale5}>
                                        {strings.noMatchingDishes || 'No matching dishes found'}
                                    </ZText>
                                </View>
                            ) : (
                                <View style={localStyles.emptyContainer}>
                                    <ZText type="M14" color={colors.grayScale5}>
                                        No dishes found in menu
                                    </ZText>
                                </View>
                            )}
                        </View>
                    )}
                </>
            ) : (
                // Google Maps location: free text input
                <>
                    <View style={[localStyles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.bColor }]}>
                        <MaterialIcons name="restaurant" size={20} color={colors.grayScale5} style={localStyles.inputIcon} />
                        <TextInput
                            style={[localStyles.textInput, { color: colors.textColor }]}
                            value={dishName}
                            onChangeText={handleTextChange}
                            placeholder={strings.typeDishNamePlaceholder}
                            placeholderTextColor={colors.grayScale5}
                            textAlign={I18nManager.isRTL ? 'right' : 'left'}
                        />
                        {dishName.length > 0 && (
                            <TouchableOpacity onPress={handleClear} style={localStyles.clearInputButton}>
                                <Ionicons name="close" size={18} color={colors.grayScale5} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <ZText type="M12" color={colors.grayScale5} style={localStyles.helperText}>
                        Type the name of the dish you ordered.
                    </ZText>
                </>
            )}
        </View>
    );
};

const localStyles = StyleSheet.create({
    container: {
        marginBottom: moderateScale(16),
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: moderateScale(12),
        borderWidth: 1,
        paddingHorizontal: moderateScale(12),
        height: moderateScale(50),
    },
    inputIcon: {
        marginRight: moderateScale(10),
    },
    textInput: {
        flex: 1,
        fontSize: moderateScale(15),
    },
    clearInputButton: {
        padding: moderateScale(4),
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: moderateScale(12),
        borderWidth: 1,
        paddingHorizontal: moderateScale(12),
        height: moderateScale(50),
    },
    selectText: {
        flex: 1,
        marginLeft: moderateScale(10),
    },
    helperText: {
        marginTop: moderateScale(6),
        marginLeft: moderateScale(4),
    },
    menuContainer: {
        marginTop: moderateScale(8),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        maxHeight: moderateScale(320),
        overflow: 'hidden',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(8),
        borderBottomWidth: 1,
    },
    searchIcon: {
        marginRight: moderateScale(8),
    },
    searchInput: {
        flex: 1,
        fontSize: moderateScale(14),
        paddingVertical: moderateScale(6),
    },
    clearSearchButton: {
        padding: moderateScale(4),
    },
    countContainer: {
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(6),
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    menuList: {
        maxHeight: moderateScale(200),
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: moderateScale(10),
        paddingHorizontal: moderateScale(12),
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    menuDishImage: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(8),
    },
    menuDishPlaceholder: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(8),
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: {
        flex: 1,
        marginLeft: moderateScale(12),
    },
    loaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: moderateScale(20),
    },
    loaderText: {
        marginLeft: moderateScale(8),
    },
    emptyContainer: {
        padding: moderateScale(20),
        alignItems: 'center',
    },
    // Selected state
    selectedContainer: {
        marginBottom: moderateScale(16),
    },
    selectedCard: {
        borderRadius: moderateScale(12),
        borderWidth: 1.5,
        padding: moderateScale(12),
    },
    selectedContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dishImage: {
        width: moderateScale(50),
        height: moderateScale(50),
        borderRadius: moderateScale(10),
    },
    iconContainer: {
        width: moderateScale(50),
        height: moderateScale(50),
        borderRadius: moderateScale(10),
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedTextContainer: {
        flex: 1,
        marginLeft: moderateScale(12),
    },
    clearButton: {
        padding: moderateScale(4),
    },
});

export default DishSelector;
