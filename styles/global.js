import { StyleSheet } from 'react-native';

const horizontalPadding = 20;
const cardRadius = 16;
const cardBg = '#3C3C3C';
const btnColor1 = '#D4DE95';
const btnColor2 = '#B9C096';
const darkBg = '#2B2B2B';
const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.10,
  shadowRadius: 8,
  elevation: 3,
};

const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  darkContainer: {
    flex: 1,
    backgroundColor: '#18181b',
    padding: 20,
  },
  pageBg: {
    flex: 1,
    backgroundColor: darkBg,
    paddingHorizontal: horizontalPadding,
    paddingTop: 28,
    paddingBottom: 28,
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  header: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 24,
    color: '#222',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#23232a',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 16,
  },
});

export default globalStyles; 
