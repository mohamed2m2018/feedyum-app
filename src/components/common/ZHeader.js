import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {styles} from '../../themes';
import {useNavigation} from '@react-navigation/native';
import ZText from './ZText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {moderateScale} from '../../common/constants';

export default function ZHeader(props) {
  const {title, onPressBack, rightIcon, isHideBack, isLeftIcon} = props;
  const navigation = useNavigation();
  const colors = useSelector(state => state.theme.theme);

  const goBack = () => navigation.goBack();
  return (
    <View style={[localStyles.container, !!isHideBack && styles.pr10]}>
      <View style={[styles.rowStart, styles.flex]}>
        {!isHideBack && (
          <TouchableOpacity style={styles.pr10} onPress={onPressBack || goBack}>
            <Ionicons
              name="arrow-back-outline"
              size={moderateScale(26)}
              color={colors.textColor}
            />
          </TouchableOpacity>
        )}
        {!!isLeftIcon && isLeftIcon}

        <ZText
          numberOfLines={1}
          style={[styles.pr10, styles.mr10, localStyles.titleText]}
          type={'B24'}>
          {title}
        </ZText>
      </View>
      {!!rightIcon && rightIcon}
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    ...styles.rowSpaceBetween,
    ...styles.ph20,
    ...styles.pv15,
    ...styles.center,
  },
  titleText: {
    width: moderateScale(200),
  },
});
