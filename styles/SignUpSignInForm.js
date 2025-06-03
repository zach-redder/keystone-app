import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center', // vertical
      alignItems: 'center',     // horizontal
      padding: 20,
      backgroundColor: '#fff',  // optional
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
    },
    input: {
      width: '100%',
      maxWidth: 350,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      padding: 10,
      marginBottom: 12,
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
  });