import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  Dimensions 
} from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  onComplete: (name: string) => void;
}

export const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('');

  const handleStart = () => {
    if (name.trim().length > 1) {
      onComplete(name.trim());
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative Orbs - ব্যাকগ্রাউন্ড এস্থেটিক আভা */}
      <View style={[styles.orb, { top: -50, right: -50, backgroundColor: 'rgba(45, 212, 191, 0.15)' }]} />
      <View style={[styles.orb, { bottom: -50, left: -50, backgroundColor: 'rgba(45, 212, 191, 0.08)' }]} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.innerContent}>
          
          {/* LOGO SECTION */}
          <View style={styles.logoWrapper}>
            <View style={styles.glassContainer}>
              {/* ফাইনাল অ্যাপ তৈরির সময় এখানে আপনার লোগো ফাইলটি বসবে */}
              <Image 
                source={require('../assets/logo.png')} 
                style={styles.logoImage} 
                resizeMode="cover"
              />
            </View>
          </View>

          {/* BRANDING */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Aura</Text>
            <Text style={styles.tagline}>Find your focus. Master your daily quests.</Text>
          </View>

          {/* INPUT SECTION */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>What should we call you?</Text>
            <TextInput 
              style={styles.textInput}
              placeholder="Enter your name"
              placeholderTextColor="rgba(148, 163, 184, 0.4)"
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={20}
              selectionColor="#2DD4BF"
            />
          </View>

          {/* ACTION BUTTON */}
          <TouchableOpacity 
            onPress={handleStart}
            disabled={name.trim().length < 2}
            activeOpacity={0.8}
            style={[
              styles.button, 
              name.trim().length < 2 && styles.buttonDisabled
            ]}
          >
            <Text style={styles.buttonText}>Begin Journey</Text>
            <ArrowRight size={20} color="#0F172A" />
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0F172A' 
  },
  orb: { 
    position: 'absolute', 
    width: 250, 
    height: 250, 
    borderRadius: 125 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 30 
  },
  innerContent: { 
    alignItems: 'center', 
    width: '100%' 
  },
  logoWrapper: { 
    marginBottom: 30 
  },
  glassContainer: { 
    padding: 6, 
    borderRadius: 30, 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#2DD4BF',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10
  },
  logoImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 24 
  },
  textSection: { 
    alignItems: 'center', 
    marginBottom: 40 
  },
  title: { 
    color: '#FFF', 
    fontSize: 42, 
    fontWeight: '900', 
    letterSpacing: -1 
  },
  tagline: { 
    color: '#94A3B8', 
    fontSize: 16, 
    textAlign: 'center', 
    marginTop: 10, 
    lineHeight: 24,
    paddingHorizontal: 20
  },
  inputCard: { 
    width: '100%', 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    padding: 25, 
    borderRadius: 30, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 25
  },
  label: { 
    color: '#2DD4BF', 
    fontSize: 10, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 12 
  },
  textInput: { 
    color: '#FFF', 
    fontSize: 22, 
    fontWeight: '600', 
    paddingVertical: 5 
  },
  button: { 
    width: '100%', 
    height: 65, 
    backgroundColor: '#2DD4BF', 
    borderRadius: 25, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10,
    shadowColor: '#2DD4BF',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8
  },
  buttonDisabled: { 
    backgroundColor: '#1E293B', 
    opacity: 0.5 
  },
  buttonText: { 
    color: '#0F172A', 
    fontSize: 18, 
    fontWeight: 'bold' 
  }
});
