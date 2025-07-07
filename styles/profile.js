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
    marginRight: 8,
  },
  profileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: '#ff4444',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 30,
    ...cardShadow,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  signOutIcon: {
    marginRight: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statItem: {
    backgroundColor: cardBg,
    borderRadius: cardRadius,
    padding: 24,
    flex: 1,
    alignItems: 'center',
    shadowColor: btnColor1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#4A4A4A',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 120,
    justifyContent: 'center',
  },
  statItemGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.8,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: btnColor1,
    marginBottom: 8,
    textShadowColor: btnColor1,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
});

export default profileStyles;
