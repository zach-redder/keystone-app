import { StyleSheet } from 'react-native';

const btnColor1 = '#D4DE95';
const darkBg = '#2B2B2B';

const logActionButtonStyles = StyleSheet.create({
  logActionBtn: {
    backgroundColor: btnColor1,
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    borderRadius: 32,
    marginTop: 28,
    marginBottom: 28,
    width: '100%',
    minHeight: 62,
    marginLeft: 2,
    marginRight: 2,
    shadowColor: '#D4DE95',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 12,
    paddingHorizontal: 20,
  },
  logActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  logActionIcon: {
    color: darkBg,
    fontWeight: '900',
    fontSize: 26,
    marginRight: 10,
  },
  logActionText: {
    color: darkBg,
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  plusImage: {
    width: 30,
    height: 30,
    marginLeft: 12,
    marginRight: 16,
    resizeMode: 'contain',
  },
});

export default logActionButtonStyles;