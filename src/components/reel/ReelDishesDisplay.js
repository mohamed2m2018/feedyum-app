/**
 * ReelDishesDisplay Component
 * Attached dishes section for reel items
 */

import React from 'react';
import AttachedDishesDisplay from '../common/AttachedDishesDisplay';
import { dishesDisplayStyles as styles } from './styles';

/**
 * Props for ReelDishesDisplay
 * @typedef {Object} ReelDishesDisplayProps
 * @property {Object} item - The reel item data
 * @property {boolean} isVisible - Whether overlay is visible
 */

const ReelDishesDisplay = React.memo(({ item, isVisible }) => {
    // Don't show if overlay is hidden
    if (!isVisible) {
        return null;
    }

    // Check if there are dishes to display
    const hasDishes = (item?.dishes && item.dishes.length > 0) || item?.dishName;

    // Hide for external (Google Maps) restaurants - only show for internal chefs
    const isExternalRestaurant = item?.googlePlaceId && !item?.reviewedChef;

    if (!hasDishes || isExternalRestaurant) {
        return null;
    }

    // Build attached dishes array
    const attachedDishes = item?.dishes && item.dishes.length > 0
        ? item.dishes
        : [
            {
                name: item.dishName,
                price: item.price,
                type: 'manual',
                image: item.poster || item.avatarUri,
            },
        ];

    return (
        <AttachedDishesDisplay
            attachedDishes={attachedDishes}
            showPrices={true}
            compact={true}
            chefId={item?.author?._id}
            chefName={item?.author?.fullName}
            restaurantName={item?.restaurantName}
            containerStyle={styles.container}
        />
    );
});

ReelDishesDisplay.displayName = 'ReelDishesDisplay';

export default ReelDishesDisplay;
