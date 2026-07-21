import React from 'react';
import {ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useQuery} from 'react-query';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import {missionService} from '../../../api/missionService';
import {StackNav} from '../../../navigation/NavigationKeys';
import {moderateScale} from '../../../common/constants';
import {commonColor} from '../../../themes/colors';
import strings from '../../../i18n/strings';

const STATUS = {
  pending: {icon: 'time-outline', color: commonColor.orange, labelKey: 'claimUnderReview'},
  approved: {icon: 'checkmark-circle-outline', color: commonColor.green, labelKey: 'claimApproved'},
  rejected: {icon: 'close-circle-outline', color: commonColor.redColor, labelKey: 'claimRejected'},
  cancelled: {icon: 'remove-circle-outline', color: commonColor.grayScale5, labelKey: 'claimCancelled'},
};

export default function RestaurantClaimStatus() {
  const navigation = useNavigation();
  const colors = useSelector(state => state.theme.theme);
  const query = useQuery('restaurantClaims', missionService.getMyRestaurantClaims, {staleTime: 10000});
  const claims = query.data?.data || [];

  return <ZSafeAreaView><ZHeader title={strings.restaurantClaims} fallbackRoute={StackNav.MissionsHub} />
    <FlatList data={claims} keyExtractor={item => item._id} refreshing={query.isFetching} onRefresh={query.refetch} contentContainerStyle={localStyles.content}
      ListEmptyComponent={<View style={localStyles.empty}>{query.isLoading ? <ActivityIndicator size="large" color={commonColor.primary} /> : <><Ionicons name="document-text-outline" size={moderateScale(50)} color={commonColor.grayScale5} /><ZText type="b16">{query.isError ? strings.claimsLoadError : strings.noRestaurantClaims}</ZText><ZText type="r14" color={commonColor.grayScale5} align="center">{query.isError ? strings.tryAgain : strings.claimsAppearHere}</ZText>{query.isError && <ZButton title={strings.retry} onPress={query.refetch} />}</>}</View>}
      renderItem={({item}) => { const status = STATUS[item.status] || STATUS.pending; return <View style={[localStyles.card, {backgroundColor: colors.inputBg}]}><View style={localStyles.row}><Ionicons name={status.icon} size={moderateScale(24)} color={status.color} /><View style={localStyles.flex}><ZText type="b16">{item.scoutedRestaurant?.name || strings.restaurantFallback}</ZText><ZText type="r13" color={commonColor.grayScale5}>{item.scoutedRestaurant?.address}</ZText></View><ZText type="b12" color={status.color}>{strings[status.labelKey]}</ZText></View>{item.reviewReason ? <ZText type="r13" color={commonColor.redColor}>{strings.claimReason}: {item.reviewReason}</ZText> : null}{item.status === 'approved' && <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate(StackNav.ChefDashboard)}><ZText type="b14" color={commonColor.primary}>{strings.continueRestaurantSetup}</ZText></TouchableOpacity>}</View>; }} />
  </ZSafeAreaView>;
}

const localStyles = StyleSheet.create({content: {padding: moderateScale(16), gap: moderateScale(12), flexGrow: 1}, empty: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: moderateScale(10)}, card: {padding: moderateScale(16), borderRadius: moderateScale(12), gap: moderateScale(12)}, row: {flexDirection: 'row', alignItems: 'center', gap: moderateScale(10)}, flex: {flex: 1}});
