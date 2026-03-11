const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin: OneSignal Order Alarm Channel
 * 
 * This plugin:
 * 1. Creates a NotificationServiceExtension.java that intercepts OneSignal
 *    notifications and routes order alerts to the high-priority alarm channel
 * 2. Registers the extension in AndroidManifest.xml via meta-data
 * 
 * This ensures that order notifications play the alarm sound and appear
 * as heads-up banners, while all other notifications use the default channel.
 */

const NOTIFICATION_EXTENSION_JAVA = `package com.feedyum;

import android.util.Log;
import androidx.annotation.Keep;
import com.onesignal.notifications.IDisplayableMutableNotification;
import com.onesignal.notifications.INotificationReceivedEvent;
import com.onesignal.notifications.INotificationServiceExtension;
import org.json.JSONObject;

/**
 * Intercepts OneSignal notifications before display.
 * Routes order alerts to the high-priority alarm channel (order_alarm_channel).
 * All other notifications use OneSignal's default channel.
 */
@Keep
public class NotificationServiceExtension implements INotificationServiceExtension {
    private static final String TAG = "FeedYumNotifExt";

    @Override
    public void onNotificationReceived(INotificationReceivedEvent event) {
        IDisplayableMutableNotification notification = event.getNotification();
        JSONObject data = notification.getAdditionalData();
        
        Log.d(TAG, "Notification received: " + notification.getTitle());
        
        if (data != null) {
            String alarmType = data.optString("alarmType", "");
            String type = data.optString("type", "");
            
            Log.d(TAG, "alarmType=" + alarmType + " type=" + type);
            
            // Only route order alarms to the high-priority channel
            if ("newOrder".equals(alarmType) || "chefDashboard".equals(type)) {
                Log.d(TAG, "Routing to order_alarm_channel");
                notification.setExtender(builder -> {
                    builder.setChannelId("order_alarm_channel");
                    return builder;
                });
            }
        }
    }
}
`;

// Step 1: Write the Java file during prebuild
function withNotificationServiceExtension(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const javaDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        'com',
        'feedyum'
      );

      // Ensure directory exists
      fs.mkdirSync(javaDir, { recursive: true });

      // Write the Java file
      const javaFilePath = path.join(javaDir, 'NotificationServiceExtension.java');
      fs.writeFileSync(javaFilePath, NOTIFICATION_EXTENSION_JAVA);
      console.log('[onesignal-alarm-plugin] Created NotificationServiceExtension.java');

      return config;
    },
  ]);
}

// Step 2: Register the extension in AndroidManifest.xml
function withManifestMetaData(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];

    if (!application) return config;

    // Ensure meta-data array exists
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    // Check if already added
    const metaDataKey = 'com.onesignal.NotificationServiceExtension';
    const existing = application['meta-data'].find(
      (item) => item.$?.['android:name'] === metaDataKey
    );

    if (!existing) {
      application['meta-data'].push({
        $: {
          'android:name': metaDataKey,
          'android:value': 'com.feedyum.NotificationServiceExtension',
        },
      });
      console.log('[onesignal-alarm-plugin] Added NotificationServiceExtension meta-data to AndroidManifest');
    }

    return config;
  });
}

// Combined plugin
module.exports = function withOrderAlarmChannel(config) {
  config = withNotificationServiceExtension(config);
  config = withManifestMetaData(config);
  return config;
};
