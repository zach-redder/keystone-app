import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { getPreferredReminderTime, updatePreferredReminderTime } from '../../services/userPreferences';
import CustomTimePicker from '../../app/onboarding/CustomTimePicker';
import keysStyles from '../../styles/keys';

const ReminderTimeModal = ({ visible, onClose, onTimeUpdated }) => {
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCurrentTime();
    }
  }, [visible]);

  const loadCurrentTime = async () => {
    try {
      const timeString = await getPreferredReminderTime();
      const time = parseTimeString(timeString);
      setSelectedTime(time);
    } catch (error) {
      console.error('Error loading reminder time:', error);
      // Set default to 9:00 AM
      const defaultTime = new Date();
      defaultTime.setHours(9, 0, 0, 0);
      setSelectedTime(defaultTime);
    }
  };

  const parseTimeString = (timeString) => {
    if (!timeString) {
      const defaultTime = new Date();
      defaultTime.setHours(9, 0, 0, 0);
      return defaultTime;
    }

    // Handle both 12-hour and 24-hour formats
    if (timeString.includes('AM') || timeString.includes('PM')) {
      // 12-hour format (e.g., "9:00 AM")
      const [time, period] = timeString.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      const minute = parseInt(minutes);

      if (period === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period === 'AM' && hour === 12) {
        hour = 0;
      }

      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      return date;
    } else {
      // 24-hour format (e.g., "09:00:00")
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return date;
    }
  };

  const formatTimeFor12Hour = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const displayMinute = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${ampm}`;
  };

  const formatTimeFor24Hour = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}:00`;
  };

  const handleTimeChange = (event, newTime) => {
    if (newTime) {
      setSelectedTime(newTime);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const time24h = formatTimeFor24Hour(selectedTime);
      const success = await updatePreferredReminderTime(time24h);
      
      if (success) {
        const time12h = formatTimeFor12Hour(selectedTime);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Notify parent component that time was updated
        if (onTimeUpdated) {
          onTimeUpdated(time12h);
        }
        
        onClose();
      } else {
        console.error('Failed to update reminder time');
      }
    } catch (error) {
      console.error('Error setting reminder time:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={keysStyles.infoModalContainer}>
        <View style={keysStyles.horizontalBar} />
        
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={keysStyles.infoSectionTitle}>Reminder Time</Text>
            <Text style={styles.subtitle}>Choose when you'd like to receive daily reminders</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
            <View style={styles.pickerSection}>
                <CustomTimePicker selectedTime={selectedTime} onTimeChange={handleTimeChange} />
            </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Time'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    paddingBottom: 20,
    paddingTop: 15,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 15,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(80, 80, 80, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 200,
  },
  spacer: {
    flex: 1,
  },
  pickerSection: {
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#B9C096',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
};

export default ReminderTimeModal;
