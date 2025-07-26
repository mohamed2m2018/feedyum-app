import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

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
      Alert.alert('Error', 'Promo code is required');
      return false;
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      Alert.alert('Error', 'Valid discount value is required');
      return false;
    }

    if (formData.discountType === 'percentage' && parseFloat(formData.discountValue) > 100) {
      Alert.alert('Error', 'Percentage discount cannot exceed 100%');
      return false;
    }

    if (!formData.validUntil) {
      Alert.alert('Error', 'Valid until date is required');
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
        Alert.alert('Success!', 'Promo code created successfully');
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
        Alert.alert('Error', data.message || 'Failed to create promo code');
      }
    } catch (error) {
      console.error('Create promo code error:', error);
      Alert.alert('Error', 'Failed to create promo code. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Promo Code</Text>
      </View>

      <View style={styles.form}>
        {/* Promo Code */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Promo Code *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter promo code (e.g., SAVE20)"
            value={formData.code}
            onChangeText={(value) => handleInputChange('code', value)}
            autoCapitalize="characters"
          />
        </View>

        {/* Discount Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Discount Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.discountType}
              onValueChange={(value) => handleInputChange('discountType', value)}
              style={styles.picker}
            >
              <Picker.Item label="Percentage" value="percentage" />
              <Picker.Item label="Fixed Amount" value="fixed" />
            </Picker>
          </View>
        </View>

        {/* Discount Value */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Discount Value * {formData.discountType === 'percentage' ? '(%)' : '(£)'}
          </Text>
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
              <Text style={styles.label}>Set Maximum Discount</Text>
              <Switch
                value={hasMaxDiscount}
                onValueChange={setHasMaxDiscount}
              />
            </View>
            {hasMaxDiscount && (
              <TextInput
                style={styles.input}
                placeholder="Maximum discount amount (£)"
                value={formData.maxDiscount}
                onChangeText={(value) => handleInputChange('maxDiscount', value)}
                keyboardType="numeric"
              />
            )}
          </View>
        )}

        {/* Minimum Order Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Minimum Order Amount (£)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={formData.minOrderAmount}
            onChangeText={(value) => handleInputChange('minOrderAmount', value)}
            keyboardType="numeric"
          />
        </View>

        {/* Usage Limit */}
        <View style={styles.inputGroup}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Set Usage Limit</Text>
            <Switch
              value={hasUsageLimit}
              onValueChange={setHasUsageLimit}
            />
          </View>
          {hasUsageLimit && (
            <TextInput
              style={styles.input}
              placeholder="Maximum number of uses"
              value={formData.usageLimit}
              onChangeText={(value) => handleInputChange('usageLimit', value)}
              keyboardType="numeric"
            />
          )}
        </View>

        {/* Valid From */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Valid From (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (leave empty for immediate)"
            value={formData.validFrom}
            onChangeText={(value) => handleInputChange('validFrom', value)}
          />
        </View>

        {/* Valid Until */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Valid Until *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
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
            <Text style={styles.createButtonText}>Create Promo Code</Text>
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