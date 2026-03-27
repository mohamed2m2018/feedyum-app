// Library imports
import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Linking,
    Platform,
    TextInput,
    Modal,
    KeyboardAvoidingView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useQuery, useMutation, useQueryClient } from 'react-query';

// Local imports
import ZText from '../../../components/common/ZText';
import ZButton from '../../../components/common/ZButton';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import { styles } from '../../../themes';
import { moderateScale } from '../../../common/constants';
import strings from '../../../i18n/strings';
import request from '../../../api/request';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';
import { StackNav } from '../../../navigation/NavigationKeys';
import { formatDate as formatDateHelper, formatSlotLabel, getLocalizedText } from '../../../utils/helpers';
import RejectReasonModal from '../ordering/components/RejectReasonModal';
import OrderReviewModal from './components/OrderReviewModal';
import OrderAlarmService from '../../../services/OrderAlarmService';
import BackgroundAlarmService from '../../../services/BackgroundAlarmService';

/**
 * ChefOrderDetailsScreen - A modal screen for viewing and managing order details
 * Fetches order by ID and allows status updates
 */
const ChefOrderDetailsScreen = () => {
    const colors = useSelector(state => state.theme.theme);
    const language = useSelector(state => state.profile?.language);
    const navigation = useNavigation();
    const route = useRoute();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const { orderId } = route.params || {};
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [editQuoteVisible, setEditQuoteVisible] = useState(false);
    const [editQuoteValue, setEditQuoteValue] = useState('');
    const [editDeliveryFee, setEditDeliveryFee] = useState('');
    const [isUpdatingQuote, setIsUpdatingQuote] = useState(false);

    // Stop alarm when viewing order details — chef has seen the order
    useEffect(() => {
        OrderAlarmService.stopAlarm();
        BackgroundAlarmService.stopForegroundAlarm();
    }, []);

    // Fetch order by ID
    const {
        data: order,
        isLoading,
        error,
        refetch,
    } = useQuery(
        ['order', orderId],
        async () => {
            const response = await request.get(`/orders/${orderId}`);
            return response.data;
        },
        {
            enabled: !!orderId,
        }
    );

    // Update order status mutation
    const updateStatusMutation = useMutation(
        async ({ orderId, status }) => {
            const response = await request.put(`/orders/${orderId}/status`, { status });
            return response.data;
        },
        {
            onSuccess: () => {
                showSuccessToast(strings.success, strings.orderUpdatedSuccess);
                queryClient.invalidateQueries(['order', orderId]);
                queryClient.invalidateQueries('chefOrders');
                navigation.goBack();
            },
            onError: (error) => {
                showErrorToast(strings.error, error?.message || strings.failedToUpdateOrder);
            },
        }
    );

    // Reject order mutation
    const rejectOrderMutation = useMutation(
        async ({ orderId, reason }) => {
            const response = await request.put(`/orders/${orderId}/status`, {
                status: 'cancelled',
                notes: reason
            });
            return response.data;
        },
        {
            onSuccess: () => {
                showSuccessToast(strings.success, strings.orderUpdatedSuccess);
                queryClient.invalidateQueries(['order', orderId]);
                queryClient.invalidateQueries('chefOrders');
                setRejectModalVisible(false);
                navigation.goBack();
            },
            onError: (error) => {
                showErrorToast(strings.error, error?.message || strings.failedToRejectOrder);
            },
        }
    );

    const handleRejectOrder = () => {
        setRejectModalVisible(true);
    };

    const handleConfirmReject = (reason) => {
        if (order) {
            rejectOrderMutation.mutate({ orderId: order._id, reason });
        }
    };

    const handleClose = () => {
        navigation.goBack();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusConfig = (status) => {
        console.log('🐞 [ChefOrderDetailsScreen] getStatusConfig called with status:', status);
        switch (status) {
            case 'pending':
                return {
                    color: colors.orange,
                    backgroundColor: colors.orange + '20',
                    text: strings.pendingChef || strings.pending,
                    icon: 'time-outline',
                };
            case 'awaiting_confirmation':
            case 'chef_review':
                return {
                    color: colors.info || '#2196F3',
                    backgroundColor: (colors.info || '#2196F3') + '20',
                    text: strings.awaitingCustomerConfirmation || 'Awaiting Customer Confirmation',
                    icon: 'hourglass-outline',
                };
            case 'confirmed':
                return {
                    color: colors.green,
                    backgroundColor: colors.green + '20',
                    text: strings.accepted,
                    icon: 'checkmark-outline',
                };
            case 'preparing':
                return {
                    color: colors.blue,
                    backgroundColor: colors.blue + '20',
                    text: strings.preparing,
                    icon: 'restaurant-outline',
                };
            case 'ready':
                return {
                    color: colors.yellow,
                    backgroundColor: colors.yellow + '20',
                    text: strings.readyForPickup,
                    icon: 'checkmark-circle-outline',
                };
            case 'completed':
                return {
                    color: colors.primary,
                    backgroundColor: colors.primary + '20',
                    text: strings.completed,
                    icon: 'checkmark-done-outline',
                };
            case 'cancelled':
            case 'expired':
                return {
                    color: colors.redColor,
                    backgroundColor: colors.redColor + '20',
                    text: status === 'expired' ? (strings.expired || 'Expired') : strings.cancelled,
                    icon: status === 'expired' ? 'timer-outline' : 'close-circle-outline',
                };
            default:
                return {
                    color: colors.grayScale7,
                    backgroundColor: colors.grayScale3,
                    text: strings.unknown,
                    icon: 'help-outline',
                };
        }
    };

    const getNextStatus = () => {
        if (!order) return null;
        switch (order.status) {
            case 'pending':
                return 'awaiting_confirmation';
            // awaiting_confirmation: customer must confirm — no chef action
            case 'confirmed':
                return 'preparing';
            case 'preparing':
                return 'ready';
            case 'ready':
                return 'completed';
            default:
                return null;
        }
    };

    const getStatusButtonText = () => {
        if (!order) return null;
        switch (order.status) {
            case 'pending':
                return strings.acceptOrder || 'Accept Order';
            // awaiting_confirmation: no button — customer's turn
            case 'confirmed':
                return strings.startPreparing;
            case 'preparing':
                return strings.markAsReady;
            case 'ready':
                return strings.completeOrder;
            default:
                return null;
        }
    };

    const handleStatusChange = () => {
        const nextStatus = getNextStatus();
        if (!nextStatus || !order) return;

        // Pending orders MUST go through the review modal
        // so the chef can edit the delivery fee (and set quote price for catering)
        if (order.status === 'pending') {
            setReviewModalVisible(true);
            return;
        }

        updateStatusMutation.mutate({ orderId: order._id, status: nextStatus });
    };

    const handleReviewAccept = async (reviewedOrder, fee, actualStatus) => {
        setReviewModalVisible(false);
        queryClient.invalidateQueries(['order', orderId]);
        queryClient.invalidateQueries('chefOrders');
        navigation.goBack();
    };

    const handleEditQuotePrice = () => {
        setEditQuoteValue(String(order?.subtotal || ''));
        setEditDeliveryFee(String(order?.deliveryFee || '0'));
        setEditQuoteVisible(true);
    };

    const handleSaveQuotePrice = async () => {
        const newPrice = parseFloat(editQuoteValue);
        const newFee = parseFloat(editDeliveryFee || '0');
        if (!newPrice || newPrice <= 0) {
            showErrorToast(strings.error, strings.enterQuotePrice || 'Please enter a valid price');
            return;
        }
        if (isNaN(newFee) || newFee < 0) {
            showErrorToast(strings.error, strings.invalidDeliveryFee || 'Please enter a valid delivery fee');
            return;
        }
        try {
            setIsUpdatingQuote(true);
            await request.put(`/orders/${order._id}/quote-price`, {
                quotePrice: newPrice,
                deliveryFee: newFee,
            });
            showSuccessToast(strings.success, strings.quotePriceUpdated || 'Quote price updated');
            setEditQuoteVisible(false);
            refetch();
            queryClient.invalidateQueries('chefOrders');
        } catch (err) {
            showErrorToast(strings.error, err?.response?.data?.messageAr || err?.message || strings.failedToUpdateOrder);
        } finally {
            setIsUpdatingQuote(false);
        }
    };

    const OrderItem = ({ item }) => (
        <View style={localStyles.orderItem}>
            <Image
                source={{
                    uri: item.dish?.image || 'https://via.placeholder.com/60x60?text=Dish'
                }}
                style={localStyles.dishImage}
            />
            <View style={localStyles.itemDetails}>
                <ZText type="B16" numberOfLines={1}>
                    {getLocalizedText(item.dish?.name, item.dish?.nameArabic, item.dish?.nameEnglish) || 'Unknown Dish'}
                </ZText>
                <ZText type="M14" color={colors.grayScale7}>
                    {(item.dish?.price?.toFixed(2) || '0.00')} × {item.quantity}
                </ZText>
                {item.dish?.cookingTime && (
                    <ZText type="R12" color={colors.grayScale7}>
                        Cooking time: {item.dish.cookingTime} min
                    </ZText>
                )}
            </View>
            <View style={localStyles.itemPrice}>
                <ZText type="B16" color={colors.primary}>
                    {((item.dish?.price || 0) * item.quantity).toFixed(2)}
                </ZText>
            </View>
        </View>
    );

    const StatusTimeline = () => {
        if (!order) return null;
        const statuses = ['pending', 'awaiting_confirmation', 'confirmed', 'preparing', 'ready', 'completed'];
        const currentIndex = statuses.indexOf(order.status);

        return (
            <View style={localStyles.timeline}>
                {statuses.map((status, index) => {
                    const config = getStatusConfig(status);
                    const isActive = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                        <View key={status} style={localStyles.timelineItem}>
                            <View
                                style={[
                                    localStyles.timelineIcon,
                                    {
                                        backgroundColor: isActive ? config.color : colors.grayScale4,
                                    },
                                ]}>
                                <Ionicons
                                    name={config.icon}
                                    size={moderateScale(16)}
                                    color={colors.white}
                                />
                            </View>
                            <ZText
                                type={isCurrent ? "B14" : "M14"}
                                color={isActive ? config.color : colors.grayScale7}
                                style={localStyles.timelineText}>
                                {config.text}
                            </ZText>
                            {index < statuses.length - 1 && (
                                <View
                                    style={[
                                        localStyles.timelineLine,
                                        {
                                            backgroundColor: isActive ? config.color : colors.grayScale4,
                                        },
                                    ]}
                                />
                            )}
                        </View>
                    );
                })}
            </View>
        );
    };

    // Loading state
    if (isLoading) {
        return (
            <ZSafeAreaView style={[localStyles.container, { backgroundColor: colors.backgroundColor }]}>
                <View style={localStyles.header}>
                    <TouchableOpacity onPress={handleClose} style={localStyles.closeButton}>
                        <Ionicons name="close" size={moderateScale(24)} color={colors.textColor} />
                    </TouchableOpacity>
                    <ZText type="B20" style={localStyles.headerTitle}>
                        {strings.orderDetails || 'Order Details'}
                    </ZText>
                    <View style={localStyles.placeholder} />
                </View>
                <View style={localStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ZText type="M16" color={colors.grayScale7} style={{ marginTop: 16 }}>
                        {strings.loading || 'Loading...'}
                    </ZText>
                </View>
            </ZSafeAreaView>
        );
    }

    // Error state
    if (error || !order) {
        return (
            <ZSafeAreaView style={[localStyles.container, { backgroundColor: colors.backgroundColor }]}>
                <View style={localStyles.header}>
                    <TouchableOpacity onPress={handleClose} style={localStyles.closeButton}>
                        <Ionicons name="close" size={moderateScale(24)} color={colors.textColor} />
                    </TouchableOpacity>
                    <ZText type="B20" style={localStyles.headerTitle}>
                        {strings.orderDetails || 'Order Details'}
                    </ZText>
                    <View style={localStyles.placeholder} />
                </View>
                <View style={localStyles.loadingContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.redColor} />
                    <ZText type="M16" color={colors.redColor} style={{ marginTop: 16 }}>
                        {strings.orderNotFound || 'Order not found'}
                    </ZText>
                    <ZButton
                        title={strings.goBack || 'Go Back'}
                        onPress={handleClose}
                        containerStyle={{ marginTop: 16 }}
                    />
                </View>
            </ZSafeAreaView>
        );
    }

    const statusConfig = getStatusConfig(order.status);
    const nextStatus = getNextStatus();
    const statusButtonText = getStatusButtonText();

    return (
        <ZSafeAreaView style={[localStyles.container, { backgroundColor: colors.backgroundColor }]}>
            {/* Header */}
            <View style={localStyles.header}>
                <TouchableOpacity onPress={handleClose} style={localStyles.closeButton}>
                    <Ionicons
                        name="close"
                        size={moderateScale(24)}
                        color={colors.textColor}
                    />
                </TouchableOpacity>
                <ZText type="B20" style={localStyles.headerTitle}>
                    Order #{order._id?.slice(-6) || 'N/A'}
                </ZText>
                <View style={localStyles.placeholder} />
            </View>

            <ScrollView
                style={localStyles.content}
                contentContainerStyle={{ paddingBottom: moderateScale(120) }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                bounces={false}>

                {/* Order Status */}
                <View style={localStyles.statusSection}>
                    <View
                        style={[
                            localStyles.statusBadge,
                            { backgroundColor: statusConfig.backgroundColor },
                        ]}>
                        <Ionicons
                            name={statusConfig.icon}
                            size={moderateScale(20)}
                            color={statusConfig.color}
                            style={localStyles.statusIcon}
                        />
                        <ZText type="B16" color={statusConfig.color}>
                            {statusConfig.text}
                        </ZText>
                    </View>
                    <ZText type="M14" color={colors.grayScale7} style={localStyles.orderDate}>
                        Placed on {formatDate(order.created_at)}
                    </ZText>
                </View>

                {/* Order Type Badge */}
                <View style={[localStyles.section, { marginBottom: moderateScale(8) }]}>
                    <View style={[localStyles.infoCard, {
                        backgroundColor: order.orderType === 'scheduled'
                            ? (colors.info || '#2196F3') + '15'
                            : order.orderType === 'catering'
                                ? colors.primary + '15'
                                : (colors.success || '#4CAF50') + '15',
                        borderWidth: 1,
                        borderColor: order.orderType === 'scheduled'
                            ? (colors.info || '#2196F3') + '30'
                            : order.orderType === 'catering'
                                ? colors.primary + '30'
                                : (colors.success || '#4CAF50') + '30',
                    }]}>
                        <View style={localStyles.infoRow}>
                            <Ionicons
                                name={order.orderType === 'scheduled' ? 'calendar-outline' : order.orderType === 'catering' ? 'pricetag-outline' : 'flash-outline'}
                                size={moderateScale(20)}
                                color={order.orderType === 'scheduled' ? (colors.info || '#2196F3') : order.orderType === 'catering' ? colors.primary : (colors.success || '#4CAF50')}
                            />
                            <View style={{ marginLeft: moderateScale(12), flex: 1 }}>
                                <ZText type="B14" color={order.orderType === 'scheduled' ? (colors.info || '#2196F3') : order.orderType === 'catering' ? colors.primary : (colors.success || '#4CAF50')}>
                                    {order.orderType === 'scheduled'
                                        ? (strings.scheduledDelivery || 'Scheduled Delivery')
                                        : order.orderType === 'catering'
                                            ? (strings.cateringOrder || 'Catering Order')
                                            : (strings.instantOrder || 'Instant Order')}
                                </ZText>
                                {order.orderType === 'scheduled' && order.scheduledFor && (
                                    <ZText type="M14" color={colors.textColor} style={{ marginTop: moderateScale(2) }}>
                                        {order.scheduledSlotLabel
                                            ? `${formatDateHelper(order.scheduledFor, language)}, ${formatSlotLabel(order.scheduledSlotLabel, language)}`
                                            : formatDateHelper(order.scheduledFor, language)}
                                    </ZText>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Status Timeline */}
                <View style={localStyles.section}>
                    <ZText type="S18" style={localStyles.sectionTitle}>
                        Order Progress
                    </ZText>
                    <StatusTimeline />
                </View>

                {/* Customer Information */}
                <View style={localStyles.section}>
                    <ZText type="S18" style={localStyles.sectionTitle}>
                        Customer Information
                    </ZText>
                    <View style={[localStyles.infoCard, { backgroundColor: colors.inputBg }]}>
                        <View style={localStyles.infoRow}>
                            <Ionicons
                                name="person-outline"
                                size={moderateScale(20)}
                                color={colors.grayScale7}
                            />
                            <ZText type="M16" style={localStyles.infoText}>
                                {order.user?.fullName || 'Unknown Customer'}
                            </ZText>
                        </View>
                        {order.user?.phone && (
                            <View style={localStyles.infoRow}>
                                <Ionicons
                                    name="call-outline"
                                    size={moderateScale(20)}
                                    color={colors.grayScale7}
                                />
                                <ZText type="M16" style={localStyles.infoText}>
                                    {order.user.phone}
                                </ZText>
                            </View>
                        )}
                        {order.deliveryAddress?.nameLine && (
                            <View style={[localStyles.infoRow, { justifyContent: 'space-between' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Ionicons
                                        name="location-outline"
                                        size={moderateScale(20)}
                                        color={colors.grayScale7}
                                    />
                                    <ZText type="M16" style={[localStyles.infoText, { flex: 1 }]}>
                                        {order.deliveryAddress.nameLine}
                                    </ZText>
                                </View>
                                {order.deliveryAddress?.location?.lat && order.deliveryAddress?.location?.long && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            const lat = order.deliveryAddress.location.lat;
                                            const lng = order.deliveryAddress.location.long;
                                            const url = Platform.select({
                                                ios: `maps:0,0?q=${lat},${lng}`,
                                                android: `geo:${lat},${lng}?q=${lat},${lng}`,
                                            });
                                            Linking.openURL(url).catch(() => {
                                                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
                                            });
                                        }}
                                        style={{
                                            padding: moderateScale(6),
                                            marginLeft: moderateScale(8),
                                        }}
                                    >
                                        <Ionicons name="navigate" size={moderateScale(20)} color={colors.primary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {/* Order Items */}
                <View style={localStyles.section}>
                    <ZText type="S18" style={localStyles.sectionTitle}>
                        Order Items ({order.items?.length || 0})
                    </ZText>
                    <View style={[localStyles.itemsCard, { backgroundColor: colors.inputBg }]}>
                        {order.items?.map((item, index) => (
                            <OrderItem key={index} item={item} />
                        ))}
                    </View>
                </View>

                {/* Special Instructions */}
                {(order.specialInstructions || order.notes) && (
                    <View style={localStyles.section}>
                        <ZText type="S18" style={localStyles.sectionTitle}>
                            Special Instructions
                        </ZText>
                        <View style={[localStyles.instructionsCard, { backgroundColor: colors.inputBg }]}>
                            <Ionicons
                                name="chatbubble-outline"
                                size={moderateScale(20)}
                                color={colors.grayScale7}
                                style={localStyles.instructionsIcon}
                            />
                            <ZText type="M16" style={localStyles.instructionsText}>
                                {order.specialInstructions || order.notes}
                            </ZText>
                        </View>
                    </View>
                )}

                {/* Order Summary */}
                <View style={localStyles.section}>
                    <ZText type="S18" style={localStyles.sectionTitle}>
                        Order Summary
                    </ZText>
                    <View style={[localStyles.summaryCard, { backgroundColor: colors.inputBg }]}>
                        <View style={localStyles.summaryRow}>
                            <ZText type="M16">{strings.subtotal}</ZText>
                            <ZText type="M16">{order.subtotal?.toFixed(2) || '0.00'}</ZText>
                        </View>
                        {order.deliveryFee > 0 && (
                            <View style={localStyles.summaryRow}>
                                <ZText type="M16">{strings.deliveryFee}</ZText>
                                <ZText type="M16">{order.deliveryFee?.toFixed(2) || '0.00'}</ZText>
                            </View>
                        )}
                        {order.serviceFee > 0 && (
                            <View style={localStyles.summaryRow}>
                                <ZText type="M16">{strings.serviceFee}</ZText>
                                <ZText type="M16">{order.serviceFee?.toFixed(2) || '0.00'}</ZText>
                            </View>
                        )}
                        {order.tax > 0 && (
                            <View style={localStyles.summaryRow}>
                                <ZText type="M16">{strings.tax}</ZText>
                                <ZText type="M16">{order.tax?.toFixed(2) || '0.00'}</ZText>
                            </View>
                        )}
                        {order.promocode?.discountAmount > 0 && (
                            <View style={localStyles.summaryRow}>
                                <ZText type="M16" color={colors.primary}>{strings.discount} ({order.promocode.code})</ZText>
                                <ZText type="M16" color={colors.primary}>-{order.promocode.discountAmount?.toFixed(2)}</ZText>
                            </View>
                        )}
                        <View style={[localStyles.summaryRow, localStyles.totalRow]}>
                            <View>
                                <ZText type="B18">{strings.total}</ZText>
                                <ZText type="R12" color={colors.grayScale7}>
                                    {strings.totalCustomerPays || 'What customer pays'}
                                </ZText>
                            </View>
                            <ZText type="B18" color={colors.primary}>
                                {order.totalPrice?.toFixed(2) || '0.00'}
                            </ZText>
                        </View>
                        {order.chefCommission && (
                            <>
                                <View style={[localStyles.summaryRow, localStyles.commissionRow]}>
                                    <View style={localStyles.commissionLabel}>
                                        <Ionicons name="information-circle-outline" size={moderateScale(14)} color={colors.orange} style={{ marginRight: moderateScale(4) }} />
                                        <ZText type="M14" color={colors.orange}>
                                            {strings.platformCommission || 'Platform Fee'} ({order.chefCommission.orderFee} {strings.EGP})
                                        </ZText>
                                    </View>
                                    <ZText type="M14" color={colors.orange}>
                                        -{order.chefCommission.amount?.toFixed(2)}
                                    </ZText>
                                </View>
                                <View style={[localStyles.summaryRow, localStyles.earningsRow]}>
                                    <ZText type="B16" color={colors.success || '#4CAF50'}>
                                        {strings.whatYouGet || 'What you get'}
                                    </ZText>
                                    <ZText type="B16" color={colors.success || '#4CAF50'}>
                                        {((order.chefCommission.earnings || 0) + (order.deliveryFee || 0)).toFixed(2)}
                                    </ZText>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* View Receipt - completed/delivered orders */}
                {['completed', 'delivered'].includes(order.status) && (
                    <TouchableOpacity
                        style={localStyles.receiptLink}
                        onPress={() => navigation.navigate(StackNav.OrderReceipt, { order })}
                        activeOpacity={0.6}
                    >
                        <Ionicons name="receipt-outline" size={moderateScale(16)} color={colors.primary} />
                        <ZText type="B14" color={colors.primary} style={{ marginLeft: moderateScale(6) }}>
                            {strings.viewReceipt || 'View Receipt'}
                        </ZText>
                    </TouchableOpacity>
                )}

                {/* Spacer for footer */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Awaiting customer confirmation info banner — enhanced with deposit */}
            {(order.status === 'awaiting_confirmation' || order.status === 'chef_review') && (
                <View style={[localStyles.footer, {
                    backgroundColor: colors.backgroundColor,
                    paddingBottom: insets.bottom + 16,
                }]}>
                    {/* Deposit status (if applicable) */}
                    {order.depositRequired && (
                        <View style={{
                            backgroundColor: order.depositConfirmedByChef ? (colors.success || '#4CAF50') + '15' : '#FF980015',
                            borderRadius: moderateScale(12),
                            paddingHorizontal: moderateScale(14),
                            paddingVertical: moderateScale(12),
                            marginBottom: moderateScale(8),
                            borderWidth: 1,
                            borderColor: order.depositConfirmedByChef ? (colors.success || '#4CAF50') + '30' : '#FF980030',
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: moderateScale(6) }}>
                                <Ionicons
                                    name={order.depositConfirmedByChef ? 'checkmark-circle' : 'cash-outline'}
                                    size={moderateScale(20)}
                                    color={order.depositConfirmedByChef ? (colors.success || '#4CAF50') : '#FF9800'}
                                    style={{ marginRight: moderateScale(8) }}
                                />
                                <ZText type="B14" color={order.depositConfirmedByChef ? (colors.success || '#4CAF50') : '#FF9800'}>
                                    {order.depositConfirmedByChef ? strings.depositConfirmed : strings.waitingForDeposit}
                                </ZText>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <ZText type="M14" color={colors.grayScale7}>{strings.depositAmount}</ZText>
                                <ZText type="B16" color={colors.textColor}>{order.depositAmount || 0} {strings.currency}</ZText>
                            </View>
                            {/* Deposit Proof Image */}
                            {order.depositProofImage && (
                                <TouchableOpacity
                                    style={{
                                        marginTop: moderateScale(10),
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: (colors.success || '#4CAF50') + '10',
                                        borderRadius: moderateScale(10),
                                        padding: moderateScale(8),
                                    }}
                                    onPress={() => {
                                        // Open image in full screen or linking
                                        Linking.openURL(order.depositProofImage).catch(() => {});
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Image
                                        source={{ uri: order.depositProofImage }}
                                        style={{
                                            width: moderateScale(50),
                                            height: moderateScale(50),
                                            borderRadius: moderateScale(8),
                                        }}
                                        resizeMode="cover"
                                    />
                                    <View style={{ marginStart: moderateScale(10), flex: 1 }}>
                                        <ZText type="B14" color={colors.success || '#4CAF50'}>
                                            {strings.depositProofSent}
                                        </ZText>
                                        <ZText type="M12" color={colors.grayScale7}>
                                            {strings.viewDepositProof}
                                        </ZText>
                                    </View>
                                    <Ionicons
                                        name="open-outline"
                                        size={moderateScale(18)}
                                        color={colors.grayScale7}
                                    />
                                </TouchableOpacity>
                            )}
                            {!order.depositConfirmedByChef && (
                                <TouchableOpacity
                                    style={{
                                        marginTop: moderateScale(10),
                                        backgroundColor: '#FF9800',
                                        paddingVertical: moderateScale(10),
                                        borderRadius: moderateScale(10),
                                        alignItems: 'center',
                                    }}
                                    onPress={async () => {
                                        try {
                                            await request.put(`/orders/${order._id}/confirm-deposit`);
                                            showSuccessToast(strings.success, strings.depositConfirmed);
                                            queryClient.invalidateQueries(['order', orderId]);
                                            queryClient.invalidateQueries('chefOrders');
                                        } catch (err) {
                                            showErrorToast(strings.error || 'Error', err?.message || strings.failedToUpdateOrder);
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <ZText type="B14" color="#FFFFFF">{strings.confirmDepositReceived}</ZText>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: (colors.info || '#2196F3') + '15',
                        borderRadius: moderateScale(12),
                        paddingHorizontal: moderateScale(14),
                        paddingVertical: moderateScale(12),
                    }}>
                        <Ionicons
                            name="hourglass-outline"
                            size={moderateScale(20)}
                            color={colors.info || '#2196F3'}
                            style={{ marginRight: moderateScale(10) }}
                        />
                        <ZText type="M14" color={colors.info || '#2196F3'} style={{ flex: 1 }}>
                            {strings.waitingForCustomerConfirmation || 'Waiting for customer to confirm'}
                        </ZText>
                    </View>

                    {/* Edit Quote Price button for catering orders */}
                    {order.orderType === 'catering' && (
                        <TouchableOpacity
                            onPress={handleEditQuotePrice}
                            style={{
                                marginTop: moderateScale(10),
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.primary,
                                borderRadius: moderateScale(12),
                                paddingVertical: moderateScale(12),
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="create-outline" size={moderateScale(18)} color="#FFF" style={{ marginRight: moderateScale(8) }} />
                            <ZText type="B14" color="#FFF">
                                {strings.editQuotePrice || 'Edit Quote Price'}
                            </ZText>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Footer Actions */}
            {nextStatus && statusButtonText && (
                <View style={[localStyles.footer, { backgroundColor: colors.backgroundColor, paddingBottom: insets.bottom + 16 }]}>
                    <ZButton
                        title={statusButtonText}
                        onPress={handleStatusChange}
                        textType="B16"
                        color={colors.white}
                        containerStyle={localStyles.actionButton}
                        loading={updateStatusMutation.isLoading}
                    />
                    {order?.status === 'pending' && (
                        <ZButton
                            title={strings.rejectOrder || 'Reject Order'}
                            onPress={handleRejectOrder}
                            textType="B16"
                            color={colors.redColor}
                            containerStyle={[localStyles.actionButton, localStyles.rejectButton, { borderColor: colors.redColor }]}
                            bgColor="transparent"
                            loading={rejectOrderMutation.isLoading}
                        />
                    )}
                </View>
            )}

            {/* Reject Reason Modal */}
            <RejectReasonModal
                visible={rejectModalVisible}
                onClose={() => setRejectModalVisible(false)}
                onConfirm={handleConfirmReject}
                colors={colors}
            />

            {/* Order Review Modal (for catering quote price) */}
            <OrderReviewModal
                visible={reviewModalVisible}
                order={order}
                onClose={() => setReviewModalVisible(false)}
                onAccept={handleReviewAccept}
                onReject={handleRejectOrder}
            />

            {/* Edit Quote Price Modal */}
            <Modal
                visible={editQuoteVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setEditQuoteVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <View style={{
                        backgroundColor: colors.backgroundColor,
                        borderRadius: moderateScale(16),
                        padding: moderateScale(24),
                        width: '85%',
                        maxWidth: 400,
                    }}>
                        <ZText type="B18" color={colors.textColor} align="center" style={{ marginBottom: moderateScale(8) }}>
                            {strings.editQuotePrice || 'Edit Quote Price'}
                        </ZText>
                        <ZText type="M14" color={colors.grayScale7} align="center" style={{ marginBottom: moderateScale(20) }}>
                            {strings.editQuotePriceDesc || 'Enter the new price for this order'}
                        </ZText>

                        {/* Quote Price */}
                        <ZText type="B14" color={colors.textColor} style={{ marginBottom: moderateScale(6) }}>
                            {strings.setQuotePrice || 'Quote Price'}
                        </ZText>
                        <TextInput
                            style={{
                                height: moderateScale(50),
                                borderWidth: 2,
                                borderColor: colors.primary,
                                borderRadius: moderateScale(12),
                                paddingHorizontal: moderateScale(16),
                                fontSize: moderateScale(20),
                                fontWeight: 'bold',
                                fontFamily: 'Urbanist-Bold',
                                textAlign: 'center',
                                color: colors.textColor,
                                backgroundColor: colors.inputBg,
                            }}
                            value={editQuoteValue}
                            onChangeText={setEditQuoteValue}
                            placeholder={strings.enterPrice || 'Enter price'}
                            placeholderTextColor={colors.grayScale7}
                            keyboardType="decimal-pad"
                            returnKeyType="next"
                            autoFocus
                        />

                        {/* Delivery Fee */}
                        <ZText type="B14" color={colors.textColor} style={{ marginTop: moderateScale(16), marginBottom: moderateScale(6) }}>
                            {strings.deliveryFee || 'Delivery Fee'}
                        </ZText>
                        <TextInput
                            style={{
                                height: moderateScale(50),
                                borderWidth: 2,
                                borderColor: colors.primary,
                                borderRadius: moderateScale(12),
                                paddingHorizontal: moderateScale(16),
                                fontSize: moderateScale(20),
                                fontWeight: 'bold',
                                fontFamily: 'Urbanist-Bold',
                                textAlign: 'center',
                                color: colors.textColor,
                                backgroundColor: colors.inputBg,
                            }}
                            value={editDeliveryFee}
                            onChangeText={setEditDeliveryFee}
                            placeholder="0"
                            placeholderTextColor={colors.grayScale7}
                            keyboardType="decimal-pad"
                            returnKeyType="done"
                        />

                        {/* Total Preview */}
                        <View style={{
                            marginTop: moderateScale(16),
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: colors.inputBg,
                            borderRadius: moderateScale(10),
                            paddingHorizontal: moderateScale(14),
                            paddingVertical: moderateScale(10),
                        }}>
                            <ZText type="B14" color={colors.grayScale7}>{strings.total || 'Total'}</ZText>
                            <ZText type="B18" color={colors.primary}>
                                {((parseFloat(editQuoteValue) || 0) + (parseFloat(editDeliveryFee) || 0)).toFixed(2)} {strings.EGP || 'EGP'}
                            </ZText>
                        </View>

                        <View style={{ flexDirection: 'row', marginTop: moderateScale(20), gap: moderateScale(10) }}>
                            <TouchableOpacity
                                onPress={() => setEditQuoteVisible(false)}
                                style={{
                                    flex: 1,
                                    paddingVertical: moderateScale(14),
                                    borderRadius: moderateScale(12),
                                    borderWidth: 1,
                                    borderColor: colors.grayScale7,
                                    alignItems: 'center',
                                }}
                                activeOpacity={0.7}
                            >
                                <ZText type="B14" color={colors.grayScale7}>{strings.cancel}</ZText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSaveQuotePrice}
                                disabled={isUpdatingQuote}
                                style={{
                                    flex: 1,
                                    paddingVertical: moderateScale(14),
                                    borderRadius: moderateScale(12),
                                    backgroundColor: colors.primary,
                                    alignItems: 'center',
                                    opacity: isUpdatingQuote ? 0.6 : 1,
                                }}
                                activeOpacity={0.7}
                            >
                                <ZText type="B14" color="#FFF">
                                    {isUpdatingQuote ? (strings.saving || 'Saving...') : (strings.save || 'Save')}
                                </ZText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ZSafeAreaView>
    );
};

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(16),
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    closeButton: {
        padding: moderateScale(4),
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: moderateScale(32),
    },
    content: {
        flex: 1,
        paddingHorizontal: moderateScale(20),
    },
    statusSection: {
        alignItems: 'center',
        paddingVertical: moderateScale(20),
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(8),
        borderRadius: moderateScale(20),
        marginBottom: moderateScale(8),
    },
    statusIcon: {
        marginRight: moderateScale(8),
    },
    orderDate: {
        textAlign: 'center',
    },
    section: {
        marginBottom: moderateScale(24),
    },
    receiptLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(12),
        marginBottom: moderateScale(12),
        backgroundColor: 'rgba(255, 77, 103, 0.08)',
        borderRadius: moderateScale(12),
    },
    sectionTitle: {
        marginBottom: moderateScale(12),
    },
    timeline: {
        paddingVertical: moderateScale(16),
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: moderateScale(16),
    },
    timelineIcon: {
        width: moderateScale(32),
        height: moderateScale(32),
        borderRadius: moderateScale(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(12),
    },
    timelineText: {
        flex: 1,
    },
    timelineLine: {
        position: 'absolute',
        left: moderateScale(15),
        top: moderateScale(32),
        width: moderateScale(2),
        height: moderateScale(16),
    },
    infoCard: {
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: moderateScale(12),
    },
    infoText: {
        marginLeft: moderateScale(12),
        flex: 1,
    },
    itemsCard: {
        borderRadius: moderateScale(12),
        overflow: 'hidden',
    },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(16),
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    dishImage: {
        width: moderateScale(60),
        height: moderateScale(60),
        borderRadius: moderateScale(8),
        marginRight: moderateScale(12),
    },
    itemDetails: {
        flex: 1,
    },
    itemPrice: {
        alignItems: 'flex-end',
    },
    instructionsCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
    },
    instructionsIcon: {
        marginRight: moderateScale(12),
        marginTop: moderateScale(2),
    },
    instructionsText: {
        flex: 1,
        lineHeight: moderateScale(22),
    },
    summaryCard: {
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(8),
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: moderateScale(12),
        marginTop: moderateScale(8),
        marginBottom: 0,
    },
    commissionRow: {
        paddingVertical: moderateScale(6),
        marginBottom: moderateScale(4),
    },
    commissionLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: moderateScale(8),
    },
    earningsRow: {
        paddingTop: moderateScale(8),
        marginBottom: 0,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(16),
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    actionButton: {
        height: moderateScale(48),
        borderRadius: moderateScale(24),
    },
    rejectButton: {
        marginTop: moderateScale(12),
        borderWidth: 1.5,
    },
});

export default ChefOrderDetailsScreen;
