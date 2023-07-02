// Library Imports
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useSelector} from 'react-redux';

// Local Imports
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import ZHeader from '../../components/common/ZHeader';
import {styles} from '../../themes';
import strings from '../../i18n/strings';
import ZText from '../../components/common/ZText';
import {moderateScale} from '../../common/constants';
import {StackNav} from '../../navigation/NavigationKeys';
import ZButton from '../../components/common/ZButton';
import {useRoute} from '@react-navigation/native';
import request from '../../api/request';
import {useQuery} from 'react-query';
import Spinner from 'react-native-loading-spinner-overlay/lib';

const SelectInterest = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);
  const [selectedChips, setSelectedChips] = useState([]);
  const [chips, setchips] = useState([]);
  const route = useRoute();
  const {email, password, type} = route.params;

  const {isLoading} = useQuery(
    'user',
    () => request.get('/categories').then(res => setchips(res.data)),
    {
      retry: 0,
    },
  );

  const RenderChips = ({item}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressChips(item)}
        style={[
          localStyles.chipsContainer,
          {borderColor: colors.primary},
          selectedChips.includes(item) && {backgroundColor: colors.primary},
        ]}>
        <ZText
          type={'b18'}
          color={selectedChips.includes(item) ? colors.white : colors.primary}>
          {item}
        </ZText>
      </TouchableOpacity>
    );
  };

  const onPressChips = value => {
    if (selectedChips.includes(value)) {
      setSelectedChips(selectedChips.filter(item => item !== value));
    } else {
      setSelectedChips([...selectedChips, value]);
    }
  };

  const onPressContinue = () => {
    navigation.navigate(StackNav.SetUpProfile, {
      title: strings.fillYourProfile,
      email,
      password,
      type,
      categories: selectedChips,
    });
  };

  const InterestChips = () => {
    return chips.map(item => {
      return <RenderChips item={item?.name} key={item?._id} />;
    });
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.selectInterest} />
      <View style={localStyles.root}>
        <ZText type={'m18'} style={styles.mv10}>
          {strings.selectInterestDescription}
        </ZText>
        <View style={localStyles.chipMainContainer}>
          <InterestChips />
        </View>
      </View>
      <Spinner visible={isLoading} />

      <View style={localStyles.btnContainer}>
        <ZButton
          title={strings.continue}
          textType={'b18'}
          color={colors.white}
          containerStyle={[localStyles.skipBtnContainer]}
          onPress={onPressContinue}
        />
      </View>
    </ZSafeAreaView>
  );
};

export default SelectInterest;

const localStyles = StyleSheet.create({
  chipMainContainer: {
    ...styles.wrap,
    ...styles.flexRow,
  },
  root: {
    ...styles.ph20,
    ...styles.flex,
  },
  btnContainer: {
    ...styles.p20,
    ...styles.rowSpaceAround,
  },
  chipsContainer: {
    ...styles.ph20,
    ...styles.pv10,
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(25),
    ...styles.mt15,
    ...styles.mh5,
  },
  skipBtnContainer: {
    width: '45%',
  },
});
