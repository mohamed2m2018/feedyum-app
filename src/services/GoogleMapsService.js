import { API_BASE_URL } from '../common/constants';
import axios from 'axios';

class GoogleMapsService {
    /**
     * Reverse geocode coordinates to get address details
     * @param {number} latitude 
     * @param {number} longitude 
     * @returns {Promise<object>} Address details
     */
    static async reverseGeocode(latitude, longitude) {
        try {
            const response = await axios.get(`${API_BASE_URL}/location/geocode`, {
                params: { lat: latitude, lng: longitude }
            });
            return response.data;
        } catch (error) {
            console.error('GoogleMapsService Error:', error);
            throw error;
        }
    }

    /**
     * Search for places using Google Places Autocomplete
     * @param {string} query 
     * @param {object} options Optional search parameters (location, radius, components)
     * @returns {Promise<Array>} List of predictions
     */
    static async searchPlaces(query, options = {}) {
        try {
            const params = { query };

            // Add optional location parameters if provided
            if (options.lat && options.lng) {
                params.location = `${options.lat},${options.lng}`;
                params.radius = options.radius || 50000; // Default 50km
            }

            // Add component restrictions if provided (e.g., country)
            if (options.components) {
                params.components = options.components;
            }

            const response = await axios.get(`${API_BASE_URL}/location/places`, {
                params
            });
            return response.data;
        } catch (error) {
            console.error('GoogleMapsService Search Error:', error);
            throw error;
        }
    }

    /**
     * Get place details using Google Places API
     * @param {string} placeId 
     * @returns {Promise<object>} Place details
     */
    static async getPlaceDetails(placeId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/location/places/details`, {
                params: { place_id: placeId }
            });
            return response.data;
        } catch (error) {
            console.error('GoogleMapsService Details Error:', error);
            throw error;
        }
    }
}

export default GoogleMapsService;
