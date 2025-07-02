import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center', // vertical
      alignItems: 'center',     // horizontal
      padding: 20,
      backgroundColor: '#2b2b2b',  // optional
    },
    contentContainer: {
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
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
      textAlign: 'center',
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
    },
    subtitle: {
      color: '#b3b3b3',
      fontSize: 18,
      textAlign: 'center',
      marginHorizontal: 30,
      marginTop: 20,
      marginBottom: 30,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    loadingText: {
      color: '#b3b3b3',
      marginLeft: 10,
      fontSize: 16,
    },
    resendButton: {
      backgroundColor: '#3C3C3C',
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 25,
      marginTop: 20,
    },
    disabledButton: {
      opacity: 0.7,
    },
    // New styles for WaitForEmailConfirmation
    emailText: {
      color: '#D4DE95',
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
    },
    description: {
      color: '#b3b3b3',
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 24,
    },
    errorContainer: {
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      width: '100%',
    },
    errorText: {
      color: '#ff6b6b',
      textAlign: 'center',
      fontSize: 16,
    },
    successContainer: {
      backgroundColor: 'rgba(212, 222, 149, 0.1)',
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      width: '100%',
    },
    successText: {
      color: '#D4DE95',
      textAlign: 'center',
      fontSize: 16,
    },
    buttonContainer: {
      width: '100%',
      gap: 15,
    },
    button: {
      width: '100%',
      paddingVertical: 15,
      borderRadius: 25,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: '#D4DE95',
      shadowColor: '#D4DE95',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 5,
    },
    secondaryButton: {
      backgroundColor: '#b3b3b3',
      borderWidth: 1,
    },
    secondaryButtonText: {
      color: '#2b2b2b',
    },
  });