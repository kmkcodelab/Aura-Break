import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Dimensions, Keyboard, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Send, Calendar, Star, ChevronDown, ChevronUp, Video } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// মুড আইকন কনস্ট্যান্টস
const MOOD_OPTIONS = {
  Great: '✨',
  Good: '😊',
  Neutral: '😐',
  Productive: '🚀',
  Tired: '😴'
};

interface Reflection {
  id: string;
  date: string;
  mood: string;
  gratitude: string;
  timestamp: number;
}

interface Props {
  reflections: Reflection[];
  moodSlots: number;
  onUpdateReflections: (r: Reflection[]) => void;
  onSaveAction: () => void; // Interstitial Ad ট্রিগার করার জন্য
  onRequestReward: () => void; // মুড স্লট বাড়ানোর জন্য
}

export const ReflectionScreen: React.FC<Props> = ({ 
  reflections, moodSlots, onUpdateReflections, onSaveAction, onRequestReward 
}) => {
  const [mood, setMood] = useState<string | null>(null);
  const [gratitude, setGratitude] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // আজকের কয়টি মুড সেভ করা হয়েছে তা ক্যালকুলেট করা
  const today = new Date().toLocaleDateString();
  const reflectionsToday = reflections.filter(r => r.date === today).length;

  const saveReflection = () => {
    if (!mood || !gratitude.trim()) return;

    const newReflection: Reflection = {
      id: Date.now().toString(),
      date: today,
      mood: mood,
      gratitude: gratitude.trim(),
      timestamp: Date.now()
    };

    onUpdateReflections([newReflection, ...reflections]);
    setMood(null);
    setGratitude('');
    Keyboard.dismiss();
    
    // মুড সেভ করার পর ইন্টারস্টিশিয়াল অ্যাড দেখানো হবে
    onSaveAction();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* DAILY CHECK-IN SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.title}>Daily Check-in</Text>
            <Text style={styles.slotCount}>{reflectionsToday}/{moodSlots} Moods</Text>
          </View>

          {/* MOOD SELECTOR */}
          <View style={styles.moodGrid}>
            {Object.entries(MOOD_OPTIONS).map(([label, emoji]) => (
              <TouchableOpacity 
                key={label}
                onPress={() => setMood(label)}
                style={[styles.moodBtn, mood === label && styles.moodBtnActive]}
              >
                <Text style={styles.moodEmoji}>{emoji}</Text>
                <Text style={styles.moodLabel}>{label.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* INPUT CARD - স্লট বাকি থাকলে ইনপুট দেখাবে, নাহলে অ্যাড বাটন */}
          {reflectionsToday < moodSlots ? (
            <View style={styles.inputCard}>
              <Text style={styles.inputHint}>Today I'm grateful for...</Text>
              <TextInput 
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Capture a positive moment..."
                placeholderTextColor="#475569"
                value={gratitude}
                onChangeText={setGratitude}
                selectionColor="#2DD4BF"
              />
              <TouchableOpacity 
                onPress={saveReflection}
                disabled={!mood || !gratitude.trim()}
                style={[styles.saveBtn, (!mood || !gratitude.trim()) && styles.saveBtnDisabled]}
              >
                <Send size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={onRequestReward} style={styles.unlockBtn}>
              <Video size={20} color="#2DD4BF" />
              <Text style={styles.unlockText}>WATCH VIDEO TO LOG MORE MOODS (AD)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* PREVIOUS REFLECTIONS HISTORY */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Calendar size={18} color="#2DD4BF" />
            <Text style={styles.historyTitle}>Memories</Text>
          </View>

          {reflections.length === 0 ? (
            <View style={styles.emptyCard}>
              <Star size={32} color="#1E293B" />
              <Text style={styles.emptyText}>Your story begins here.</Text>
            </View>
          ) : (
            reflections.map((ref) => (
              <TouchableOpacity 
                key={ref.id} 
                activeOpacity={0.7}
                onPress={() => setExpandedId(expandedId === ref.id ? null : ref.id)}
                style={styles.reflectionCard}
              >
                <div style={styles.cardMain}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardEmoji}>{(MOOD_OPTIONS as any)[ref.mood]}</Text>
                    <View>
                      <Text style={styles.cardDate}>{ref.date}</Text>
                      <Text style={styles.cardMoodLabel}>{ref.mood} Energy</Text>
                    </View>
                  </View>
                  {expandedId === ref.id ? <ChevronUp size={16} color="#475569"/> : <ChevronDown size={16} color="#475569"/>}
                </div>
                
                {expandedId === ref.id && (
                  <View style={styles.expandContent}>
                    <Text style={styles.gratitudeText}>"{ref.gratitude}"</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  slotCount: { color: '#2DD4BF', fontSize: 12, fontWeight: 'bold' },
  moodGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    padding: 15, 
    borderRadius: 30, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 25
  },
  moodBtn: { alignItems: 'center', gap: 8, opacity: 0.3 },
  moodBtnActive: { opacity: 1, transform: [{ scale: 1.1 }] },
  moodEmoji: { fontSize: 32 },
  moodLabel: { color: '#94A3B8', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  inputCard: { 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    padding: 25, 
    borderRadius: 35, 
    borderWidth: 1, 
    borderColor: 'rgba(45, 212, 191, 0.1)',
    position: 'relative'
  },
  inputHint: { color: '#2DD4BF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 15 },
  textArea: { color: 'white', fontSize: 15, lineHeight: 24, minHeight: 100, textAlignVertical: 'top' },
  saveBtn: { 
    position: 'absolute', 
    bottom: 20, 
    right: 20, 
    backgroundColor: '#2DD4BF', 
    padding: 12, 
    borderRadius: 20,
    shadowColor: '#2DD4BF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  saveBtnDisabled: { opacity: 0.2, backgroundColor: '#1E293B' },
  unlockBtn: { 
    width: '100%', 
    padding: 25, 
    borderRadius: 35, 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    borderColor: '#2DD4BF', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12 
  },
  unlockText: { color: '#2DD4BF', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  historySection: { marginTop: 10 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  historyTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  emptyCard: { 
    padding: 60, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.02)', 
    borderRadius: 35, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderStyle: 'dashed'
  },
  emptyText: { color: '#475569', fontSize: 14, fontWeight: '600', marginTop: 15 },
  reflectionCard: { 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    padding: 20, 
    borderRadius: 25, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.05)', 
    marginBottom: 12 
  },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  cardEmoji: { fontSize: 28 },
  cardDate: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  cardMoodLabel: { color: '#475569', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  expandContent: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
  gratitudeText: { color: '#CBD5E1', fontSize: 14, fontStyle: 'italic', lineHeight: 22 }
});
