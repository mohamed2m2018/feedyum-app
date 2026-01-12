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
import strings from '../i18n/strings';
import StarRating from '../components/StarRating';

const ChefProfileScreen = ({ route, navigation }) => {
  const { chefId } = route.params;
  const [chefProfile, setChefProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about'); // 'about' or 'menu'

  useEffect(() => {
    fetchChefProfile();
  }, [chefId]);

  const fetchChefProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/user/chef/${chefId}/profile`);
      const data = await response.json();

      if (data.success) {
        setChefProfile(data.chef);
      } else {
        Alert.alert(strings.error, data.message || strings.failedToLoadChefProfile);
      }
    } catch (error) {
      Alert.alert(strings.error, strings.failedToLoadChefProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToMenu = () => {
    if (chefProfile?.menu) {
      navigation.navigate('ChefMenu', {
        chefId: chefId,
        chefName: chefProfile.fullName || chefProfile.username,
        // Pass rating info for header fallback
        averageDishRating: chefProfile.averageDishRating || 0,
        ratedDishesCount: chefProfile.ratedDishesCount || 0,
        menu: chefProfile.menu
      });
    }
  };

  const navigateToDish = (dish) => {
    navigation.navigate('DishDetail', {
      dish: dish,
      chefId: chefId,
      chefName: chefProfile.fullName || chefProfile.username
    });
  };

  const renderDishItem = ({ item }) => (
    <TouchableOpacity style={styles.dishItem} onPress={() => navigateToDish(item)}>
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/80' }}
        style={styles.dishImage}
      />
      <View style={styles.dishInfo}>
        <Text style={styles.dishName}>{item.name}</Text>
        <Text style={styles.dishDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.dishPrice}>£{item.price?.toFixed(2)}</Text>
      </View>
      <View style={styles.dishStatus}>
        <Text style={[
          styles.availabilityText,
          item.isAvailable ? styles.available : styles.unavailable
        ]}>
          {item.isAvailable ? strings.available : strings.unavailable}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSectionItem = ({ item: section }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{section.name}</Text>
      {section.description && (
        <Text style={styles.sectionDescription}>{section.description}</Text>
      )}
      <FlatList
        data={section.dishes}
        renderItem={renderDishItem}
        keyExtractor={(dish) => dish._id}
        scrollEnabled={false}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{strings.loadingChefProfile}</Text>
      </View>
    );
  }

  if (!chefProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{strings.chefProfileNotFound}</Text>
        <TouchableOpacity onPress={fetchChefProfile} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>{strings.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: chefProfile.avatar || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <View style={styles.nameRow}>
              <Text style={styles.chefName}>
                {chefProfile.fullName || chefProfile.username}
              </Text>
              <StarRating
                rating={chefProfile?.averageDishRating || 0}
                totalReviews={chefProfile?.ratedDishesCount || 0}
                size="small"
                showText={true}
                showCount={chefProfile?.ratedDishesCount > 0}
                showWhenNoRating={true}
              />
            </View>
          </View>
          <Text style={styles.chefType}>{strings.chef}</Text>
          {chefProfile.bio && (
            <Text style={styles.bio}>{chefProfile.bio}</Text>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{chefProfile.postsNo || 0}</Text>
          <Text style={styles.statLabel}>{strings.posts}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{chefProfile.likesNo || 0}</Text>
          <Text style={styles.statLabel}>{strings.likes}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {chefProfile.menu?.dishCount || 0}
          </Text>
          <Text style={styles.statLabel}>{strings.dishes}</Text>
        </View>
      </View>

      {/* Tags */}
      {chefProfile.tags && chefProfile.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsTitle}>{strings.specialties}</Text>
          <View style={styles.tagsWrapper}>
            {chefProfile.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Menu Access Button - Always show for chefs */}
      {chefProfile.type === 'chef' && (
        <View style={styles.menuAccessContainer}>
          <TouchableOpacity style={styles.menuAccessButton} onPress={navigateToMenu}>
            <Text style={styles.menuAccessButtonText}>
              {chefProfile.menu && chefProfile.menu.dishes && chefProfile.menu.dishes.length > 0
                ? `View Menu (${chefProfile.menu.dishes.length} dishes)`
                : 'View Menu'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'about' && styles.activeTab]}
          onPress={() => setActiveTab('about')}
        >
          <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
            About
          </Text>
        </TouchableOpacity>
        {chefProfile.type === 'chef' && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'menu' && styles.activeTab]}
            onPress={() => setActiveTab('menu')}
          >
            <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>
              Menu
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Content */}
      {activeTab === 'about' && (
        <View style={styles.tabContent}>
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>{strings.contactInformation}</Text>
            {chefProfile.email && (
              <Text style={styles.infoText}>📧 {chefProfile.email}</Text>
            )}
            {chefProfile.phone && (
              <Text style={styles.infoText}>📱 {chefProfile.phone}</Text>
            )}
          </View>

          {chefProfile.locations && chefProfile.locations.length > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>{strings.locations}</Text>
              {chefProfile.locations.map((location, index) => (
                <Text key={index} style={styles.infoText}>
                  📍 {location.description}
                </Text>
              ))}
            </View>
          )}

          {chefProfile.type === 'chef' && (
            <TouchableOpacity style={styles.viewMenuButton} onPress={navigateToMenu}>
              <Text style={styles.viewMenuButtonText}>
                {chefProfile.menu && chefProfile.menu.dishes && chefProfile.menu.dishes.length > 0
                  ? 'View Full Menu & Order'
                  : 'View Menu (Coming Soon)'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {activeTab === 'menu' && (
        <View style={styles.tabContent}>
          {chefProfile.menu && chefProfile.menu.dishes && chefProfile.menu.dishes.length > 0 ? (
            <View>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>{chefProfile.menu.name || 'Menu'}</Text>
                {chefProfile.menu.description && (
                  <Text style={styles.menuDescription}>
                    {chefProfile.menu.description}
                  </Text>
                )}
              </View>

              <TouchableOpacity style={styles.viewFullMenuButton} onPress={navigateToMenu}>
                <Text style={styles.viewFullMenuButtonText}>{strings.viewFullMenuAndOrder}</Text>
              </TouchableOpacity>

              {chefProfile.menu.sections && chefProfile.menu.sections.length > 0 ? (
                <FlatList
                  data={chefProfile.menu.sections.slice(0, 2)} // Show only first 2 sections as preview
                  renderItem={renderSectionItem}
                  keyExtractor={(section) => section._id}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.menuPreview}>
                  <Text style={styles.menuPreviewText}>
                    {chefProfile.menu.dishes.length} dishes available
                  </Text>
                  <TouchableOpacity style={styles.previewButton} onPress={navigateToMenu}>
                    <Text style={styles.previewButtonText}>{strings.viewAllDishes}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noMenuContainer}>
              <Text style={styles.noMenuText}>{strings.chefPreparingMenu}</Text>
              <Text style={styles.noMenuSubtext}>{strings.checkBackSoon}</Text>
              <TouchableOpacity style={styles.checkBackButton} onPress={fetchChefProfile}>
                <Text style={styles.checkBackButtonText}>{strings.refresh}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chefName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  noRating: {
    marginLeft: 8,
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  chefType: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 16,
    marginTop: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tagsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 1,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#1976D2',
  },
  tabContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    backgroundColor: '#fff',
    padding: 16,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    lineHeight: 24,
  },
  viewMenuButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  viewMenuButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuHeader: {
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  menuDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  viewFullMenuButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  viewFullMenuButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  dishItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dishDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dishPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  dishStatus: {
    justifyContent: 'center',
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  available: {
    color: '#4CAF50',
  },
  unavailable: {
    color: '#F44336',
  },
  menuAccessContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 1,
  },
  menuAccessButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  menuAccessButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuPreview: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  menuPreviewText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  previewButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noMenuContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noMenuText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  noMenuSubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  checkBackButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  checkBackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChefProfileScreen;