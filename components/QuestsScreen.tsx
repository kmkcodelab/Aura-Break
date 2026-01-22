import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Dimensions, Keyboard 
} from 'react-native';
import { Check, Plus, Trash2, Edit2, Video, TrendingUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface DayStats {
  date: string;
  created: number;
  completed: number;
}

interface Props {
  tasks: Task[];
  dailySlotLimit: number;
  history: DayStats[];
  onUpdateTasks: (t: Task[]) => void;
  onRequestReward: () => void;
}

export const QuestsScreen: React.FC<Props> = ({ 
  tasks, dailySlotLimit, history, onUpdateTasks, onRequestReward 
}) => {
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const toggleTask = (id: string) => {
    onUpdateTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // এডিট ও ডিলিট লজিক (টিক দেওয়া থাকলে আগে আনটিক হবে)
  const handleTaskAction = (task: Task, action: 'edit' | 'delete') => {
    if (task.completed) {
      // যদি কাজ শেষ হয়ে থাকে (Checked), তবে প্রথমে আনটিক হবে
      toggleTask(task.id);
    } else {
      // যদি কাজ বাকি থাকে (Unchecked), তবে অ্যাকশন কাজ করবে
      if (action === 'delete') {
        onUpdateTasks(tasks.filter(t => t.id !== task.id));
      } else {
        setEditingId(task.id);
        setEditValue(task.text);
      }
    }
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdateTasks(tasks.map(t => t.id === editingId ? { ...t, text: editValue } : t));
      setEditingId(null);
      Keyboard.dismiss();
    }
  };

  const attemptAddTask = () => {
    if (!newText.trim()) return;
    const newTask = { id: Date.now().toString(), text: newText, completed: false };
    onUpdateTasks([...tasks, newTask]);
    setNewText('');
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <Text style={styles.title}>Daily Wins</Text>
        <View style={styles.slotIndicator}>
          {[...Array(dailySlotLimit)].map((_, i) => (
            <View key={i} style={[styles.dot, i < tasks.length ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
      </View>

      {/* TASK LIST */}
      <View style={styles.taskList}>
        {tasks.map((task) => (
          <View key={task.id} style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
            <TouchableOpacity onPress={() => toggleTask(task.id)} style={[styles.checkBox, task.completed && styles.checkActive]}>
              {task.completed && <Check size={14} color="#0F172A" strokeWidth={4} />}
            </TouchableOpacity>

            {editingId === task.id ? (
              <View style={styles.editWrapper}>
                <TextInput 
                  style={styles.editInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  autoFocus
                />
                <TouchableOpacity onPress={saveEdit}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={[styles.taskText, task.completed && styles.strikeThrough]}>{task.text}</Text>
            )}

            {editingId !== task.id && (
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => handleTaskAction(task, 'edit')} style={styles.actionBtn}>
                  <Edit2 size={16} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleTaskAction(task, 'delete')} style={styles.actionBtn}>
                  <Trash2 size={16} color="#EF4444" opacity={0.7} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* ADD TASK INPUT OR UNLOCK BUTTON */}
        {tasks.length < dailySlotLimit ? (
          <View style={styles.inputCard}>
            <TextInput 
              style={styles.input}
              placeholder="Next win for today..."
              placeholderTextColor="#475569"
              value={newText}
              onChangeText={setNewText}
            />
            <TouchableOpacity onPress={attemptAddTask} style={styles.plusBtn}>
              <Plus size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={onRequestReward} style={styles.unlockBtn}>
            <Video size={18} color="#2DD4BF" />
            <Text style={styles.unlockText}>WATCH VIDEO TO UNLOCK 2 SLOTS (AD)</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 7-DAY HISTORY SECTION */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <TrendingUp size={18} color="#2DD4BF" />
          <Text style={styles.historyTitle}>7-Day History</Text>
        </View>

        {history.length === 0 ? (
          <Text style={styles.emptyHistory}>No history yet. Start winning today!</Text>
        ) : (
          history.slice().reverse().map((day, idx) => (
            <View key={idx} style={styles.historyRow}>
              <Text style={styles.historyDate}>{day.date}</Text>
              <View style={styles.historyStats}>
                <Text style={styles.historyCount}>{day.completed}/{day.created} Wins</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { width: `${day.created > 0 ? (day.completed / day.created) * 100 : 0}%` }]} 
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  slotIndicator: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#2DD4BF' },
  dotInactive: { backgroundColor: '#1E293B' },
  taskList: { gap: 12 },
  taskCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    padding: 18, 
    borderRadius: 25, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.05)' 
  },
  taskCardCompleted: { opacity: 0.5, backgroundColor: 'rgba(45, 212, 191, 0.05)' },
  checkBox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: '#2DD4BF', borderColor: '#2DD4BF' },
  taskText: { flex: 1, color: 'white', fontSize: 15, fontWeight: '600', marginLeft: 15 },
  strikeThrough: { textDecorationLine: 'line-through', color: '#94A3B8' },
  actionRow: { flexDirection: 'row', gap: 5 },
  actionBtn: { padding: 8 },
  editWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 15 },
  editInput: { flex: 1, color: 'white', borderBottomWidth: 1, borderColor: '#2DD4BF', paddingVertical: 2 },
  saveText: { color: '#2DD4BF', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  inputCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    padding: 10, 
    paddingLeft: 20, 
    borderRadius: 25, 
    borderWidth: 1, 
    borderColor: 'rgba(45, 212, 191, 0.1)' 
  },
  input: { flex: 1, color: 'white', fontSize: 15 },
  plusBtn: { backgroundColor: '#2DD4BF', width: 45, height: 45, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  unlockBtn: { 
    width: '100%', 
    padding: 20, 
    borderRadius: 25, 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    borderColor: '#2DD4BF', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12 
  },
  unlockText: { color: '#2DD4BF', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  historySection: { marginTop: 40 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  historyTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  historyRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.02)', 
    padding: 15, 
    borderRadius: 20, 
    marginBottom: 8 
  },
  historyDate: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  historyStats: { alignItems: 'flex-end', gap: 5 },
  historyCount: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  progressBar: { width: 80, height: 4, backgroundColor: '#1E293B', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2DD4BF' },
  emptyHistory: { color: '#475569', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 10 }
});
