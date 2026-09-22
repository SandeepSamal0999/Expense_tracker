import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS } from '../constants/colors';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export interface DateRange {
  start: Date;
  end: Date;
}

interface Props {
  visible: boolean;
  /** Pre-selected range (optional) */
  value?: DateRange | null;
  onConfirm: (range: DateRange) => void;
  onClose: () => void;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function isBetween(d: Date, s: Date, e: Date): boolean {
  return d >= s && d <= e;
}

export default function DateRangePickerModal({
  visible,
  value,
  onConfirm,
  onClose,
}: Props) {
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Selection state: first tap sets rangeStart, second tap finalises rangeEnd
  const [rangeStart, setRangeStart] = useState<Date | null>(
    value?.start ?? null,
  );
  const [rangeEnd, setRangeEnd] = useState<Date | null>(value?.end ?? null);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');

  // Days grid for the current view month
  const days = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    // Pad to complete last week row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const goPrev = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const goNext = () => {
    const nextIsInFuture =
      viewYear > today.getFullYear() ||
      (viewYear === today.getFullYear() && viewMonth >= today.getMonth());
    if (nextIsInFuture) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const isNextDisabled =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  const handleDayPress = (day: Date) => {
    if (day > today) return; // future blocked

    if (selecting === 'start' || !rangeStart) {
      setRangeStart(startOfDay(day));
      setRangeEnd(null);
      setSelecting('end');
    } else {
      // Second tap
      if (day < rangeStart) {
        // Tapped earlier than start — swap
        setRangeEnd(endOfDay(rangeStart));
        setRangeStart(startOfDay(day));
      } else {
        setRangeEnd(endOfDay(day));
      }
      setSelecting('start');
    }
  };

  const handleConfirm = () => {
    if (!rangeStart) return;
    const end = rangeEnd ?? endOfDay(rangeStart); // single day
    onConfirm({ start: rangeStart, end });
    setSelecting('start');
  };

  const handleClear = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setSelecting('start');
  };

  // Label for the selection hint
  const hintText = !rangeStart
    ? 'Tap a date to start'
    : !rangeEnd
    ? 'Tap another date to set end (or confirm for a single day)'
    : formatLabel(rangeStart, rangeEnd);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Date / Range</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Hint */}
          <Text style={styles.hint}>{hintText}</Text>

          {/* Month navigator */}
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
              <Text
                style={[
                  styles.navBtnText,
                  isNextDisabled && styles.navBtnTextDisabled,
                ]}>
                ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* Day-name headers */}
          <View style={styles.dayNames}>
            {DAY_NAMES.map(d => (
              <Text key={d} style={styles.dayName}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.grid}>
            {days.map((day, i) => {
              if (!day) {
                return <View key={`empty-${i}`} style={styles.cell} />;
              }

              const isFuture = day > today;
              const isStart = rangeStart && sameDay(day, rangeStart);
              const isEnd = rangeEnd && sameDay(day, rangeEnd);
              const isInRange =
                rangeStart &&
                rangeEnd &&
                isBetween(startOfDay(day), rangeStart, rangeEnd) &&
                !isStart &&
                !isEnd;
              const isToday = sameDay(day, today);
              const isSingleDay =
                isStart && (!rangeEnd || sameDay(rangeStart!, rangeEnd));

              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={[
                    styles.cell,
                    isInRange && styles.cellInRange,
                    (isStart || isEnd) && styles.cellEndpoint,
                    isSingleDay && styles.cellSingle,
                  ]}
                  onPress={() => handleDayPress(day)}
                  disabled={isFuture}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.cellText,
                      isFuture && styles.cellTextFuture,
                      isToday && !isStart && !isEnd && styles.cellTextToday,
                      (isStart || isEnd) && styles.cellTextEndpoint,
                    ]}>
                    {day.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirm */}
          <TouchableOpacity
            style={[styles.confirmBtn, !rangeStart && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!rangeStart}
            activeOpacity={0.8}>
            <Text style={styles.confirmText}>
              {rangeEnd && !sameDay(rangeStart!, rangeEnd)
                ? 'Apply Range'
                : 'Apply Date'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function formatLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (sameDay(start, end)) return fmt(start);
  return `${fmt(start)} → ${fmt(end)}`;
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
    paddingBottom: 8,
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
  clearText: {
    color: COLORS.danger,
    fontSize: 14,
  },
  hint: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
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
    marginBottom: 20,
  },
  cell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellInRange: {
    backgroundColor: COLORS.accent + '18',
  },
  cellEndpoint: {
    backgroundColor: COLORS.accent,
    borderRadius: CELL_SIZE / 2,
    width: CELL_SIZE,
    alignSelf: 'center',
  },
  cellSingle: {
    borderRadius: CELL_SIZE / 2,
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
  cellTextEndpoint: {
    color: COLORS.bg,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: COLORS.accent,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
