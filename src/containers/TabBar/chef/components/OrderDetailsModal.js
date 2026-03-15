// Library imports
import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local imports
import ZText from '../../../../components/common/ZText';
import ZButton from '../../../../components/common/ZButton';
import { styles } from '../../../../themes';
import { moderateScale } from '../../../../common/constants';
import strings from '../../../../i18n/strings';
import { formatDate as formatDateHelper, formatSlotLabel } from '../../../../utils/helpers';

const OrderDetailsModal = ({
  visible,
  onClose,
  order,
  onStatusChange,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const language = useSelector(state => state.profile?.language);

  if (!order) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status) => {
    console.log('🐞 [OrderDetailsModal] getStatusConfig called with status:', status);
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
          color: colors.success || '#4CAF50',
          backgroundColor: (colors.success || '#4CAF50') + '20',
          text: strings.confirmed || strings.orderAccepted || 'Confirmed',
          icon: 'checkmark-circle-outline',
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
      case 'delivered':
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

  const statusConfig = getStatusConfig(order.status);

  const getNextStatus = () => {
    switch (order.status) {
      case 'pending':
        return 'preparing';
      case 'awaiting_confirmation':
      case 'chef_review':
        return null; // Customer must confirm — no chef action
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'completed';
      default:
        return null;
    }
  };

  const getStatusButtonText = () => {
    switch (order.status) {
      case 'pending':
        return strings.startPreparing;
      case 'awaiting_confirmation':
      case 'chef_review':
        return null; // Customer must confirm — no chef action
      case 'preparing':
        return strings.markAsReady;
      case 'ready':
        return strings.completeOrder;
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus();
  const statusButtonText = getStatusButtonText();

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
    const statuses = ['pending', 'preparing', 'ready', 'completed'];
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[localStyles.container, { backgroundColor: colors.backgroundColor }]}>
        {/* Header with drag handle for pageSheet dismiss affordance */}
        <View style={localStyles.dragHandleContainer}>
          <View style={localStyles.dragHandle} />
        </View>
        <View style={localStyles.header}>
          <TouchableOpacity onPress={onClose} style={localStyles.closeButton}>
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
          contentContainerStyle={{ paddingBottom: moderateScale(100) }}
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

          {/* Scheduled Delivery Info */}
          {order.orderType === 'scheduled' && order.scheduledFor && (
            <View style={[localStyles.section, { marginBottom: 0 }]}>
              <View style={[localStyles.infoCard, { backgroundColor: (colors.info || '#2196F3') + '15', borderWidth: 1, borderColor: (colors.info || '#2196F3') + '30' }]}>
                <View style={localStyles.infoRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={moderateScale(20)}
                    color={colors.info || '#2196F3'}
                  />
                  <View style={{ marginLeft: moderateScale(12), flex: 1 }}>
                    <ZText type="B14" color={colors.info || '#2196F3'}>
                      {strings.scheduledDelivery || 'Scheduled Delivery'}
                    </ZText>
                    <ZText type="M14" color={colors.textColor} style={{ marginTop: moderateScale(2) }}>
                      {order.scheduledSlotLabel
                        ? `${formatDateHelper(order.scheduledFor, language)}, ${formatSlotLabel(order.scheduledSlotLabel, language)}`
                        : formatDateHelper(order.scheduledFor, language)}
                    </ZText>
                  </View>
                </View>
              </View>
            </View>
          )}

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
                <View style={localStyles.infoRow}>
                  <Ionicons
                    name="location-outline"
                    size={moderateScale(20)}
                    color={colors.grayScale7}
                  />
                  <ZText type="M16" style={localStyles.infoText}>
                    {order.deliveryAddress.nameLine}
                  </ZText>
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
        </ScrollView>

        {/* Awaiting customer confirmation info banner */}
        {(order.status === 'awaiting_confirmation' || order.status === 'chef_review') && (
          <View style={[localStyles.footer, { flexDirection: 'row', alignItems: 'center', backgroundColor: (colors.info || '#2196F3') + '10' }]}>
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
        )}

        {/* Footer Actions */}
        {nextStatus && statusButtonText && (
          <View style={localStyles.footer}>
            <ZButton
              title={statusButtonText}
              onPress={() => {
                onStatusChange(order, nextStatus);
                onClose();
              }}
              textType="B16"
              color={colors.white}
              containerStyle={localStyles.actionButton}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(4),
  },
  dragHandle: {
    width: moderateScale(36),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: '#D1D5DB',
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
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    height: moderateScale(48),
    borderRadius: moderateScale(24),
  },
});

export default OrderDetailsModal;