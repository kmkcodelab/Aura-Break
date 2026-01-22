export type MoodType = 'Great' | 'Good' | 'Neutral' | 'Productive' | 'Tired';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface DayStats {
  date: string;
  created: number;
  completed: number;
}

export interface Reflection {
  id: string;
  date: string;
  mood: MoodType;
  gratitude: string;
  timestamp: number; // মুড সেভ করার সঠিক সময় ট্র্যাকিংয়ের জন্য (৪ ঘণ্টা রিমাইন্ডার লজিক)
}

export interface UserProfile {
  name: string;
  focusSessions: number;
  lastResetDate: string;
}

export type TimerMode = 'MANUAL' | 'AUTO_LOOP';
export type SessionType = 'FOCUS' | 'BREAK';

export interface TimerState {
  timeLeft: number;       // সেকেন্ড হিসেবে বাকি সময়
  isActive: boolean;      // টাইমার কি চলছে?
  session: SessionType;   // FOCUS না কি BREAK?
  targetEndTime: number | null; // কখন শেষ হওয়ার কথা (Timestamp in ms)
}

export interface AppState {
  profile: UserProfile | null;
  tasks: Task[];
  reflections: Reflection[];
  history: DayStats[];
  dailySlotLimit: number; // টাস্কের জন্য লিমিট
  moodSlotLimit: number;  // মুডের জন্য লিমিট (আমাদের আলোচনা অনুযায়ী নতুন যোগ করা হয়েছে)
  timerMode: TimerMode;
  timer: TimerState;
  hasOverlayPermission: boolean;
  focusDuration: number; // মিনিটে (ইউজার এডিট করতে পারবে)
  breakDuration: number; // মিনিটে (ইউজার এডিট করতে পারবে)
}
