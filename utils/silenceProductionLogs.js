// Release builds have no use for diagnostic logs, and many of them (auth, onboarding, deep links)
// print account details. warn and error stay so real failures remain visible in device logs.
// Imported first in app/_layout.js so it takes effect before any other module logs at load time.
if (!__DEV__) {
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.debug = noop;
}
