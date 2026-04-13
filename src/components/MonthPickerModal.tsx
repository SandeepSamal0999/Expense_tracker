import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../constants/colors';

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface Props {
  visible: boolean;
  selectedMonth: number; // 0-indexed
  selectedYear: number;
  onSelect: (month: number, year: number) => void;
  onClose: () => void;
}

export default function MonthPickerModal({
  visible,
  selectedMonth,
  selectedYear,
  onSelect,
  onClose,
}: Props) {
  const now = new Date();
  const [year, setYear] = useState(selectedYear);

  // Sync local year when the modal opens with a new selectedYear
  useEffect(() => {
    if (visible) setYear(selectedYear);
  }, [visible, selectedYear]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}>
        {/* Inner card — tap here should NOT close the modal */}
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          <Text style={styles.heading}>Select Month</Text>

          {/* Year row */}
          <View style={styles.yearRow}>
            <TouchableOpacity
              style={styles.yearArrowBtn}
              onPress={() => setYear(y => y - 1)}>
              <Text style={styles.yearArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.yearLabel}>{year}</Text>
            <TouchableOpacity
              style={styles.yearArrowBtn}
              onPress={() => setYear(y => y + 1)}
              disabled={year >= now.getFullYear()}>
              <Text
                style={[
                  styles.yearArrow,
                  year >= now.getFullYear() && styles.arrowDisabled,
                ]}>
                ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* 4 × 3 month grid */}
          <View style={styles.grid}>
            {MONTH_NAMES.map((m, i) => {
              const isFuture =
                year === now.getFullYear() && i > now.getMonth();
              const isSelected =
                i === selectedMonth && year === selectedYear;
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.monthBtn,
                    isSelected && styles.monthBtnSelected,
                    isFuture && styles.monthBtnDisabled,
                  ]}
                  disabled={isFuture}
                  onPress={() => {
                    onSelect(i, year);
                    onClose();
                  }}>
                  <Text
                    style={[
                      styles.monthText,
                      isSelected && styles.monthTextSelected,
                      isFuture && styles.monthTextDisabled,
                    ]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000090',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    padding: 24,
    width: '100%',
  },
  heading: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 24,
  },
  yearArrowBtn: {
    padding: 8,
  },
  yearArrow: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
  },
  arrowDisabled: {
    color: COLORS.muted,
  },
  yearLabel: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  monthBtn: {
    width: '22%',
    aspectRatio: 1.6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBtnSelected: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  monthBtnDisabled: {
    opacity: 0.3,
  },
  monthText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  monthTextSelected: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  monthTextDisabled: {
    color: COLORS.muted,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    color: COLORS.muted,
    fontSize: 14,
  },
});
