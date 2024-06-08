// Libraries import
import React, {useEffect, useState} from 'react';
import { useWindowDimensions, StyleSheet} from 'react-native';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';
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

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    {key: 'forYou', title: strings.foryou},
    {key: 'following', title: strings.following},
  ]);

  const [focusedTab, setFocusedTab] = useState('forYou');

  useEffect(() => {
    if (isFocused) {
      updateCurrentScreen(TabNav.FollowingTab);
    }
  }, [isFocused, updateCurrentScreen]);

  useEffect(() => {
    if (index === 0) {
      setFocusedTab('forYou');
    } else {
      setFocusedTab('following');
    }
  }, [index]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'forYou':
        return <ReelsComponent amIFocused={index === 0} />;
      case 'following':
        return <ReelsComponentFollowing amIFocused={focusedTab === 'following'} />;
      default:
        return null;
    }
  };

  const renderTabBar = props => (
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
    backgroundColor: 'transparent',
  },
  indicator: {
    backgroundColor: commonColor.primary,
    height: 3,
  },
  label: {
    color: commonColor.white,
    fontWeight: 'bold',
  },
  selectedLabel: {
    color: commonColor.primary,
    fontWeight: 'bold',
  },
});
