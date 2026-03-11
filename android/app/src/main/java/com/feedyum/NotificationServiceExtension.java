package com.feedyum;

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
