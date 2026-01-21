import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    I18nManager,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { moderateScale } from '../common/constants';
import ZText from './common/ZText';
import strings from '../i18n/strings';
import request from '../api/request';
import GoogleMapsService from '../services/GoogleMapsService';

const RestaurantSearch = ({
    onRestaurantSelect,
    placeholder = strings.searchRestaurantPlaceholder,
    selectedRestaurant = null,
    onClear,
    userLocation = null,
}) => {
    const colors = useSelector(state => state.theme.theme);
    const [searchText, setSearchText] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchSource, setSearchSource] = useState(null); // 'partner' or 'google'
    const debounceRef = useRef(null);
    const isSelectingRef = useRef(false);

    // Debounced search
    useEffect(() => {
        if (isSelectingRef.current) {
            isSelectingRef.current = false;
            return;
        }

        if (searchText.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchRestaurants(searchText);
        }, 400);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchText]);

    const searchRestaurants = async (query) => {
        setLoading(true);
        try {
            // First, search partner chefs
            const partnerResponse = await request.get('/user/search', {
                params: {
                    searchString: query,
                    type: 'chef',
                    limit: 5,
                },
            });

            const partnerChefs = partnerResponse?.data?.data?.users || [];

            if (partnerChefs.length > 0) {
                // Found partners - show them
                setSuggestions(
                    partnerChefs.map(chef => ({
                        id: chef._id,
                        name: chef.fullName || chef.username,
                        description: chef.bio || 'Partner Chef',
                        type: 'partner',
                        chefId: chef._id,
                        avatar: chef.avatar,
                    }))
                );
                setSearchSource('partner');
                setShowSuggestions(true);
            } else {
                // No partners found - search Google Maps with location bias
                const searchOptions = {};

                if (userLocation) {
                    if (userLocation.lat && userLocation.lng) {
                        searchOptions.lat = userLocation.lat;
                        searchOptions.lng = userLocation.lng;
                    }
                    if (userLocation.country) {
                        // Map full country names to ISO 3166-1 alpha-2 codes
                        const countryMap = {
                            'Egypt': 'eg',
                            'United States': 'us',
                            'United Kingdom': 'gb',
                            'Saudi Arabia': 'sa',
                            'UAE': 'ae',
                            'United Arab Emirates': 'ae',
                            // ... other countries
                        };
                        const countryCode = countryMap[userLocation.country] || userLocation.country;
                        searchOptions.components = `country:${countryCode}`;
                    }

                    // TODO: This might need to change in future to support global search dynamically
                    // For now, restricting to Egypt as per request if no specific country found or to override
                    if (!searchOptions.components) {
                        searchOptions.components = 'country:eg';
                    }
                    // Override to enforce Egypt for now (remove 'if' above if strict enforcement is desired regardless of user location)
                    searchOptions.components = 'country:eg';
                }

                const googleResults = await GoogleMapsService.searchPlaces(query, searchOptions);

                if (googleResults && googleResults.length > 0) {
                    setSuggestions(
                        googleResults.map(place => ({
                            id: place.place_id,
                            name: place.structured_formatting?.main_text || place.description,
                            description: place.structured_formatting?.secondary_text || '',
                            type: 'google',
                            placeId: place.place_id,
                        }))
                    );
                    setSearchSource('google');
                    setShowSuggestions(true);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            }
        } catch (error) {
            console.error('Restaurant search error:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionPress = async (item) => {
        isSelectingRef.current = true;
        setSearchText(item.name);
        setShowSuggestions(false);
        setSuggestions([]);

        if (item.type === 'google') {
            // Get full place details
            try {
                const details = await GoogleMapsService.getPlaceDetails(item.placeId);
                onRestaurantSelect({
                    ...item,
                    address: details?.formatted_address,
                    lat: details?.geometry?.location?.lat,
                    lng: details?.geometry?.location?.lng,
                });
            } catch (error) {
                onRestaurantSelect(item);
            }
        } else {
            onRestaurantSelect(item);
        }
    };

    const handleClear = () => {
        setSearchText('');
        setSuggestions([]);
        setShowSuggestions(false);
        setSearchSource(null);
        if (onClear) {
            onClear();
        }
    };

    const renderSuggestion = ({ item }) => (
        <TouchableOpacity
            style={[localStyles.suggestionItem, { borderBottomColor: colors.bColor }]}
            onPress={() => handleSuggestionPress(item)}
        >
            <View style={localStyles.suggestionContent}>
                {item.type === 'partner' ? (
                    <View style={[localStyles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                        <MaterialIcons name="verified" size={16} color={colors.primary} />
                    </View>
                ) : (
                    <View style={[localStyles.iconContainer, { backgroundColor: colors.grayScale3 }]}>
                        <Ionicons name="location-outline" size={16} color={colors.grayScale7} />
                    </View>
                )}
                <View style={localStyles.suggestionTextContainer}>
                    <ZText type="B14" color={colors.textColor} numberOfLines={1}>
                        {item.name}
                    </ZText>
                    <ZText type="M12" color={colors.grayScale5} numberOfLines={1}>
                        {item.type === 'partner' ? strings.partnerChefLabel : item.description}
                    </ZText>
                </View>
            </View>
        </TouchableOpacity>
    );

    // If a restaurant is already selected, show it nicely
    if (selectedRestaurant && !showSuggestions) {
        return (
            <View style={localStyles.selectedContainer}>
                <View style={[localStyles.selectedCard, { backgroundColor: colors.inputBg, borderColor: colors.primary }]}>
                    <View style={localStyles.selectedContent}>
                        {selectedRestaurant.type === 'partner' ? (
                            <View style={[localStyles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                                <MaterialIcons name="verified" size={20} color={colors.primary} />
                            </View>
                        ) : (
                            <View style={[localStyles.iconContainer, { backgroundColor: colors.grayScale3 }]}>
                                <Ionicons name="location" size={20} color={colors.primary} />
                            </View>
                        )}
                        <View style={localStyles.selectedTextContainer}>
                            <ZText type="B16" color={colors.textColor} numberOfLines={1}>
                                {selectedRestaurant.name}
                            </ZText>
                            <ZText type="M12" color={colors.grayScale5} numberOfLines={1}>
                                {selectedRestaurant.type === 'partner' ? strings.partnerChefLabel : selectedRestaurant.description}
                            </ZText>
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
            <View style={[localStyles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.bColor }]}>
                <Ionicons name="search" size={20} color={colors.grayScale5} style={localStyles.searchIcon} />
                <TextInput
                    style={[localStyles.textInput, { color: colors.textColor }]}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.grayScale5}
                    textAlign={I18nManager.isRTL ? 'right' : 'left'}
                />
                {loading && (
                    <ActivityIndicator size="small" color={colors.primary} style={localStyles.loader} />
                )}
                {searchText.length > 0 && !loading && (
                    <TouchableOpacity onPress={handleClear} style={localStyles.clearInputButton}>
                        <Ionicons name="close" size={18} color={colors.grayScale5} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Helper text */}
            <ZText type="M12" color={colors.grayScale5} style={localStyles.helperText}>
                {strings.cantFindRestaurant}
            </ZText>

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
                <View style={[localStyles.suggestionsContainer, { backgroundColor: colors.backgroundColor, borderColor: colors.bColor }]}>
                    {searchSource === 'partner' && (
                        <View style={[localStyles.sourceHeader, { backgroundColor: colors.primary + '10' }]}>
                            <MaterialIcons name="verified" size={14} color={colors.primary} />
                            <ZText type="M12" color={colors.primary} style={localStyles.sourceText}>
                                {strings.partnerChefs}
                            </ZText>
                        </View>
                    )}
                    {searchSource === 'google' && (
                        <View style={[localStyles.sourceHeader, { backgroundColor: colors.grayScale2 }]}>
                            <Ionicons name="location" size={14} color={colors.grayScale7} />
                            <ZText type="M12" color={colors.grayScale7} style={localStyles.sourceText}>
                                {strings.googleMapsResults}
                            </ZText>
                        </View>
                    )}
                    <FlatList
                        data={suggestions}
                        renderItem={renderSuggestion}
                        keyExtractor={item => item.id}
                        scrollEnabled={true}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                    />
                </View>
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
    searchIcon: {
        marginRight: moderateScale(10),
    },
    textInput: {
        flex: 1,
        fontSize: moderateScale(15),
    },
    loader: {
        marginLeft: moderateScale(8),
    },
    clearInputButton: {
        padding: moderateScale(4),
    },
    helperText: {
        marginTop: moderateScale(6),
        marginLeft: moderateScale(4),
    },
    suggestionsContainer: {
        marginTop: moderateScale(8),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        overflow: 'hidden',
        maxHeight: moderateScale(250),
    },
    sourceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(8),
    },
    sourceText: {
        marginLeft: moderateScale(6),
    },
    suggestionItem: {
        paddingVertical: moderateScale(12),
        paddingHorizontal: moderateScale(12),
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    suggestionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: moderateScale(36),
        height: moderateScale(36),
        borderRadius: moderateScale(18),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(12),
    },
    suggestionTextContainer: {
        flex: 1,
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
    selectedTextContainer: {
        flex: 1,
        marginLeft: moderateScale(12),
    },
    clearButton: {
        padding: moderateScale(4),
    },
});

export default RestaurantSearch;
