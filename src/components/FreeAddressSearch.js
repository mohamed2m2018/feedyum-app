import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { showErrorToast } from '../utils/toast';
import { useSelector } from 'react-redux';
import { moderateScale } from '../common/constants';
import ZText from './common/ZText';
import strings from '../i18n/strings';
import GoogleMapsService from '../services/GoogleMapsService';

const FreeAddressSearch = ({
  onLocationSelect,
  onClear,
  onFocus,
  placeholder,
  autoFocus = false,
  initialValue = ''
}) => {
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isSelectingRef = React.useRef(false);
  const prevInitialValueRef = React.useRef(initialValue);

  // Sync searchText when initialValue changes from parent (e.g., pin moved)
  useEffect(() => {
    // Only update if the initialValue actually changed and it's not from user typing
    if (initialValue !== prevInitialValueRef.current) {
      prevInitialValueRef.current = initialValue;
      // Set flag to prevent triggering search
      isSelectingRef.current = true;
      setSearchText(initialValue);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [initialValue]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    // Don't search if we just selected an item
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

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
      const predictions = await GoogleMapsService.searchPlaces(query, { components: 'country:eg' });

      const formattedSuggestions = predictions.map(item => ({
        id: item.place_id,
        description: item.description,
        place_id: item.place_id,
        details: {
          // Note: Google Autocomplete doesn't return lat/lng immediately.
          // We are passing limited info here. The selection handler might need to fetch details.
          formatted_address: item.description,
        }
      }));

      setSuggestions(formattedSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.log('Search failed', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = async (suggestion) => {
    // Set flag to prevent search from re-triggering
    isSelectingRef.current = true;
    setSearchText(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    setLoading(true);

    try {
      const details = await GoogleMapsService.getPlaceDetails(suggestion.place_id);

      if (onLocationSelect) {
        // Map Google Place Details to what the app expects
        const mappedDetails = {
          geometry: details.geometry,
          formatted_address: details.formatted_address,
          address_components: details.address_components
        };

        onLocationSelect(
          { description: suggestion.description, ...mappedDetails }, // Pass details merged or as second arg? Original was `(data, details)`
          mappedDetails
        );
      }
    } catch (error) {
      showErrorToast(strings.error, strings.failedToGetLocationDetails || "Failed to get location details");
    } finally {
      setLoading(false);
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
          onFocus={onFocus}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={localStyles.loadingIndicator}
          />
        )}
        {searchText.length > 0 && !loading && (
          <TouchableOpacity
            onPress={() => {
              setSearchText('');
              setSuggestions([]);
              setShowSuggestions(false);
              // Notify parent to clear selected location
              if (onClear) {
                onClear();
              }
            }}
            style={localStyles.clearButton}
          >
            <Text style={{ color: colors.grayScale5, fontSize: 18, fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
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
  clearButton: {
    padding: moderateScale(8),
    marginLeft: moderateScale(4),
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