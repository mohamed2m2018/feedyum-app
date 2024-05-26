// Library import
import {StyleSheet, TouchableOpacity, View, ScrollView, I18nManager} from 'react-native';
import React, {useState, useRef} from 'react';
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

export default function Discover({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [isContentOverflowing, setIsContentOverflowing] = useState(false);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const [currentScrollPosition, setCurrentScrollPosition] = useState(0); // New state for scroll position

  const [isSelect, setIsSelect] = useState({
    index: 0,
    routes: routes?.map(item => ({key: I18nManager.isRTL? item.nameAr: item.nameEn, title:  I18nManager.isRTL? item.nameAr: item.nameEn})),
  });

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
    const SCROLL_OFFSET = 100;

    const handleScrollViewLayout = event => {
      setScrollViewWidth(event.nativeEvent.layout.width);
    };

    const onContentSizeChange = (contentWidth, contentHeight) => {
      setIsContentOverflowing(scrollViewWidth < contentWidth);
    };

    const handleScroll = event => {
      setCurrentScrollPosition(event.nativeEvent.contentOffset.x);
    };

    const handleScrollArrowPress = () => {
      scrollViewRef.current?.scrollTo({
        x: currentScrollPosition + SCROLL_OFFSET,
        animated: true,
      });
    };
    const isAtEnd =
      currentScrollPosition + scrollViewWidth >=
      props.navigationState.routes.length * 100; // Assuming each item is 100 pixels wide

    return (
      <View style={{flexDirection: 'row'}}>
        {/* Left Arrow (only show if content overflows) */}
        {isContentOverflowing &&
          currentScrollPosition > 0 && ( // Check both overflow and scroll position
            <TouchableOpacity
              onPress={() => {
                // Scroll left when pressed
                scrollViewRef.current?.scrollTo({
                  x: Math.max(currentScrollPosition - SCROLL_OFFSET, 0), // Don't go below 0
                  animated: true,
                });
              }}
              style={{
                paddingRight: moderateScale(5), // Add padding to the right
                top: -5,
              }}>
              <MaterialIcons
                name={I18nManager.isRTL? "keyboard-arrow-right": "keyboard-arrow-left"}
                size={moderateScale(35)}
                color={colors.grayScale7}
              />
            </TouchableOpacity>
          )}

        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{maxHeight: 40}}
          contentContainerStyle={localStyles.scrollContainer}
          onContentSizeChange={onContentSizeChange}
          onLayout={handleScrollViewLayout}
          onScroll={handleScroll} // Add onScroll handler
        >
          {props.navigationState.routes.map((item, index) => (
            <HeaderCetegoryItem title={item.title} index={index} key={index} />
          ))}
        </ScrollView>

        {/* Arrow Button */}
        {isContentOverflowing && !isAtEnd && (
          <TouchableOpacity
            onPress={handleScrollArrowPress}
            style={{
              paddingLeft: moderateScale(5),
              top: -5,
            }}>
            <MaterialIcons
                name={I18nManager.isRTL? "keyboard-arrow-left": "keyboard-arrow-right"}
                size={moderateScale(35)}
              color={colors.grayScale7}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const _renderScene = ({route}) => {
    return <HashtagCategory selectedTag={routes?.find(item=> item.nameAr === route.title || item.nameEn === route.title).nameEn } />;
  };

  const onPressSearch = () => {
    navigation.navigate(StackNav.Search);
  };

  return (
    <ZSafeAreaView style={{flex: 1}}>
      <View style={localStyles.headerContainer}>
        <ZText type="b24">{strings.explore}</ZText>
        <TouchableOpacity onPress={onPressSearch}>
          <Ionicons
            name="search-outline"
            size={moderateScale(30)}
            color={colors.dark ? colors.white : colors.darkColor}
          />
        </TouchableOpacity>
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
  root: {
    borderBottomWidth: moderateScale(2),
    width: 'auto',
    paddingHorizontal: moderateScale(10),
  },
  scrollContainer: {
    paddingHorizontal: moderateScale(10),
  },
});
