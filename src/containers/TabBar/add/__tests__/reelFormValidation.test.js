/**
 * Comprehensive test suite for CreateReel/EditReel form validation and submit data assembly.
 *
 * Tests cover:
 * - Chef Create validation (10 cases)
 * - Chef Edit validation (4 cases)
 * - User Create validation (6 cases)
 * - User Edit validation (3 cases)
 * - Submit data assembly (11 cases)
 *
 * These tests validate the shared logic used by BOTH the old (legacy) and new (RHF) forms.
 */

import { reelFormResolver, buildReelSubmitData } from '../utils/reelFormValidation';

// Mock i18n strings — avoids pulling in react-native-localization runtime
jest.mock('../../../../i18n/strings', () => ({
  pleaseFillAllInputs: 'Please fill all required fields',
  tooLargeTitle: 'Title is too long (max 45 characters)',
  descriptionTooShort: 'Description is too short',
  selectRestaurantAndDish: 'Please select a restaurant and dish',
}));

// ─── Helpers ────────────────────────────────────────────────────────────────────

const makeChefValues = (overrides = {}) => ({
  title: 'Delicious Burger',
  caption: 'A juicy burger with all the toppings',
  phone: '+201122953522',
  locations: [{ lat: 30.0, long: 31.0, description: 'Cairo' }],
  attachedDishes: [],
  ...overrides,
});

const makeUserValues = (overrides = {}) => ({
  caption: 'Best burger I have ever had!',
  selectedRestaurant: { type: 'partner', chefId: 'chef123', name: 'Emy Food' },
  selectedDish: { type: 'menu', dishId: 'dish123', name: 'Smash Burger' },
  rating: 4,
  ...overrides,
});

const chefCreateCtx = { userType: 'chef', isEditing: false, userHasPhone: false, hasBranches: false };
const chefEditCtx = { userType: 'chef', isEditing: true, userHasPhone: false, hasBranches: false };
const chefWithPhoneCtx = { userType: 'chef', isEditing: false, userHasPhone: true, hasBranches: false };
const chefWithBranchesCtx = { userType: 'chef', isEditing: false, userHasPhone: false, hasBranches: true };
const userCreateCtx = { userType: 'user', isEditing: false };
const userEditCtx = { userType: 'user', isEditing: true };

const hasError = (result, field) => !!result.errors[field];
const noErrors = (result) => Object.keys(result.errors).length === 0;

// ─── Chef Create Validation ────────────────────────────────────────────────────

describe('reelFormResolver — Chef Create', () => {
  it('1. passes with all valid fields', () => {
    const result = reelFormResolver(makeChefValues(), chefCreateCtx);
    expect(noErrors(result)).toBe(true);
  });

  it('2. fails when title is empty', () => {
    const result = reelFormResolver(makeChefValues({ title: '' }), chefCreateCtx);
    expect(hasError(result, 'title')).toBe(true);
  });

  it('3. fails when title is whitespace-only', () => {
    const result = reelFormResolver(makeChefValues({ title: '   ' }), chefCreateCtx);
    expect(hasError(result, 'title')).toBe(true);
  });

  it('4. fails when caption is empty', () => {
    const result = reelFormResolver(makeChefValues({ caption: '' }), chefCreateCtx);
    expect(hasError(result, 'caption')).toBe(true);
  });

  it('5. fails when caption < 5 characters', () => {
    const result = reelFormResolver(makeChefValues({ caption: 'Hi' }), chefCreateCtx);
    expect(hasError(result, 'caption')).toBe(true);
    expect(result.errors.caption.type).toBe('minLength');
  });

  it('6. fails when title > 45 characters', () => {
    const longTitle = 'A'.repeat(46);
    const result = reelFormResolver(makeChefValues({ title: longTitle }), chefCreateCtx);
    expect(hasError(result, 'title')).toBe(true);
    expect(result.errors.title.type).toBe('maxLength');
  });

  it('7. passes when title is exactly 45 characters', () => {
    const exactTitle = 'A'.repeat(45);
    const result = reelFormResolver(makeChefValues({ title: exactTitle }), chefCreateCtx);
    expect(hasError(result, 'title')).toBe(false);
  });

  it('8. fails when no phone AND user has no phone', () => {
    const result = reelFormResolver(makeChefValues({ phone: '' }), chefCreateCtx);
    expect(hasError(result, 'phone')).toBe(true);
  });

  it('9. passes when no phone BUT user already has phone', () => {
    const result = reelFormResolver(makeChefValues({ phone: '' }), chefWithPhoneCtx);
    expect(hasError(result, 'phone')).toBe(false);
  });

  it('10. fails when no locations, no branches, and not editing', () => {
    const result = reelFormResolver(makeChefValues({ locations: [] }), chefCreateCtx);
    expect(hasError(result, 'locations')).toBe(true);
  });

  it('11. passes when no locations BUT has branches', () => {
    const result = reelFormResolver(makeChefValues({ locations: [] }), chefWithBranchesCtx);
    expect(hasError(result, 'locations')).toBe(false);
  });
});

// ─── Chef Edit Validation ───────────────────────────────────────────────────────

describe('reelFormResolver — Chef Edit', () => {
  it('12. passes with all valid fields in edit mode', () => {
    const result = reelFormResolver(makeChefValues(), chefEditCtx);
    expect(noErrors(result)).toBe(true);
  });

  it('13. fails when title is empty in edit mode', () => {
    const result = reelFormResolver(makeChefValues({ title: '' }), chefEditCtx);
    expect(hasError(result, 'title')).toBe(true);
  });

  it('14. fails when caption is empty in edit mode', () => {
    const result = reelFormResolver(makeChefValues({ caption: '' }), chefEditCtx);
    expect(hasError(result, 'caption')).toBe(true);
  });

  it('15. locations NOT required in edit mode (even without branches)', () => {
    const result = reelFormResolver(makeChefValues({ locations: [] }), chefEditCtx);
    expect(hasError(result, 'locations')).toBe(false);
  });
});

// ─── User Create Validation ─────────────────────────────────────────────────────

describe('reelFormResolver — User Create (Review)', () => {
  it('16. passes with all valid fields', () => {
    const result = reelFormResolver(makeUserValues(), userCreateCtx);
    expect(noErrors(result)).toBe(true);
  });

  it('17. fails when caption is empty', () => {
    const result = reelFormResolver(makeUserValues({ caption: '' }), userCreateCtx);
    expect(hasError(result, 'caption')).toBe(true);
  });

  it('18. fails when caption < 5 characters', () => {
    const result = reelFormResolver(makeUserValues({ caption: 'Meh' }), userCreateCtx);
    expect(hasError(result, 'caption')).toBe(true);
    expect(result.errors.caption.type).toBe('minLength');
  });

  it('19. fails when no restaurant selected', () => {
    const result = reelFormResolver(makeUserValues({ selectedRestaurant: null }), userCreateCtx);
    expect(hasError(result, 'selectedRestaurant')).toBe(true);
  });

  it('20. fails when no dish selected', () => {
    const result = reelFormResolver(makeUserValues({ selectedDish: null }), userCreateCtx);
    expect(hasError(result, 'selectedDish')).toBe(true);
  });

  it('21. fails when restaurant selected but no dish', () => {
    const result = reelFormResolver(makeUserValues({ selectedDish: null }), userCreateCtx);
    expect(hasError(result, 'selectedDish')).toBe(true);
    expect(hasError(result, 'selectedRestaurant')).toBe(false);
  });
});

// ─── User Edit Validation ───────────────────────────────────────────────────────

describe('reelFormResolver — User Edit (Review)', () => {
  it('22. passes with all valid fields in edit mode', () => {
    const result = reelFormResolver(makeUserValues(), userEditCtx);
    expect(noErrors(result)).toBe(true);
  });

  it('23. fails when caption is empty in edit mode', () => {
    const result = reelFormResolver(makeUserValues({ caption: '' }), userEditCtx);
    expect(hasError(result, 'caption')).toBe(true);
  });

  it('24. fails when no restaurant in edit mode', () => {
    const result = reelFormResolver(makeUserValues({ selectedRestaurant: null }), userEditCtx);
    expect(hasError(result, 'selectedRestaurant')).toBe(true);
  });
});

// ─── Submit Data Assembly ───────────────────────────────────────────────────────

describe('buildReelSubmitData', () => {
  const chefUser = { _id: 'chef1', type: 'chef', phone: '+201122953522' };
  const regularUser = { _id: 'user1', type: 'user' };

  it('25. chef submit with dishes → dishes array = dish IDs', () => {
    const values = makeChefValues({
      attachedDishes: [
        { _id: 'dish1', name: 'Burger' },
        { _id: 'dish2', name: 'Pizza' },
      ],
    });
    const result = buildReelSubmitData(values, { user: chefUser });
    expect(result.dishes).toEqual(['dish1', 'dish2']);
  });

  it('26. chef submit derives categories from dishes with ObjectId categories', () => {
    const values = makeChefValues({
      attachedDishes: [
        { _id: 'dish1', categories: ['aabbccddee112233445566ff'] },
        { _id: 'dish2', categories: ['aabbccddee112233445566ff', '112233445566778899aabbcc'] },
      ],
    });
    const result = buildReelSubmitData(values, { user: chefUser });
    expect(result.category).toEqual(['aabbccddee112233445566ff', '112233445566778899aabbcc']);
  });

  it('27. chef submit derives categories from object-type categories', () => {
    const values = makeChefValues({
      attachedDishes: [
        { _id: 'dish1', categories: [{ _id: 'cat1' }] },
      ],
    });
    const result = buildReelSubmitData(values, { user: chefUser });
    expect(result.category).toEqual(['cat1']);
  });

  it('28. chef submit with no dish categories → category is undefined', () => {
    const values = makeChefValues({ attachedDishes: [] });
    const result = buildReelSubmitData(values, { user: chefUser });
    expect(result.category).toBeUndefined();
  });

  it('29. user submit with partner restaurant → reviewedChefId set', () => {
    const values = makeUserValues();
    const result = buildReelSubmitData(values, { user: regularUser });
    expect(result.reviewedChefId).toBe('chef123');
    expect(result.isReview).toBe(true);
  });

  it('30. user submit with Google restaurant → googlePlaceId + restaurantName set', () => {
    const values = makeUserValues({
      selectedRestaurant: {
        type: 'google',
        placeId: 'ChIJ123',
        name: 'Street Food Place',
        address: '123 Main St',
      },
    });
    const result = buildReelSubmitData(values, { user: regularUser });
    expect(result.googlePlaceId).toBe('ChIJ123');
    expect(result.restaurantName).toBe('Street Food Place');
    expect(result.restaurantAddress).toBe('123 Main St');
  });

  it('31. user submit with menu dish → reviewedDishId + dishes set', () => {
    const values = makeUserValues();
    const result = buildReelSubmitData(values, { user: regularUser });
    expect(result.reviewedDishId).toBe('dish123');
    expect(result.dishes).toEqual(['dish123']);
  });

  it('32. user submit with manual dish → dishName set', () => {
    const values = makeUserValues({
      selectedDish: { type: 'manual', name: 'Custom Shawarma' },
    });
    const result = buildReelSubmitData(values, { user: regularUser });
    expect(result.dishName).toBe('Custom Shawarma');
    expect(result.reviewedDishId).toBeUndefined();
  });

  it('33. user submit with rating > 0 → rating included', () => {
    const values = makeUserValues({ rating: 5 });
    const result = buildReelSubmitData(values, { user: regularUser });
    expect(result.rating).toBe(5);
  });

  it('34. user submit with rating = 0 → rating excluded', () => {
    const values = makeUserValues({ rating: 0 });
    const result = buildReelSubmitData(values, { user: regularUser });
    expect(result.rating).toBeUndefined();
  });

  it('35. submit cleans up internal fields', () => {
    const values = makeChefValues({
      attachedDishes: [{ _id: 'd1' }],
      price: 100,
      duration: 30,
      linkToGo: 'http://example.com',
    });
    const result = buildReelSubmitData(values, { user: chefUser });
    expect(result.attachedDishes).toBeUndefined();
    expect(result.price).toBeUndefined();
    expect(result.duration).toBeUndefined();
    expect(result.linkToGo).toBeUndefined();
  });

  it('36. edit mode sets mediaIsEdited flag when title exists and media changed', () => {
    const values = makeChefValues();
    const result = buildReelSubmitData(values, {
      user: chefUser,
      mediaIsEdited: true,
      postDataToBeEdited: { title: 'Old Title' },
    });
    expect(result.mediaIsEdited).toBe(true);
  });

  it('37. create mode sets mediaIsEdited to falsy (no postDataToBeEdited)', () => {
    const values = makeChefValues();
    const result = buildReelSubmitData(values, {
      user: chefUser,
      mediaIsEdited: true,
      postDataToBeEdited: undefined,
    });
    expect(result.mediaIsEdited).toBeFalsy();
  });

  it('38. user submit uses dish name as title', () => {
    const values = makeUserValues({ title: 'My Original Title' });
    const result = buildReelSubmitData(values, { user: regularUser });
    expect(result.title).toBe('Smash Burger'); // selectedDish.name overrides title
  });

  it('39. chef submit uses phone from user object if available', () => {
    const values = makeChefValues({ phone: '' });
    const result = buildReelSubmitData(values, { user: chefUser });
    expect(result.phone).toBe('+201122953522');
  });

  it('40. chef submit uses form phone if user has no phone', () => {
    const values = makeChefValues({ phone: '+201011223344' });
    const noPhoneUser = { _id: 'chef1', type: 'chef' };
    const result = buildReelSubmitData(values, { user: noPhoneUser });
    expect(result.phone).toBe('+201011223344');
  });
});
