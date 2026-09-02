const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// AppCheckCore is pulled in transitively by the GoogleSignIn CocoaPod
// (via @react-native-google-signin/google-signin). It's a Swift pod that
// requires GoogleUtilities and RecaptchaInterop to define modules, but
// neither does by default when built as static libraries, which fails
// `pod install` with:
//   "The Swift pod `AppCheckCore` depends upon `GoogleUtilities` and
//   `RecaptchaInterop`, which do not define modules."
// This forces modular headers for just those two pods, as suggested by
// the CocoaPods error itself.
const PODS_REQUIRING_MODULAR_HEADERS = ['GoogleUtilities', 'RecaptchaInterop'];

function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      const linesToAdd = PODS_REQUIRING_MODULAR_HEADERS.filter(
        (name) => !contents.includes(`pod '${name}', :modular_headers => true`)
      ).map((name) => `  pod '${name}', :modular_headers => true`);

      if (linesToAdd.length > 0) {
        contents = contents.replace(
          'use_expo_modules!',
          `use_expo_modules!\n\n${linesToAdd.join('\n')}`
        );
        fs.writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);
}

module.exports = withModularHeaders;
