import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal, 
  TextInput, Dimensions, Animated, Image 
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Play, Pause, RotateCcw, Zap, Coffee, Edit2, Save, X, ShieldAlert } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  timer: { timeLeft: number; isActive: boolean; session: 'FOCUS' | 'BREAK' };
  timerMode: 'MANUAL' | 'AUTO_LOOP';
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onUpdateMode: (m: 'MANUAL' | 'AUTO_LOOP') => void;
  focusDuration: number;
  breakDuration: number;
  onUpdateSettings: (focus: number, breakTime: number) => void;
  isOnline: boolean;
}

export const FocusScreen: React.FC<Props> = ({ 
  timer, timerMode, onToggleTimer, onResetTimer, 
  onUpdateMode, focusDuration, breakDuration, onUpdateSettings, isOnline
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [tempFocus, setTempFocus] = useState(focusDuration.toString());
  const [tempBreak, setTempBreak] = useState(breakDuration.toString());

  // Progress calculation
  const totalTime = timer.session === 'FOCUS' ? (focusDuration * 60) : (breakDuration * 60);
  const progress = ((totalTime - timer.timeLeft) / totalTime) * 100;
  
  // SVG Constants
  const size = 280;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      
      {/* 1. TIMER SETTINGS MODAL */}
      <Modal visible={showSettings} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.settingsCard}>
            <Text style={styles.modalTitle}>Timer Settings</Text>
            
            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>Focus Duration (min)</Text>
              <View style={styles.inputRow}>
                <Zap size={18} color="#2DD4BF" />
                <TextInput 
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={tempFocus}
                  onChangeText={setTempFocus}
                />
              </View>
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>Break Duration (min)</Text>
              <View style={styles.inputRow}>
                <Coffee size={18} color="#2DD4BF" />
                <TextInput 
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={tempBreak}
                  onChangeText={setTempBreak}
                />
              </View>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  onUpdateSettings(Number(tempFocus), Number(tempBreak));
                  setShowSettings(false);
                }} 
                style={styles.saveBtn}
              >
                <Save size={18} color="#0F172A" />
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. MODE SELECTOR */}
      <View style={styles.modeSelector}>
        <TouchableOpacity 
          onPress={() => onUpdateMode('MANUAL')}
          style={[styles.modeBtn, timerMode === 'MANUAL' && styles.modeBtnActive]}
        >
          <Text style={[styles.modeText, timerMode === 'MANUAL' && styles.modeTextActive]}>Manual</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => onUpdateMode('AUTO_LOOP')}
          style={[styles.modeBtn, timerMode === 'AUTO_LOOP' && styles.modeBtnActive]}
        >
          <Text style={[styles.modeText, timerMode === 'AUTO_LOOP' && styles.modeTextActive]}>Auto-Loop</Text>
        </TouchableOpacity>
      </View>

      {/* 3. CIRCULAR TIMER (SVG) */}
      <View style={styles.timerWrapper}>
        <Svg width={size} height={size} style={styles.svg}>
          <Circle 
            cx={center} cy={center} r={radius} 
            stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} fill="transparent" 
          />
          <Circle 
            cx={center} cy={center} r={radius} 
            stroke="#2DD4BF" strokeWidth={strokeWidth} fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>

        <View style={styles.timerTextContainer}>
          <Text style={styles.timeDisplay}>{formatTime(timer.timeLeft)}</Text>
          <View style={styles.sessionBadge}>
            {timer.session === 'FOCUS' ? <Zap size={14} color="#2DD4BF" fill="#2DD4BF" /> : <Coffee size={14} color="#2DD4BF" />}
            <Text style={styles.sessionText}>{timer.session}</Text>
          </View>
        </View>
      </View>

      {/* 4. CONTROLS */}
      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={onResetTimer} style={styles.iconBtn}>
          <RotateCcw size={22} color="#94A3B8" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onToggleTimer} style={styles.startBtn}>
          {timer.isActive ? <Pause size={28} color="#0F172A" /> : <Play size={28} color="#0F172A" style={{marginLeft: 4}} />}
          <Text style={styles.startBtnText}>{timer.isActive ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.iconBtn}>
          <Edit2 size={22} color="#94A3B8" />
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  settingsCard: { width: '100%', backgroundColor: '#1E293B', borderRadius: 30, padding: 25, borderWidth: 1, borderColor: 'rgba(45, 212, 191, 0.2)' },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 25 },
  inputBox: { marginBottom: 20 },
  inputLabel: { color: '#2DD4BF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', padding: 12, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  textInput: { flex: 1, color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  cancelText: { color: '#94A3B8', fontWeight: 'bold' },
  saveBtn: { flex: 1, backgroundColor: '#2DD4BF', padding: 15, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  saveText: { color: '#0F172A', fontWeight: 'bold' },
  modeSelector: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', padding: 5, borderRadius: 20, width: 260, marginBottom: 40 },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 15 },
  modeBtnActive: { backgroundColor: '#2DD4BF' },
  modeText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  modeTextActive: { color: '#0F172A' },
  timerWrapper: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  timerTextContainer: { alignItems: 'center' },
  timeDisplay: { color: 'white', fontSize: 64, fontWeight: 'bold', letterSpacing: -2 },
  sessionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  sessionText: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold', letterSpacing: 3, textTransform: 'uppercase' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 30, marginTop: 50 },
  iconBtn: { padding: 15, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20 },
  startBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2DD4BF', paddingHorizontal: 35, paddingVertical: 18, borderRadius: 30, gap: 10, shadowColor: '#2DD4BF', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  startBtnText: { color: '#0F172A', fontWeight: '900', textTransform: 'uppercase', fontSize: 14 }
});
