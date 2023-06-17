// Library import
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo, useState} from 'react';
import {useSelector} from 'react-redux';
import ActionSheet from 'react-native-actions-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Custom import
import {moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import ZText from '../common/ZText';
import strings from '../../i18n/strings';
import images from '../../assets/images';
import {Add_Icon} from '../../assets/svgs';

export default SwitchAccont = props => {
  const {SheetRef} = props;
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState('');

  const onPressAccount = inx => setIsSelect(inx);

  const RenderUserAccount = memo(({item, index}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressAccount(index)}
        style={[styles.rowCenter, styles.mb20]}>
        <Image
          source={colors.dark ? images.userDark : images.userLight}
          style={localStyles.userImage}
        />
        <View style={[styles.mh20, styles.flex]}>
          <ZText type="b18">{'Andrew Ainsley'}</ZText>
          <ZText type="m16" numberOfLines={1} style={styles.mt10}>
            {'andrew_ainsley@yourdomain.com'}
          </ZText>
        </View>
        {isSelect === index && (
          <Ionicons
            name={'checkmark-circle'}
            size={moderateScale(26)}
            color={colors.primary}
            style={styles.mr5}
          />
        )}
      </TouchableOpacity>
    );
  });

  return (
    <ActionSheet
      ref={SheetRef}
      isGestureEnabled={true}
      indicatorStyle={{width: moderateScale(100)}}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
      <View
        style={[
          localStyles.switchContainer,
          {borderBottomColor: colors.bColor},
        ]}>
        <ZText type={'b24'} align={'center'}>
          {strings.switchAccount}
        </ZText>
      </View>
      <FlatList
        data={[1, 2, 3, 4]}
        renderItem={({item, index}) => (
          <RenderUserAccount item={item} index={index} />
        )}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.mt20}
      />
      <TouchableOpacity style={localStyles.addAccountStyle}>
        <Add_Icon width={moderateScale(60)} height={moderateScale(60)} />
        <View style={[styles.mh20, styles.flex]}>
          <ZText type="b18">{strings.addAccount}</ZText>
        </View>
      </TouchableOpacity>
    </ActionSheet>
  );
};

const localStyles = StyleSheet.create({
  actionSheetContainer: {
    ...styles.p20,
    ...styles.pb40,
  },
  switchContainer: {
    ...styles.mt10,
    ...styles.pb20,
    borderBottomWidth: moderateScale(1),
  },
  userImage: {
    width: moderateScale(60),
    height: moderateScale(60),
  },
  addAccountStyle: {
    ...styles.rowCenter,
    ...styles.mb30,
  },
});
