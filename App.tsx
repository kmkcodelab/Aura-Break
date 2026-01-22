import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  Image, Modal, TextInput, Alert, AppState, 
  Dimensions, KeyboardAvoidingView, Platform, Linking 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Battery from 'expo-battery';
import NetInfo from '@react-native-community/netinfo';
import { Timer, LayoutGrid, Heart, Edit2, ShieldCheck, X, Zap, Clock } from 'lucide-react-native';

// অরিজিনাল অ্যাড আইডিগুলো এখানে সেট করা হয়েছে
const AD_UNITS = {
  BANNER: 'ca-app-pub-8386795368168436/2654142864',
  INTERSTITIAL: 'ca-app-pub-8386795368168436/3535129636',
  REWARDED: 'ca-app-pub-8386795368168436/3754621483',
  APP_OPEN: 'ca-app-pub-8386795368168436/4325467128'
};

const STORAGE_KEY = 'aura_break_master_data';
const { width, height } = Dimensions.get('window');

// নোটিফিকেশন কনফিগারেশন
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [activeTab, setActiveTab] = useState<'focus' | 'quests' | 'reflection'>('focus');
  const [isOnline, setIsOnline] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [reflections, setReflections] = useState<any[]>([]);
  
  // এডিটিং এবং লিমিট স্টেট
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [showBreakScreen, setShowBreakScreen] = useState(false);
  
  // টাইমার স্টেট (গ্লোবাল লজিক)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [session, setSession] = useState<'FOCUS' | 'BREAK'>('FOCUS');
  const [timerMode, setTimerMode] = useState<'MANUAL' | 'AUTO_LOOP'>('MANUAL');

  // কাস্টম অ্যাড ওভারলে (৩সে/১৫সে টাইমার সহ)
  const [adOverlay, setAdOverlay] = useState<{show: boolean, type: string, timer: number}>({
    show: false, type: '', timer: 0
  });

  const lastAdShown = useRef(Date.now());

  // ১. অ্যাপ শুরু হওয়ার সময় ডেটা লোড
  useEffect(() => {
    const initApp = async () => {
      await loadPersistedData();
      const netStatus = await NetInfo.fetch();
      setIsOnline(!!netStatus.isConnected);
      
      // অ্যাপ ওপেন অ্যাড লজিক (২য় বার থেকে)
      const openCount = await AsyncStorage.getItem('open_count');
      if (openCount && parseInt(openCount) >= 1) {
        triggerSmartAd('APP_OPEN');
      }
      await AsyncStorage.setItem('open_count', (parseInt(openCount || '0') + 1).toString());
    };
    initApp();

    const unsubscribeNet = NetInfo.addEventListener(state => setIsOnline(!!state.isConnected));
    return () => unsubscribeNet();
  }, []);

  const loadPersistedData = async () => {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setProfile(data.profile);
      setTasks(data.tasks || []);
      setReflections(data.reflections || []);
    }
  };

  // ২. সিকোয়েন্সিয়াল নোটিফিকেশন (সকাল ৬টা - রাত ১১টা)
  useEffect(() => {
    const scheduleReminders = async () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour <= 23) {
        // টাস্ক রিমাইন্ডার লজিক
        const firstIncomplete = tasks.find(t => !t.completed);
        if (firstIncomplete) {
          await Notifications.scheduleNotificationAsync({
            content: { title: "Aura Break", body: `Next Task: ${firstIncomplete.text}` },
            trigger: { seconds: 3600 }, // ১ ঘণ্টা পর পর
          });
        }
      }
    };
    scheduleReminders();
  }, [tasks]);

  // ৩. টাইমার ও অটো-ব্রেক লজিক
  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleSessionEnd();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionEnd = () => {
    if (session === 'FOCUS') {
      setSession('BREAK');
      setTimeLeft(5 * 60);
      setShowBreakScreen(true);
      if (timerMode === 'AUTO_LOOP') setIsActive(true);
      else setIsActive(false);
    } else {
      setShowBreakScreen(false);
      setSession('FOCUS');
      setTimeLeft(25 * 60);
      if (timerMode === 'AUTO_LOOP') setIsActive(true);
      else setIsActive(false);
    }
  };

  // ৪. অ্যাড টাইমিং লজিক (৩সে এবং ১৫সে)
  const triggerSmartAd = (type: 'INT' | 'REW' | 'APP_OPEN') => {
    if (!isOnline) return;
    const duration = type === 'REW' ? 15 : 3;
    setAdOverlay({ show: true, type, timer: duration });

    const adInt = setInterval(() => {
      setAdOverlay(prev => {
        if (prev.timer <= 1) {
          clearInterval(adInt);
          return { ...prev, timer: 0 };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);
  };

  if (!profile) return <View style={styles.container}><Text style={{color:'white', textAlign:'center', marginTop:100}}>Loading Profile...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      {/* হেডার: লোগো ও নাম এডিট */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image source={require('./assets/logo.png')} style={styles.logoImg} />
          <View>
            <Text style={styles.brandTitle}>AURA PLATFORM</Text>
            <View style={styles.nameEditRow}>
              {isNameEditing ? (
                <TextInput 
                  style={styles.nameInput} 
                  value={tempName} 
                  onChangeText={setTempName}
                  onBlur={async () => {
                    const newProf = {...profile, name: tempName};
                    setProfile(newProf);
                    setIsNameEditing(false);
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({profile: newProf, tasks, reflections}));
                  }}
                  autoFocus
                />
              ) : (
                <Text style={styles.userName}>Hi, {profile.name}</Text>
              )}
              <TouchableOpacity onPress={() => {setIsNameEditing(true); setTempName(profile.name);}}>
                <Edit2 size={16} color="#2DD4BF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
        <ScrollView style={{flex: 1, paddingHorizontal: 20}}>
          {/* এখানে অন্যান্য স্ক্রিনগুলো (Focus, Quests, Reflection) রেন্ডার হবে */}
          <Text style={{color: 'gray', marginTop: 20}}>Tab: {activeTab}</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ৫ মিনিটের ফুল স্ক্রিন আনস্টপেবল ব্রেক স্ক্রিন */}
      <Modal visible={showBreakScreen} transparent={false} animationType="fade">
        <View style={styles.fullLockScreen}>
          <Text style={styles.lockTitle}>BREAK TIME</Text>
          <Text style={styles.lockTimer}>{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</Text>
          <Text style={styles.lockSub}>Your phone is locked for your health.</Text>
          {isOnline && <View style={styles.adRefresher}><Text style={{color:'#475569'}}>Refreshing Ad (15s)...</Text></View>}
        </View>
      </Modal>

      {/* স্মার্ট অ্যাড সিমুলেশন (৩সে/১৫সে ক্লোজ বাটন সহ) */}
      <Modal visible={adOverlay.show} transparent={true}>
        <View style={styles.adContainer}>
          <View style={styles.adBox}>
            <Text style={styles.adType}>{adOverlay.type}</Text>
            {adOverlay.timer > 0 ? (
              <Text style={styles.adCounter}>Close in {adOverlay.timer}s</Text>
            ) : (
              <TouchableOpacity onPress={() => setAdOverlay({show: false, type:'', timer:0})} style={styles.closeBtn}>
                <X color="white" size={24} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* নেভিগেশনের নিচে অফলাইন-সেন্সিটিভ ব্যানার অ্যাড */}
      <View style={styles.bottomSection}>
        {isOnline && (
          <View style={styles.bannerAd}>
            <Text style={styles.adPlaceholder}>AdUnit: {AD_UNITS.BANNER}</Text>
          </View>
        )}
        <View style={styles.navBar}>
          {/* ট্যাব বাটনগুলো এখানে থাকবে */}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20, paddingTop: 40 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoImg: { width: 45, height: 45, borderRadius: 12 },
  brandTitle: { color: '#2DD4BF', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  nameInput: { color: 'white', fontSize: 22, fontWeight: 'bold', borderBottomWidth: 1, borderColor: '#2DD4BF' },
  fullLockScreen: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  lockTitle: { color: '#2DD4BF', fontSize: 32, fontWeight: 'bold' },
  lockTimer: { color: 'white', fontSize: 72, fontWeight: 'bold', marginVertical: 30 },
  lockSub: { color: '#64748B', textAlign: 'center' },
  adRefresher: { marginTop: 50, width: 300, height: 250, backgroundColor: '#1E293B', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  adContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  adBox: { width: width * 0.8, height: height * 0.6, backgroundColor: '#FFF', borderRadius: 30, padding: 20, alignItems: 'center' },
  adCounter: { position: 'absolute', top: 20, right: 20, color: '#000', fontWeight: 'bold' },
  closeBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: 'red', borderRadius: 20, padding: 5 },
  bottomSection: { position: 'absolute', bottom: 0, width: '100%' },
  bannerAd: { height: 50, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  adPlaceholder: { color: '#334155', fontSize: 8 },
  navBar: { height: 80, backgroundColor: 'rgba(15,23,42,0.9)', borderTopWidth: 1, borderColor: '#1E293B' },
  adTimer: { color: 'white' }, adType: { color: 'black', fontWeight: 'bold', marginBottom: 10 }
});
