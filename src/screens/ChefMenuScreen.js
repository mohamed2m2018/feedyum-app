import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, clearCart } from '../redux/reducer/cartSlice';

const ChefMenuScreen = ({ route, navigation }) => {
  const { chefId, chefName } = route.params;
  const [menu, setMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);
  
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  const cartChefId = useSelector(state => state.cart.chefId);

  useEffect(() => {
    fetchMenu();
  }, [chefId]);

  const fetchMenu = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/menus/chef/${chefId}`);
      const data = await response.json();

      if (data) {
        setMenu(data);
        // Set first section as selected by default
        if (data.sections && data.sections.length > 0) {
          setSelectedSection(data.sections[0]._id);
        }
      } else {
        Alert.alert('No Menu', 'This chef has not created a menu yet.');
      }
    } catch (error) {
Alert.alert('Error', 'Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  };

  const addDishToCart = (dish) => {
    // Check if cart has items from different chef
    if (cartChefId && cartChefId !== chefId) {
      Alert.alert(
        'Different Chef',
        'You can only order from one chef at a time. Clear your cart to order from this chef?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Clear Cart', 
            onPress: () => {
              dispatch(clearCart());
              dispatch(addToCart({
                dish: dish,
                quantity: 1,
                chefId: chefId,
                chefName: chefName
              }));
              Alert.alert('Added!', `${dish.name} added to cart`);
            }
          }
        ]
      );
    } else {
      dispatch(addToCart({
        dish: dish,
        quantity: 1,
        chefId: chefId,
        chefName: chefName
      }));
      Alert.alert('Added!', `${dish.name} added to cart`);
    }
  };

  const navigateToCart = () => {
    navigation.navigate('Cart');
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const renderDishItem = ({ item: dish }) => {
    const isInCart = cartItems.some(cartItem => cartItem.dishId === dish._id);
    
    return (
      <View style={styles.dishCard}>
        <Image 
          source={{ uri: dish.image || 'https://via.placeholder.com/100' }} 
          style={styles.dishImage} 
        />
        <View style={styles.dishInfo}>
          <Text style={styles.dishName}>{dish.name}</Text>
          <Text style={styles.dishDescription} numberOfLines={2}>
            {dish.description}
          </Text>
          <View style={styles.dishFooter}>
            <Text style={styles.dishPrice}>£{dish.price?.toFixed(2)}</Text>
            <View style={styles.dishActions}>
              <Text style={[
                styles.availabilityText,
                dish.isAvailable ? styles.available : styles.unavailable
              ]}>
                {dish.isAvailable ? 'Available' : 'Unavailable'}
              </Text>
              {dish.isAvailable && (
                <TouchableOpacity 
                  style={[styles.addButton, isInCart && styles.addedButton]}
                  onPress={() => addDishToCart(dish)}
                >
                  <Text style={[styles.addButtonText, isInCart && styles.addedButtonText]}>
                    {isInCart ? 'Added' : 'Add'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSectionTab = ({ item: section }) => (
    <TouchableOpacity
      style={[
        styles.sectionTab,
        selectedSection === section._id && styles.activeSectionTab
      ]}
      onPress={() => setSelectedSection(section._id)}
    >
      <Text style={[
        styles.sectionTabText,
        selectedSection === section._id && styles.activeSectionTabText
      ]}>
        {section.name}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  if (!menu) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No menu available</Text>
        <TouchableOpacity onPress={fetchMenu} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedSectionData = menu.sections?.find(section => section._id === selectedSection);
  const dishesInSection = selectedSectionData?.dishes || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.menuTitle}>{menu.name}</Text>
        <Text style={styles.chefName}>by {chefName}</Text>
        {menu.description && (
          <Text style={styles.menuDescription}>{menu.description}</Text>
        )}
      </View>

      {/* Section Tabs */}
      {menu.sections && menu.sections.length > 0 && (
        <View style={styles.sectionTabsContainer}>
          <FlatList
            data={menu.sections}
            renderItem={renderSectionTab}
            keyExtractor={(section) => section._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionTabsList}
          />
        </View>
      )}

      {/* Dishes List */}
      <FlatList
        data={dishesInSection}
        renderItem={renderDishItem}
        keyExtractor={(dish) => dish._id}
        contentContainerStyle={styles.dishesList}
        ListEmptyComponent={
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>
              No dishes in this section yet
            </Text>
          </View>
        }
      />

      {/* Cart Button */}
      {getCartItemCount() > 0 && (
        <TouchableOpacity style={styles.cartButton} onPress={navigateToCart}>
          <Text style={styles.cartButtonText}>
            View Cart ({getCartItemCount()})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  chefName: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sectionTabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTabsList: {
    paddingHorizontal: 16,
  },
  sectionTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  activeSectionTab: {
    backgroundColor: '#007AFF',
  },
  sectionTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeSectionTabText: {
    color: '#fff',
  },
  dishesList: {
    padding: 16,
  },
  dishCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dishImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dishDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  dishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  dishActions: {
    alignItems: 'flex-end',
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  available: {
    color: '#4CAF50',
  },
  unavailable: {
    color: '#F44336',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addedButton: {
    backgroundColor: '#4CAF50',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addedButtonText: {
    color: '#fff',
  },
  emptySection: {
    padding: 40,
    alignItems: 'center',
  },
  emptySectionText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  cartButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ChefMenuScreen;