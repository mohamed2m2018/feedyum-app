// Library imports
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';

// Local imports
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import strings from '../../../i18n/strings';

export default function Analytics() {
  const colors = useSelector(state => state.theme.theme);

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.analytics} isHideBack={true} />
      <View style={localStyles.container}>
        <View style={localStyles.placeholderContainer}>
          <ZText type="B20" align="center" color={colors.grayScale7}>
            Analytics Dashboard
          </ZText>
          <ZText type="M16" align="center" color={colors.grayScale7} style={localStyles.placeholderText}>
            Revenue charts and performance metrics will be displayed here
          </ZText>
        </View>
      </View>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: moderateScale(12),
    textAlign: 'center',
  },
});