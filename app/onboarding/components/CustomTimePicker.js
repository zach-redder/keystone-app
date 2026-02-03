import { View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { styles } from '../../../styles/onboarding';

export default function CustomTimePicker({ selectedTime, onTimeChange }) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55

  const handleHourChange = (hour) => {
    const newTime = new Date(selectedTime);
    const currentHours = newTime.getHours();
    const isPm = currentHours >= 12;
    newTime.setHours(isPm ? hour % 12 + 12 : hour % 12); // Maintain current AM/PM
    onTimeChange(null, newTime);
  };

  const handleMinuteChange = (minute) => {
    const newTime = new Date(selectedTime);
    newTime.setMinutes(minute);
    onTimeChange(null, newTime);
  };

  const handleAmPmChange = (amPm) => {
    const newTime = new Date(selectedTime);
    const currentHours = newTime.getHours();
    if (amPm === 'AM' && currentHours >= 12) {
      newTime.setHours(currentHours - 12);
    } else if (amPm === 'PM' && currentHours < 12) {
      newTime.setHours(currentHours + 12);
    }
    onTimeChange(null, newTime);
  };

  const isPm = selectedTime.getHours() >= 12;
  const displayHour = selectedTime.getHours() % 12 || 12; // Convert 0 to 12 for display

  return (
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={displayHour}
        onValueChange={handleHourChange}
        style={styles.picker}
        itemStyle={{ color: '#ffffff' }}
      >
        {hours.map((hour) => (
          <Picker.Item key={hour} label={hour.toString()} value={hour} style={styles.pickerItem} />
        ))}
      </Picker>
      <Picker
        selectedValue={selectedTime.getMinutes()}
        onValueChange={handleMinuteChange}
        style={styles.picker}
        itemStyle={{ color: '#ffffff' }}
      >
        {minutes.map((minute) => (
          <Picker.Item key={minute} label={minute.toString().padStart(2, '0')} value={minute} style={styles.pickerItem} />
        ))}
      </Picker>
      <Picker
        selectedValue={isPm ? 'PM' : 'AM'}
        onValueChange={handleAmPmChange}
        style={styles.picker}
        itemStyle={{ color: '#ffffff' }}
      >
        <Picker.Item label="AM" value="AM" style={styles.pickerItem} />
        <Picker.Item label="PM" value="PM" style={styles.pickerItem} />
      </Picker>
    </View>
  );
};