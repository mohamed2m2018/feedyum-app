#!/bin/bash
# =============================================================================
# post-prebuild-restore.sh
# 
# Automatically restores custom native assets after `npx expo prebuild`.
# This is necessary because prebuild deletes and regenerates the android/
# directory, overwriting any manually customized icons, colors, or sounds.
#
# Run this after every prebuild:
#   npx expo prebuild && ./scripts/post-prebuild-restore.sh
#
# Or it runs automatically via the npm "postprebuild" hook.
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RES_DIR="$PROJECT_DIR/android/app/src/main/res"
BRAND_DIR="$PROJECT_DIR/brand-assets"

echo "🔧 Post-prebuild asset restoration starting..."

# --- 1. Fix icon background color (prebuild sets it to app.json's adaptiveIcon.backgroundColor) ---
echo "  ✅ Fixing iconBackground color to #C0392B..."
if [ -f "$RES_DIR/values/colors.xml" ]; then
  sed -i '' 's|<color name="iconBackground">#FF4D67</color>|<color name="iconBackground">#C0392B</color>|g' "$RES_DIR/values/colors.xml"
fi

# --- 2. Remove conflicting .webp icon files (prebuild generates these, they override our .png) ---
echo "  ✅ Removing generated .webp icon files..."
find "$RES_DIR"/mipmap-* -name "*.webp" -delete 2>/dev/null || true

# --- 3. Remove monochrome icon references (causes themed icon issues on Android 16+) ---
echo "  ✅ Removing monochrome icon references..."
for XML_FILE in "$RES_DIR/mipmap-anydpi-v26/ic_launcher.xml" "$RES_DIR/mipmap-anydpi-v26/ic_launcher_round.xml"; do
  if [ -f "$XML_FILE" ]; then
    sed -i '' '/<monochrome/d' "$XML_FILE"
  fi
done

# --- 4. Restore alarm ringtone to native resources ---
echo "  ✅ Restoring alarm ringtone..."
mkdir -p "$RES_DIR/raw"
if [ -f "$PROJECT_DIR/assets/sounds/ringtone.mp3" ]; then
  cp "$PROJECT_DIR/assets/sounds/ringtone.mp3" "$RES_DIR/raw/alarm_ringtone.mp3"
fi

# --- 5. Restore brand icon PNGs from brand-assets (if they exist) ---
if [ -d "$BRAND_DIR/mipmap" ]; then
  echo "  ✅ Restoring brand icon PNGs..."
  for DENSITY_DIR in "$BRAND_DIR"/mipmap-*; do
    DENSITY=$(basename "$DENSITY_DIR")
    if [ -d "$RES_DIR/$DENSITY" ]; then
      cp -f "$DENSITY_DIR"/* "$RES_DIR/$DENSITY/" 2>/dev/null || true
    fi
  done
fi

# --- 6. Restore local.properties (SDK path) ---
if [ ! -f "$PROJECT_DIR/android/local.properties" ]; then
  echo "  ✅ Restoring local.properties..."
  echo "sdk.dir=$HOME/Library/Android/sdk" > "$PROJECT_DIR/android/local.properties"
fi

echo "✅ Post-prebuild restoration complete!"
