// Library import
import {FlatList, StyleSheet, View} from 'react-native';
import React, {useCallback} from 'react';
import ActionSheet from 'react-native-actions-sheet';
import {useSelector} from 'react-redux';

// Local import
import {styles} from '../../themes';
import ZText from '../common/ZText';
import {userDetail} from '../../api/constant';
import UserDetailComponent from '../UserDetailComponent';
import strings from '../../i18n/strings';
import ZButton from '../common/ZButton';

export default function GoLiveTogether(props) {
  const colors = useSelector(state => state.theme.theme);
  const {SheetRef} = props;

  const renderItem = useCallback(
    ({item, index}) => {
      return (
        <UserDetailComponent
          userName={item?.name}
          userImage={item?.imgUrl}
          isFollowed={item?.isFollow}
          key={index}
        />
      );
    },
    [userDetail],
  );

  return (
    <ActionSheet
      ref={SheetRef}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
      <View
        style={[
          localStyles.headerContainer,
          {
            borderBottomColor: colors.bColor,
          },
        ]}>
        <ZText type="b24" align={'center'} style={styles.mb20}>
          {'Go LIVE Together'}
        </ZText>
      </View>

      <FlatList
        data={userDetail}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.pb40}
        showsVerticalScrollIndicator={false}
        bounces={false}
      />
      <ZButton
        textType={'b18'}
        color={colors.white}
        title={strings.request}
        containerStyle={localStyles.btnContainer}
      />
    </ActionSheet>
  );
}

const localStyles = StyleSheet.create({
  actionSheetContainer: {
    ...styles.p20,
    height: '80%',
  },
  mainContainer: {
    ...styles.flexRow,
    width: '100%',
  },
  headerContainer: {
    ...styles.pb5,
    ...styles.mb5,
    borderBottomWidth: 1,
  },
  btnContainer: {
    ...styles.mb30,
  },
});
