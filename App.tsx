import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  Image, Modal, TextInput, Dimensions, AppState, 
  Linking, Platform, BackHandler, Alert, StatusBar 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';
import * as IntentLauncher from 'expo-intent-launcher';
import { BannerAd, BannerAdSize, TestIds, InterstitialAd, AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { Edit2, Timer as TimerIcon, LayoutGrid, Heart, ShieldAlert, X, Layers, ArrowRight, ShieldCheck } from 'lucide-react-native';

import { COLORS, AD_UNITS, NOTIFICATION_HOURS, TIMER_DEFAULTS } from './constants';
import { FocusScreen } from './components/FocusScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { QuestsScreen } from './components/QuestsScreen';
import { ReflectionScreen } from './components/ReflectionScreen';

const STORAGE_KEY = 'AURA_FINAL_STABLE_V1';
const PKG_NAME = 'com.kmkcodelab.aurabreak';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ad Instances
const interstitial = InterstitialAd.createForAdRequest(AD_UNITS.INTERSTITIAL || TestIds.INTERSTITIAL);
const rewarded = RewardedAd.createForAdRequest(AD_UNITS.REWARDED || TestIds.REWARDED);

export default function App() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'focus' | 'quests' | 'reflection'>('focus');
  const [isOnline, setIsOnline] = useState(true);
  
  // Permission & Ads
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [adLoaded, setAdLoaded] = useState({ interstitial: false, rewarded: false });

  // App Logic States
  const [tasks, setTasks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [reflections, setReflections] = useState<any[]>([]);
  const [taskSlots, setTaskSlots] = useState(3);
  const [moodSlots, setMoodSlots] = useState(3);

  // Timer States
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [session, setSession] = useState<'FOCUS' | 'BREAK'>('FOCUS');
  const [timerMode, setTimerMode] = useState<'MANUAL' | 'AUTO_LOOP'>('MANUAL');
  const [showBreakScreen, setShowBreakScreen] = useState(false);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // --- ১. লাইফ-সাইকেল এবং ডাটা লোড ---
  useEffect(() => {
    const initApp = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          setProfile(data.profile);
          setTasks(data.tasks || []);
          setHistory(data.history || []);
          setReflections(data.reflections || []);
          setTaskSlots(data.taskSlots || 3);
          setMoodSlots(data.moodSlots || 3);
          setHasOverlayPermission(data.hasOverlayPermission || false);
        }
      } catch (e) {
        console.error("Data Load Error:", e);
      } finally {
        // ফেইল-সেফ: ডাটা লোড হোক বা না হোক, স্ক্রিন থেকে লোডিং সরিয়ে দেবে
        setTimeout(() => setIsDataLoaded(true), 1500);
      }
    };
    initApp();

    const unsubNet = NetInfo.addEventListener(s => setIsOnline(!!s.isConnected));
    loadAds();
    return () => unsubNet();
  }, []);

  const loadAds = () => {
    try {
      interstitial.addAdEventListener(AdEventType.LOADED, () => setAdLoaded(p => ({...p, interstitial: true})));
      interstitial.load();
      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => setAdLoaded(p => ({...p, rewarded: true})));
      rewarded.load();
    } catch(e) {}
  };

  const saveData = async (overrides = {}) => {
    const data = { profile, tasks, history, reflections, taskSlots, moodSlots, hasOverlayPermission, ...overrides };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // --- ২. পারমিশন লজিক (সরাসরি সেটিংস) ---
  const handleStartTimer = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      if (!hasOverlayPermission && Platform.OS === 'android') {
        setShowPermissionModal(true);
      } else {
        setIsActive(true);
      }
    }
  };

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.MANAGE_OVERLAY_PERMISSION, {
          data: `package:${PKG_NAME}`
        });
        setHasOverlayPermission(true);
        saveData({ hasOverlayPermission: true });
      } catch (e) {
        Alert.alert("Manual Step", "Please find Aura Break in the list and enable 'Display over other apps'.");
      }
    }
    setShowPermissionModal(false);
  };

  // --- ৩. টাইমার লজিক ---
  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      const isFocus = session === 'FOCUS';
      if (isFocus) {
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
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // --- রেন্ডারিং ---
  if (!isDataLoaded) {
    return (
      <View style={styles.loadingBox}>
        <Text style={{color: COLORS.primary, fontSize: 24, fontWeight: 'bold'}}>Aura Break</Text>
      </View>
    );
  }

  if (!profile) {
    return <OnboardingScreen onComplete={(n) => {
      const p = {name: n, lastReset: new Date().toLocaleDateString()};
      setProfile(p);
      saveData({profile: p});
    }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.background, '#1E293B']} style={styles.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Image source={require('./assets/logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.brand}>AURA PLATFORM</Text>
            <View style={styles.nameRow}>
              {isEditingName ? (
                <TextInput 
                  style={styles.nameInput} 
                  value={tempName} 
                  onChangeText={setTempName}
                  onBlur={() => { setProfile({...profile, name: tempName}); setIsEditingName(false); saveData({profile: {...profile, name: tempName}}); }}
                  autoFocus
                />
              ) : (
                <Text style={styles.greeting}>Hi, {profile.name}</Text>
              )}
              <TouchableOpacity onPress={() => { setTempName(profile.name); setIsEditingName(true); }}>
                <Edit2 size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={{flex: 1, paddingHorizontal: 20}}>
        {activeTab === 'focus' && (
          <FocusScreen 
            timer={{timeLeft, isActive, session}}
            timerMode={timerMode}
            onToggle={handleStartTimer}
            onReset={() => { setIsActive(false); setTimeLeft(25*60); setSession('FOCUS'); }}
            onModeChange={setTimerMode}
            onSettingsChange={(f:number, b:number) => { setTimeLeft(f*60); }}
          />
        )}
        {activeTab === 'quests' && <QuestsScreen tasks={tasks} limit={taskSlots} history={history} onUpdateTasks={(t:any) => {setTasks(t); saveData({tasks: t});}} onUnlock={() => {}} />}
        {activeTab === 'reflection' && <ReflectionScreen reflections={reflections} limit={moodSlots} onUpdate={(r:any) => {setReflections(r); saveData({reflections: r});}} onSave={() => {}} onUnlock={() => {}} />}
      </View>

      {/* NAV BAR */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('focus')}>
          <TimerIcon size={24} color={activeTab==='focus'?COLORS.primary:COLORS.slate} />
          <Text style={[styles.navText, {color: activeTab==='focus'?COLORS.primary:COLORS.slate}]}>Focus</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('quests')}>
          <LayoutGrid size={24} color={activeTab==='quests'?COLORS.primary:COLORS.slate} />
          <Text style={[styles.navText, {color: activeTab==='quests'?COLORS.primary:COLORS.slate}]}>Quests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('reflection')}>
          <Heart size={24} color={activeTab==='reflection'?COLORS.primary:COLORS.slate} />
          <Text style={[styles.navText, {color: activeTab==='reflection'?COLORS.primary:COLORS.slate}]}>Reflection</Text>
        </TouchableOpacity>
      </View>

      {/* PERMISSION MODAL (The requested design) */}
      <Modal visible={showPermissionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.permCard}>
            <Layers size={40} color={COLORS.primary} style={{marginBottom: 15}} />
            <Text style={styles.permTitle}>Display Over Apps</Text>
            <Text style={styles.permDesc}>Aura needs permission to show the breakdown screen over other apps for effective focus.</Text>
            <TouchableOpacity onPress={requestPermission} style={styles.allowBtn}>
              <Text style={{fontWeight: 'bold'}}>ALLOW IN SETTINGS</Text>
              <ArrowRight size={18} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPermissionModal(false)} style={{marginTop: 15}}>
              <Text style={{color: COLORS.slate}}>MAYBE LATER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BANNER AD (Conditional) */}
      {isOnline && <View style={styles.banner}><BannerAd unitId={AD_UNITS.BANNER || TestIds.BANNER} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} /></View>}

      {/* BREAK SCREEN */}
      <Modal visible={showBreakScreen} transparent={false}>
        <View style={styles.breakScreen}>
          <ShieldAlert size={80} color={COLORS.primary} />
          <Text style={styles.breakTitle}>BREAK TIME</Text>
          <Text style={styles.breakTimer}>{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</Text>
          {isOnline && <BannerAd unitId={AD_UNITS.BANNER || TestIds.BANNER} size={BannerAdSize.MEDIUM_RECTANGLE} />}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bg: { position: 'absolute', width: '100%', height: '100%' },
  loadingBox: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 50 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  logo: { width: 50, height: 50, borderRadius: 15 },
  brand: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  nameInput: { color: 'white', fontSize: 24, fontWeight: 'bold', borderBottomWidth: 1, borderColor: COLORS.primary, minWidth: 150 },
  navBar: { height: 80, flexDirection: 'row', backgroundColor: 'rgba(15,23,42,0.95)', borderTopWidth: 1, borderColor: '#334155', position: 'absolute', bottom: 50, width: '100%' },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navText: { fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  banner: { position: 'absolute', bottom: 0, width: '100%', height: 50, backgroundColor: 'black', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  permCard: { backgroundColor: '#1E293B', padding: 25, borderRadius: 30, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary },
  permTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  permDesc: { color: COLORS.slate, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  allowBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakScreen: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  breakTitle: { color: COLORS.primary, fontSize: 32, fontWeight: 'bold', marginTop: 20 },
  breakTimer: { color: 'white', fontSize: 80, fontWeight: 'bold', marginBottom: 40 }
});
