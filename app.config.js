const withModularHeaders = require("./plugins/withModularHeaders");

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      eas: {
        projectId: "dcae90a0-8eb4-4fe0-b8d0-e50c0989c2e3"
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      // Superwall removed
    },
    scheme: "keystone",
    plugins: [
      // Preserve plugins declared in app.json (google-signin, apple-authentication) —
      // this array used to overwrite them entirely instead of merging.
      ...(config.plugins || []),
      [
        "expo-router",
        {
          origin: "https://thekeystoneapp.com",
        },
      ],
      withModularHeaders,
      [
        "@config-plugins/react-native-webrtc",
        {
          microphonePermission: "Keystone listens through your microphone when you talk to your AI companion.",
          // The plugin always writes a camera string; voice mode never opens the camera
          cameraPermission: "Keystone does not use the camera.",
        },
      ],
    ],
  };
};