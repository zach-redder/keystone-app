import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StreakCounter = ({ activeDays = [], dailyActivityCounts = {} }) => {
  // Generate the last 6 months (approximately 168 days to ensure exactly 6 months)
  const generateDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 188; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().slice(0, 10);
      const activityCount = dailyActivityCounts[dayStr] || 0;
      days.push({
        date: dayStr,
        isActive: activeDays.includes(dayStr),
        activityCount: activityCount
      });
    }
    
    return days;
  };

  const days = generateDays();
  
  // Group days into weeks (7 rows, one for each day of the week)
  const weeks = [];
  for (let i = 0; i < 7; i++) {
    const weekDays = [];
    for (let j = i; j < days.length; j += 7) {
      weekDays.push(days[j]);
    }
    weeks.push(weekDays);
  }

  // Get month labels positioned correctly for the grid
  const getMonthLabels = () => {
    const months = [];
    let currentMonth = '';
    
    // Find the first occurrence of each month
    days.forEach((day, index) => {
      const date = new Date(day.date);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      
      if (month !== currentMonth) {
        currentMonth = month;
        // Calculate position based on the column index
        const columnIndex = Math.floor(index / 7);
        months.push({ 
          month, 
          columnIndex,
          position: columnIndex
        });
      }
    });
    return months;
  };

  // Get the appropriate color based on activity count
  const getActivityColor = (day) => {
    if (!day.isActive) return '#2a2a2a'; // Inactive
    
    const count = day.activityCount;
    if (count >= 5) return '#D4DE95'; // Full green for 5+ activities
    if (count >= 3) return '#6a7a5a'; // Medium green for 3-4 activities
    if (count >= 1) return '#4a5a3a'; // Light green for 1-2 activities
    return '#2a2a2a'; // Fallback
  };

  const monthLabels = getMonthLabels();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity Calendar</Text>
      
      {/* Month labels positioned above the grid */}
      <View style={styles.monthLabelsContainer}>
        {monthLabels.map((label, index) => {
          // Calculate position based on the actual grid columns
          const totalColumns = weeks[0]?.length || 1;
          const columnWidth = 100 / totalColumns;
          
          // Adjust positioning for better visual alignment
          let percentagePosition;
          if (index === monthLabels.length - 1) {
            // Last month: position it to align with the right edge of the grid
            percentagePosition = 100 - (columnWidth / 2);
          } else {
            // Other months: center on their column
            percentagePosition = (label.position + 0.5) * columnWidth;
          }
          
          return (
            <Text 
              key={index} 
              style={[
                styles.monthLabel,
                { 
                  left: `${percentagePosition}%`,
                  transform: [{ translateX: -50 }] // Center the text on its position
                }
              ]}
            >
              {label.month}
            </Text>
          );
        })}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.calendarContainer}>
        {/* Calendar grid */}
        <View style={styles.grid}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.week}>
              {week.map((day, dayIndex) => (
                <View
                  key={dayIndex}
                  style={[
                    styles.day,
                    { backgroundColor: getActivityColor(day) }
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={styles.legendSquares}>
          <View style={[styles.legendSquare, styles.legendInactive]} />
          <View style={[styles.legendSquare, styles.legendLow]} />
          <View style={[styles.legendSquare, styles.legendMedium]} />
          <View style={[styles.legendSquare, styles.legendHigh]} />
        </View>
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#3C3C3C',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  monthLabelsContainer: {
    position: 'relative',
    height: 20,
    marginBottom: 8,
    width: '100%',
    paddingLeft: 0, // Ensure no extra padding
  },
  monthLabel: {
    color: '#888',
    fontSize: 12,
    position: 'absolute',
    top: 0,
    transform: [{ translateX: -50 }], // Center the text on its position
    whiteSpace: 'nowrap', // Prevent text wrapping
  },
  calendarContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  grid: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  week: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  day: {
    width: 10,
    height: 10,
    marginRight: 2,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendText: {
    color: '#888',
    fontSize: 12,
    marginHorizontal: 8,
  },
  legendSquares: {
    flexDirection: 'row',
  },
  legendSquare: {
    width: 10,
    height: 10,
    marginRight: 2,
    borderRadius: 2,
  },
  legendInactive: {
    backgroundColor: '#2a2a2a',
  },
  legendLow: {
    backgroundColor: '#4a5a3a',
  },
  legendMedium: {
    backgroundColor: '#6a7a5a',
  },
  legendHigh: {
    backgroundColor: '#D4DE95',
  },
});

export default StreakCounter; 