// Library import
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import ActionSheet from 'react-native-actions-sheet';

// Local import
import {moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import ZText from '../common/ZText';
import strings from '../../i18n/strings';
import ZButton from '../common/ZButton';

const LogOut = props => {
  const {SheetRef, onPressCancel, onPressLogOut} = props;
  const colors = useSelector(state => state.theme.theme);

  return (
    <ActionSheet
      ref={SheetRef}
      isGestureEnabled={true}
      indicatorStyle={{width: moderateScale(100)}}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
      <View style={localStyles.bottomContainer}>
        <ZText
          type={'M24'}
          style={styles.mt10}
          color={colors.lightRed}
          align={'center'}>
          {strings.logout}
        </ZText>
        <View
          style={[
            localStyles.divider,
            {
              backgroundColor: colors.bColor,
            },
          ]}
        />

        <ZText type={'b20'} align={'center'}>
          {strings.logOutDescription}
        </ZText>
        <View style={localStyles.btnContainer}>
          <ZButton
            title={strings.cancel}
            textType={'b18'}
            color={colors.dark ? colors.white : colors.primary}
            containerStyle={localStyles.skipBtnContainer}
            bgColor={colors.dark3}
            onPress={onPressCancel}
          />
          <ZButton
            title={strings.yesLogOut}
            textType={'b18'}
            color={colors.white}
            containerStyle={localStyles.skipBtnContainer}
            onPress={onPressLogOut}
          />
        </View>
      </View>
    </ActionSheet>
  );
};

const localStyles = StyleSheet.create({
  actionSheetContainer: {
    ...styles.ph20,
  },
  btnContainer: {
    ...styles.pv30,
    ...styles.rowSpaceAround,
  },
  skipBtnContainer: {
    width: '45%',
  },
  bottomContainer: {
    ...styles.pv10,
  },
  divider: {
    height: moderateScale(1),
    ...styles.mv25,
  },
});

export default LogOut;
