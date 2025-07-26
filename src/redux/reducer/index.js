import {combineReducers} from 'redux';
import theme from './theme';
import profile from './profile';
import cart from './cartSlice';
import order from './orderSlice';

const rootReducer = combineReducers({
  theme,
  profile,
  cart,
  order,
});

export default rootReducer;
