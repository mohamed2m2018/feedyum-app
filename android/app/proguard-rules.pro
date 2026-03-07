# =============================================================================
# FeedYum ProGuard/R8 Rules — Security Hardening
# =============================================================================

# ─── React Native Core ───────────────────────────────────────────────────────
-keep,allowobfuscation class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.modules.** { *; }
-keep class com.facebook.react.views.** { *; }
-keep class com.facebook.react.animated.** { *; }
-keep class com.facebook.react.devsupport.** { *; }

# Keep all native methods
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
    @com.facebook.react.uimanager.annotations.ReactProp *;
    @com.facebook.react.uimanager.annotations.ReactPropGroup *;
}
-keepclassmembers class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keepclassmembers class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers class * { @com.facebook.proguard.annotations.DoNotStrip *; }
-keepclassmembers class * { @com.facebook.proguard.annotations.KeepGettersAndSetters *; }

# ─── Hermes Engine ───────────────────────────────────────────────────────────
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.hermes.intl.** { *; }

# ─── react-native-reanimated ─────────────────────────────────────────────────
-keep class com.swmansion.reanimated.** { *; }

# ─── react-native-gesture-handler ────────────────────────────────────────────
-keep class com.swmansion.gesturehandler.** { *; }

# ─── react-native-screens ────────────────────────────────────────────────────
-keep class com.swmansion.rnscreens.** { *; }

# ─── Expo Modules ────────────────────────────────────────────────────────────
-keep class expo.modules.** { *; }
-keep class com.facebook.react.ReactPackage { *; }

# ─── Firebase ────────────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class io.invertase.firebase.** { *; }
-dontwarn com.google.firebase.**

# ─── Google Play Services ────────────────────────────────────────────────────
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# ─── Google Mobile Ads ───────────────────────────────────────────────────────
-keep class com.google.android.gms.ads.** { *; }

# ─── OkHttp / Networking ────────────────────────────────────────────────────
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**

# ─── Socket.io ───────────────────────────────────────────────────────────────
-keep class io.socket.** { *; }
-dontwarn io.socket.**

# ─── Stripe ──────────────────────────────────────────────────────────────────
-keep class com.stripe.** { *; }
-dontwarn com.stripe.**

# ─── AsyncStorage ────────────────────────────────────────────────────────────
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# ─── React Navigation ───────────────────────────────────────────────────────
-keep class com.reactnavigation.** { *; }

# ─── Video Player ────────────────────────────────────────────────────────────
-keep class com.brentvatne.react.** { *; }
-keep class com.google.android.exoplayer2.** { *; }
-dontwarn com.google.android.exoplayer2.**

# ─── Image Libraries ────────────────────────────────────────────────────────
-keep class com.facebook.fresco.** { *; }
-keep class com.facebook.imagepipeline.** { *; }
-keep class com.bumptech.glide.** { *; }
-dontwarn com.bumptech.glide.**

# ─── Segment Analytics ──────────────────────────────────────────────────────
-keep class com.segment.** { *; }
-dontwarn com.segment.**

# ─── General: Keep annotations ──────────────────────────────────────────────
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes SourceFile,LineNumberTable
-keepattributes InnerClasses,EnclosingMethod
-keepattributes RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations

# ─── General: Keep enums ────────────────────────────────────────────────────
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ─── General: Keep Parcelables ──────────────────────────────────────────────
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}

# ─── General: Keep Serializable ─────────────────────────────────────────────
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ─── Suppress Warnings ──────────────────────────────────────────────────────
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
-dontwarn java.beans.**
-dontwarn javax.naming.**
