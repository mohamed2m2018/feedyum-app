// Library import
import {StyleSheet, TouchableOpacity, View, ScrollView, I18nManager, FlatList} from 'react-native';
import React, {useState, useRef, useEffect} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {TabView} from 'react-native-tab-view';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import {moderateScale} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import HashtagCategory from './HashtagCategory';
import {StackNav} from '../../../navigation/NavigationKeys';
import {routes} from './utils/routes';
import strings from '../../../i18n/strings';
import AddressDropdown from '../../../components/AddressDropdown';
import { useLocation } from '../../../navigation/locationContext';

export default function Discover({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const location = useLocation();
  const [isContentOverflowing, setIsContentOverflowing] = useState(false);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const [currentScrollPosition, setCurrentScrollPosition] = useState(0);
  const [isLocationChanging, setIsLocationChanging] = useState(false);

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

  const scrollViewRef = useRef(null);

  const _handleIndexChange = index => {
    setIsSelect({...isSelect, index: index});
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const HeaderCetegoryItem = ({title, index}) => {
    return (
      <TouchableOpacity
        onPress={() => _handleIndexChange(index)}
        style={[
          localStyles.root,
          {
            borderBottomColor:
              isSelect.index === index ? colors.primary : colors.dark3,
          },
        ]}
        key={index}>
        <ZText
          type={'s18'}
          align={'center'}
          style={styles.pb20}
          color={isSelect.index === index ? colors.primary : colors.grayScale7}>
          {title}
        </ZText>
      </TouchableOpacity>
    );
  };
  const _renderTabBar = props => {
    const flatListRef = useRef(null);

    // Scroll to selected index when it changes
    useEffect(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: isSelect.index,
          animated: true,
          viewPosition: 0.5,
        });
      }
    }, [isSelect.index]);

    const renderItem = ({ item, index }) => (
      <HeaderCetegoryItem title={item.title} index={index} />
    );

    return (
      <View>
        <FlatList
          ref={flatListRef}
          data={props.navigationState.routes}
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
  };

  const _renderScene = ({route}) => {
    const selectedTag = route.key;

    return (
      <HashtagCategory 
        selectedTag={selectedTag}
        isLocationChanging={isLocationChanging}
      />
    );
    };

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
          <TouchableOpacity onPress={onPressSearch} style={localStyles.searchButton}>
            <Ionicons
              name="search-outline"
              size={moderateScale(30)}
              color={colors.dark ? colors.white : colors.darkColor}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <TabView
        navigationState={isSelect}
        renderScene={_renderScene}
        renderTabBar={_renderTabBar}
        onIndexChange={_handleIndexChange}
        activeColor={{color: colors.primary}}
        navigation={navigation}
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
