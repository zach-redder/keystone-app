import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center', // vertical
      alignItems: 'center',     // horizontal
      padding: 20,
      backgroundColor: '#2b2b2b',  // optional
    },
    logo: {
      width: 100,
      height: 100,
      marginBottom: 25,
    },
    title: {
      fontSize: 28,
      marginBottom: 35,
      color: '#fff',
      fontWeight: 'bold',
    },
    input: {
      width: '100%',
      maxWidth: 350,
      backgroundColor: '#3c3c3c',
      borderRadius: 15,
      padding: 20,
      marginBottom: 20,
      color: '#fff',
      fontSize: 18,
    },
    error: {
      color: 'red',
      marginBottom: 10,
    },
    toggle: {
      marginTop: 20,
      color: '#007aff',
      textDecorationLine: 'underline',
    },
    registerButton: {
      backgroundColor: '#D4DE95',
      paddingVertical: 20,
      paddingHorizontal: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      marginBottom: 40,
      shadowColor: '#D4DE95',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 20,
      elevation: 10,
    },
    buttonText: {
      color: '#2b2b2b',
      fontSize: 18,
      fontWeight: 'bold',
    },
    dividerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
      marginBottom: 40,
    },
    divider: {
      width: '38%',
      height: 1,
      backgroundColor: '#fff',  
    },
    orText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    socialContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 15,
    },
    signInSocialContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 15,
      marginBottom: 75,
    },
    socialButton: {
      backgroundColor: '#2b2b2b',
      borderWidth: 1,
      borderColor: '#fff',
      padding: 10,
      borderRadius: 8,
      marginHorizontal: 10,
    },
    socialIcon: {
      width: 50,
      height: 50,
    }
  });