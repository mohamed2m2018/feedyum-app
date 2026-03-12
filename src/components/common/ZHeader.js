import {I18nManager, StyleSheet, TouchableOpacity, View, SafeAreaView} from 'react-native';
import React from 'react';
import {styles} from '../../themes';
import {useNavigation} from '@react-navigation/native';
import ZText from './ZText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {moderateScale} from '../../common/constants';

export default function ZHeader(props) {
  const {title, onPressBack, rightIcon, isHideBack, isLeftIcon, onTitlePress} = props;
  const navigation = useNavigation();
  const colors = useSelector(state => state.theme.theme);

  const goBack = () => navigation.goBack();

  const titleContent = (
    <ZText
      numberOfLines={1}
      style={[
        styles.pr10,
        styles.mr10,
        !!rightIcon && localStyles.titleText,
      ]}
      type={'B24'}>
      {title}
    </ZText>
  );

  return (
    <SafeAreaView>
      <View style={[localStyles.container, !!isHideBack && styles.pr10]}>
        <View style={[styles.rowStart, styles.flex]}>
          {!isHideBack && (
            <TouchableOpacity style={styles.pr10} onPress={onPressBack || goBack}>
              <Ionicons
                name="arrow-back-outline"
                size={moderateScale(26)}
                style={I18nManager.isRTL && {transform: [{scaleX: -1}]}}
                color={colors.textColor}
              />
            </TouchableOpacity>
          )}
          {!!isLeftIcon && isLeftIcon}

          {!!title && (
            onTitlePress ? (
              <TouchableOpacity activeOpacity={1} onPress={onTitlePress}>
                {titleContent}
              </TouchableOpacity>
            ) : (
              titleContent
            )
          )}
        </View>
        {!!rightIcon && rightIcon}
      </View>
    </SafeAreaView>
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
    width: moderateScale(300),
  },
});
