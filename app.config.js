const suffix = process.env.APP_BUNDLE_ID_SUFFIX ?? "";
const bundleId = `com.hardwoodstudio.pickup${suffix}`;
const appName = suffix ? "pickup. (dev)" : "pickup.";

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: appName,
  slug: "pickup-nativewind-clean",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "pickup",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: bundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription:
        "We need access to your camera to take photos of basketball courts and share them with the community.",
      NSPhotoLibraryUsageDescription:
        "We need access to your photo library to upload photos of basketball courts.",
      NSPhotoLibraryAddUsageDescription:
        "We need access to save photos you take of basketball courts.",
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#ffffff",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: bundleId,
    permissions: ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"],
  },
  web: {
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-apple-authentication",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 320,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          image: "./assets/images/splash-icon-dark.png",
          backgroundColor: "#000000",
        },
      },
    ],
    "@maplibre/maplibre-react-native",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "4fb8ae84-2b89-4204-8d4a-c92a03c66f5a",
    },
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/4fb8ae84-2b89-4204-8d4a-c92a03c66f5a",
  },
};
