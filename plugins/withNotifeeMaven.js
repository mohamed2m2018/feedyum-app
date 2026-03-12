const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin: Notifee Maven Repository
 * 
 * Adds the local Maven repository for @notifee/react-native to the
 * project-level build.gradle. This ensures Gradle can resolve the
 * `app.notifee:core` dependency during Android builds.
 * 
 * This plugin survives `npx expo prebuild --clean` since it modifies
 * the generated build.gradle during the prebuild process.
 */
module.exports = function withNotifeeMaven(config) {
  return withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    const mavenLine = `        maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }`;

    // Only add if not already present
    if (!buildGradle.includes('@notifee/react-native/android/libs')) {
      // Insert after the jitpack maven line, or after mavenCentral() in allprojects
      config.modResults.contents = buildGradle.replace(
        /maven\s*\{\s*url\s*'https:\/\/www\.jitpack\.io'\s*\}/,
        `maven { url 'https://www.jitpack.io' }\n${mavenLine}`
      );
      console.log('[withNotifeeMaven] Added Notifee Maven repository to build.gradle');
    }

    return config;
  });
};
