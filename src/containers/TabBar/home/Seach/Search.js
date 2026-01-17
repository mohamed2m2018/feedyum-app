// Library import
import { StyleSheet, View, I18nManager, Dimensions, Animated, TouchableOpacity } from 'react-native';
import React, { memo, useCallback, useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { TabView, TabBar } from 'react-native-tab-view';
import LinearGradient from 'react-native-linear-gradient';

// Local import
import ZSafeAreaView from '../../../../components/common/ZSafeAreaView';
import strings from '../../../../i18n/strings';
import { moderateScale } from '../../../../common/constants';
import { styles } from '../../../../themes';
import ZText from '../../../../components/common/ZText';
import { useIsFocused } from '@react-navigation/native';
import { useScreen } from '../../../../navigation/screenContext';
import { TabNav } from '../../../../navigation/NavigationKeys';
import ZLoader from '../../../../components/common/ZLoader';
import SearchHeader from '../../../../components/SearchHeader';

// Tab components
import DishSearchTab from './DishSearchTab';
import KitchensTab from './KitchensTab';
import ReviewsTab from './ReviewsTab';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Search() {
  const colors = useSelector(state => state.theme.theme);
  const { selectedAddress } = useSelector(state => state.address);

  // User location for location-based search
  const userLocation = selectedAddress?.coordinates ? {
    lat: selectedAddress.coordinates.lat || selectedAddress.coordinates.latitude,
    lng: selectedAddress.coordinates.lng || selectedAddress.coordinates.longitude,
  } : null;

  // Unified search state shared across all tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [useSemanticSearch, setUseSemanticSearch] = useState(true);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Tab state
  const [tabState, setTabState] = useState({
    index: 0,
    routes: [
      { key: 'dishes', title: strings.dishesTab || 'Dishes' },
      { key: 'kitchens', title: strings.kitchensTab || 'Kitchens' },
      { key: 'reels', title: strings.reelsTab || 'Reels' },
    ],
  });

  // Focus tracking
  const isFocused = useIsFocused();
  const { updateCurrentScreen } = useScreen();

  useEffect(() => {
    if (isFocused) {
      updateCurrentScreen(TabNav.Search);
    }
  }, [isFocused, updateCurrentScreen]);

  const handleIndexChange = useCallback((index) => {
    setTabState(prev => ({ ...prev, index }));
  }, []);

  const getActiveTabKey = () => tabState.routes[tabState.index]?.key || 'discover';

  // Simple tab bar with per-tab gradient backgrounds (works in RTL)
  const renderTabBar = useCallback(() => (
    <View style={localStyles.tabBarWrapper}>
      <View style={[localStyles.tabBarContainer, { backgroundColor: colors.inputBg + 'CC' }]}>
        {tabState.routes.map((route, index) => {
          const isSelected = tabState.index === index;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => handleIndexChange(index)}
              activeOpacity={0.8}
              style={[
                localStyles.tabItem,
                isSelected && localStyles.tabItemSelected,
              ]}
            >
              {isSelected && (
                <LinearGradient
                  colors={[colors.primary, colors.lightRed || '#FF8A9B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <ZText
                type={isSelected ? 'b14' : 'm14'}
                color={isSelected ? colors.white : colors.grayScale5}
              >
                {route.title}
              </ZText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  ), [tabState.index, tabState.routes, handleIndexChange, colors]);

  // Render tab content
  const renderScene = useCallback(({ route }) => {
    const rtlStyle = I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : {};

    switch (route.key) {
      case 'dishes':
        return (
          <DishSearchTab
            searchQuery={debouncedQuery}
            useSemanticSearch={useSemanticSearch}
            userLocation={userLocation}
            rtlStyle={rtlStyle}
          />
        );
      case 'kitchens':
        return (
          <KitchensTab
            searchQuery={debouncedQuery}
            useSemanticSearch={useSemanticSearch}
            userLocation={userLocation}
            rtlStyle={rtlStyle}
          />
        );
      case 'reels':
        return (
          <ReviewsTab
            searchQuery={debouncedQuery}
            useSemanticSearch={useSemanticSearch}
            userLocation={userLocation}
            rtlStyle={rtlStyle}
          />
        );
      default:
        return null;
    }
  }, [debouncedQuery, useSemanticSearch, userLocation]);

  return (
    <ZSafeAreaView>
      <View style={localStyles.container}>
        {/* Premium Unified Search Header */}
        <SearchHeader
          value={searchQuery}
          onChangeText={setSearchQuery}
          activeTab={getActiveTabKey()}
          useSemanticSearch={useSemanticSearch}
          onToggleSemantic={() => setUseSemanticSearch(!useSemanticSearch)}
        />

        {/* Tab View */}
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
          pagerStyle={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : {}}
        />
      </View>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarWrapper: {
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(8),
  },
  tabBarContainer: {
    flexDirection: 'row',
    borderRadius: moderateScale(16),
    padding: moderateScale(4),
  },
  tabItem: {
    flex: 1,
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    ...styles.center,
  },
  tabItemSelected: {
    // gradient applied via LinearGradient child
  },
});
