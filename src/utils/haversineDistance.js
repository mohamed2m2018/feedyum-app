/**
 * Calculate the distance between two coordinates using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
    // Validate inputs
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
        return Infinity; // Return large distance if coordinates are missing
    }

    const toRadians = (degrees) => degrees * (Math.PI / 180);

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
};

/**
 * Check if two locations are within a threshold distance
 * @param {object} loc1 - First location { latitude, longitude }
 * @param {object} loc2 - Second location { latitude, longitude }
 * @param {number} thresholdKm - Threshold in kilometers (default 1km)
 * @returns {boolean} True if within threshold
 */
export const isWithinThreshold = (loc1, loc2, thresholdKm = 1.0) => {
    if (!loc1 || !loc2) return false;

    const distance = haversineDistance(
        loc1.latitude,
        loc1.longitude,
        loc2.latitude,
        loc2.longitude
    );

    return distance < thresholdKm;
};

export default haversineDistance;
