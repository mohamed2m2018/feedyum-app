// Library import
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import ActionSheet from 'react-native-actions-sheet';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';

// Local import
import {moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import ZText from '../common/ZText';
import {UserDetailCategory} from '../../api/constant';
import ZButton from '../common/ZButton';
import strings from '../../i18n/strings';
import images from '../../assets/images';
import {StackNav} from '../../navigation/NavigationKeys';

export default function UserProfile(props) {
  const colors = useSelector(state => state.theme.theme);
  const {SheetRef} = props;
  const navigation = useNavigation();
  const [isFollow, setIsFollow] = useState(false);
  const userImage =
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1160&q=80';
  const userName = 'Dracel Steward';

  const onPressMessage = () => (
    SheetRef.current?.hide(),
    navigation.navigate(StackNav.Chat, {
      userName: userName,
      userImage: userImage,
    })
  );

  const onPressFollow = () => setIsFollow(!isFollow);

  const RenderUserDetail = ({item}) => {
    return (
      <View style={styles.itemsCenter}>
        <ZText type="b24" align={'center'}>
          {item.value}
        </ZText>
        <ZText type="m16" align={'center'} style={styles.mt10}>
          {item.title}
        </ZText>
      </View>
    );
  };

  return (
    <ActionSheet
      ref={SheetRef}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
      <View style={styles.itemsCenter}>
        <TouchableOpacity style={styles.mt25}>
          {!!userImage?.length ? (
            <Image
              source={{
                uri: userImage,
              }}
              style={localStyles.userImage}
            />
          ) : (
            <Image
              source={colors.dark ? images.userDark : images.userLight}
              style={localStyles.userImage}
            />
          )}
        </TouchableOpacity>
        <View style={styles.mv20}>
          <ZText type="b24" align={'center'}>
            {userName}
          </ZText>
          <ZText type="m14" align={'center'} style={styles.mt10}>
            {'andrew_ainsley@yourdomain.com'}
          </ZText>
        </View>
      </View>
      <View style={[styles.flexRow, styles.justifyEvenly]}>
        {UserDetailCategory.map((item, index) => (
          <RenderUserDetail item={item} key={index} />
        ))}
      </View>
      <View style={localStyles.editProfileContainer}>
        <ZButton
          title={isFollow ? strings.follow : strings.following}
          color={isFollow ? colors.white : colors.primary}
          onPress={onPressFollow}
          textType="b14"
          style={styles.ml5}
          containerStyle={[
            localStyles.buttonContainer,
            {borderColor: colors.primary},
          ]}
          bgColor={isFollow ? colors.primary : colors.tranparent}
          frontIcon={
            <Ionicons
              name="person-add-outline"
              size={moderateScale(18)}
              color={isFollow ? colors.white : colors.primary}
            />
          }
        />
        <ZButton
          title={strings.message}
          color={colors.primary}
          onPress={onPressMessage}
          textType="b14"
          style={styles.ml5}
          containerStyle={[
            localStyles.buttonContainer,
            {borderColor: colors.primary},
          ]}
          bgColor={colors.tranparent}
          frontIcon={
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={moderateScale(18)}
              color={colors.primary}
            />
          }
        />
      </View>
    </ActionSheet>
  );
}

const localStyles = StyleSheet.create({
  actionSheetContainer: {
    ...styles.p20,
  },
  userImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
  },
  editProfileContainer: {
    ...styles.flexRow,
    ...styles.justifyEvenly,
    ...styles.mt25,
  },
  buttonContainer: {
    ...styles.ph15,
    ...styles.mb40,
    borderWidth: moderateScale(1),
    width: '45%',
  },
});
