import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { useApp } from '../../context/AppContext';
import { CategoryMeta } from '../../types';

interface Props {
  onBack: () => void;
}

export default function ManageCategoriesScreen({ onBack }: Props) {
  const { state, addCategory, updateCategory, deleteCategory } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<CategoryMeta | null>(null);
  const [inputName, setInputName] = useState('');
  const [inputEmoji, setInputEmoji] = useState('');

  const openAdd = () => {
    setEditing(null);
    setInputName('');
    setInputEmoji('');
    setModalVisible(true);
  };

  const openEdit = (cat: CategoryMeta) => {
    setEditing(cat);
    setInputName(cat.name);
    setInputEmoji(cat.emoji);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const name = inputName.trim();
    const emoji = inputEmoji.trim();
    if (!name) { Alert.alert('Error', 'Category name is required'); return; }
    if (!emoji) { Alert.alert('Error', 'Emoji is required'); return; }

    // Check duplicate (ignore self when editing)
    const duplicate = state.categories.find(
      c => c.name.toLowerCase() === name.toLowerCase() && c.name !== editing?.name,
    );
    if (duplicate) { Alert.alert('Error', 'A category with this name already exists'); return; }

    if (editing) {
      await updateCategory(editing.name, name, emoji);
    } else {
      await addCategory(name, emoji);
    }
    setModalVisible(false);
  };

  const handleDelete = (cat: CategoryMeta) => {
    Alert.alert(
      'Delete Category',
      `Delete "${cat.name}"? Existing transactions will keep this category name.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCategory(cat.name),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {state.categories.map(cat => (
          <View key={cat.name} style={styles.row}>
            <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
            <Text style={styles.emoji}>{cat.emoji}</Text>
            <Text style={styles.name}>{cat.name}</Text>
            {cat.isDefault && <Text style={styles.defaultBadge}>default</Text>}
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openEdit(cat)} style={styles.editBtn}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              {!cat.isDefault && (
                <TouchableOpacity onPress={() => handleDelete(cat)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editing ? 'Edit Category' : 'New Category'}
            </Text>

            <Text style={styles.inputLabel}>Emoji</Text>
            <TextInput
              style={styles.input}
              value={inputEmoji}
              onChangeText={setInputEmoji}
              placeholder="e.g. 🎓"
              placeholderTextColor={COLORS.muted}
              maxLength={4}
            />

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={inputName}
              onChangeText={setInputName}
              placeholder="e.g. Education"
              placeholderTextColor={COLORS.muted}
              maxLength={20}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: { padding: 4 },
  backText: { color: COLORS.accent, fontSize: 16 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  addBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  addText: { color: COLORS.bg, fontWeight: '700', fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  emoji: { fontSize: 20, marginRight: 10 },
  name: { color: COLORS.text, fontSize: 15, fontWeight: '500', flex: 1 },
  defaultBadge: {
    color: COLORS.muted,
    fontSize: 11,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editText: { color: COLORS.accent, fontSize: 13 },
  deleteBtn: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteText: { color: COLORS.danger, fontSize: 13 },
  overlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputLabel: { color: COLORS.muted, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    color: COLORS.text,
    fontSize: 16,
    padding: 14,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { color: COLORS.muted, fontSize: 15 },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { color: COLORS.bg, fontSize: 15, fontWeight: '700' },
});
