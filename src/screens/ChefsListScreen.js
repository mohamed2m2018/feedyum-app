import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import ChefProfileCard from '../components/ChefProfileCard';
import userService from '../api/userService';
import strings from '../i18n/strings';

const ChefsListScreen = ({ navigation, userToken }) => {
  const [chefs, setChefs] = useState([]);
  const [filteredChefs, setFilteredChefs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchChefs();
  }, []);

  useEffect(() => {
    filterChefs();
  }, [searchQuery, chefs]);

  const fetchChefs = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getAllUsers(userToken);
      
      if (data.success) {
        // Filter only chef users and fetch their profiles
        const chefUsers = data.users.filter(user => user.type === 'chef');
        const chefsWithProfiles = await Promise.all(
          chefUsers.map(async (chef) => {
            try {
              const profileData = await userService.getChefProfile(chef._id, userToken);
              return profileData.success ? profileData.chef : chef;
            } catch (error) {
              console.error(`Failed to fetch profile for chef ${chef._id}:`, error);
              return chef;
            }
          })
        );
        
        setChefs(chefsWithProfiles);
      } else {
        Alert.alert(strings.error, data.message || strings.failedToLoadChefs);
      }
    } catch (error) {
      console.error('Failed to fetch chefs:', error);
      Alert.alert(strings.error, strings.failedToLoadChefs);
    } finally {
      setIsLoading(false);
    }
  };

  const filterChefs = () => {
    if (!searchQuery.trim()) {
      setFilteredChefs(chefs);
    } else {
      const filtered = chefs.filter(chef => 
        (chef.fullName && chef.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (chef.username && chef.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (chef.bio && chef.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (chef.tags && chef.tags.some(tag => 
          tag.name && tag.name.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
      setFilteredChefs(filtered);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchChefs();
    setIsRefreshing(false);
  };

  const handleChefPress = (chef) => {
    navigation.navigate('ChefProfile', { chefId: chef._id });
  };

  const handleViewMenu = (chef) => {
    if (chef.hasMenu) {
      navigation.navigate('ChefMenu', { 
        chefId: chef._id,
        chefName: chef.fullName || chef.username,
        menu: chef.menu
      });
    } else {
      Alert.alert(strings.noMenu, strings.chefHasNotCreatedMenu);
    }
  };

  const renderChefItem = ({ item }) => (
    <ChefProfileCard
      chef={item}
      onPress={handleChefPress}
      onViewMenu={handleViewMenu}
      showMenuButton={true}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchQuery ? 'No chefs found matching your search' : 'No chefs available'}
      </Text>
      {searchQuery && (
        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading chefs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search chefs by name, bio, or specialty..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredChefs.length} chef{filteredChefs.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Chefs List */}
      <FlatList
        data={filteredChefs}
        renderItem={renderChefItem}
        keyExtractor={(item) => item._id}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredChefs.length === 0 ? styles.emptyListContainer : null}
      />
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
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ChefsListScreen;