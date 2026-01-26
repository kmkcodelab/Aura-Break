import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  Image, Modal, TextInput, Dimensions, AppState, 
  Platform, BackHandler, Alert, StatusBar 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';
import * as IntentLauncher from 'expo-intent-launcher';
import { BannerAd, BannerAdSize, TestIds, InterstitialAd, AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { Edit2, Timer as TimerIcon, LayoutGrid, Heart, ShieldAlert, Layers, ArrowRight, ShieldCheck } from 'lucide-react-native';

import { AD_UNITS, COLORS, TIMER_DEFAULTS } from './constants';
import { FocusScreen } from './components/FocusScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { QuestsScreen } from './components/QuestsScreen';
import { ReflectionScreen } from './components/ReflectionScreen';

const STORAGE_KEY = 'AURA_FINAL_STABLE_V5';
const PKG_NAME = 'com.kmkcodelab.aurabreak';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const interstitial = InterstitialAd.createForAdRequest(AD_UNITS.INTERSTITIAL || TestIds.INTERSTITIAL);
const rewarded = RewardedAd.createForAdRequest(AD_UNITS.REWARDED || TestIds.REWARDED);

export default function App() {
  const [isReady, setIsReady] = useState(false); // লোডিং স্টেট
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
  const [focusDur, setFocusDur] = useState(TIMER_DEFAULTS.FOCUS_MIN);
  const [breakDur, setBreakDur] = useState(TIMER_DEFAULTS.BREAK_MIN);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [session, setSession] = useState<'FOCUS' | 'BREAK'>('FOCUS');
  const [timerMode, setTimerMode] = useState<'MANUAL' | 'AUTO_LOOP'>('MANUAL');
  const [showBreakScreen, setShowBreakScreen] = useState(false);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // --- ১. ডাটা লোড ও ইনিশিয়ালাইজেশন (লোডিং ফিক্স) ---
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
          setFocusDur(data.focusDur || 25);
          setBreakDur(data.breakDur || 5);
          setTimeLeft((data.focusDur || 25) * 60);
          setHasOverlayPermission(data.hasOverlayPermission || false);
        }
      } catch (e) {
        console.log("Storage Error:", e);
      } finally {
        // ফেইল-সেফ: ডাটা থাকুক বা না থাকুক, ২ সেকেন্ড পর অ্যাপ লোড হবেই
        setTimeout(() => setIsReady(true), 1000);
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
      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => handleReward());
      rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
        setAdLoaded(p => ({...p, rewarded: false}));
        rewarded.load();
      });
      rewarded.load();
    } catch(e) {}
  };

  const saveData = async (overrides = {}) => {
    const data = { profile, tasks, history, reflections, taskSlots, moodSlots, focusDur, breakDur, hasOverlayPermission, ...overrides };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // --- ২. পারমিশন লজিক (সঠিক সেটিংসে নিয়ে যাওয়া) ---
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

  const openOverlaySettings = async () => {
    if (Platform.OS === 'android') {
      try {
        // এই লাইনটি আপনাকে সরাসরি 'Display over other apps' পেজে নিয়ে যাবে
        await IntentLauncher.startActivityAsync('android.settings.action.MANAGE_OVERLAY_PERMISSION', {
          data: `package:${PKG_NAME}`
        });
        setHasOverlayPermission(true);
        saveData({ hasOverlayPermission: true });
        setShowPermissionModal(false);
      } catch (e) {
        Alert.alert("Error", "Could not open settings. Please enable manually.");
      }
    }
  };

  const handleReward = () => {
    if (activeTab === 'quests') setTaskSlots(p => p + 2);
    if (activeTab === 'reflection') setMoodSlots(p => p + 2);
    saveData({ taskSlots: taskSlots + 2, moodSlots: moodSlots + 2 });
  };

  // --- ৩. টাইমার ও ব্রেক লজিক ---
  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      if (session === 'FOCUS') {
        setSession('BREAK');
        setTimeLeft(breakDur * 60);
        setShowBreakScreen(true);
        if (timerMode === 'AUTO_LOOP') setIsActive(true); else setIsActive(false);
      } else {
        setShowBreakScreen(false);
        setSession('FOCUS');
        setTimeLeft(focusDur * 60);
        if (timerMode === 'AUTO_LOOP') setIsActive(true); else setIsActive(false);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Back Button Block on Break Screen
  useEffect(() => {
    const onBackPress = () => {
      if (showBreakScreen) return true;
      return false;
    };
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [showBreakScreen]);

  // --- রেন্ডারিং ---
  if (!isReady) {
    return (
      <View style={styles.loadingBox}>
        <Image source={require('./assets/logo.png')} style={{width:80, height:80, borderRadius:20}} />
      </View>
    );
  }

  if (!profile) return <OnboardingScreen onComplete={(n) => {
    const p = {name: n, lastReset: new Date().toLocaleDateString()};
    setProfile(p);
    saveData({profile: p});
  }} />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
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
            timer={{timeLeft, isActive, session}} timerMode={timerMode} focusDur={focusDur} breakDur={breakDur}
            onToggle={handleStartTimer} 
            onReset={() => { setIsActive(false); setTimeLeft(focusDur * 60); setSession('FOCUS'); }}
            onModeChange={setTimerMode} 
            onSettingsChange={(f, b) => { setFocusDur(f); setBreakDur(b); setTimeLeft(f*60); saveData({focusDur:f, breakDur:b}); }}
          />
        )}
        {activeTab === 'quests' && <QuestsScreen tasks={tasks} limit={taskSlots} history={history} onUpdateTasks={(t) => {setTasks(t); saveData({tasks: t});}} onUnlock={() => { if(isOnline) rewarded.show(); else Alert.alert("Offline"); }} />}
        {activeTab === 'reflection' && <ReflectionScreen reflections={reflections} limit={moodSlots} onUpdate={(r) => {setReflections(r); saveData({reflections: r});}} onSave={() => { if(isOnline) interstitial.show(); }} onUnlock={() => { if(isOnline) rewarded.show(); else Alert.alert("Offline"); }} />}
      </View>

      {/* NAV BAR */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('focus')}><TimerIcon size={24} color={activeTab==='focus'?COLORS.primary:COLORS.slate} /><Text style={[styles.navText, {color: activeTab==='focus'?COLORS.primary:COLORS.slate}]}>Focus</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('quests')}><LayoutGrid size={24} color={activeTab==='quests'?COLORS.primary:COLORS.slate} /><Text style={[styles.navText, {color: activeTab==='quests'?COLORS.primary:COLORS.slate}]}>Quests</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('reflection')}><Heart size={24} color={activeTab==='reflection'?COLORS.primary:COLORS.slate} /><Text style={[styles.navText, {color: activeTab==='reflection'?COLORS.primary:COLORS.slate}]}>Reflection</Text></TouchableOpacity>
      </View>

      {/* PERMISSION MODAL (Glassmorphism) */}
      <Modal visible={showPermissionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.permCard}>
            <Layers size={40} color={COLORS.primary} style={{marginBottom: 15}} />
            <Text style={styles.permTitle}>Display Over Apps</Text>
            <Text style={styles.permDesc}>Aura needs permission to show the breakdown screen over other apps.</Text>
            
            <TouchableOpacity onPress={openOverlaySettings} style={styles.allowBtn}>
              <ShieldCheck size={18} color="#0F172A" />
              <Text style={{fontWeight: 'bold', color: '#0F172A'}}>ALLOW IN SETTINGS</Text>
              <ArrowRight size={18} color="#0F172A" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowPermissionModal(false)} style={{marginTop: 15}}>
              <Text style={{color: COLORS.slate, fontSize: 12, fontWeight: 'bold'}}>MAYBE LATER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BANNER & BREAK SCREEN */}
      {isOnline && <View style={styles.banner}><BannerAd unitId={AD_UNITS.BANNER || TestIds.BANNER} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} /></View>}

      <Modal visible={showBreakScreen} transparent={false} onRequestClose={()=>{}}>
        <View style={styles.breakScreen}>
          <ShieldAlert size={80} color={COLORS.primary} />
          <Text style={styles.breakTitle}>BREAK TIME</Text>
          <Text style={styles.breakTimer}>{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</Text>
          <Text style={{color: COLORS.slate}}>Screen locked. Relax.</Text>
          {isOnline && <View style={styles.adBox}><BannerAd unitId={AD_UNITS.BANNER} size={BannerAdSize.MEDIUM_RECTANGLE} /></View>}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bg: { position: 'absolute', width: '100%', height: '100%' },
  loadingBox: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  logo: { width: 50, height: 50, borderRadius: 15 },
  brand: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  nameInput: { color: 'white', fontSize: 24, fontWeight: 'bold', borderBottomWidth: 1, borderColor: COLORS.primary, minWidth: 150 },
  navBar: { height: 80, flexDirection: 'row', backgroundColor: 'rgba(15,23,42,0.95)', borderTopWidth: 1, borderColor: '#334155', position: 'absolute', bottom: 50, width: '100%' },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navText: { fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  banner: { position: 'absolute', bottom: 0, width: '100%', height: 50, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  permCard: { width: '100%', backgroundColor: '#1E293B', padding: 25, borderRadius: 30, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary },
  permTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  permDesc: { color: COLORS.slate, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  allowBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' },
  breakScreen: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  breakTitle: { color: COLORS.primary, fontSize: 32, fontWeight: 'bold', marginTop: 20 },
  breakTimer: { color: 'white', fontSize: 80, fontWeight: 'bold', marginBottom: 40 },
  adBox: { marginTop: 30 }
});
