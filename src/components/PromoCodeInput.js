import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,

  ActivityIndicator,
} from 'react-native';
import { showErrorToast, showSuccessToast, showWarningToast } from '../utils/toast';
import strings from '../i18n/strings';

const PromoCodeInput = ({
  onPromoCodeApplied,
  orderAmount,
  chefId,
  appliedPromoCode,
  onRemovePromoCode
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      showWarningToast(strings.error, strings.enterPromoCode);
      return;
    }

    setIsValidating(true);

    try {
      const response = await fetch('/api/promocode/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // You'll need to get this from your auth context
        },
        body: JSON.stringify({
          code: promoCode,
          orderAmount: orderAmount,
          chefId: chefId,
        }),
      });

      const data = await response.json();

      if (data.success && data.valid) {
        onPromoCodeApplied({
          code: promoCode.toUpperCase(),
          discountAmount: data.discountAmount,
          discountType: data.discountType,
        });

        showSuccessToast(strings.successExclamation, data.message);
        setPromoCode('');
      } else {
        showErrorToast(strings.invalidPromoCode, data.message || strings.promoCodeInvalidMsg);
      }
    } catch (error) {
      showErrorToast(strings.error, strings.failedToValidatePromoCode);
    } finally {
      setIsValidating(false);
    }
  };

  const removePromoCode = () => {
    onRemovePromoCode();
    setPromoCode('');
  };

  if (appliedPromoCode) {
    return (
      <View style={styles.appliedContainer}>
        <View style={styles.appliedInfo}>
          <Text style={styles.appliedText}>
            🎟️ {appliedPromoCode.code} Applied
          </Text>
          <Text style={styles.discountText}>
            -£{appliedPromoCode.discountAmount.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity onPress={removePromoCode} style={styles.removeButton}>
          <Text style={styles.removeButtonText}>{strings.remove}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{strings.havePromoCode}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={strings.enterPromoCodePlaceholder}
          value={promoCode}
          onChangeText={setPromoCode}
          autoCapitalize="characters"
          editable={!isValidating}
        />
        <TouchableOpacity
          style={[styles.applyButton, isValidating && styles.disabledButton]}
          onPress={validatePromoCode}
          disabled={isValidating}
        >
          {isValidating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.applyButtonText}>{strings.apply}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  appliedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  appliedInfo: {
    flex: 1,
  },
  appliedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  discountText: {
    fontSize: 14,
    color: '#2E7D32',
    marginTop: 2,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  removeButtonText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default PromoCodeInput;