import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import ZText from '../../../components/common/ZText';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';
import { moderateScale } from '../../../common/constants';
import strings from '../../../i18n/strings';
import paymobService from '../../../api/paymobService';

export default function PaymobCheckout({ navigation, route }) {
    const { checkoutUrl, transactionId, amount } = route.params;
    const colors = useSelector(state => state.theme.theme);
    const [isLoading, setIsLoading] = useState(true);
    const [paymentProcessed, setPaymentProcessed] = useState(false);
    const webViewRef = useRef(null);

    const handleWebViewMessage = async (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'PAYMOB_PAYMENT_RESULT') {
                setPaymentProcessed(true);
                if (data.success) {
                    showSuccessToast(
                        strings.paymentSuccessful,
                        strings.walletChargedSuccessfully
                    );
                    navigation.goBack();
                } else {
                    showErrorToast(strings.paymentFailed, strings.paymentNotCompleted);
                    navigation.goBack();
                }
            }
        } catch (e) {
            // Not a JSON message, ignore
        }
    };

    const handleNavigationStateChange = async (navState) => {
        const { url } = navState;

        // Detect redirect URL that indicates payment completion
        if (url && url.includes('/api/paymob/redirect')) {
            if (!paymentProcessed) {
                setPaymentProcessed(true);

                try {
                    const urlObj = new URL(url);
                    const success = urlObj.searchParams.get('success') === 'true';

                    if (success) {
                        try {
                            if (transactionId) {
                                await paymobService.verifyPayment(transactionId);
                            }
                            showSuccessToast(
                                strings.paymentSuccessful,
                                strings.walletChargedSuccessfully
                            );
                        } catch (error) {
                            showSuccessToast(
                                strings.paymentSuccessful,
                                strings.paymentBeingProcessed
                            );
                        }
                    } else {
                        showErrorToast(strings.paymentFailed, strings.paymentNotCompleted);
                    }
                } catch (e) {
                    // URL parsing failed, try to verify via API
                    showSuccessToast(strings.paymentPending, strings.paymentBeingProcessed);
                }

                setTimeout(() => navigation.goBack(), 1500);
            }
        }
    };

    const handleError = () => {
        setIsLoading(false);
        showErrorToast(strings.error, strings.failedToLoadPaymentPage);
    };

    return (
        <ZSafeAreaView>
            <ZHeader
                title={strings.paymentTitle}
                isLeftIcon={
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons
                            name="arrow-back"
                            size={moderateScale(24)}
                            color={colors.textColor}
                        />
                    </TouchableOpacity>
                }
            />

            <View style={localStyles.amountBanner}>
                <ZText type="m14" color={colors.grayScale7}>
                    {strings.amountToPay}
                </ZText>
                <ZText type="b20" color={colors.primary}>
                    {strings.currency} {amount}
                </ZText>
            </View>

            <View style={localStyles.container}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: checkoutUrl }}
                    style={localStyles.webview}
                    onMessage={handleWebViewMessage}
                    onNavigationStateChange={handleNavigationStateChange}
                    onLoadEnd={() => setIsLoading(false)}
                    onError={handleError}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    scalesPageToFit={true}
                    mixedContentMode="compatibility"
                    renderLoading={() => (
                        <View style={localStyles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <ZText type="m14" color={colors.grayScale7} style={localStyles.loadingText}>
                                {strings.loadingPaymentPage}
                            </ZText>
                        </View>
                    )}
                />

                {isLoading && (
                    <View style={[localStyles.loadingOverlay, { backgroundColor: colors.backgroundColor }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <ZText type="m14" color={colors.grayScale7} style={localStyles.loadingText}>
                            {strings.loadingPaymentPage}
                        </ZText>
                    </View>
                )}
            </View>
        </ZSafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
    amountBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(12),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: moderateScale(12),
    },
});
