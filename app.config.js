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
      superwallApiKey: process.env.EXPO_PUBLIC_SUPERWALL_API_KEY,
    },
    scheme: "keystone",
    plugins: [
      [
        "expo-router",
        {
          origin: "https://thekeystoneapp.com",
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 26,
          },
          ios: {
            deploymentTarget: "15.1",
          },
        },
      ],
    ],
  };
};