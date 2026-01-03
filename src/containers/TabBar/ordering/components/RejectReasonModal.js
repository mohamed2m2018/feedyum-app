import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import ZText from '../../../../components/common/ZText';
import { moderateScale } from '../../../../common/constants';
import Ionicons from 'react-native-vector-icons/Ionicons';

const RejectReasonModal = ({ visible, onClose, onConfirm, colors }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason);
            setReason('');
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalContainer}
            >
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
                <View style={[styles.content, { backgroundColor: colors.backgroundColor }]}>
                    <View style={styles.header}>
                        <ZText type="B18" color={colors.textColor}>Reject Order</ZText>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textColor} />
                        </TouchableOpacity>
                    </View>

                    <ZText type="r14" color={colors.grayScale7} style={styles.subtitle}>
                        Please provide a reason for rejecting this order.
                    </ZText>

                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.inputBg,
                            color: colors.textColor,
                            borderColor: colors.borderColor
                        }]}
                        placeholder="Reason for rejection..."
                        placeholderTextColor={colors.grayScale5}
                        multiline
                        numberOfLines={4}
                        value={reason}
                        onChangeText={setReason}
                        textAlignVertical="top"
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.btn, styles.cancelBtn, { borderColor: colors.borderColor }]}
                            onPress={onClose}
                        >
                            <ZText type="B16" color={colors.textColor}>Cancel</ZText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, styles.confirmBtn, {
                                backgroundColor: reason.trim() ? colors.primary : colors.disabled
                            }]}
                            onPress={handleConfirm}
                            disabled={!reason.trim()}
                        >
                            <ZText type="B16" color={colors.white}>Reject Order</ZText>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        width: '90%',
        borderRadius: moderateScale(16),
        padding: moderateScale(20),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(10),
    },
    subtitle: {
        marginBottom: moderateScale(16),
    },
    input: {
        height: moderateScale(100),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        padding: moderateScale(12),
        fontSize: moderateScale(16),
        marginBottom: moderateScale(20),
    },
    actions: {
        flexDirection: 'row',
        gap: moderateScale(12),
    },
    btn: {
        flex: 1,
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    confirmBtn: {
        // bg color handled in inline style
    },
});

export default RejectReasonModal;
