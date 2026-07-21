/**
 * @format
 */

import appPackage from '../package.json';

it('has a configured application entry point', () => {
  expect(appPackage.main).toBe('index.js');
});
