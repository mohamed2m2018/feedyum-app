import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useQueryClient } from 'react-query';

import ZSafeAreaView from '../components/common/ZSafeAreaView';
import ZText from '../components/common/ZText';
import ZHeader from '../components/common/ZHeader';
import { moderateScale, getHeight } from '../common/constants';
import { StackNav } from '../navigation/NavigationKeys';
import strings from '../i18n/strings';
import branchService from '../api/branchService';
import { showSuccessToast, showErrorToast, showActionDialog } from '../utils/toast';
import { ALERT_TYPE } from 'react-native-alert-notification';

const ChefBranchesScreen = () => {
    const colors = useSelector(state => state.theme.theme);
    const navigation = useNavigation();
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);

    // Fetch branches using branch API (not user.locations)
    const { data: branchesData, refetch, isLoading } = useQuery(
        'myBranches',
        () => branchService.getBranches(), // No chefId = gets current user's branches
        { retry: 1 }
    );

    const branches = branchesData?.branches || [];

    // Extract a meaningful branch name from the address
    const getBranchName = (branch) => {
        // Use branchName if available (new ChefBranch model)
        if (branch.branchName) {
            return branch.branchName.length > 25
                ? branch.branchName.substring(0, 22) + '...'
                : branch.branchName;
        }

        const address = branch.addressDetails?.formattedAddress || branch.description || '';
        if (!address) return strings.branch || 'Branch';

        const parts = address.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length === 0) return strings.branch || 'Branch';

        let branchName = parts[0];
        if (parts.length > 1 && /^\d+$/.test(branchName)) {
            branchName = parts[1];
        }

        return branchName.length > 25 ? branchName.substring(0, 22) + '...' : branchName;
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const handleAddBranch = () => {
        navigation.navigate(StackNav.MapLocationPicker, {
            isChefBranch: true,
            onLocationSelect: async (locationData) => {
                try {
                    // Use branch API to add new branch
                    await branchService.addBranch({
                        branchName: locationData.branchName || `${locationData.city || 'New'} Branch`,
                        streetName: locationData.streetName || locationData.formattedAddress?.split(',')[0] || 'Street',
                        buildingNumber: locationData.buildingNumber || '1',
                        area: locationData.area || locationData.city || 'Area',
                        city: locationData.city || 'City',
                        state: locationData.state || 'State',
                        country: locationData.country || 'Egypt',
                        postalCode: locationData.postalCode || '00000',
                        lat: parseFloat(locationData.lat || locationData.latitude),
                        long: parseFloat(locationData.long || locationData.longitude),
                        phoneNumber: locationData.phoneNumber || '0000000000',
                        countryCode: locationData.countryCode || '+20',
                        deliveryRadius: locationData.deliveryRadius || 20,
                    });

                    // Invalidate and refetch
                    queryClient.invalidateQueries('myBranches');
                    refetch();
                    showSuccessToast(strings.success, strings.branchAddedSuccess || 'Branch added successfully');
                } catch (error) {
                    console.log('Add branch error:', error);
                    showErrorToast(strings.error, error?.response?.data?.message || error?.message || strings.somethingWentWrong);
                }
            },
        });
    };

    const handleEditBranch = (branch, index) => {
        navigation.navigate(StackNav.MapLocationPicker, {
            isChefBranch: true,
            initialLocation: {
                latitude: parseFloat(branch.location?.lat || branch.lat),
                longitude: parseFloat(branch.location?.long || branch.long),
                address: branch.addressDetails?.formattedAddress || branch.description
            },
            onLocationSelect: async (locationData) => {
                try {
                    await branchService.editBranch(branch._id, {
                        branchName: locationData.branchName || branch.branchName,
                        streetName: locationData.streetName || locationData.formattedAddress?.split(',')[0] || 'Street',
                        buildingNumber: locationData.buildingNumber || '1',
                        area: locationData.area || locationData.city || 'Area',
                        city: locationData.city || 'City',
                        state: locationData.state || 'State',
                        country: locationData.country || 'Egypt',
                        postalCode: locationData.postalCode || '00000',
                        lat: parseFloat(locationData.lat || locationData.latitude),
                        long: parseFloat(locationData.long || locationData.longitude),
                        phoneNumber: locationData.phoneNumber || branch.contactInfo?.phoneNumber || '0000000000',
                        countryCode: locationData.countryCode || branch.contactInfo?.countryCode || '+20',
                        deliveryRadius: locationData.deliveryRadius || branch.deliveryRadius || 20,
                    });

                    queryClient.invalidateQueries('myBranches');
                    refetch();
                    showSuccessToast(strings.success, strings.branchUpdatedSuccess || 'Branch updated successfully');
                } catch (error) {
                    console.log('Edit branch error:', error);
                    showErrorToast(strings.error, error?.response?.data?.message || error?.message || strings.somethingWentWrong);
                }
            },
        });
    };

    const handleDeleteBranch = (branch) => {
        // Prevent deleting the last branch
        if (branches.length <= 1) {
            showErrorToast(
                strings.cannotDeleteBranch || 'Cannot Delete',
                strings.lastBranchWarning || 'At least one branch must exist. You cannot delete your only branch.'
            );
            return;
        }

        showActionDialog({
            type: ALERT_TYPE.WARNING,
            title: strings.deleteBranch || 'Delete Branch',
            message: strings.deleteBranchConfirm || 'Are you sure you want to delete this branch?',
            confirmText: strings.delete,
            cancelText: strings.cancel,
            onConfirm: async () => {
                try {
                    await branchService.deleteBranch(branch._id);
                    queryClient.invalidateQueries('myBranches');
                    refetch();
                    showSuccessToast(strings.success, strings.branchDeletedSuccess || 'Branch deleted successfully');
                } catch (error) {
                    console.log('Delete branch error:', error);
                    showErrorToast(strings.error, error?.response?.data?.message || error?.message || strings.somethingWentWrong);
                }
            },
        });
    };

    const renderBranchCard = ({ item, index }) => (
        <View style={[localStyles.branchCard, { backgroundColor: colors.dark ? colors.inputBg : colors.white }]}>
            {/* Location Icon with Gradient Background */}
            <View style={localStyles.iconContainer}>
                <LinearGradient
                    colors={[colors.primary, colors.lightRed || '#FF7B8E']}
                    style={localStyles.iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="location" size={moderateScale(20)} color={colors.white} />
                </LinearGradient>
            </View>

            {/* Branch Info */}
            <View style={localStyles.branchInfo}>
                <ZText type="b16" color={colors.textColor} numberOfLines={1}>
                    {getBranchName(item)}
                </ZText>
                <ZText type="m14" color={colors.grayScale5} numberOfLines={2} style={localStyles.addressText}>
                    {item.addressDetails?.formattedAddress || item.description || strings.noAddressProvided || 'No address provided'}
                </ZText>
            </View>

            {/* Action Buttons */}
            <View style={localStyles.actionButtons}>
                <TouchableOpacity
                    onPress={() => handleEditBranch(item, index)}
                    style={[localStyles.actionBtn, { borderColor: colors.primary }]}
                >
                    <MaterialIcon name="pencil" size={moderateScale(16)} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDeleteBranch(item)}
                    style={[localStyles.actionBtn, localStyles.deleteBtn]}
                >
                    <MaterialIcon name="delete-outline" size={moderateScale(16)} color={colors.redColor} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const EmptyState = () => (
        <View style={localStyles.emptyContainer}>
            <View style={[localStyles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="storefront-outline" size={moderateScale(48)} color={colors.primary} />
            </View>
            <ZText type="b20" color={colors.textColor} style={localStyles.emptyTitle}>
                {strings.noBranchesYet || 'No Branches Yet'}
            </ZText>
            <ZText type="m14" color={colors.grayScale5} style={localStyles.emptySubtitle}>
                {strings.addYourFirstBranch || 'Add your first branch location to start receiving orders'}
            </ZText>
            <TouchableOpacity
                onPress={handleAddBranch}
                style={[localStyles.emptyAddBtn, { backgroundColor: colors.primary }]}
            >
                <Ionicons name="add" size={moderateScale(20)} color={colors.white} />
                <ZText type="b14" color={colors.white} style={localStyles.emptyAddBtnText}>
                    {strings.addBranch || 'Add Branch'}
                </ZText>
            </TouchableOpacity>
        </View>
    );

    const HeaderComponent = () => (
        <View style={localStyles.headerSection}>
            <LinearGradient
                colors={[colors.primary, colors.lightRed || '#FF7B8E']}
                style={localStyles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={localStyles.headerContent}>
                    <View style={localStyles.headerIconBg}>
                        <Ionicons name="location" size={moderateScale(28)} color={colors.white} />
                    </View>
                    <View style={localStyles.headerTextContainer}>
                        <ZText type="b20" color={colors.white}>
                            {strings.yourBranches}
                        </ZText>
                        <ZText type="m14" color={colors.white} style={{ opacity: 0.9 }}>
                            {branches.length} {branches.length === 1 ? (strings.branch || 'branch') : (strings.branches || 'branches')}
                        </ZText>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );

    if (isLoading) {
        return (
            <ZSafeAreaView>
                <ZHeader title={strings.yourBranches} />
                <View style={localStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </ZSafeAreaView>
        );
    }

    return (
        <ZSafeAreaView>
            <ZHeader title={strings.branches || 'Branches'} />

            <FlatList
                data={branches}
                renderItem={renderBranchCard}
                keyExtractor={(item, index) => `branch-${index}`}
                ListHeaderComponent={branches.length > 0 ? HeaderComponent : null}
                ListEmptyComponent={EmptyState}
                contentContainerStyle={localStyles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />

            {/* Floating Add Button */}
            {branches.length > 0 && (
                <TouchableOpacity onPress={handleAddBranch} activeOpacity={0.8}>
                    <LinearGradient
                        colors={[colors.primary, colors.lightRed || '#FF7B8E']}
                        style={localStyles.fab}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="add" size={moderateScale(28)} color={colors.white} />
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </ZSafeAreaView>
    );
};

const localStyles = StyleSheet.create({
    listContainer: {
        flexGrow: 1,
        paddingHorizontal: moderateScale(16),
        paddingBottom: moderateScale(100),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Header Section
    headerSection: {
        marginBottom: moderateScale(20),
        marginTop: moderateScale(10),
    },
    headerGradient: {
        borderRadius: moderateScale(16),
        padding: moderateScale(20),
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconBg: {
        width: moderateScale(50),
        height: moderateScale(50),
        borderRadius: moderateScale(25),
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(15),
    },
    headerTextContainer: {
        flex: 1,
    },
    // Branch Card
    branchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(16),
        borderRadius: moderateScale(16),
        marginBottom: moderateScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    iconContainer: {
        marginRight: moderateScale(14),
    },
    iconGradient: {
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    branchInfo: {
        flex: 1,
    },
    addressText: {
        marginTop: moderateScale(4),
        lineHeight: moderateScale(18),
    },
    actionButtons: {
        flexDirection: 'row',
        gap: moderateScale(8),
    },
    actionBtn: {
        width: moderateScale(36),
        height: moderateScale(36),
        borderRadius: moderateScale(10),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    deleteBtn: {
        backgroundColor: 'rgba(247, 85, 85, 0.1)',
    },
    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: moderateScale(40),
        paddingTop: moderateScale(80),
    },
    emptyIconContainer: {
        width: moderateScale(100),
        height: moderateScale(100),
        borderRadius: moderateScale(50),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: moderateScale(24),
    },
    emptyTitle: {
        textAlign: 'center',
        marginBottom: moderateScale(8),
    },
    emptySubtitle: {
        textAlign: 'center',
        lineHeight: moderateScale(22),
        marginBottom: moderateScale(32),
    },
    emptyAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: moderateScale(14),
        paddingHorizontal: moderateScale(24),
        borderRadius: moderateScale(30),
    },
    emptyAddBtnText: {
        marginLeft: moderateScale(8),
    },
    // FAB
    fab: {
        position: 'absolute',
        bottom: moderateScale(30),
        right: moderateScale(20),
        width: moderateScale(60),
        height: moderateScale(60),
        borderRadius: moderateScale(30),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});

export default ChefBranchesScreen;
