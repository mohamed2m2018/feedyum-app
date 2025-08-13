import {combineReducers} from 'redux';
import theme from './theme';
import profile from './profile';
import cart from './cartSlice';
import order from './orderSlice';
import address from '../reducers/addressReducer';

const rootReducer = combineReducers({
  theme,
  profile,
  cart,
  order,
  address,
});

export default rootReducer;
