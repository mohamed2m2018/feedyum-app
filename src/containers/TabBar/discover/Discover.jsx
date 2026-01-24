// Library import
import {StyleSheet, TouchableOpacity, View, I18nManager, FlatList, Dimensions} from 'react-native';
import React, {useState, useRef, useEffect, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {TabView} from 'react-native-tab-view';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import {moderateScale} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import HashtagCategory from './HashtagCategory';
import ZLoader from '../../../components/common/ZLoader';
import {StackNav} from '../../../navigation/NavigationKeys';
import {routes} from './utils/routes';
import strings from '../../../i18n/strings';
import AddressDropdown from '../../../components/AddressDropdown';
import { useLocation } from '../../../navigation/locationContext';
import HeaderIconWithBadge from '../../../components/common/HeaderIconWithBadge';
import { useNotificationCounts } from '../../../hooks/useNotificationCounts';
import { selectCartItemCount } from '../../../redux/reducer/cartSlice';

const HeaderCetegoryItem = React.memo(({ title, index, isSelected, onPress, colors }) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(index)}
      style={[
        localStyles.root,
        {
          borderBottomColor:
            isSelected ? colors.primary : colors.dark3,
        },
      ]}
      key={index}>
      <ZText
        type={'s18'}
        align={'center'}
        style={styles.pb20}
        color={isSelected ? colors.primary : colors.grayScale7}>
        {title}
      </ZText>
    </TouchableOpacity>
  );
});

const RenderTabBar = React.memo(({ navigationState, index, onIndexChange, colors }) => {
  const flatListRef = useRef(null);

  // Scroll to selected index when it changes
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [index]);

  const renderItem = useCallback(({ item, index: itemIndex }) => (
    <HeaderCetegoryItem 
      title={item.title} 
      index={itemIndex} 
      isSelected={index === itemIndex}
      onPress={onIndexChange}
      colors={colors}
    />
  ), [index, onIndexChange, colors]);

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={navigationState.routes}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={localStyles.scrollContainer}
        keyExtractor={(item, index) => index.toString()}
        onScrollToIndexFailed={info => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          });
        }}
      />
    </View>
  );
});

const RenderScene = React.memo(({ route, isLocationChanging }) => {
   const selectedTag = route.key;

   return (
     <View style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : {}}>
       <HashtagCategory 
         selectedTag={selectedTag}
         isLocationChanging={isLocationChanging}
       />
     </View>
   );
});

export default function Discover({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const location = useLocation();
  const [isLocationChanging, setIsLocationChanging] = useState(false);
  const cartItemCount = useSelector(selectCartItemCount);
  const { unseenOrdersCount, unreadChatsCount } = useNotificationCounts();

  const [isSelect, setIsSelect] = useState({
    index: 0,
    routes: routes?.map(item => ({key: item.nameEn, title:  I18nManager.isRTL? item.nameAr: item.nameEn})),
  });

  // Track location changes and provide visual feedback
  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      setIsLocationChanging(true);

      // Reset loading state after a brief moment to let React Query handle the refetch
      const timer = setTimeout(() => {
        setIsLocationChanging(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [location?.latitude, location?.longitude, location?.selectedAddress]);

  const _handleIndexChange = useCallback(index => {
    setIsSelect(prev => ({...prev, index: index}));
  }, []);

  const _renderTabBar = useCallback(props => (
    <RenderTabBar 
      navigationState={isSelect}
      index={isSelect.index}
      onIndexChange={_handleIndexChange}
      colors={colors}
    />
  ), [isSelect, _handleIndexChange, colors]);

  const _renderScene = useCallback(({route}) => (
    <RenderScene route={route} isLocationChanging={isLocationChanging} />
  ), [isLocationChanging]);

  const onPressSearch = () => {
    navigation.navigate(StackNav.Search);
  };

  return (
    <ZSafeAreaView style={{flex: 1}}>
      <View style={localStyles.headerContainer}>
        <ZText type="b24">{strings.explore}</ZText>
        <View style={localStyles.headerRightSection}>
          {/* Address Dropdown for Discover */}
          <View style={localStyles.addressDropdownWrapper}>
            <AddressDropdown 
              compact={true}
              style={{ 
                flex: 1,
                maxWidth: moderateScale(160) // Increased max width
              }}
              onAddressSelect={(address) => {

                // React Query will automatically refetch when location context changes
              }}
            />
          </View>
          <HeaderIconWithBadge
            name="basket-outline"
            count={cartItemCount}
            onPress={() => navigation.navigate(StackNav.ShoppingCart)}
          />
          <HeaderIconWithBadge
            name="bag-handle-outline"
            count={unseenOrdersCount}
            onPress={() => navigation.navigate(StackNav.Orders)}
          />
          <HeaderIconWithBadge
            name="chatbubbles-outline"
            count={unreadChatsCount}
            onPress={() => navigation.navigate(StackNav.ChatList)}
          />
        </View>
      </View>
      
      <TabView
        navigationState={isSelect}
        renderScene={_renderScene}
        renderTabBar={_renderTabBar}
        onIndexChange={_handleIndexChange}
        activeColor={{color: colors.primary}}
        navigation={navigation}
        lazy={true}
        lazyPreloadDistance={1}
        renderLazyPlaceholder={() => <ZLoader height={100} />}
        initialLayout={{ width: Dimensions.get('window').width }}
        animationEnabled={true}
        pagerStyle={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : {}}
      />
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  headerContainer: {
    ...styles.rowSpaceBetween,
    ...styles.pt20,
    ...styles.ph20,
    ...styles.pb30,
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  addressDropdownWrapper: {
    flex: 1,
    marginRight: moderateScale(15), // Increased space from search icon
    maxWidth: moderateScale(160), // Prevent overflow
  },
  searchButton: {
    padding: moderateScale(5), // Add touch area
    marginLeft: moderateScale(5),
  },
  root: {
    borderBottomWidth: moderateScale(2),
    width: 'auto',
    paddingHorizontal: moderateScale(10),
  },
  scrollContainer: {
    paddingHorizontal: moderateScale(10),
  },
});
