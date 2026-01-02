import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useSelector } from 'react-redux';
import { moderateScale } from '../common/constants';
import ZText from './common/ZText';
import strings from '../i18n/strings';

const FreeAddressSearch = ({ 
  onLocationSelect, 
  placeholder, 
  autoFocus = false,
  initialValue = ''
}) => {
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText.trim().length > 2) {
        searchAddresses(searchText.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const searchAddresses = async (query, retryCount = 0) => {
    setLoading(true);
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Using Nominatim (OpenStreetMap) - completely free
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=eg&limit=5&addressdetails=1&extratags=1`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'FoodTokApp/1.0 (Contact: support@foodtok.app)', // Required by Nominatim
            'Accept': 'application/json',
            'Accept-Language': 'en,ar'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle rate limiting (429) with retry
        if (response.status === 429 && retryCount < 2) {
await new Promise(resolve => setTimeout(resolve, 1500));
          return searchAddresses(query, retryCount + 1);
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      const formattedSuggestions = data.map(item => ({
        id: item.place_id,
        description: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        details: {
          geometry: {
            location: {
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            }
          },
          formatted_address: item.display_name,
          address_components: item.address || {}
        }
      }));

      setSuggestions(formattedSuggestions);
      setShowSuggestions(true);
    } catch (error) {
// Don't show alert for abort/timeout - user likely typed more
      if (error.name === 'AbortError') {
return;
      }
      
      // Only show alert if it's not a network error (user might be offline)
      if (error.message?.includes('Network request failed')) {
        Alert.alert(strings.error || 'Error', 'No internet connection. Please check your network.');
      } else {
        // Silently fail for other errors to avoid annoying the user during typing
}
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setSearchText(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (onLocationSelect) {
      onLocationSelect(
        { description: suggestion.description },
        suggestion.details
      );
    }
  };

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity
      style={[localStyles.suggestionItem, { backgroundColor: colors.backgroundColor }]}
      onPress={() => handleSuggestionPress(item)}
    >
      <ZText type="s14" color={colors.textColor} numberOfLines={2}>
        {item.description}
      </ZText>
    </TouchableOpacity>
  );

  return (
    <View style={localStyles.container}>
      <View style={[localStyles.inputContainer, { backgroundColor: colors.inputBg }]}>
        <TextInput
          style={[localStyles.textInput, { color: colors.textColor }]}
          value={searchText}
          onChangeText={setSearchText}
          placeholder={placeholder || strings.searchLocationPlaceholder}
          placeholderTextColor={colors.grayScale5}
          autoFocus={autoFocus}
          multiline={false}
        />
        {loading && (
          <ActivityIndicator 
            size="small" 
            color={colors.primary} 
            style={localStyles.loadingIndicator}
          />
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={[localStyles.suggestionsContainer, { backgroundColor: colors.backgroundColor }]}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          />
        </View>
      )}

      {showSuggestions && suggestions.length === 0 && !loading && searchText.length > 2 && (
        <View style={[localStyles.noResultsContainer, { backgroundColor: colors.backgroundColor }]}>
          <ZText type="s14" color={colors.grayScale5}>
            {strings.noAddressFound}
          </ZText>
        </View>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 0,
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(16),
    paddingVertical: moderateScale(14),
    textAlignVertical: 'center',
  },
  loadingIndicator: {
    marginLeft: moderateScale(8),
  },
  suggestionsContainer: {
    borderRadius: moderateScale(12),
    marginTop: moderateScale(8),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: moderateScale(200),
  },
  suggestionItem: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  noResultsContainer: {
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    alignItems: 'center',
    borderRadius: moderateScale(12),
    marginTop: moderateScale(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

export default FreeAddressSearch; 