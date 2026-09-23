import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '../constants/colors';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface Props {
  visible: boolean;
  value: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
  /** Allow picking dates after today (e.g. an expected completion date). Default false. */
  allowFuture?: boolean;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DatePickerModal({
  visible,
  value,
  onSelect,
  onClose,
  allowFuture = false,
}: Props) {
  const today = new Date();

  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());

  const days = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const goPrev = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const isNextDisabled =
    !allowFuture &&
    (viewYear > today.getFullYear() ||
      (viewYear === today.getFullYear() && viewMonth >= today.getMonth()));
  const goNext = () => {
    if (isNextDisabled) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleDayPress = (day: Date) => {
    if (!allowFuture && day > today) return; // future blocked
    onSelect(day);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Date</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goPrev} style={styles.navBtn}>
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity
              onPress={goNext}
              style={[styles.navBtn, isNextDisabled && styles.navBtnDisabled]}>
              <Text style={[styles.navBtnText, isNextDisabled && styles.navBtnTextDisabled]}>
                ›
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dayNames}>
            {DAY_NAMES.map(d => (
              <Text key={d} style={styles.dayName}>{d}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {days.map((day, i) => {
              if (!day) return <View key={`empty-${i}`} style={styles.cell} />;

              const isFuture = !allowFuture && day > today;
              const isSelected = sameDay(day, value);
              const isToday = sameDay(day, today);

              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={[styles.cell, isSelected && styles.cellSelected]}
                  onPress={() => handleDayPress(day)}
                  disabled={isFuture}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.cellText,
                      isFuture && styles.cellTextFuture,
                      isToday && !isSelected && styles.cellTextToday,
                      isSelected && styles.cellTextSelected,
                    ]}>
                    {day.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 24,
  },
  navBtnTextDisabled: {
    color: COLORS.muted,
  },
  monthLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  dayNames: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  cell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    backgroundColor: COLORS.accent,
    borderRadius: CELL_SIZE / 2,
    width: CELL_SIZE,
    alignSelf: 'center',
  },
  cellText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  cellTextFuture: {
    color: COLORS.muted,
    opacity: 0.35,
  },
  cellTextToday: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  cellTextSelected: {
    color: COLORS.bg,
    fontWeight: '700',
  },
});
