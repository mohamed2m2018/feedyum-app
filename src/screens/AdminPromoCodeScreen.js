import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,

  ActivityIndicator,
  Switch,
} from 'react-native';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import ZText from '../components/common/ZText';
import ZHeader from '../components/common/ZHeader';
import { moderateScale } from '../common/constants';
import strings from '../i18n/strings';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../themes/colors'; // Assuming colors are imported from here

const AdminPromoCodeScreen = ({ userToken }) => {
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscount: '',
    minOrderAmount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [hasUsageLimit, setHasUsageLimit] = useState(false);
  const [hasMaxDiscount, setHasMaxDiscount] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.code.trim()) {
      showErrorToast(strings.error, strings.promoCodeRequired);
      return false;
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      showErrorToast(strings.error, strings.validDiscountRequired);
      return false;
    }

    if (formData.discountType === 'percentage' && parseFloat(formData.discountValue) > 100) {
      showErrorToast(strings.error, strings.percentageLimit);
      return false;
    }

    if (!formData.validUntil) {
      showErrorToast(strings.error, strings.validUntilRequired);
      return false;
    }

    return true;
  };

  const createPromoCode = async () => {
    if (!validateForm()) return;

    setIsCreating(true);

    try {
      const promocodeData = {
        code: formData.code.toUpperCase(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        maxDiscount: hasMaxDiscount && formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
        usageLimit: hasUsageLimit && formData.usageLimit ? parseInt(formData.usageLimit) : null,
        validFrom: formData.validFrom || new Date().toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
      };

      const response = await fetch('/api/promocode/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(promocodeData),
      });

      const data = await response.json();

      if (data.success) {
        showSuccessToast(strings.success, strings.promoCodeCreatedSuccess);
        // Reset form
        setFormData({
          code: '',
          discountType: 'percentage',
          discountValue: '',
          maxDiscount: '',
          minOrderAmount: '',
          usageLimit: '',
          validFrom: '',
          validUntil: '',
        });
        setHasUsageLimit(false);
        setHasMaxDiscount(false);
      } else {
        showErrorToast(strings.error, data.message || strings.failedToCreatePromoCode);
      }
    } catch (error) {
      showErrorToast(strings.error, strings.failedToCreatePromoCode);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ZHeader title={strings.createPromoCode} showBack />
      </View>

      <View style={styles.form}>
        {/* Promo Code */}
        <View style={styles.inputGroup}>
          <ZText type="B16" color={colors.textColor} style={styles.label}>{strings.promoCodeLabel} *</ZText>
          <TextInput
            style={styles.input}
            placeholder={strings.promoCodeExample}
            value={formData.code}
            onChangeText={(value) => handleInputChange('code', value)}
            autoCapitalize="characters"
          />
        </View>

        {/* Discount Type */}
        <View style={styles.inputGroup}>
          <ZText type="B16" color={colors.textColor} style={styles.label}>{strings.discountTypeLabel} *</ZText>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.discountType}
              onValueChange={(value) => handleInputChange('discountType', value)}
              style={styles.picker}
            >
              <Picker.Item label={strings.percentage} value="percentage" />
              <Picker.Item label={strings.fixedAmount} value="fixed" />
            </Picker>
          </View>
        </View>

        {/* Discount Value */}
        <View style={styles.inputGroup}>
          <ZText type="B16" color={colors.textColor} style={styles.label}>
            {strings.discountValueLabel} {formData.discountType === 'percentage' ? '(%)' : '(£)'}
          </ZText>
          <TextInput
            style={styles.input}
            placeholder={formData.discountType === 'percentage' ? '20' : '5.00'}
            value={formData.discountValue}
            onChangeText={(value) => handleInputChange('discountValue', value)}
            keyboardType="numeric"
          />
        </View>

        {/* Max Discount (for percentage only) */}
        {formData.discountType === 'percentage' && (
          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <ZText type="B16" color={colors.textColor} style={styles.label}>{strings.setMaxDiscount}</ZText>
              <Switch
                value={hasMaxDiscount}
                onValueChange={setHasMaxDiscount}
              />
            </View>
            {hasMaxDiscount && (
              <TextInput
                style={styles.input}
                placeholder={strings.maxDiscountAmountPlaceholder}
                value={formData.maxDiscount}
                onChangeText={(value) => handleInputChange('maxDiscount', value)}
                keyboardType="numeric"
              />
            )}
          </View>
        )}

        {/* Minimum Order Amount */}
        <View style={styles.inputGroup}>
          <ZText type="B16" color={colors.textColor} style={styles.label}>{strings.minOrderAmount}</ZText>
          <TextInput
            style={styles.input}
            placeholder={strings.amountPlaceholder}
            value={formData.minOrderAmount}
            onChangeText={(value) => handleInputChange('minOrderAmount', value)}
            keyboardType="numeric"
          />
        </View>

        {/* Usage Limit */}
        <View style={styles.inputGroup}>
          <View style={styles.switchRow}>
            <ZText type="B16" color={colors.textColor} style={styles.label}>{strings.setUsageLimit}</ZText>
            <Switch
              value={hasUsageLimit}
              onValueChange={setHasUsageLimit}
            />
          </View>
          {hasUsageLimit && (
            <TextInput
              style={styles.input}
              placeholder={strings.maxUsesPlaceholder}
              value={formData.usageLimit}
              onChangeText={(value) => handleInputChange('usageLimit', value)}
              keyboardType="numeric"
            />
          )}
        </View>

        {/* Valid From */}
        <View style={styles.inputGroup}>
          <ZText type="B16" color={colors.textColor} style={styles.label}>{strings.validFromOptional}</ZText>
          <TextInput
            style={styles.input}
            placeholder={strings.datePlaceholderOptional}
            value={formData.validFrom}
            onChangeText={(value) => handleInputChange('validFrom', value)}
          />
        </View>

        {/* Valid Until */}
        <View style={styles.inputGroup}>
          <ZText type="B16" color={colors.textColor} style={styles.label}>{strings.validUntilLabel} *</ZText>
          <TextInput
            style={styles.input}
            placeholder={strings.datePlaceholder}
            value={formData.validUntil}
            onChangeText={(value) => handleInputChange('validUntil', value)}
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, isCreating && styles.disabledButton]}
          onPress={createPromoCode}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>{strings.createPromoCode}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AdminPromoCodeScreen;