// Library import
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {TabView} from 'react-native-tab-view';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import {App_Logo} from '../../../assets/svgs';
import {moderateScale} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import strings from '../../../i18n/strings';
import HashtagCategory from './HashtagCategory';
import SoundCategory from './SoundCategory';
import {StackNav} from '../../../navigation/NavigationKeys';

export default function Discover({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState({
    index: 0,
    routes: [
      {key: 'first', title: 'Past Orders' },
      {key: 'second', title: 'Ongoing Orders'},
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
          return <HeaderCetegoryItem title={item?.title} index={index} />;
        })}
      </View>
    );
  };

  const _renderScene = ({route}) => {
    if (route.key == 'first' && isSelect.index == 0) {
      return <SoundCategory />;
    }
    if (route.key == 'second' && isSelect.index == 1) {
      return <HashtagCategory />;
    }
  };

  const onPressSearch = () => {
    navigation.navigate(StackNav.Search);
  };

  return (
    <ZSafeAreaView>
      <View style={localStyles.headerContainer}>
        <View style={styles.pr10}>
          <App_Logo height={moderateScale(30)} width={moderateScale(30)} />
        </View>
        <ZText type="b24">{'Orders'}</ZText>
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
    ...styles.pb10,
  },
  root: {
    borderBottomWidth: moderateScale(2),
    width: '50%',
  },
  mainContainer: {
    ...styles.rowSpaceBetween,
    ...styles.ph20,
    ...styles.pt20,
    width: '100%',
  },
});
