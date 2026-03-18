import strings from '../../../../i18n/strings';

/**
 * Shared validation resolver for Create/Edit Reel forms.
 * Works with React Hook Form's resolver API.
 *
 * @param {Object} values - Form field values
 * @param {Object} context - { userType: 'chef'|'user', isEditing: boolean, userHasPhone: boolean, hasBranches: boolean }
 * @returns {{ values: Object, errors: Object }}
 */
export const reelFormResolver = (values, context = {}) => {
  const errors = {};
  const { userType = 'chef', isEditing = false, userHasPhone = false, hasBranches = false } = context;

  if (userType === 'chef') {
    // Title - required
    if (!values.title || !values.title.trim()) {
      errors.title = { type: 'required', message: strings.pleaseFillAllInputs || 'Please fill all required fields' };
    } else if (values.title.trim().length > 45) {
      errors.title = { type: 'maxLength', message: strings.tooLargeTitle || 'Title is too long (max 45 characters)' };
    }

    // Caption - required, min 5
    if (!values.caption || !values.caption.trim()) {
      errors.caption = { type: 'required', message: strings.pleaseFillAllInputs || 'Please fill all required fields' };
    } else if (values.caption.trim().length < 5) {
      errors.caption = { type: 'minLength', message: strings.descriptionTooShort || 'Description is too short' };
    }

    // Phone - required if user doesn't already have one
    if (!userHasPhone && !values.phone) {
      errors.phone = { type: 'required', message: strings.pleaseFillAllInputs || 'Please fill all required fields' };
    }

    // Locations - required only on create AND no existing branches
    if (!isEditing && !hasBranches && (!values.locations || values.locations.length === 0)) {
      errors.locations = { type: 'required', message: strings.pleaseFillAllInputs || 'Please fill all required fields' };
    }
  } else {
    // Regular user (review) flow

    // Caption - required, min 5
    if (!values.caption || !values.caption.trim()) {
      errors.caption = { type: 'required', message: strings.selectRestaurantAndDish || 'Please fill all required fields' };
    } else if (values.caption.trim().length < 5) {
      errors.caption = { type: 'minLength', message: strings.descriptionTooShort || 'Description is too short' };
    }

    // Restaurant - required
    if (!values.selectedRestaurant) {
      errors.selectedRestaurant = { type: 'required', message: strings.selectRestaurantAndDish || 'Please select a restaurant and dish' };
    }

    // Dish - required
    if (!values.selectedDish) {
      errors.selectedDish = { type: 'required', message: strings.selectRestaurantAndDish || 'Please select a restaurant and dish' };
    }
  }

  return { values, errors };
};

/**
 * Build the submit payload from form values.
 * Handles both chef and regular user flows.
 *
 * @param {Object} formValues - Validated form values
 * @param {Object} options - { user, mediaIsEdited, postDataToBeEdited }
 * @returns {Object} dataToBeSent
 */
export const buildReelSubmitData = (formValues, options = {}) => {
  const { user, mediaIsEdited = false, postDataToBeEdited } = options;
  const isChef = user?.type === 'chef';

  // Derive categories from attached dishes
  const derivedCategories = Array.from(
    new Set(
      (formValues.attachedDishes || [])
        .flatMap(dish => {
          const cats = Array.isArray(dish?.categories) && dish.categories.length
            ? dish.categories
            : [dish?.category];
          return cats.map(cat => {
            if (!cat) return null;
            if (typeof cat === 'object' && cat._id) return cat._id;
            if (typeof cat === 'string' && /^[a-fA-F0-9]{24}$/.test(cat)) return cat;
            return null;
          });
        })
        .filter(Boolean),
    ),
  );

  const dataToBeSent = {
    ...formValues,
    phone: user?.phone || formValues.phone,
    mediaIsEdited: postDataToBeEdited?.title && mediaIsEdited,
    dishes: formValues.attachedDishes?.map(dish => dish._id) || [],
  };

  // Regular user → review-specific fields
  if (!isChef) {
    dataToBeSent.isReview = true;
    dataToBeSent.title = formValues.selectedDish?.name || dataToBeSent.title;

    // Restaurant info
    if (formValues.selectedRestaurant?.type === 'partner') {
      dataToBeSent.reviewedChefId = formValues.selectedRestaurant.chefId;
    } else {
      dataToBeSent.googlePlaceId = formValues.selectedRestaurant?.placeId;
      dataToBeSent.restaurantName = formValues.selectedRestaurant?.name;
      dataToBeSent.restaurantAddress = formValues.selectedRestaurant?.address;
    }

    // Dish info
    if (formValues.selectedDish?.type === 'menu') {
      dataToBeSent.reviewedDishId = formValues.selectedDish.dishId;
      dataToBeSent.dishes = [formValues.selectedDish.dishId];
    } else {
      dataToBeSent.dishName = formValues.selectedDish?.name;
    }
  }

  // Rating (only include if > 0)
  if (dataToBeSent.rating < 1 || !dataToBeSent.rating) {
    delete dataToBeSent.rating;
  }

  // Set category if derived from dishes
  if (derivedCategories.length > 0) {
    dataToBeSent.category = derivedCategories;
  } else {
    delete dataToBeSent.category;
  }

  // Clean up fields not needed in API payload
  delete dataToBeSent.attachedDishes;
  delete dataToBeSent.price;
  delete dataToBeSent.duration;
  delete dataToBeSent.linkToGo;
  delete dataToBeSent.selectedRestaurant;
  delete dataToBeSent.selectedDish;
  delete dataToBeSent.locations;

  return dataToBeSent;
};
