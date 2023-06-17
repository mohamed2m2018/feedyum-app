// Library import
import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import strings from '../../../i18n/strings';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import {reportData} from '../../../api/constant';
import {moderateScale} from '../../../common/constants';
import ZButton from '../../../components/common/ZButton';

export default function Report({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [isSelected, setIsSelected] = useState('');

  const onPressItem = item => {
    setIsSelected(item);
  };

  const onPressSkip = () => navigation.goBack();

  const RenderData = ({item}) => {
    console.log('item', item);
    return (
      <TouchableOpacity
        onPress={() => onPressItem(item.lnName)}
        style={localStyles.settingsContainer}>
        <Ionicons
          name={
            isSelected === item.lnName ? 'radio-button-on' : 'radio-button-off'
          }
          size={moderateScale(24)}
          color={colors.primary}
          style={styles.mr10}
        />
        <ZText type="s18">{item.lnName}</ZText>
      </TouchableOpacity>
    );
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.report} />
      <View style={[styles.ph20, styles.flex]}>
        <FlatList
          data={reportData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => <RenderData item={item} />}
          bounces={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <View style={localStyles.btnContainer}>
        <ZButton
          title={strings.cancel}
          textType={'b18'}
          color={colors.dark ? colors.white : colors.primary}
          containerStyle={localStyles.skipBtnContainer}
          bgColor={colors.dark3}
          onPress={onPressSkip}
        />
        <ZButton
          title={strings.submit}
          textType={'b18'}
          color={colors.white}
          containerStyle={localStyles.skipBtnContainer}
          onPress={onPressSkip}
        />
      </View>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  settingsContainer: {
    ...styles.flexRow,
    ...styles.mt20,
  },
  btnContainer: {
    ...styles.p20,
    ...styles.rowSpaceAround,
  },
  skipBtnContainer: {
    width: '45%',
  },
});
