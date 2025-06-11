import { StyleSheet, Dimensions } from 'react-native';
import globalStyles from './global';

export const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    ...globalStyles.pageBg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
    position: 'relative',
    flex: 1,
    gap: 12,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  logoWrapper: {
    shadowColor: '#D4DE95',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
    borderRadius: 80,
    padding: 10,
    backgroundColor: 'rgba(212, 222, 149, 0.07)',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  title: {
    ...globalStyles.title,
    color: '#ffffff',
    fontSize: 26,
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 17,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#D4DE95',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#2b2b2b',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
