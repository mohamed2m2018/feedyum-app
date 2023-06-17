// Libraries import
import {
  Image,
  Modal,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import React, {memo, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

// Local import
import {styles} from '../../../themes';
import {moderateScale, isAndroid} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {App_Logo} from '../../../assets/svgs';
import {headerCategoryData, inboxData} from '../../../api/constant';
import images from '../../../assets/images';
import {StackNav} from '../../../navigation/NavigationKeys';

export default function Inbox({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Activity');

  const onPressHeaderCategory = item => {
    setSelectedCategory(item.type);
    setModalVisible(!modalVisible);
  };

  const onPressModalClose = () => setModalVisible(!modalVisible);

  const onPressMessage = () => navigation.navigate(StackNav.Message);

  const RenderItem = memo(({item}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressHeaderCategory(item)}
        style={localStyles.itemContainer}>
        <Ionicons
          name={item.icon}
          size={moderateScale(24)}
          color={colors.textColor}
          style={styles.mr10}
        />
        <ZText type="s18">{item.type}</ZText>
        {item.type === selectedCategory && (
          <Ionicons
            name="checkmark-outline"
            size={moderateScale(22)}
            color={colors.primary}
            style={localStyles.selectIocn}
          />
        )}
      </TouchableOpacity>
    );
  });

  const RenderInboxItem = memo(({item}) => {
    return (
      <TouchableOpacity style={localStyles.renderItemCoontainer}>
        <View>
          {!!item?.profileImage ? (
            <Image
              source={{
                uri: item.profileImage,
              }}
              style={localStyles.userImage}
            />
          ) : (
            <Image
              source={colors.dark ? images.userDark : images.userLight}
              style={localStyles.userImage}
            />
          )}
        </View>
        <View style={[styles.mh10, styles.flex]}>
          <ZText type="b18" numberOfLines={1}>
            {item.name}
          </ZText>
          <ZText type="m14" numberOfLines={2} style={styles.mt5}>
            {item.desc}
          </ZText>
        </View>
        {!!item.follow ? (
          <TouchableOpacity
            style={[localStyles.followBtn, {backgroundColor: colors.primary}]}>
            <ZText type="b14" color={colors.white}>
              {item.follow}
            </ZText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity>
            <Image source={images.post} style={localStyles.postImage} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  });

  const RenderHeader = memo(({title}) => {
    return (
      <View
        style={[localStyles.titleContainer, {borderTopColor: colors.bColor}]}>
        <ZText type={'b20'}>{title}</ZText>
      </View>
    );
  });

  return (
    <ZSafeAreaView>
      <View style={localStyles.headerContainer}>
        <View style={styles.pr10}>
          <App_Logo height={moderateScale(30)} width={moderateScale(30)} />
        </View>

        <TouchableOpacity
          onPress={() => setModalVisible(!modalVisible)}
          style={styles.rowCenter}>
          <ZText type="b24">{selectedCategory}</ZText>
          <Ionicons
            name="chevron-down-outline"
            size={moderateScale(26)}
            style={styles.ml5}
            color={colors.dark ? colors.white : colors.darkColor}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onPressMessage}>
          <Ionicons
            name="navigate-circle-outline"
            size={moderateScale(30)}
            color={colors.dark ? colors.white : colors.darkColor}
          />
        </TouchableOpacity>
      </View>
      <SectionList
        sections={inboxData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => <RenderInboxItem item={item} key={item.id} />}
        renderSectionHeader={({section: {title}}) => (
          <RenderHeader title={title} />
        )}
        stickyHeaderHiddenOnScroll={true}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ph20}
      />

      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <TouchableWithoutFeedback onPress={onPressModalClose}>
          <View
            style={[
              localStyles.modalMainContainer,
              {
                top: isAndroid ? moderateScale(60) : moderateScale(105),
              },
            ]}>
            <View
              style={[
                localStyles.root,
                {backgroundColor: colors.backgroundColor},
              ]}>
              {headerCategoryData.map(item => (
                <RenderItem item={item} key={item.id} />
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  headerContainer: {
    ...styles.rowSpaceBetween,
    ...styles.pt20,
    ...styles.ph20,
    ...styles.pb10,
  },
  userImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
  },
  postImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    backgroundColor: 'green',
    borderRadius: moderateScale(12),
  },
  followBtn: {
    ...styles.ph20,
    ...styles.pv10,
    borderRadius: moderateScale(30),
  },
  modalMainContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  root: {
    ...styles.p20,
  },
  itemContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
    ...styles.mv15,
  },
  selectIocn: {
    position: 'absolute',
    right: 0,
  },
  titleContainer: {
    ...styles.pt10,
    ...styles.mb20,
  },
  renderItemCoontainer: {
    ...styles.rowCenter,
    ...styles.mb15,
  },
});
