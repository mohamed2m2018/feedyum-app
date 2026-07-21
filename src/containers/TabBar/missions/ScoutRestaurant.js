// Library imports
import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {FadeInUp} from 'react-native-reanimated';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKeys';
import {commonColor} from '../../../themes/colors';
import {styles as themeStyles} from '../../../themes';
import {showSuccessToast} from '../../../utils/toast';
import request from '../../../api/request';
import strings from '../../../i18n/strings';

const AnimatedView = Animated.createAnimatedComponent(View);

const DEBOUNCE_MS = 300;

export default function ScoutRestaurant() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const route = useRoute();
  const missionId = route.params?.missionId;

  // State
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Debounce ref
  const debounceRef = useRef(null);

  // Search handler with debounce
  const handleSearch = useCallback(
    text => {
      setSearchText(text);
      setSelectedPlace(null);
      setSearchError('');

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!text.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      debounceRef.current = setTimeout(async () => {
        try {
          const response = await request.get('/missions/search-places', {
            params: {query: text.trim(), missionId},
          });
          const places = response?.data?.data || response?.data?.places || [];
          setResults(Array.isArray(places) ? places : []);
        } catch (error) {
          setResults([]);
          setSearchError(error?.response?.data?.message || 'Could not search restaurants. Please try again.');
        } finally {
          setIsSearching(false);
        }
      }, DEBOUNCE_MS);
    },
    [missionId],
  );

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // Clear search
  const handleClear = useCallback(() => {
    setSearchText('');
    setResults([]);
    setIsSearching(false);
    setSelectedPlace(null);
    setSearchError('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // Start scouting -- navigate to content creation with mission context
  const handleStartScouting = useCallback(
    place => {
      // Navigate to ReviewReelCreator with scout context for content creation
      navigation.navigate(StackNav.ReviewReelCreator, {
        missionId: missionId,
        missionData: {
          _id: missionId,
          restaurantName: place.name,
          type: 'scouting',
        },
        reviewType: 'mission',
        scoutData: {
          googlePlaceId: place.placeId,
          restaurantName: place.name,
          restaurantAddress: place.address,
          isOnPlatform: place.isOnPlatform,
          location: place.location || null,
        },
      });
    },
    [navigation, missionId],
  );

  // Review instead -- navigate to the restaurant profile if available
  const handleReviewInstead = useCallback(
    place => {
      if (place.chefId) {
        navigation.navigate(StackNav.ProfileDetail, {
          id: place.chefId,
          userName: place.name,
        });
      } else {
        showSuccessToast(
          'Already on FeedYum',
          `${place.name} is already listed. Head to their page to leave a review!`,
        );
        navigation.navigate(StackNav.MissionsHub);
      }
    },
    [navigation],
  );

  // Render a single result card
  const renderResultCard = useCallback(
    ({item: place, index}) => (
      <AnimatedView
        entering={FadeInUp.delay(index * 80).duration(300)}
        style={[
          localStyles.resultCard,
          {backgroundColor: colors.inputBg},
          themeStyles.shadowStyle,
        ]}>
        {/* Restaurant info */}
        <View style={localStyles.resultInfo}>
          <ZText type="b16" numberOfLines={1}>
            {place.name}
          </ZText>
          <ZText
            type="r14"
            color={commonColor.grayScale7}
            numberOfLines={2}
            style={localStyles.addressText}>
            {place.address}
          </ZText>

          {/* Rating row */}
          {place.rating != null && (
            <View style={localStyles.ratingRow}>
              <Ionicons
                name="star"
                size={moderateScale(14)}
                color={commonColor.yellow}
              />
              <ZText type="r14" style={localStyles.ratingText}>
                {place.rating}
              </ZText>
            </View>
          )}

          {/* Status badge */}
          <View
            style={[
              localStyles.statusBadge,
              {
                backgroundColor: !place.eligible
                  ? 'rgba(255, 148, 0, 0.12)'
                  : 'rgba(0, 197, 102, 0.12)',
              },
            ]}>
            <Ionicons
              name={!place.eligible ? 'alert-circle' : 'checkmark-circle'}
              size={moderateScale(14)}
              color={!place.eligible ? commonColor.orange : commonColor.green}
            />
            <ZText
              type="r12"
              color={!place.eligible ? commonColor.orange : commonColor.green}
              style={localStyles.statusText}>
              {place.eligible ? 'Eligible for this mission' : (
                place.eligibilityReason === 'ALREADY_ON_PLATFORM' ? 'Already on FeedYum' :
                  place.eligibilityReason === 'ALREADY_SCOUTED' ? 'Already scouted' :
                    place.eligibilityReason === 'OUTSIDE_TARGET_AREA' ? 'Outside mission area' :
                      place.eligibilityReason === 'WRONG_PLACE' ? 'Not the mission target' : 'Not eligible'
              )}
            </ZText>
          </View>
        </View>

        {/* Action button */}
        {!place.eligible ? (
          <TouchableOpacity
            onPress={() => place.isOnPlatform && handleReviewInstead(place)}
            disabled={!place.isOnPlatform}
            style={[
              localStyles.outlinedButton,
              {borderColor: commonColor.orange},
            ]}>
            <ZText type="b14" color={commonColor.orange}>
              {place.isOnPlatform ? 'Review Instead' : 'Unavailable'}
            </ZText>
            <Ionicons
              name="arrow-forward"
              size={moderateScale(14)}
              color={commonColor.orange}
            />
          </TouchableOpacity>
        ) : (
          <ZButton
            title="Start Scouting"
            onPress={() => handleStartScouting(place)}
            containerStyle={localStyles.scoutButton}
            textType="b14"
            color={commonColor.white}
            frontIcon={
              <Ionicons
                name="arrow-forward"
                size={moderateScale(14)}
                color={commonColor.white}
                style={localStyles.buttonIcon}
              />
            }
          />
        )}
      </AnimatedView>
    ),
    [colors, handleStartScouting, handleReviewInstead],
  );

  // Empty state when no search yet
  const renderEmptyState = () => {
    if (searchText.trim().length > 0) {
      // User has searched but no results
      return (
        <View style={localStyles.emptyContainer}>
          <Ionicons
            name="search-outline"
            size={moderateScale(56)}
            color={commonColor.grayScale4}
          />
          <ZText
            type="b16"
            color={commonColor.grayScale5}
            style={localStyles.emptyTitle}>
            No restaurants found
          </ZText>
          <ZText
            type="r14"
            color={commonColor.grayScale5}
            align="center"
            style={localStyles.emptySubtext}>
            Try a different search term or check the spelling.
          </ZText>
        </View>
      );
    }

    // No search yet -- show prompt
    return (
      <View style={localStyles.emptyContainer}>
        <Ionicons
          name="location-outline"
          size={moderateScale(64)}
          color={commonColor.grayScale4}
        />
        <ZText
          type="b18"
          color={commonColor.grayScale5}
          style={localStyles.emptyTitle}>
          Search for a restaurant to scout
        </ZText>
        <ZText
          type="r14"
          color={commonColor.grayScale5}
          align="center"
          style={localStyles.emptySubtext}>
          Find restaurants not yet on FeedYum and earn scout bonuses!
        </ZText>
      </View>
    );
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.scoutRestaurant || 'Scout Restaurant'} fallbackRoute={StackNav.MissionsHub} />

      {/* Search bar */}
      <View style={localStyles.searchContainer}>
        <View
          style={[
            localStyles.searchBar,
            {backgroundColor: colors.inputBg},
          ]}>
          <Ionicons
            name="search-outline"
            size={moderateScale(20)}
            color={commonColor.grayScale5}
          />
          <TextInput
            style={[
              localStyles.searchInput,
              {color: colors.textColor},
            ]}
            placeholder="Search restaurants..."
            placeholderTextColor={commonColor.placeHolderColor}
            value={searchText}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons
                name="close-circle"
                size={moderateScale(20)}
                color={commonColor.grayScale5}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading indicator */}
      {isSearching && (
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="small" color={commonColor.primary} />
          <ZText
            type="r14"
            color={commonColor.grayScale5}
            style={localStyles.loadingText}>
            Searching...
          </ZText>
        </View>
      )}

      {!!searchError && !isSearching && (
        <View style={localStyles.loadingContainer} accessibilityRole="alert">
          <Ionicons name="cloud-offline-outline" size={moderateScale(24)} color={commonColor.redColor} />
          <ZText type="r14" color={commonColor.redColor} style={localStyles.loadingText}>{searchError}</ZText>
          <TouchableOpacity onPress={() => handleSearch(searchText)} accessibilityRole="button">
            <ZText type="b14" color={commonColor.primary}>Retry</ZText>
          </TouchableOpacity>
        </View>
      )}

      {/* Results list */}
      <FlatList
        data={results}
        keyExtractor={(item, index) => item.placeId || `place-${index}`}
        renderItem={renderResultCard}
        contentContainerStyle={[
          localStyles.listContent,
          results.length === 0 && localStyles.listEmpty,
        ]}
        ListEmptyComponent={!isSearching && !searchError ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
      {results.length > 0 && (
        <ZText type="r11" color={commonColor.grayScale5} align="center" style={localStyles.googleAttribution}>
          Restaurant results provided by Google
        </ZText>
      )}
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  // Search
  searchContainer: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    gap: moderateScale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
    padding: 0,
  },
  googleAttribution: {
    paddingVertical: moderateScale(8),
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(8),
    gap: moderateScale(8),
  },
  loadingText: {
    marginLeft: moderateScale(4),
  },

  // List
  listContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(32),
  },
  listEmpty: {
    flexGrow: 1,
  },

  // Result card
  resultCard: {
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
  },
  resultInfo: {
    marginBottom: moderateScale(12),
  },
  addressText: {
    marginTop: moderateScale(4),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(6),
    gap: moderateScale(4),
  },
  ratingText: {
    marginLeft: moderateScale(2),
  },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    marginTop: moderateScale(8),
    gap: moderateScale(4),
  },
  statusText: {
    marginLeft: moderateScale(2),
  },

  // Buttons
  scoutButton: {
    borderRadius: moderateScale(10),
    height: moderateScale(42),
  },
  buttonIcon: {
    marginLeft: moderateScale(6),
  },
  outlinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: moderateScale(10),
    height: moderateScale(42),
    gap: moderateScale(6),
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(32),
  },
  emptyTitle: {
    marginTop: moderateScale(16),
  },
  emptySubtext: {
    marginTop: moderateScale(8),
    lineHeight: moderateScale(20),
  },
});
