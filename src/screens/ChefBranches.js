import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    I18nManager,
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
    const isDarkTheme = colors.dark === 'dark';

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
            onLocationSelect: (locationData) => {
                // Don't save yet — navigate to WorkingHoursScreen to collect hours first
                const pendingBranchData = {
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
                    deliveryTiers: locationData.deliveryTiers || [],
                    deliveryFee: locationData.deliveryFee, // Pass explicitly
                    areaDeliveryFees: locationData.areaDeliveryFees || [], // Pass explicitly
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    orderMode: locationData.orderMode || 'asap',
                    minLeadTime: locationData.minLeadTime || 60,
                    slotDuration: locationData.slotDuration || 60,
                    excludedAreas: locationData.excludedAreas || [],
                };

                // Delay navigation so it fires AFTER MapLocationPicker's goBack() pops
                setTimeout(() => {
                    navigation.navigate(StackNav.WorkingHours, {
                        mode: 'create',
                        pendingBranchData,
                        onSave: () => {
                            queryClient.invalidateQueries('myBranches');
                            refetch();
                        },
                    });
                }, 100);
            },
        });
    };

    const handleEditBranch = (branch, index) => {
        navigation.navigate(StackNav.MapLocationPicker, {
            isChefBranch: true,
            editMode: true,
            addressToEdit: {
                _id: branch._id,
                location: branch.location,
                lat: branch.location?.lat || branch.lat,
                long: branch.location?.long || branch.long,
                formattedAddress: branch.addressDetails?.formattedAddress || branch.description,
                nameLine: branch.addressDetails?.formattedAddress || branch.description,
                label: branch.branchName || 'Branch',
                branchName: branch.branchName,
                addressType: 'business',
                streetDetails: branch.addressDetails?.streetDetails || {
                    streetName: branch.addressDetails?.formattedAddress?.split(',')[0] || '',
                    area: branch.addressDetails?.area || '',
                },
                buildingDetails: branch.addressDetails?.buildingDetails,
                contactInfo: branch.contactInfo,
                deliveryRadius: branch.deliveryRadius,
                deliveryFee: branch.deliveryFee, // PRE-FILL BASE FEE
                areaDeliveryFees: branch.areaDeliveryFees, // PRE-FILL AREA FEES
                deliveryTiers: branch.deliveryTiers,
                orderMode: branch.orderMode,
                minLeadTime: branch.minLeadTime,
                slotDuration: branch.slotDuration,
                excludedAreas: branch.excludedAreas || [],
            },
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
                        deliveryTiers: locationData.deliveryTiers || [], // Pass empty array over old tiers
                        deliveryFee: locationData.deliveryFee, // PASS EXPLICITLY TO BACKEND
                        areaDeliveryFees: locationData.areaDeliveryFees || [], // PASS EXPLICITLY TO BACKEND
                        orderMode: locationData.orderMode || branch.orderMode || 'asap',
                        minLeadTime: locationData.minLeadTime || branch.minLeadTime || 60,
                        slotDuration: locationData.slotDuration || branch.slotDuration || 60,
                        excludedAreas: locationData.excludedAreas || branch.excludedAreas || [],
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

    const handleToggleStatus = async (branch) => {
        // Cycle through: auto -> forceClosed -> forceOpen -> auto
        const currentOverride = branch.manualOverride || 'auto';
        let newOverride;
        if (currentOverride === 'auto') newOverride = 'forceClosed';
        else if (currentOverride === 'forceClosed') newOverride = 'forceOpen';
        else newOverride = 'auto';

        try {
            await branchService.toggleBranchStatus(branch._id, newOverride);
            queryClient.invalidateQueries('myBranches');
            refetch();
            showSuccessToast(strings.success, strings.branchStatusUpdated);
        } catch (error) {
            showErrorToast(strings.error, error?.response?.data?.message || error?.message || strings.somethingWentWrong);
        }
    };

    const getStatusInfo = (branch) => {
        const override = branch.manualOverride || 'auto';
        if (override === 'forceOpen') return { label: strings.forceOpen, color: '#4CAF50', icon: 'checkmark-circle' };
        if (override === 'forceClosed') return { label: strings.forceClosed, color: '#FF5252', icon: 'close-circle' };
        return { label: strings.autoSchedule, color: colors.primary, icon: 'time-outline' };
    };

    const formatTime12h = (timeStr) => {
        if (!timeStr) return '--:--';
        const [h, m] = timeStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const getWorkingHoursSummary = (branch) => {
        const hours = branch.operatingHours || [];
        if (hours.length === 0) return strings.noWorkingHoursSet;

        // Get today's day name
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayKey = dayNames[new Date().getDay()];
        const todaySchedule = hours.find(h => h.day === todayKey);

        if (!todaySchedule || !todaySchedule.isOpen) {
            return `${strings.closedNow || strings.closed}`;
        }

        return `${formatTime12h(todaySchedule.openTime)} - ${formatTime12h(todaySchedule.closeTime)}`;
    };

    const getOrderModeInfo = (branch) => {
        const mode = branch.orderMode || (branch.allowScheduledOrders ? 'both' : 'asap');

        if (mode === 'asap') {
            return {
                mode,
                icon: 'flash',
                label: strings.asapOnly || 'ASAP',
            };
        }

        if (mode === 'scheduled') {
            return {
                mode,
                icon: 'calendar',
                label: strings.scheduledOnly || 'Scheduled',
            };
        }

        return {
            mode,
            icon: 'time',
            label: strings.bothModes || 'Both',
        };
    };

    const renderBranchCard = ({ item, index }) => {
        const statusInfo = getStatusInfo(item);
        const orderModeInfo = getOrderModeInfo(item);
        return (
            <View
                style={[
                    localStyles.branchCard,
                    {
                        backgroundColor: colors.inputBg,
                        borderColor: isDarkTheme ? colors.bColor : colors.grayScale1,
                    },
                ]}
            >
                <View style={localStyles.branchTopRow}>
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

                    <View style={localStyles.branchInfo}>
                        <ZText type="B18" color={colors.textColor} numberOfLines={1}>
                            {getBranchName(item)}
                        </ZText>
                        <ZText type="m14" color={colors.grayScale5} numberOfLines={2} style={localStyles.addressText}>
                            {item.addressDetails?.formattedAddress || item.description || strings.noAddressProvided || 'No address provided'}
                        </ZText>
                    </View>

                    <View style={localStyles.actionButtons}>
                        <TouchableOpacity
                            onPress={() => handleEditBranch(item, index)}
                            style={[
                                localStyles.actionBtn,
                                {
                                    backgroundColor: colors.primary + '14',
                                    borderColor: colors.primary + '66',
                                },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={strings.edit || 'Edit'}
                            testID={`branch-edit-${index}`}
                        >
                            <MaterialIcon name="pencil" size={moderateScale(16)} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDeleteBranch(item)}
                            style={[localStyles.actionBtn, localStyles.deleteBtn, { borderColor: colors.redColor + '22' }]}
                            accessibilityRole="button"
                            accessibilityLabel={strings.delete || 'Delete'}
                            testID={`branch-delete-${index}`}
                        >
                            <MaterialIcon name="delete-outline" size={moderateScale(16)} color={colors.redColor} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[localStyles.statusSection, { borderTopColor: colors.bColor }]}>
                    <TouchableOpacity
                        style={[localStyles.statusToggle, { backgroundColor: statusInfo.color + '15' }]}
                        onPress={() => handleToggleStatus(item)}
                        accessibilityRole="button"
                        accessibilityLabel={statusInfo.label}
                        testID={`branch-status-${index}`}
                    >
                        <Ionicons name={statusInfo.icon} size={moderateScale(16)} color={statusInfo.color} />
                        <ZText type="M12" color={statusInfo.color} style={localStyles.inlineLabel} numberOfLines={1}>
                            {statusInfo.label}
                        </ZText>
                        <Ionicons name="swap-horizontal-outline" size={moderateScale(14)} color={statusInfo.color} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[localStyles.hoursButton, { backgroundColor: colors.primary + '10' }]}
                        onPress={() => navigation.navigate(StackNav.WorkingHours, {
                            branch: item,
                            onSave: () => {
                                queryClient.invalidateQueries('myBranches');
                                refetch();
                            },
                        })}
                        accessibilityRole="button"
                        accessibilityLabel={getWorkingHoursSummary(item)}
                        testID={`branch-hours-${index}`}
                    >
                        <Ionicons name="time-outline" size={moderateScale(14)} color={colors.primary} />
                        <ZText type="M12" color={colors.primary} style={localStyles.inlineLabel} numberOfLines={1}>
                            {getWorkingHoursSummary(item)}
                        </ZText>
                        <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={moderateScale(14)} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[localStyles.schedulingRow, { borderTopColor: colors.bColor }]}
                    onPress={async () => {
                        const currentMode = orderModeInfo.mode;
                        const nextMode = currentMode === 'asap' ? 'both' : currentMode === 'both' ? 'scheduled' : 'asap';
                        try {
                            await branchService.editBranch(item._id, { orderMode: nextMode });
                            queryClient.invalidateQueries('myBranches');
                            refetch();
                        } catch (e) {
                            console.error('[ORDER_MODE] Failed to update:', e?.response?.data || e.message);
                        }
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={strings.orderModeLabel || 'Order Mode'}
                    testID={`branch-order-mode-${index}`}
                >
                    <View style={localStyles.schedulingLabelWrap}>
                        <Ionicons name={orderModeInfo.icon} size={moderateScale(16)} color={colors.primary} />
                        <ZText type="M14" color={colors.textColor} style={localStyles.inlineLabel}>
                            {strings.orderModeLabel || 'Order Mode'}
                        </ZText>
                    </View>
                    <View style={[localStyles.schedulingBadge, { backgroundColor: colors.primary + '15' }]}>
                        <ZText type="B12" color={colors.primary} numberOfLines={1}>
                            {orderModeInfo.label}
                        </ZText>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    const emptyState = (
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

    const headerComponent = (
        <View style={localStyles.headerSection}>
            <LinearGradient
                colors={[colors.primary, colors.lightRed || '#FF7B8E']}
                style={localStyles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={localStyles.headerContent}>
                    <View style={localStyles.headerIconBg}>
                        <Ionicons name="location-outline" size={moderateScale(22)} color={colors.white} />
                    </View>
                    <View style={localStyles.headerTextContainer}>
                        <ZText type="B18" color={colors.white} numberOfLines={1}>
                            {strings.yourBranches}
                        </ZText>
                        <ZText type="M12" color={colors.white} style={localStyles.headerSubtitle} numberOfLines={1}>
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
                ListHeaderComponent={branches.length > 0 ? headerComponent : null}
                ListEmptyComponent={emptyState}
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
                        style={[localStyles.fab, I18nManager.isRTL ? localStyles.fabRTL : localStyles.fabLTR]}
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
        paddingHorizontal: moderateScale(20),
        paddingBottom: moderateScale(100),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Header Section
    headerSection: {
        marginBottom: moderateScale(16),
        marginTop: moderateScale(8),
    },
    headerGradient: {
        borderRadius: moderateScale(14),
        paddingHorizontal: moderateScale(18),
        paddingVertical: moderateScale(14),
        overflow: 'hidden',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconBg: {
        width: moderateScale(42),
        height: moderateScale(42),
        borderRadius: moderateScale(21),
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(12),
    },
    headerTextContainer: {
        flex: 1,
    },
    headerSubtitle: {
        opacity: 0.88,
        marginTop: moderateScale(2),
    },
    // Branch Card
    branchCard: {
        padding: moderateScale(14),
        borderRadius: moderateScale(18),
        marginBottom: moderateScale(14),
        borderWidth: StyleSheet.hairlineWidth,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    branchTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        marginRight: moderateScale(12),
    },
    iconGradient: {
        width: moderateScale(46),
        height: moderateScale(46),
        borderRadius: moderateScale(14),
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
        marginLeft: moderateScale(10),
    },
    actionBtn: {
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(13),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
        marginLeft: moderateScale(8),
    },
    deleteBtn: {
        backgroundColor: 'rgba(247, 85, 85, 0.1)',
    },
    statusSection: {
        marginTop: moderateScale(14),
        paddingTop: moderateScale(14),
        borderTopWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
    },
    statusToggle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: moderateScale(44),
        paddingHorizontal: moderateScale(12),
        borderRadius: moderateScale(12),
        marginRight: moderateScale(6),
    },
    hoursButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: moderateScale(44),
        paddingHorizontal: moderateScale(12),
        borderRadius: moderateScale(12),
        marginLeft: moderateScale(6),
    },
    inlineLabel: {
        marginLeft: moderateScale(7),
        flex: 1,
    },
    schedulingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: moderateScale(48),
        paddingTop: moderateScale(12),
        marginTop: moderateScale(10),
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    schedulingLabelWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: moderateScale(12),
    },
    schedulingBadge: {
        paddingHorizontal: moderateScale(10),
        paddingVertical: moderateScale(5),
        borderRadius: moderateScale(10),
        maxWidth: moderateScale(150),
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
    fabLTR: {
        right: moderateScale(20),
    },
    fabRTL: {
        left: moderateScale(20),
    },
});

export default ChefBranchesScreen;
