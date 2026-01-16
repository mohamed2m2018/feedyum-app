// Library Imports
import {
  ActivityIndicator,
  I18nManager,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

// Local Imports
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import ZHeader from '../../components/common/ZHeader';
import { styles } from '../../themes';
import strings from '../../i18n/strings';
import ZText from '../../components/common/ZText';
import { moderateScale } from '../../common/constants';
import ZButton from '../../components/common/ZButton';
import { useRoute } from '@react-navigation/native';
import request from '../../api/request';
import { useQuery } from 'react-query';

const SelectCategory = ({ navigation }) => {
  const colors = useSelector(state => state.theme.theme);
  const [chips, setchips] = useState([]);

  const route = useRoute();
  const [selectedChips, setSelectedChips] = useState(route.params.categoryIds);
  const [names, setNames] = useState(route?.params?.categoryNames || []);

  const { setcategoryIds } = route.params;

  const { isFetching } = useQuery(
    'categories',
    () => request.get('/categories').then(res => setchips(res.data)),
    {
      retry: 0,
    },
  );

  // eslint-disable-next-line react/no-unstable-nested-components
  const RenderChips = ({ item, id }) => {
    return (
      <TouchableOpacity
        onPress={() => onPressChips(id, item)}
        style={[
          localStyles.chipsContainer,
          { borderColor: colors.primary },
          selectedChips.includes(id) && { backgroundColor: colors.primary },
        ]}>
        <ZText
          type={'b18'}
          color={selectedChips.includes(id) ? colors.white : colors.primary}>
          {item}
        </ZText>
      </TouchableOpacity>
    );
  };

  const onPressChips = (value, name) => {
    if (selectedChips.includes(value)) {
      setSelectedChips(selectedChips.filter(item => item !== value));
      setNames(names?.filter(item => item !== name));
    } else {
      setSelectedChips([...selectedChips, value]);
      setNames([...names, name]);
    }
  };

  const onPressContinue = () => {
    setcategoryIds([...selectedChips]);
    route.params?.setCategoryNames?.([...names]);
    navigation?.goBack();
    // Note: React-query will automatically re-fetch when categoryIds state changes
    // (it's part of the query key in useOptimizedReels)
  };

  const InterestChips = () => {
    return chips?.map(item => {
      // Use Arabic name if RTL and available, otherwise fallback to English name
      const displayName = I18nManager.isRTL
        ? (item?.nameArabic || item?.name)
        : item?.name;
      return (
        <RenderChips
          item={displayName}
          id={item?._id}
          key={item?._id}
        />
      );
    });
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.selectInterest} />
      {isFetching && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
      )}
      {!isFetching && (
        <View style={localStyles.root}>
          <ZText type={'m18'} style={styles.mv10}>
            {strings.selectInterestDescription}
          </ZText>
          <View style={localStyles.chipMainContainer}>
            <InterestChips />
          </View>
        </View>
      )}
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

export default SelectCategory;

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
