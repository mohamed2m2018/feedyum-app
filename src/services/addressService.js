// Address API service
import request from '../api/request';

class AddressService {
  // Get all user addresses
  async getAddresses() {
    try {
      const response = await Promise.race([
        request.get('/address/'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]);
      return response.data;
    } catch (error) {
throw error;
    }
  }

  // Add new address
  async addAddress(addressData) {
    try {
const response = await request.post('/address/add_address', addressData);
return response.data;
    } catch (error) {
throw error;
    }
  }

  // Edit existing address
  async editAddress(addressId, addressData) {
    try {
      const response = await request.put('/address/edit_address', {
        addressId,
        ...addressData
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Delete address
  async deleteAddress(addressId) {
    try {
const response = await request.delete('/address/', {
        data: { addressId }
      });
return response.data;
    } catch (error) {
throw error;
    }
  }

  // Set current location as delivery address
  async setCurrentLocation(locationData) {
    try {
      const response = await Promise.race([
        request.post('/address/current_location', locationData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 15000)
        )
      ]);
      return response.data;
    } catch (error) {
throw error;
    }
  }

  // Reverse geocode coordinates to address
  async geocodeAddress(lat, lng) {
    try {
      const response = await request.post('/address/geocode', {
        lat: lat.toString(),
        long: lng.toString()
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new AddressService();