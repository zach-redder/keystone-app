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

const profileStyles = StyleSheet.create({
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
  header: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  proBadgeWrap: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: btnColor1,
    shadowColor: btnColor1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadge: {
    color: btnColor1,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  profileSection: {
    backgroundColor: cardBg,
    borderRadius: cardRadius,
    padding: 20,
    marginBottom: 20,
    ...cardShadow,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  profileItemLast: {
    borderBottomWidth: 0,
  },
  profileItemIcon: {
    marginRight: 15,
  },
  profileItemText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  profileItemValue: {
    fontSize: 14,
    color: '#888',
  },
  signOutButton: {
    backgroundColor: '#ff4444',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 30,
    ...cardShadow,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    backgroundColor: cardBg,
    borderRadius: cardRadius,
    padding: 20,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    ...cardShadow,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: btnColor1,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

export default profileStyles;
