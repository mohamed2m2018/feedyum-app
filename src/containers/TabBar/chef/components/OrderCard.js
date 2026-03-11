// Library imports
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local imports
import ZText from '../../../../components/common/ZText';
import ZButton from '../../../../components/common/ZButton';
import { moderateScale } from '../../../../common/constants';
import { styles } from '../../../../themes';
import strings from '../../../../i18n/strings';

const StatusBadge = ({ status, colors }) => {
  const getStatusConfig = () => {
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
          text: strings.awaitingConfirmation || 'Awaiting Confirmation',
          icon: 'hourglass-outline',
        };
      case 'confirmed':
        return {
          color: colors.green, // Use green for Accepted
          backgroundColor: colors.green + '20',
          text: strings.accepted,
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
          text: strings.ready,
          icon: 'checkmark-circle-outline',
        };
      case 'out_for_delivery':
        return {
          color: colors.info || '#2196F3',
          backgroundColor: (colors.info || '#2196F3') + '20',
          text: strings.outForDelivery || 'Out for Delivery',
          icon: 'bicycle-outline',
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

  const config = getStatusConfig();

  return (
    <View
      style={[
        localStyles.statusBadge,
        { backgroundColor: config.backgroundColor },
      ]}>
      <Ionicons
        name={config.icon}
        size={moderateScale(14)}
        color={config.color}
        style={localStyles.statusIcon}
      />
      <ZText type="S12" color={config.color}>
        {config.text}
      </ZText>
    </View>
  );
};

const StatusUpdateButtons = ({ order, onStatusChange, onReject, onAccept, colors }) => {
  if (order.status === 'pending' || order.status === 'awaiting_confirmation' || order.status === 'chef_review') {
    return (
      <View style={{ flexDirection: 'row', gap: moderateScale(8) }}>
        <ZButton
          title={strings.reject}
          onPress={() => onReject && onReject(order)}
          textType="S14"
          color={colors.error}
          containerStyle={[
            localStyles.statusButton,
            {
              backgroundColor: colors.white,
              borderColor: colors.error,
              borderWidth: 1,
              flex: 1,
            },
          ]}
        />
        <ZButton
          title={strings.accept}
          onPress={() => onAccept ? onAccept(order) : onStatusChange(order, 'confirmed')}
          textType="S14"
          color={colors.white}
          containerStyle={[
            localStyles.statusButton,
            {
              backgroundColor: colors.primary,
              flex: 1,
            },
          ]}
        />
      </View>
    );
  }

  const getNextStatus = () => {
    switch (order.status) {
      case 'confirmed':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'out_for_delivery';
      case 'out_for_delivery':
        return 'completed';
      default:
        return null;
    }
  };

  const getButtonText = () => {
    switch (order.status) {
      case 'confirmed':
        return strings.startPreparing;
      case 'preparing':
        return strings.markReady;
      case 'ready':
        return strings.markOutForDelivery;
      case 'out_for_delivery':
        return strings.completeOrder;
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus();
  const buttonText = getButtonText();

  if (!nextStatus || !buttonText) {
    return null;
  }

  return (
    <ZButton
      title={buttonText}
      onPress={() => onStatusChange(order, nextStatus)}
      textType="S14"
      color={colors.white}
      containerStyle={[
        localStyles.statusButton,
        { backgroundColor: colors.primary },
      ]}
    />
  );
};

const OrderCard = ({
  order,
  onStatusChange,
  onViewDetails,
  onChatWithCustomer,
  onReject,
  onAccept,
  containerStyle,
}) => {
  const colors = useSelector(state => state.theme.theme);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalItems = () => {
    return order.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  return (
    <TouchableOpacity
      style={[
        localStyles.container,
        {
          backgroundColor: colors.inputBg,
          borderColor: colors.bColor,
        },
        containerStyle,
      ]}
      onPress={() => onViewDetails && onViewDetails(order)}
      activeOpacity={0.8}>

      {/* Order Header */}
      <View style={localStyles.header}>
        <View style={localStyles.orderInfo}>
          <ZText type="B16" style={localStyles.orderId}>
            Order #{order._id?.slice(-6) || 'N/A'}
          </ZText>
          <ZText type="M12" color={colors.grayScale7}>
            {formatDate(order.created_at)}
          </ZText>
        </View>
        <StatusBadge status={order.status} colors={colors} />
      </View>

      {/* Customer Info */}
      <View style={localStyles.customerSection}>
        <View style={localStyles.customerInfo}>
          <Ionicons
            name="person-outline"
            size={moderateScale(16)}
            color={colors.grayScale7}
            style={localStyles.customerIcon}
          />
          <ZText type="M14" style={localStyles.customerName}>
            {order.user?.fullName || strings.unknownCustomer}
          </ZText>
        </View>
        {order.status === 'ready' && order.user?.phone && (
          <TouchableOpacity style={localStyles.phoneInfo}>
            <Ionicons
              name="call-outline"
              size={moderateScale(16)}
              color={colors.primary}
              style={localStyles.customerIcon}
            />
            <ZText type="M14" color={colors.primary}>
              {order.user.phone}
            </ZText>
          </TouchableOpacity>
        )}
        {order.deliveryAddress?.nameLine && (
          <View style={localStyles.addressInfo}>
            <Ionicons
              name="location-outline"
              size={moderateScale(16)}
              color={colors.grayScale7}
              style={localStyles.addressIcon}
            />
            <ZText
              type="M12"
              color={colors.grayScale7}
              numberOfLines={1}
              style={localStyles.address}>
              {order.deliveryAddress.nameLine}
            </ZText>
          </View>
        )}
      </View>

      {/* Order Summary */}
      <View style={localStyles.orderSummary}>
        <View style={localStyles.summaryRow}>
          <ZText type="M14" color={colors.grayScale7}>
            {getTotalItems() === 1 ? strings.oneItemLabel : strings.itemsCountLabel.replace('{0}', getTotalItems())}
          </ZText>
          <ZText type="B16" color={colors.primary}>
            {order.totalPrice?.toFixed(2) || '0.00'}
          </ZText>
        </View>
        {order.specialInstructions && (
          <View style={localStyles.instructionsContainer}>
            <Ionicons
              name="chatbubble-outline"
              size={moderateScale(14)}
              color={colors.grayScale7}
              style={localStyles.instructionsIcon}
            />
            <ZText
              type="M12"
              color={colors.grayScale7}
              numberOfLines={2}
              style={localStyles.instructions}>
              {order.specialInstructions}
            </ZText>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={localStyles.actionsContainer}>
        <View style={localStyles.actionButtonsRow}>
          {/* Chat Button */}
          {onChatWithCustomer && (
            <ZButton
              title={strings.chat}
              onPress={() => onChatWithCustomer(order)}
              textType="S14"
              color={colors.primary}
              bgColor={colors.primary + '15'}
              containerStyle={[
                localStyles.chatButton,
                {
                  borderColor: colors.primary,
                  borderWidth: 1,
                },
              ]}
              frontIcon={
                <Ionicons
                  name="chatbubble-outline"
                  size={moderateScale(16)}
                  color={colors.primary}
                  style={localStyles.buttonIcon}
                />
              }
            />
          )}

          {/* Status Update Button */}
          {onStatusChange && (
            <View style={localStyles.statusButtonContainer}>
              <StatusUpdateButtons
                order={order}
                onStatusChange={onStatusChange}
                onReject={onReject}
                onAccept={onAccept}
                colors={colors}
              />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const localStyles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    ...styles.shadowStyle,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(12),
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    marginBottom: moderateScale(4),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  statusIcon: {
    marginRight: moderateScale(4),
  },
  customerSection: {
    marginBottom: moderateScale(12),
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  customerIcon: {
    marginRight: moderateScale(8),
  },
  customerName: {
    flex: 1,
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIcon: {
    marginRight: moderateScale(8),
  },
  address: {
    flex: 1,
  },
  orderSummary: {
    marginBottom: moderateScale(12),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionsIcon: {
    marginRight: moderateScale(8),
    marginTop: moderateScale(2),
  },
  instructions: {
    flex: 1,
    lineHeight: moderateScale(16),
  },
  actionsContainer: {
    marginTop: moderateScale(8),
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    alignItems: 'center',
  },
  chatButton: {
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    flex: 1,
  },
  statusButtonContainer: {
    flex: 2,
  },
  statusButton: {
    height: moderateScale(40),
    borderRadius: moderateScale(20),
  },
  buttonIcon: {
    marginRight: moderateScale(4),
  },
});

export default OrderCard;