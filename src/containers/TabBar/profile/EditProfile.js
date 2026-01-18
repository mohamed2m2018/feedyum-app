// Library import
import {
  I18nManager,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import { styles } from '../../../themes';
import { moderateScale } from '../../../common/constants';
import images from '../../../assets/images';
import ZText from '../../../components/common/ZText';
import { SectionList } from 'react-native';
import { editProfileData } from '../../../api/constant';
import { StackNav } from '../../../navigation/NavigationKeys';
import strings from '../../../i18n/strings';
import { useRoute } from '@react-navigation/native';

export default function EditProfile({ navigation }) {
  const colors = useSelector(state => state.theme.theme);

  const route = useRoute();
  const { user } = route.params;

  // Get dynamic title based on user type
  const getEditProfileTitle = () => {
    return user?.type === 'chef'
      ? strings.editProfileAndBranches
      : strings.editProfile;
  };

  const onPressEditProfile = () =>
    navigation.navigate(StackNav.SetUpProfile, { title: getEditProfileTitle() });

  // Premium card for info item
  const RenderInfoItem = memo(({ item }) => {
    return (
      <TouchableOpacity
        style={[
          localStyles.infoCard,
          {
            backgroundColor: colors.dark ? colors.inputBg : colors.white,
            shadowColor: colors.dark ? '#000' : colors.textColor,
          },
        ]}
        activeOpacity={0.7}
        onPress={onPressEditProfile}>
        <View style={localStyles.infoCardContent}>
          <View style={[localStyles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons
              name={item.icon}
              size={moderateScale(22)}
              color={colors.primary}
              style={{
                ...(I18nManager.isRTL && { transform: [{ scaleX: -1 }] }),
              }}
            />
          </View>
          <View style={localStyles.infoTextContainer}>
            <ZText type="m14" color={colors.grayScale5} style={localStyles.infoLabel}>
              {item.type}
            </ZText>
            <ZText type="b16" numberOfLines={1} style={localStyles.infoValue}>
              {item.value || '—'}
            </ZText>
          </View>
        </View>
        <View style={[localStyles.chevronContainer, { backgroundColor: colors.primary + '10' }]}>
          <Ionicons
            name="chevron-forward-outline"
            style={{
              ...(I18nManager.isRTL && { transform: [{ scaleX: -1 }] }),
            }}
            size={moderateScale(18)}
            color={colors.primary}
          />
        </View>
      </TouchableOpacity>
    );
  });

  return (
    <ZSafeAreaView>
      <ZHeader title={getEditProfileTitle()} />
      <ScrollView
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>

        {/* Premium Profile Avatar Section */}
        <View style={localStyles.avatarSection}>
          <TouchableOpacity
            onPress={onPressEditProfile}
            activeOpacity={0.8}
            style={localStyles.avatarWrapper}>
            <LinearGradient
              colors={[colors.primary, colors.primary + 'AA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={localStyles.avatarGradientBorder}>
              <View style={[localStyles.avatarInner, { backgroundColor: colors.backgroundColor }]}>
                <Image
                  source={
                    user?.avatar
                      ? { uri: user?.avatar }
                      : colors.dark
                        ? images.userDark
                        : images.userLight
                  }
                  style={localStyles.userImage}
                />
              </View>
            </LinearGradient>
            <View style={[localStyles.editIconContainer, { backgroundColor: colors.primary }]}>
              <MaterialIcon
                name="camera"
                size={moderateScale(16)}
                color={colors.white}
              />
            </View>
          </TouchableOpacity>

          {/* User Name Display */}
          <ZText type="b20" style={localStyles.userName}>
            {user?.fullName}
          </ZText>
          {user?.email && (
            <ZText type="m14" color={colors.grayScale5} style={localStyles.userEmail}>
              {user?.email}
            </ZText>
          )}

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={[localStyles.editButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
            activeOpacity={0.7}
            onPress={onPressEditProfile}>
            <MaterialIcon
              name="account-edit-outline"
              size={moderateScale(18)}
              color={colors.primary}
            />
            <ZText type="s14" color={colors.primary} style={localStyles.editButtonText}>
              {strings.editProfile}
            </ZText>
          </TouchableOpacity>
        </View>

        {/* Info Cards Section */}
        <SectionList
          sections={editProfileData(user?.fullName, user?.phone)}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => <RenderInfoItem item={item} key={item.id} />}
          renderSectionHeader={({ section: { title } }) => (
            <View style={localStyles.sectionHeader}>
              <View style={[localStyles.sectionDivider, { backgroundColor: colors.primary }]} />
              <ZText type="b18" color={colors.textColor}>
                {title}
              </ZText>
            </View>
          )}
          stickyHeaderHiddenOnScroll={true}
          bounces={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          style={localStyles.sectionList}
        />
      </ScrollView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(40),
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingTop: moderateScale(30),
    paddingBottom: moderateScale(25),
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: moderateScale(16),
  },
  avatarGradientBorder: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    padding: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: moderateScale(112),
    height: moderateScale(112),
    borderRadius: moderateScale(56),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userImage: {
    width: moderateScale(112),
    height: moderateScale(112),
    borderRadius: moderateScale(56),
  },
  editIconContainer: {
    position: 'absolute',
    bottom: moderateScale(4),
    right: moderateScale(4),
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    marginBottom: moderateScale(4),
    textAlign: 'center',
  },
  userEmail: {
    marginBottom: moderateScale(16),
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(25),
    borderWidth: 1,
  },
  editButtonText: {
    marginLeft: moderateScale(8),
  },

  // Section List
  sectionList: {
    marginTop: moderateScale(10),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(20),
    marginBottom: moderateScale(16),
  },
  sectionDivider: {
    width: moderateScale(4),
    height: moderateScale(20),
    borderRadius: moderateScale(2),
    marginRight: moderateScale(12),
  },

  // Info Cards
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    borderRadius: moderateScale(16),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: moderateScale(14),
    flex: 1,
  },
  infoLabel: {
    marginBottom: moderateScale(2),
  },
  infoValue: {
    maxWidth: '90%',
  },
  chevronContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
