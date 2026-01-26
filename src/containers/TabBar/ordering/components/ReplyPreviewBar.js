import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from '../../../../common/constants';
import strings from '../../../../i18n/strings';

/**
 * ReplyPreviewBar - Shows preview of message being replied to above input
 */
const ReplyPreviewBar = ({
    replyingTo,
    onCancel,
    colors,
    isRTL = false,
}) => {
    if (!replyingTo) return null;

    // Get sender name
    const senderName = replyingTo.user?.name || strings.user;

    // Get message preview (truncated)
    let previewText = '';
    if (replyingTo.audio) {
        previewText = `🎤 ${strings.voiceMessage || 'Voice message'}`;
    } else if (replyingTo.image && !replyingTo.text) {
        previewText = `📷 ${strings.photo || 'Photo'}`;
    } else if (replyingTo.image && replyingTo.text) {
        previewText = `📷 ${replyingTo.text.substring(0, 40)}${replyingTo.text.length > 40 ? '...' : ''}`;
    } else {
        previewText = replyingTo.text?.substring(0, 60) || '';
        if (replyingTo.text?.length > 60) previewText += '...';
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.inputBg, borderLeftColor: colors.primary }]}>
            <View style={[styles.content, isRTL && styles.contentRTL]}>
                <View style={styles.replyIcon}>
                    <Ionicons name="return-up-back" size={moderateScale(16)} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.senderName, { color: colors.primary }]} numberOfLines={1}>
                        {strings.replyingTo || 'Replying to'} {senderName}
                    </Text>
                    <Text style={[styles.previewText, { color: colors.grayScale7 }]} numberOfLines={1}>
                        {previewText}
                    </Text>
                </View>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={moderateScale(20)} color={colors.grayScale5} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(8),
        borderLeftWidth: 3,
        marginHorizontal: moderateScale(10),
        marginBottom: moderateScale(4),
        borderRadius: moderateScale(8),
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    contentRTL: {
        flexDirection: 'row-reverse',
    },
    replyIcon: {
        marginRight: moderateScale(8),
    },
    textContainer: {
        flex: 1,
    },
    senderName: {
        fontSize: moderateScale(12),
        fontWeight: '600',
        marginBottom: moderateScale(2),
    },
    previewText: {
        fontSize: moderateScale(12),
    },
    closeButton: {
        padding: moderateScale(4),
    },
});

export default ReplyPreviewBar;
