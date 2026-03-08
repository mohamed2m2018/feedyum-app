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
import RejectReasonModal from '../ordering/components/RejectReasonModal';

/**
 * ChefOrderDetailsScreen - A modal screen for viewing and managing order details
 * Fetches order by ID and allows status updates
 */
const ChefOrderDetailsScreen = () => {
    const colors = useSelector(state => state.theme.theme);
    const navigation = useNavigation();
    const route = useRoute();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const { orderId } = route.params || {};
    const [rejectModalVisible, setRejectModalVisible] = useState(false);

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
                    text: strings.pending,
                    icon: 'time-outline',
                };
            case 'awaiting_confirmation':
            case 'chef_review':
                return {
                    color: colors.info || '#2196F3',
                    backgroundColor: (colors.info || '#2196F3') + '20',
                    text: strings.awaitingConfirmation || strings.accepted || 'Awaiting Confirmation',
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
            case 'awaiting_confirmation':
            case 'chef_review':
                return 'confirmed';
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
            case 'awaiting_confirmation':
            case 'chef_review':
                return strings.confirmOrder || 'Confirm Order';
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
        if (nextStatus && order) {
            updateStatusMutation.mutate({ orderId: order._id, status: nextStatus });
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
                    {item.dish?.name || 'Unknown Dish'}
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
                showsVerticalScrollIndicator={false}>

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
                            <ZText type="B18">{strings.total}</ZText>
                            <ZText type="B18" color={colors.primary}>
                                {order.totalPrice?.toFixed(2) || '0.00'}
                            </ZText>
                        </View>
                    </View>
                </View>

                {/* Spacer for footer */}
                <View style={{ height: 100 }} />
            </ScrollView>

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
