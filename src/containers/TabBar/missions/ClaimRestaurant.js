import React, {useEffect, useRef, useState} from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useMutation, useQuery} from 'react-query';
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
import {showErrorToast, showSuccessToast} from '../../../utils/toast';
import strings from '../../../i18n/strings';

const RELATIONSHIPS = ['owner', 'manager', 'authorized_representative'];

export default function ClaimRestaurant() {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const restaurantId = route.params?.restaurantId;
  const [form, setForm] = useState({contactName: '', contactEmail: '', contactPhone: '', relationship: 'owner'});
  const [evidence, setEvidence] = useState(null);
  const [uploading, setUploading] = useState(false);
  const allowExit = useRef(false);
  const uploadAbortRef = useRef(null);
  const idempotencyKey = useRef(`claim-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const dirty = Boolean(evidence || Object.values(form).some((value, index) => index < 3 && value.trim()));

  const restaurantQuery = useQuery(['scoutedRestaurant', restaurantId], () => missionService.getScoutedRestaurant(restaurantId), {enabled: !!restaurantId});
  const restaurant = restaurantQuery.data?.data;
  const submitClaim = useMutation(data => missionService.submitRestaurantClaim(restaurantId, data));

  useEffect(() => navigation.addListener('beforeRemove', event => {
    if (allowExit.current || !dirty || submitClaim.isSuccess) return;
    event.preventDefault();
    Alert.alert(strings.discardClaim, uploading ? strings.activeClaimUploadWarning : strings.discardClaimWarning, [
      {text: strings.stay, style: 'cancel'},
      {text: strings.discard, style: 'destructive', onPress: () => { uploadAbortRef.current?.abort(); allowExit.current = true; navigation.dispatch(event.data.action); }},
    ]);
  }), [navigation, dirty, submitClaim.isSuccess, uploading]);

  const update = (key, value) => setForm(current => ({...current, [key]: value}));

  const pickEvidence = async () => {
    const result = await DocumentPicker.getDocumentAsync({type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: true});
    if (!result.canceled) {
      if (result.assets[0].size > 10 * 1024 * 1024) showErrorToast(strings.fileTooLarge, strings.evidenceSizeWarning);
      else setEvidence(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!form.contactName.trim() || !form.contactEmail.trim() || !form.contactPhone.trim() || !evidence) {
      showErrorToast(strings.missingInformation, strings.missingClaimInfo);
      return;
    }
    try {
      setUploading(true);
      uploadAbortRef.current = new AbortController();
      const upload = await missionService.createClaimEvidenceUpload({fileName: evidence.name, contentType: evidence.mimeType, size: evidence.size});
      const blob = await (await fetch(evidence.uri, {signal: uploadAbortRef.current.signal})).blob();
      const uploadResponse = await fetch(upload.data.uploadUrl, {method: 'PUT', headers: {'Content-Type': evidence.mimeType}, body: blob, signal: uploadAbortRef.current.signal});
      if (!uploadResponse.ok) throw new Error('Evidence upload failed');
      await submitClaim.mutateAsync({
        ...form,
        idempotencyKey: idempotencyKey.current,
        evidence: [{kind: 'business_license', objectKey: upload.data.objectKey, fileName: evidence.name, contentType: evidence.mimeType, size: evidence.size}],
      });
      allowExit.current = true;
      showSuccessToast(strings.claimSubmitted, strings.claimSubmittedDescription);
      navigation.replace(StackNav.RestaurantClaimStatus);
    } catch (error) {
      if (error?.name !== 'AbortError') showErrorToast(strings.claimFailed, error?.response?.data?.message || error.message || strings.tryAgain);
    } finally {
      uploadAbortRef.current = null;
      setUploading(false);
    }
  };

  return (
    <ZSafeAreaView edges={['top', 'left', 'right', 'bottom']}>
      <ZHeader title={strings.claimRestaurant} fallbackRoute={StackNav.MissionsHub} />
      <KeyboardAvoidingView style={localStyles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={localStyles.content} keyboardShouldPersistTaps="handled">
          {restaurantQuery.isLoading ? <ZText align="center">{strings.loadingRestaurant}</ZText> : restaurantQuery.isError ? (
            <View style={localStyles.state}><ZText color={commonColor.redColor}>{strings.restaurantLoadError}</ZText><ZButton title={strings.retry} onPress={restaurantQuery.refetch} /></View>
          ) : (
            <>
              <View style={[localStyles.restaurant, {backgroundColor: colors.inputBg}]}>
                <Ionicons name="restaurant-outline" size={moderateScale(28)} color={commonColor.primary} />
                <View style={localStyles.flex}><ZText type="b18">{restaurant?.name}</ZText><ZText type="r13" color={commonColor.grayScale5}>{restaurant?.address}</ZText></View>
              </View>
              <ZText type="r14" color={commonColor.grayScale5}>{strings.claimPrivacy}</ZText>
              {[
                ['contactName', strings.contactName, 'default'], ['contactEmail', strings.businessEmail, 'email-address'], ['contactPhone', strings.businessPhone, 'phone-pad'],
              ].map(([key, placeholder, keyboardType]) => (
                <TextInput key={key} value={form[key]} onChangeText={value => update(key, value)} placeholder={placeholder} placeholderTextColor={commonColor.grayScale5} keyboardType={keyboardType} style={[localStyles.input, {backgroundColor: colors.inputBg, color: colors.textColor}]} accessibilityLabel={placeholder} />
              ))}
              <ZText type="b14">{strings.yourRelationship}</ZText>
              <View style={localStyles.relationships}>{RELATIONSHIPS.map(value => <TouchableOpacity accessibilityRole="button" key={value} onPress={() => update('relationship', value)} style={[localStyles.chip, form.relationship === value && localStyles.chipActive]}><ZText type="r12" color={form.relationship === value ? commonColor.white : colors.textColor}>{strings[`relationship_${value}`]}</ZText></TouchableOpacity>)}</View>
              <TouchableOpacity onPress={pickEvidence} style={[localStyles.evidence, {borderColor: commonColor.primary}]} accessibilityRole="button">
                <Ionicons name={evidence ? 'document-attach' : 'cloud-upload-outline'} size={moderateScale(26)} color={commonColor.primary} />
                <ZText type="b14" color={commonColor.primary}>{evidence?.name || strings.selectOwnershipDocument}</ZText>
                <ZText type="r12" color={commonColor.grayScale5}>{strings.evidenceFormats}</ZText>
              </TouchableOpacity>
              <ZButton title={uploading ? strings.submitting : strings.submitForReview} onPress={handleSubmit} disabled={uploading || restaurant?.status === 'claimed'} isLoading={uploading} accessibilityLabel={strings.submitRestaurantClaim} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  flex: {flex: 1}, content: {padding: moderateScale(20), gap: moderateScale(16)}, state: {gap: moderateScale(16), alignItems: 'center'},
  restaurant: {flexDirection: 'row', gap: moderateScale(12), padding: moderateScale(16), borderRadius: moderateScale(12), alignItems: 'center'},
  input: {minHeight: moderateScale(50), borderRadius: moderateScale(12), paddingHorizontal: moderateScale(14), fontSize: moderateScale(15)},
  relationships: {flexDirection: 'row', flexWrap: 'wrap', gap: moderateScale(8)}, chip: {paddingHorizontal: moderateScale(12), paddingVertical: moderateScale(8), borderRadius: moderateScale(18), backgroundColor: commonColor.grayScale2}, chipActive: {backgroundColor: commonColor.primary},
  evidence: {borderWidth: 1.5, borderStyle: 'dashed', borderRadius: moderateScale(12), padding: moderateScale(20), alignItems: 'center', gap: moderateScale(6)},
});
