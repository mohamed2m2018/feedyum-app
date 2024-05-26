// Libraries import
import React, {useEffect, useState} from 'react';
import { useWindowDimensions, StyleSheet} from 'react-native';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';

// Local import
import ReelsComponent from './ReelsComponent';
import ReelsComponentFollowing from './ReelsComponentFollowing';
import {useIsFocused} from '@react-navigation/native';
import {useScreen} from '../../../navigation/screenContext';
import {TabNav} from '../../../navigation/NavigationKeys';
import {commonColor} from '../../../themes';
import ZText from '../../../components/common/ZText';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import strings from '../../../i18n/strings';

export default function Following() {
  const isFocused = useIsFocused();
  const {updateCurrentScreen} = useScreen();
  const layout = useWindowDimensions();

  useEffect(() => {
    if (isFocused) {
      updateCurrentScreen(TabNav.FollowingTab);
    }
  }, [isFocused, updateCurrentScreen]);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    {key: 'forYou', title: strings.foryou},
    {key: 'following', title: strings.following},
  ]);

  const renderScene = SceneMap({
    forYou: ReelsComponent,
    following: ReelsComponentFollowing,
  });

  const renderTabBar = props => {
    return (
      <TabBar
        {...props}
        indicatorStyle={styles.indicator}
        style={styles.tabBar}
        renderLabel={({focused, route}) => (
          <ZText style={focused ? styles.selectedLabel : styles.label}>
            {route.title}
          </ZText>
        )}
        labelStyle={styles.label}
      />
    );
  };

  return (
    <ZSafeAreaView>
      <TabView
        navigationState={{index, routes}}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{width: layout.width}}
        renderTabBar={renderTabBar}
      />
    </ZSafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent', // Tab bar background color
  },
  indicator: {
    backgroundColor: commonColor.primary, // Indicator color
    height: 3, // Indicator height
  },
  label: {
    color: commonColor.white, // Tab label color
    fontWeight: 'bold', // Tab label font weight
  },
  selectedLabel: {
    color: commonColor.primary, // Tab label color
    fontWeight: 'bold', // Tab label font weight
  },
});
