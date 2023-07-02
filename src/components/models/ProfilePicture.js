// Library import
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';
import ActionSheet from 'react-native-actions-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Custom import
import {moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import ZText from '../common/ZText';
import strings from '../../i18n/strings';

const ProfilePicture = props => {
  const {SheetRef, onPressGallery, onPressCamera, title, post} = props;
  const colors = useSelector(state => state.theme.theme);

  return (
    <ActionSheet
      ref={SheetRef}
      gestureEnabled={true}
      indicatorStyle={{width: moderateScale(100)}}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
      <View style={localStyles.bottomContainer}>
        <ZText type={'M24'} color={colors.primary}>
          {title ? title : strings.uploadProfilePicture}
        </ZText>

        <TouchableOpacity
          style={[
            localStyles.contextContainer,
            {borderColor: colors.textColor},
          ]}
          onPress={onPressGallery || onPressCamera}>
          <Ionicons
            name={post ? 'add-circle-outline' : 'ios-camera'}
            size={moderateScale(26)}
            color={colors.textColor}
            style={styles.mr5}
          />
          <ZText type={'s18'} style={styles.ml10}>
            {post ? "Let's Go" : strings.chooseFromGallery}
          </ZText>
        </TouchableOpacity>
      </View>
    </ActionSheet>
  );
};

const localStyles = StyleSheet.create({
  actionSheetContainer: {
    ...styles.p25,
    height: 220,
  },
  contextContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
    ...styles.mt20,
    ...styles.p15,
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(15),
  },
  bottomContainer: {
    width: '100%',
    ...styles.selfCenter,
    paddingHorizontal: moderateScale(40),
    ...styles.mv30,
  },
});

export default ProfilePicture;
