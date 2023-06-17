// Library import
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local import
import ZSafeAreaView from '../../../../components/common/ZSafeAreaView';
import ZText from '../../../../components/common/ZText';
import {styles} from '../../../../themes';
import {moderateScale} from '../../../../common/constants';
import strings from '../../../../i18n/strings';
import ZHeader from '../../../../components/common/ZHeader';
import {TabView} from 'react-native-tab-view';
import Following from './Following';
import Follower from './Follower';
import Suggested from './Suggested';

export default function UserNetwork({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState({
    index: 0,
    routes: [
      {key: 'first', title: strings.following},
      {key: 'second', title: strings.followers},
      {key: 'third', title: strings.suggested},
    ],
  });

  const _handleIndexChange = index => {
    setIsSelect({...isSelect, index: index});
  };

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
        ]}>
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
    return (
      <View style={localStyles.mainContainer}>
        {props.navigationState.routes.map((item, index) => {
          return <HeaderCetegoryItem title={item.title} index={index} />;
        })}
      </View>
    );
  };

  const _renderScene = ({route}) => {
    if (route.key == 'first' && isSelect.index == 0) {
      return <Following />;
    }
    if (route.key == 'second' && isSelect.index == 1) {
      return <Follower />;
    }
    if (route.key == 'third' && isSelect.index == 2) {
      return <Suggested />;
    }
  };

  const RightIcon = () => {
    return (
      <TouchableOpacity>
        <Ionicons
          name="search-outline"
          size={moderateScale(26)}
          color={colors.textColor}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={'Jenny Wilson'} rightIcon={<RightIcon />} />
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
  root: {
    borderBottomWidth: moderateScale(2),
    width: '33.33%',
  },
  mainContainer: {
    ...styles.rowSpaceBetween,
    ...styles.ph20,
    ...styles.pt20,
    width: '100%',
  },
});
