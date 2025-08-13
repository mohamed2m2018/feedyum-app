// Branch API service
import request from './request';

class BranchService {
  // Get all branches for a chef
  async getBranches(chefId = null) {
    try {
      const params = chefId ? { chefId } : {};
      const response = await request.get('/branches/', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Add a new branch
  async addBranch(branchData) {
    try {
      const response = await request.post('/branches/add', branchData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Edit existing branch
  async editBranch(branchId, branchData) {
    try {
      const response = await request.put('/branches/edit', {
        branchId,
        ...branchData
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Delete a branch
  async deleteBranch(branchId) {
    try {
      const response = await request.delete('/branches/delete', {
        data: { branchId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Validate order location
  async validateOrderLocation(chefId, deliveryAddress) {
    try {
      const response = await request.post('/location-chefs/validate-order', {
        chefId,
        deliveryAddress
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get chefs by location
  async getChefsByLocation(locationParams) {
    try {
      const response = await request.get('/location-chefs/', {
        params: locationParams
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get country list with currency info
  getCountryList() {
    return [
      { name: 'United Kingdom', currency: 'GBP', symbol: '£' },
      { name: 'United States', currency: 'USD', symbol: '$' },
      { name: 'Canada', currency: 'CAD', symbol: 'C$' },
      { name: 'Australia', currency: 'AUD', symbol: 'A$' },
      { name: 'Egypt', currency: 'EGP', symbol: '£E' },
      { name: 'France', currency: 'EUR', symbol: '€' },
      { name: 'Germany', currency: 'EUR', symbol: '€' },
      { name: 'Spain', currency: 'EUR', symbol: '€' },
      { name: 'Italy', currency: 'EUR', symbol: '€' },
      { name: 'India', currency: 'INR', symbol: '₹' },
      { name: 'Japan', currency: 'JPY', symbol: '¥' },
      { name: 'China', currency: 'CNY', symbol: '¥' },
      { name: 'Brazil', currency: 'BRL', symbol: 'R$' },
      { name: 'Mexico', currency: 'MXN', symbol: '$' },
      { name: 'South Africa', currency: 'ZAR', symbol: 'R' },
      { name: 'UAE', currency: 'AED', symbol: 'د.إ' },
      { name: 'Saudi Arabia', currency: 'SAR', symbol: 'ر.س' }
    ];
  }

  // Validate branch data
  validateBranchData(data) {
    const errors = {};
    
    if (!data.branchName?.trim()) {
      errors.branchName = 'Branch name is required';
    }
    
    if (!data.streetName?.trim()) {
      errors.streetName = 'Street name is required';
    }
    
    if (!data.buildingNumber?.trim()) {
      errors.buildingNumber = 'Building number is required';
    }
    
    if (!data.area?.trim()) {
      errors.area = 'Area is required';
    }
    
    if (!data.city?.trim()) {
      errors.city = 'City is required';
    }
    
    if (!data.state?.trim()) {
      errors.state = 'State/Province is required';
    }
    
    if (!data.country?.trim()) {
      errors.country = 'Country is required';
    }
    
    if (!data.postalCode?.trim()) {
      errors.postalCode = 'Postal code is required';
    }
    
    if (!data.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }
    
    if (!data.countryCode?.trim()) {
      errors.countryCode = 'Country code is required';
    }
    
    if (!data.lat || isNaN(Number(data.lat))) {
      errors.location = 'Valid coordinates are required';
    }
    
    if (!data.long || isNaN(Number(data.long))) {
      errors.location = 'Valid coordinates are required';
    }
    
    if (data.deliveryRadius && (isNaN(Number(data.deliveryRadius)) || Number(data.deliveryRadius) < 0)) {
      errors.deliveryRadius = 'Delivery radius must be a positive number';
    }
    
    if (data.deliveryFee && (isNaN(Number(data.deliveryFee)) || Number(data.deliveryFee) < 0)) {
      errors.deliveryFee = 'Delivery fee must be a positive number';
    }
    
    if (data.minimumOrderAmount && (isNaN(Number(data.minimumOrderAmount)) || Number(data.minimumOrderAmount) < 0)) {
      errors.minimumOrderAmount = 'Minimum order amount must be a positive number';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default new BranchService(); 