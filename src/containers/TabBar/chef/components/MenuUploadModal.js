import React, { useState } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';

let DocumentPicker = null;
try {
    DocumentPicker = require('expo-document-picker');
} catch (e) {
    // expo-document-picker not available (needs native rebuild)
}
import ZText from '../../../../components/common/ZText';
import ZButton from '../../../../components/common/ZButton';
import { moderateScale } from '../../../../common/constants';
import request from '../../../../api/request';
import strings from '../../../../i18n/strings';

const MAX_FILES = 10;

const getContentType = (ext) => {
    const types = {
        pdf: 'application/pdf',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls: 'application/vnd.ms-excel',
        csv: 'text/csv',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
    };
    return types[ext?.toLowerCase()] || 'application/octet-stream';
};

const isImageFile = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
};

const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'document-text-outline';
    if (['xlsx', 'xls', 'csv'].includes(ext)) return 'grid-outline';
    return 'document-outline';
};

export default function MenuUploadModal({ visible, onClose, onSuccess }) {
    const colors = useSelector(state => state.theme.theme);
    const [files, setFiles] = useState([]);
    const [notes, setNotes] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [showPickerSheet, setShowPickerSheet] = useState(false);

    const pickFiles = () => {
        if (files.length >= MAX_FILES) {
            setResultMessage({ type: 'error', message: strings.menuUploadMaxFiles });
            return;
        }

        // If document picker not available (needs rebuild), go straight to photos
        if (!DocumentPicker) {
            pickPhotos();
            return;
        }

        setShowPickerSheet(true);
    };

    const pickPhotos = async () => {
        const remaining = MAX_FILES - files.length;
        try {
            const results = await ImagePicker.openPicker({
                multiple: true,
                maxFiles: remaining,
                mediaType: 'photo',
                compressImageQuality: 0.8,
            });
            const newFiles = (Array.isArray(results) ? results : [results]).map(asset => ({
                uri: asset.path,
                fileName: asset.filename || `menu_${Date.now()}.jpg`,
                type: 'image',
            }));
            setFiles(prev => [...prev, ...newFiles].slice(0, MAX_FILES));
        } catch (error) {
            if (error?.code !== 'E_PICKER_CANCELLED') {
                console.error('Image picker error:', error);
            }
        }
    };

    const pickDocuments = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/csv',
                ],
                multiple: true,
            });
            if (result.canceled) return;
            const newFiles = (result.assets || []).map(asset => ({
                uri: asset.uri,
                fileName: asset.name || `menu_${Date.now()}.pdf`,
                type: 'document',
            }));
            setFiles(prev => [...prev, ...newFiles].slice(0, MAX_FILES));
        } catch (error) {
            console.error('Document picker error:', error);
        }
    };

    const removeFile = index => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFileToR2 = async (file) => {
        const ext = file.fileName?.split('.').pop() || 'jpg';
        const fileType = isImageFile(file.fileName) ? 'image' : 'pdf';
        const urlRes = await request.get(`/menu-upload/get-upload-url?type=${fileType}&extension=${ext}`);
        const { presignedUrl, publicUrl, key } = urlRes.data;

        const response = await fetch(file.uri);
        const blob = await response.blob();

        await fetch(presignedUrl, {
            method: 'PUT',
            body: blob,
            headers: { 'Content-Type': getContentType(ext) },
        });

        return { url: publicUrl, key, type: file.type, originalName: file.fileName };
    };

    const [resultMessage, setResultMessage] = useState(null); // { type: 'success'|'error', message }

    const handleSubmit = async () => {
        if (files.length === 0) {
            setResultMessage({ type: 'error', message: strings.menuUploadNoFiles });
            return;
        }

        setUploading(true);

        try {
            // Upload each file to R2
            const uploadedFiles = [];
            for (let i = 0; i < files.length; i++) {
                setUploadProgress(
                    strings.formatString(strings.menuUploadProgress, i + 1, files.length)
                );
                const uploaded = await uploadFileToR2(files[i]);
                uploadedFiles.push(uploaded);
            }

            setUploadProgress(strings.menuUploadSubmitting);

            // Submit the menu upload request
            await request.post('/menu-upload/submit', {
                files: uploadedFiles,
                notes,
            });

            setFiles([]);
            setNotes('');
            setUploadProgress('');

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Menu upload error:', error, error?.response?.data);
            const msg = error?.response?.data?.error || error.message || strings.somethingWentWrong;
            setResultMessage({ type: 'error', message: msg });
        } finally {
            setUploading(false);
            setUploadProgress('');
        }
    };

    const handleClose = () => {
        if (uploading) return;
        setFiles([]);
        setNotes('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}>
            <View style={[localStyles.container, { backgroundColor: colors.backgroundColor }]}>
                {/* Header */}
                <View style={[localStyles.header, { borderBottomColor: colors.bColor }]}>
                    <TouchableOpacity onPress={handleClose} disabled={uploading}>
                        <Ionicons name="close" size={moderateScale(24)} color={colors.textColor} />
                    </TouchableOpacity>
                    <ZText type="B18" color={colors.textColor}>
                        {strings.menuUploadTitle}
                    </ZText>
                    <View style={{ width: moderateScale(24) }} />
                </View>

                <ScrollView
                    style={localStyles.content}
                    contentContainerStyle={localStyles.contentContainer}
                    showsVerticalScrollIndicator={false}>

                    {/* Instructions */}
                    <View style={[localStyles.infoCard, { backgroundColor: colors.inputBg }]}>
                        <Ionicons name="information-circle-outline" size={moderateScale(24)} color={colors.primary} />
                        <ZText type="M14" color={colors.grayScale7} style={localStyles.infoText}>
                            {strings.menuUploadInstructions}
                        </ZText>
                    </View>

                    {/* File Grid */}
                    <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                        {strings.menuUploadPhotosLabel}
                    </ZText>

                    <View style={localStyles.fileGrid}>
                        {files.map((file, index) => (
                            <View key={index} style={[localStyles.fileThumb, { borderColor: colors.bColor }]}>
                                {isImageFile(file.fileName) ? (
                                    <Image source={{ uri: file.uri }} style={localStyles.thumbImage} />
                                ) : (
                                    <View style={[localStyles.docThumb, { backgroundColor: colors.inputBg }]}>
                                        <Ionicons name={getFileIcon(file.fileName)} size={moderateScale(32)} color={colors.primary} />
                                        <ZText type="M10" color={colors.grayScale7} numberOfLines={1} style={localStyles.docName}>
                                            {file.fileName?.split('.').pop()?.toUpperCase()}
                                        </ZText>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={[localStyles.removeBtn, { backgroundColor: colors.redColor }]}
                                    onPress={() => removeFile(index)}
                                    disabled={uploading}>
                                    <Ionicons name="close" size={moderateScale(14)} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {files.length < MAX_FILES && (
                            <TouchableOpacity
                                style={[localStyles.addFileBtn, { borderColor: colors.primary, backgroundColor: colors.inputBg }]}
                                onPress={pickFiles}
                                disabled={uploading}>
                                <Ionicons name="add-outline" size={moderateScale(28)} color={colors.primary} />
                                <ZText type="M12" color={colors.primary}>
                                    {strings.menuUploadAddPhotos}
                                </ZText>
                            </TouchableOpacity>
                        )}
                    </View>

                    <ZText type="M12" color={colors.grayScale7} style={localStyles.fileCount}>
                        {files.length}/{MAX_FILES} {strings.menuUploadFilesLabel}
                    </ZText>
                </ScrollView>

                {/* Submit Button */}
                <View style={[localStyles.footer, { borderTopColor: colors.bColor }]}>
                    {uploading ? (
                        <View style={localStyles.uploadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <ZText type="M14" color={colors.primary} style={localStyles.uploadingText}>
                                {uploadProgress || strings.uploading}
                            </ZText>
                        </View>
                    ) : (
                        <ZButton
                            title={strings.menuUploadSubmit}
                            textType="b18"
                            color={colors.white}
                            containerStyle={localStyles.submitBtn}
                            onPress={handleSubmit}
                            disabled={files.length === 0}
                            frontIcon={
                                <Ionicons
                                    name="cloud-upload-outline"
                                    size={moderateScale(20)}
                                    color={colors.white}
                                    style={{ marginRight: moderateScale(8) }}
                                />
                            }
                        />
                    )}
                </View>
            </View>

            {/* File Type Picker Sheet */}
            <Modal
                visible={showPickerSheet}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPickerSheet(false)}>
                <TouchableOpacity
                    style={localStyles.sheetBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowPickerSheet(false)}>
                    <View style={[localStyles.pickerSheet, { backgroundColor: colors.inputBg }]}>
                        <View style={localStyles.sheetHandle} />
                        <ZText type="B18" color={colors.textColor} style={localStyles.sheetTitle}>
                            {strings.menuUploadAddPhotos}
                        </ZText>

                        <TouchableOpacity
                            style={[localStyles.sheetOption, { backgroundColor: colors.backgroundColor }]}
                            onPress={() => { setShowPickerSheet(false); pickPhotos(); }}>
                            <Ionicons name="camera-outline" size={moderateScale(24)} color={colors.primary} />
                            <ZText type="B16" color={colors.textColor}>{strings.menuUploadPickPhotos}</ZText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[localStyles.sheetOption, { backgroundColor: colors.backgroundColor }]}
                            onPress={() => { setShowPickerSheet(false); pickDocuments(); }}>
                            <Ionicons name="document-text-outline" size={moderateScale(24)} color={colors.primary} />
                            <ZText type="B16" color={colors.textColor}>{strings.menuUploadPickDocuments}</ZText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[localStyles.sheetCancel, { borderColor: colors.bColor }]}
                            onPress={() => setShowPickerSheet(false)}>
                            <ZText type="B16" color={colors.grayScale7}>{strings.cancel}</ZText>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Result Message Sheet */}
            <Modal
                visible={!!resultMessage}
                transparent
                animationType="slide"
                onRequestClose={() => setResultMessage(null)}>
                <TouchableOpacity
                    style={localStyles.sheetBackdrop}
                    activeOpacity={1}
                    onPress={() => setResultMessage(null)}>
                    <View style={[localStyles.pickerSheet, { backgroundColor: colors.inputBg }]}>
                        <View style={localStyles.sheetHandle} />
                        <Ionicons
                            name={resultMessage?.type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                            size={moderateScale(40)}
                            color={resultMessage?.type === 'error' ? colors.redColor : '#4CAF50'}
                            style={localStyles.sheetTitle}
                        />
                        <ZText type="B18" color={colors.textColor} style={localStyles.sheetTitle}>
                            {resultMessage?.type === 'error' ? strings.error : strings.success}
                        </ZText>
                        <ZText type="M14" color={colors.grayScale7} style={{ textAlign: 'center', marginBottom: moderateScale(20) }}>
                            {resultMessage?.message}
                        </ZText>
                        <TouchableOpacity
                            style={[localStyles.sheetOption, { backgroundColor: colors.backgroundColor, justifyContent: 'center' }]}
                            onPress={() => setResultMessage(null)}>
                            <ZText type="B16" color={colors.primary}>{strings.ok || 'OK'}</ZText>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </Modal>
    );
}

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(16),
        borderBottomWidth: 1,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: moderateScale(16),
    },
    infoCard: {
        flexDirection: 'row',
        padding: moderateScale(14),
        borderRadius: moderateScale(12),
        gap: moderateScale(10),
        marginBottom: moderateScale(20),
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        lineHeight: moderateScale(20),
    },
    sectionTitle: {
        marginBottom: moderateScale(12),
    },
    fileGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: moderateScale(10),
    },
    fileThumb: {
        width: moderateScale(100),
        height: moderateScale(100),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    docThumb: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: moderateScale(4),
    },
    docName: {
        textAlign: 'center',
    },
    removeBtn: {
        position: 'absolute',
        top: moderateScale(4),
        right: moderateScale(4),
        width: moderateScale(22),
        height: moderateScale(22),
        borderRadius: moderateScale(11),
        justifyContent: 'center',
        alignItems: 'center',
    },
    addFileBtn: {
        width: moderateScale(100),
        height: moderateScale(100),
        borderRadius: moderateScale(12),
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: moderateScale(4),
    },
    fileCount: {
        marginTop: moderateScale(8),
        textAlign: 'center',
    },
    footer: {
        padding: moderateScale(16),
        borderTopWidth: 1,
    },
    submitBtn: {
        width: '100%',
    },
    uploadingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: moderateScale(14),
        gap: moderateScale(10),
    },
    uploadingText: {
        flex: 0,
    },
    sheetBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    pickerSheet: {
        paddingHorizontal: moderateScale(20),
        paddingTop: moderateScale(16),
        paddingBottom: moderateScale(34),
        borderTopLeftRadius: moderateScale(20),
        borderTopRightRadius: moderateScale(20),
    },
    sheetHandle: {
        alignSelf: 'center',
        width: moderateScale(40),
        height: moderateScale(4),
        borderRadius: moderateScale(2),
        backgroundColor: '#CCCCCC55',
        marginBottom: moderateScale(16),
    },
    sheetTitle: {
        textAlign: 'center',
        marginBottom: moderateScale(16),
    },
    sheetOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(14),
        padding: moderateScale(16),
        borderRadius: moderateScale(14),
        marginBottom: moderateScale(10),
    },
    sheetCancel: {
        alignItems: 'center',
        padding: moderateScale(14),
        borderRadius: moderateScale(14),
        borderWidth: 1,
        marginTop: moderateScale(4),
    },
});
