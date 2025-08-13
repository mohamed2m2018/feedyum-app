import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {useQueryClient} from 'react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../../../components/common/ZText';
import ZHeader from '../../../components/common/ZHeader';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZButton from '../../../components/common/ZButton';

import {moderateScale} from '../../../common/constants';
import {styles} from '../../../themes';
import images from '../../../assets/images';
import strings from '../../../i18n/strings';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartChef,
  updateQuantity,
  removeFromCart,
  clearCart,
} from '../../../redux/reducer/cartSlice';
import {
  placeOrder,
  selectOrderPlacing,
  selectOrderError,
  clearError as clearOrderError,
  setCurrentOrder,
} from '../../../redux/reducer/orderSlice';
import { getAddresses, setSelectedAddress } from '../../../redux/actions/addressActions';
import {StackNav} from '../../../navigation/NavigationKeys';

const ShoppingCart = () => {
  
  const colors = useSelector(state => state.theme.theme);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  
  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const chef = useSelector(selectCartChef);
  const isPlacingOrder = useSelector(selectOrderPlacing);
  const orderError = useSelector(selectOrderError);
  const { selectedAddress } = useSelector(state => state.address);
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Load addresses when component mounts
  useEffect(() => {
    dispatch(getAddresses());
  }, [dispatch]);



  // Memoize expensive calculations
  const cartSummary = useMemo(() => ({
    itemCount: cartItems.length,
    totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    formattedSubtotal: subtotal.toFixed(0)
  }), [cartItems, subtotal]);



  const handleQuantityChange = useCallback((dishId, newQuantity) => {
    if (newQuantity <= 0) {
      Alert.alert(
        strings.removeItem,
        strings.areYouSureRemoveItem,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => dispatch(removeFromCart({dishId})),
          },
        ]
      );
    } else {
      dispatch(updateQuantity({dishId, quantity: newQuantity}));
    }
  }, [dispatch]);

  const handleRemoveItem = useCallback((dishId, dishName) => {
    Alert.alert(
      'Remove Item',
      `Remove ${dishName} from your cart?`,
      [
        {text: strings.cancel, style: 'cancel'},
        {
          text: strings.removeFromCart,
          style: 'destructive',
          onPress: () => dispatch(removeFromCart({dishId})),
        },
      ]
    );
  }, []);

  const handleClearCart = useCallback(() => {
    Alert.alert(
      strings.clearCart,
      strings.areYouSureClearCart,
      [
        {text: strings.cancel, style: 'cancel'},
        {
          text: strings.clearAll,
          style: 'destructive',
          onPress: () => dispatch(clearCart()),
        },
      ]
    );
  }, []);

  const handleCheckout = async () => {
    Alert.alert(
      strings.placeOrderConfirm,
      strings.deliveryFeeMessage,
      [
        {
          text: strings.cancel,
          style: 'cancel',
        },
        {
          text: strings.placeOrder,
          onPress: async () => {
            try {
              setIsCheckingOut(true);
              
              // Check if user has selected a delivery address
              if (!selectedAddress) {
                Alert.alert(
                  'No Delivery Address',
                  'Please select a delivery address before placing your order.',
                  [{ text: 'OK' }]
                );
                setIsCheckingOut(false);
                return;
              }

              // Debug logging

              


              // Validate chef ID
              if (!chef?.id) {
                console.error('❌ Chef ID is missing!');
                Alert.alert(
                  'Order Error',
                  'Chef information is missing. Clear cart and try again?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Clear Cart', 
                      onPress: () => {
                        dispatch(clearCart());
                        navigation.goBack();
                      }
                    }
                  ]
                );
                setIsCheckingOut(false);
                return;
              }

              // Validate cart items
              if (!cartItems || cartItems.length === 0) {
                console.error('❌ Cart items are missing!');
                Alert.alert(
                  'Order Error',
                  'Your cart is empty. Please add items before placing an order.',
                  [{ text: 'OK' }]
                );
                setIsCheckingOut(false);
                return;
              }

              // Prepare order data to match backend API expectations
              const orderData = {
                chefId: chef.id,
                items: cartItems.map(item => ({
                  dish: item.dishId,
                  quantity: item.quantity,
                })),
                deliveryAddress: (() => {
                  // Extract city from formatted address if area is not available
                  let city = selectedAddress.streetDetails?.area || selectedAddress.city || '';
                  
                  if (!city && selectedAddress.formattedAddress) {
                    // Try to extract city from formatted address (usually contains "Cairo" or other city names)
                    const addressParts = selectedAddress.formattedAddress.split(',');
                    const cityMatch = addressParts.find(part => 
                      part.trim().toLowerCase().includes('cairo') || 
                      part.trim().toLowerCase().includes('giza') ||
                      part.trim().toLowerCase().includes('alexandria')
                    );
                    if (cityMatch) {
                      city = cityMatch.trim();
                    } else if (addressParts.length > 1) {
                      // Fallback: use the second-to-last part as city
                      city = addressParts[addressParts.length - 2]?.trim() || 'Cairo';
                    } else {
                      city = 'Cairo'; // Default fallback
                    }
                  }
                  
                  return {
                    street: selectedAddress.streetDetails?.streetName || selectedAddress.formattedAddress || selectedAddress.nameLine || 'Address not specified',
                    city: city || 'Cairo',
                    state: selectedAddress.streetDetails?.state || '',
                    zipCode: selectedAddress.streetDetails?.postalCode || '',
                    nameLine: selectedAddress.formattedAddress || selectedAddress.nameLine || '',
                    streetDetails: selectedAddress.streetDetails,
                    buildingDetails: selectedAddress.buildingDetails,
                    coordinates: selectedAddress.coordinates
                  };
                })(),
                notes: specialInstructions || '', // Backend expects 'notes' not 'specialInstructions'
              };


              
              console.log('=== ORDER DATA DEBUG ===');
              console.log('Chef ID being sent:', orderData.chefId);
              console.log('Items being sent:', orderData.items);
              console.log('Full order data:', orderData);
              console.log('========================');
              
              // Place real order using Redux thunk
              const newOrder = await dispatch(placeOrder(orderData));
              
              console.log('Order placed successfully:', newOrder);
              
              if (newOrder && newOrder._id) {
                // Clear the cart after successful order
                dispatch(clearCart());
                
                // Invalidate chat list queries to refresh the chat list
                queryClient.invalidateQueries(['orderChats']);
                queryClient.invalidateQueries(['chatList']);

                // Navigate to order tracking with the real order ID
                navigation.navigate(StackNav.OrderTracking, {
                  orderId: newOrder._id,
                });
              } else {
                throw new Error('Order was not created properly');
              }
              
            } catch (error) {
              console.error('Order placement failed:', error);
              console.error('Error details:', JSON.stringify(error, null, 2));
              
              let errorMessage = 'Failed to place order. Please try again.';
              
              if (error?.message) {
                errorMessage = error.message;
              } else if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
              } else if (typeof error === 'string') {
                errorMessage = error;
              }
              
              Alert.alert(
                strings.orderFailed,
                errorMessage,
                [{text: 'OK'}]
              );
            } finally {
              setIsCheckingOut(false);
            }
          },
        },
      ]
    );
  };

  const renderCartItem = useCallback(({item}) => {
    return (
      <View style={[localStyles.cartItem, {backgroundColor: colors.white}]}>
        <Image
          source={item.dish?.image ? {uri: item.dish.image} : images.dishPlaceholder}
          style={localStyles.itemImage}
          resizeMode="cover"
        />
        
        <View style={localStyles.itemInfo}>
          {/* Dish Name Section - Always Visible */}
          <View style={localStyles.dishNameSection}>
            <ZText 
              type="B18" 
              numberOfLines={2} 
              style={[localStyles.dishName, {color: '#000000', fontWeight: 'bold'}]}
            >
              {item.dish?.name || item.name || strings.testDishName}
            </ZText>
            <ZText type="M14" color={colors.primary} style={localStyles.dishPrice}>
              {item.dish?.price || item.price || 0} EGP
            </ZText>
          </View>
          
          {/* Controls Section */}
          <View style={localStyles.controlsSection}>
            <View style={localStyles.quantityContainer}>
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.dishId, item.quantity - 1)}
                style={[localStyles.quantityButton, {backgroundColor: colors.inputBg}]}>
                <Ionicons name="remove" size={moderateScale(14)} color={colors.textColor} />
              </TouchableOpacity>
              
              <View style={[localStyles.quantityBadge, {backgroundColor: colors.primary + '15', borderColor: colors.primary + '30'}]}>
                <ZText type="B14" color={colors.primary} style={localStyles.quantityText}>
                  {item.quantity}
                </ZText>
              </View>
              
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.dishId, item.quantity + 1)}
                style={[localStyles.quantityButton, {backgroundColor: colors.primary}]}>
                <Ionicons name="add" size={moderateScale(14)} color={colors.white} />
              </TouchableOpacity>
            </View>
            
            <View style={localStyles.itemActions}>
              <ZText type="B14" color={colors.textColor} style={localStyles.itemTotal}>
                {((item.dish?.price || item.price || 0) * item.quantity).toFixed(0)} EGP
              </ZText>
              <TouchableOpacity
                onPress={() => handleRemoveItem(item.dishId, item.dish?.name || item.name || 'Item')}
                style={localStyles.removeButton}>
                <Ionicons name="trash-outline" size={moderateScale(16)} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }, [colors, handleQuantityChange, handleRemoveItem]);

  const renderHeader = () => (
    <View style={[localStyles.headerContainer, {backgroundColor: colors.backgroundColor}]}>
      <View style={localStyles.chefInfo}>
        <Ionicons name="restaurant" size={moderateScale(24)} color={colors.primary} />
        <View style={localStyles.chefDetails}>
          <ZText type="B16" color={colors.textColor}>
            Order from {chef.name}
          </ZText>
          <ZText type="M14" color={colors.grayScale7}>
            {cartSummary.itemCount} {cartSummary.itemCount === 1 ? 'item' : 'items'}
          </ZText>
        </View>
        <TouchableOpacity onPress={handleClearCart}>
          <ZText type="M14" color={colors.error}>
            Clear All
          </ZText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={[localStyles.footerContainer, {backgroundColor: colors.backgroundColor}]}>
      {/* Delivery Address Section */}
      <View style={localStyles.addressSection}>
        <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
          Delivery Address
        </ZText>
        <View style={[
          localStyles.addressDisplay, 
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.borderColor || colors.grayScale3
          }
        ]}>
          <ZText type="M14" color={colors.textColor}>
            {selectedAddress ? 
              (selectedAddress.formattedAddress || selectedAddress.nameLine || 'Selected Address') : 
              'No address selected'
            }
          </ZText>
        </View>
      </View>

      {/* Special Instructions Section */}
      <View style={localStyles.instructionsSection}>
        <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
          Special Instructions
        </ZText>
        <TextInput
          style={[
            localStyles.instructionsInput,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.borderColor || colors.grayScale3,
              color: colors.textColor,
            }
          ]}
          placeholder={strings.specialInstructionsPlaceholder}
          placeholderTextColor={colors.grayScale7}
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
          multiline={true}
          numberOfLines={3}
          maxLength={500}
          textAlignVertical="top"
        />
        <ZText type="M12" color={colors.grayScale7} style={localStyles.characterCount}>
          {specialInstructions.length}/500 characters
        </ZText>
      </View>

      <View style={localStyles.summaryContainer}>
        <View style={localStyles.summaryRow}>
          <ZText type="M16" color={colors.textColor}>
            Subtotal
          </ZText>
          <ZText type="B16" color={colors.textColor}>
            {cartSummary.formattedSubtotal} EGP
          </ZText>
        </View>
        
        <View style={localStyles.summaryRow}>
          <ZText type="M14" color={colors.grayScale7}>
            Delivery Fee
          </ZText>
          <ZText type="M14" color={colors.grayScale7}>
            To be determined by chef
          </ZText>
        </View>
        
        <View style={[localStyles.summaryRow, localStyles.totalRow]}>
          <ZText type="B18" color={colors.textColor}>
            Total
          </ZText>
          <ZText type="B18" color={colors.primary}>
            {cartSummary.formattedSubtotal} EGP + delivery
          </ZText>
        </View>
      </View>
      
      <ZButton
        title={isCheckingOut ? strings.processing : strings.placeOrder}
        textType="B16"
        color={colors.white}
        containerStyle={[
          localStyles.checkoutButton,
          {backgroundColor: colors.primary}
        ]}
        onPress={handleCheckout}
        disabled={isCheckingOut}
      />
    </View>
  );

  // Move all useCallback hooks before any conditional returns
  const keyExtractor = useCallback((item) => item.dishId, []);
  const getItemLayout = useCallback((data, index) => ({
    length: moderateScale(100),
    offset: moderateScale(100) * index,
    index,
  }), []);

  if (cartItems.length === 0) {
    return (
      <ZSafeAreaView>
        <ZHeader title={strings.shoppingCart} showBack />
        <View style={localStyles.emptyContainer}>
          <Ionicons name="basket-outline" size={moderateScale(80)} color={colors.grayScale7} />
          <ZText type="B18" color={colors.textColor} style={localStyles.emptyTitle}>
            Your cart is empty
          </ZText>
          <ZText type="M14" color={colors.grayScale7} align="center" style={localStyles.emptySubtitle}>
            Add some delicious dishes from chef menus to get started
          </ZText>
          <ZButton
            title={strings.browseMenus}
            onPress={() => navigation.goBack()}
            containerStyle={localStyles.browseButton}
          />
        </View>
      </ZSafeAreaView>
    );
  }

  return (
    <ZSafeAreaView>
      <ZHeader title="Shopping Cart" showBack />
      
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={localStyles.listContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
        getItemLayout={getItemLayout}
      />
    </ZSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  listContainer: {
    paddingBottom: moderateScale(20),
  },
  headerContainer: {
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  chefInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chefDetails: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  // Compact Cart Item Styles
  cartItem: {
    flexDirection: 'row',
    marginHorizontal: moderateScale(16),
    marginVertical: moderateScale(6),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
    padding: moderateScale(12),
  },
  itemImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  dishNameSection: {
    marginBottom: moderateScale(8),
  },
  dishName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: moderateScale(2),
  },
  dishPrice: {
    fontSize: moderateScale(14),
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(8),
  },
  itemName: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  quantityButton: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#FFFFFF', // Background color for shadow efficiency
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(15),
    borderWidth: 1,
    minWidth: moderateScale(35),
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    minWidth: moderateScale(20),
    textAlign: 'center',
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  itemTotal: {
    textAlign: 'right',
  },
  removeButton: {
    padding: moderateScale(4),
  },
  footerContainer: {
    padding: moderateScale(20),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: moderateScale(20),
  },
  summaryContainer: {
    marginBottom: moderateScale(20),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: moderateScale(12),
    marginTop: moderateScale(8),
  },
  checkoutButton: {
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  emptyTitle: {
    marginTop: moderateScale(20),
    marginBottom: moderateScale(10),
  },
  emptySubtitle: {
    marginBottom: moderateScale(30),
    lineHeight: moderateScale(20),
  },
  browseButton: {
    height: moderateScale(44),
    paddingHorizontal: moderateScale(30),
  },
  addressSection: {
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    marginBottom: moderateScale(12),
  },
  addressDisplay: {
    marginTop: moderateScale(4),
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
  },
  instructionsSection: {
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  instructionsInput: {
    marginTop: moderateScale(4),
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    minHeight: moderateScale(80),
    fontSize: moderateScale(14),
    textAlignVertical: 'top',
  },
  characterCount: {
    marginTop: moderateScale(4),
    textAlign: 'right',
  },
});

export default ShoppingCart;