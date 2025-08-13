import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import strings from '../i18n/strings';
import branchService from '../api/branchService';
import BranchCard from '../components/BranchCard';
import AddBranchModal from '../components/AddBranchModal';
import { colors } from '../themes/colors';

const ChefBranchManagement = ({ navigation, userToken }) => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [chefSettings, setChefSettings] = useState(null);
  const [stats, setStats] = useState(null);

  const currentTheme = useSelector(state => state.theme.theme);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const response = await branchService.getBranches();
      
      if (response.success) {
        setBranches(response.branches);
        setStats(response.stats);
        
        // Extract chef settings from first branch
        if (response.branches.length > 0 && response.branches[0].chef) {
          setChefSettings(response.branches[0].chef.chefSettings);
        }
      } else {
        Alert.alert(strings.error, response.message || 'Failed to load branches');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      Alert.alert(strings.error, 'Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBranches();
    setIsRefreshing(false);
  };

  const handleAddBranch = () => {
    setShowAddModal(true);
  };

  const handleBranchAdded = (newBranch) => {
    setBranches(prev => [newBranch, ...prev]);
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      active: prev.active + 1
    }));
    setShowAddModal(false);
    
    // Update chef settings if this is the first branch
    if (newBranch.chef?.chefSettings) {
      setChefSettings(newBranch.chef.chefSettings);
    }
  };

  const handleEditBranch = (branch) => {
    navigation.navigate('EditBranch', { 
      branch, 
      onBranchUpdated: handleBranchUpdated 
    });
  };

  const handleBranchUpdated = (updatedBranch) => {
    setBranches(prev => 
      prev.map(branch => 
        branch._id === updatedBranch._id ? updatedBranch : branch
      )
    );
  };

  const handleDeleteBranch = (branchId, branchName) => {
    Alert.alert(
      'Delete Branch',
      `Are you sure you want to delete "${branchName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteBranch(branchId) }
      ]
    );
  };

  const confirmDeleteBranch = async (branchId) => {
    try {
      const response = await branchService.deleteBranch(branchId);
      
      if (response.success) {
        setBranches(prev => prev.filter(branch => branch._id !== branchId));
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          active: prev.active - 1
        }));
        
        Alert.alert('Success', response.message);
        
        // If no branches left, reset chef settings
        if (response.remainingBranches === 0) {
          setChefSettings(null);
        }
      } else {
        Alert.alert(strings.error, response.message || 'Failed to delete branch');
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      Alert.alert(strings.error, 'Failed to delete branch');
    }
  };

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { backgroundColor: currentTheme.backgroundColor }]}>
      <Text style={[styles.emptyTitle, { color: currentTheme.textColor }]}>
        No Branches Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.grayColor }]}>
        Add your first branch to start receiving orders
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={handleAddBranch}
      >
        <Text style={styles.addButtonText}>Add First Branch</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={[styles.statsContainer, { backgroundColor: currentTheme.cardBackground }]}>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.primary }]}>{stats?.total || 0}</Text>
        <Text style={[styles.statLabel, { color: currentTheme.grayColor }]}>Total</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.success }]}>{stats?.active || 0}</Text>
        <Text style={[styles.statLabel, { color: currentTheme.grayColor }]}>Active</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.error }]}>{stats?.inactive || 0}</Text>
        <Text style={[styles.statLabel, { color: currentTheme.grayColor }]}>Inactive</Text>
      </View>
      {chefSettings?.currency && (
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: currentTheme.textColor }]}>
            {chefSettings.currencySymbol}
          </Text>
          <Text style={[styles.statLabel, { color: currentTheme.grayColor }]}>
            {chefSettings.currency}
          </Text>
        </View>
      )}
    </View>
  );

  const renderCountryInfo = () => {
    if (!chefSettings?.country) return null;
    
    return (
      <View style={[styles.countryInfo, { backgroundColor: currentTheme.cardBackground }]}>
        <Text style={[styles.countryTitle, { color: currentTheme.textColor }]}>
          Operating Country
        </Text>
        <Text style={[styles.countryName, { color: colors.primary }]}>
          {chefSettings.country}
        </Text>
        <Text style={[styles.countryNote, { color: currentTheme.grayColor }]}>
          All branches must be in the same country. This setting cannot be changed.
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.backgroundColor }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
          Loading branches...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: currentTheme.textColor }]}>
            Branch Management
          </Text>
          <Text style={[styles.subtitle, { color: currentTheme.grayColor }]}>
            Manage your restaurant locations
          </Text>
        </View>

        {/* Country Info */}
        {renderCountryInfo()}

        {/* Stats */}
        {stats && renderStats()}

        {/* Add Branch Button */}
        {branches.length > 0 && (
          <TouchableOpacity
            style={[styles.addBranchButton, { backgroundColor: colors.primary }]}
            onPress={handleAddBranch}
          >
            <Text style={styles.addBranchButtonText}>+ Add New Branch</Text>
          </TouchableOpacity>
        )}

        {/* Branches List */}
        {branches.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.branchesContainer}>
            {branches.map(branch => (
              <BranchCard
                key={branch._id}
                branch={branch}
                onEdit={() => handleEditBranch(branch)}
                onDelete={() => handleDeleteBranch(branch._id, branch.branchName)}
                theme={currentTheme}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Branch Modal */}
      <AddBranchModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onBranchAdded={handleBranchAdded}
        chefSettings={chefSettings}
        theme={currentTheme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
  },
  countryInfo: {
    margin: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  countryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  countryName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  countryNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  addBranchButton: {
    margin: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBranchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  branchesContainer: {
    padding: 20,
    paddingTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  addButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChefBranchManagement; 