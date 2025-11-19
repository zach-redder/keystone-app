import { StyleSheet } from 'react-native';

const menuStyles = StyleSheet.create({
  blurView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(80, 80, 80, 0.45)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    paddingVertical: 6,
    paddingHorizontal: 0,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
    marginLeft: 4,
    marginRight: 4,
  },
  itemActive: {
    backgroundColor: '#3C3C3C',
    borderRadius: 10,
  },
  icon: {
    width: 32,
    height: 32,
    marginRight: 12,
    marginLeft: 2,
    paddingTop: 4,
    resizeMode: 'contain',
  },
  label: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default menuStyles;
