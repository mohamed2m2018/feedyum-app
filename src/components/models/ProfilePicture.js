// Library import
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import ActionSheet from 'react-native-actions-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Custom import
import {moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import ZText from '../common/ZText';
import strings from '../../i18n/strings';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {TabNav} from '../../navigation/NavigationKeys';
import {useScreen} from '../../navigation/screenContext';

const ProfilePicture = props => {
  const {SheetRef, onPressGallery, onPressCamera, title, post, isFromSwipe} =
    props;
  const colors = useSelector(state => state.theme.theme);

  const navigation = useNavigation();
  const {currentScreen: previousScreen} = useScreen();
  const buttonClicked = useRef(false);

  const handleClose = () => {
    if (previousScreen && isFromSwipe && !buttonClicked.current) {
      if (previousScreen === TabNav.FollowingTab) {
        navigation.navigate(TabNav.Search);
      } else {
        navigation.navigate(TabNav.FollowingTab);
      }
    }
  };

  useEffect(() => {
    buttonClicked.current = false;
  }, [previousScreen]);

  return (
    <ActionSheet
      ref={SheetRef}
      gestureEnabled={true}
      onClose={handleClose}
      indicatorStyle={{width: moderateScale(100)}}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
        {...(post && {height: 300})},
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
          onPress={
            onPressGallery
              ? () => {
                  onPressGallery();
                  buttonClicked.current = true;
                }
              : () => {
                  onPressCamera(true);
                  buttonClicked.current = true;
                }
          }>
          <Ionicons
            name={post ? 'add-circle-outline' : 'ios-camera'}
            size={moderateScale(26)}
            color={colors.textColor}
            style={styles.mr5}
          />
          <ZText type={'s18'} style={styles.ml10}>
            {post ? strings.postDishImage : strings.chooseFromGallery}
          </ZText>
        </TouchableOpacity>
        {post && (
          <TouchableOpacity
            style={[
              localStyles.contextContainer,
              {borderColor: colors.textColor},
            ]}
            onPress={() => {
              onPressCamera(false);
              buttonClicked.current = true;
            }}>
            <Ionicons
              name={'add-circle-outline'}
              size={moderateScale(26)}
              color={colors.textColor}
              style={styles.mr5}
            />
            <ZText type={'s18'} style={styles.ml10}>
              {strings.postDishVideo}
            </ZText>
          </TouchableOpacity>
        )}
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
