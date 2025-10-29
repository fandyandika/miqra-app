import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { signInEmail, signUpEmail } from '@/services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const doSignIn = async () => {
    try {
      console.log('[LoginScreen] Attempting sign in with:', email.trim());
      const session = await signInEmail(email.trim(), password);
      console.log('[LoginScreen] Sign in successful, session:', !!session);
      Alert.alert('Masuk', 'Berhasil login.');
    } catch (e: any) {
      console.error('[LoginScreen] Sign in error:', e);
      const errorMessage = e?.message || e?.toString() || 'Unknown error';
      Alert.alert('Gagal Masuk', errorMessage);
    }
  };

  const doSignUp = async () => {
    try {
      await signUpEmail(email.trim(), password);
      Alert.alert('Daftar', 'Akun berhasil dibuat! Silakan login.');
    } catch (e: any) {
      const errorMessage = e?.message || e?.toString() || 'Unknown error';
      if (errorMessage.includes('Anonymous sign-ins are disabled')) {
        Alert.alert(
          'Gagal Daftar',
          'Signup dinonaktifkan. Gunakan akun test:\ntest1@miqra.com / password123'
        );
      } else {
        Alert.alert('Gagal Daftar', errorMessage);
      }
    }
  };

  return (
    <View className="flex-1 bg-background px-5 pt-14">
      <Text className="text-2xl font-semibold text-charcoal">Masuk Miqra</Text>
      <TextInput
        className="mt-6 bg-surface rounded-xl px-4 py-3 border border-border"
        placeholder="email@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="mt-3 bg-surface rounded-xl px-4 py-3 border border-border"
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable
        onPress={doSignIn}
        style={{
          backgroundColor: '#10b981',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginTop: 16,
        }}
      >
        <Text style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>Masuk</Text>
      </Pressable>
      <Pressable
        onPress={doSignUp}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginTop: 12,
          borderWidth: 1,
          borderColor: '#10b981',
        }}
      >
        <Text style={{ color: '#10b981', textAlign: 'center', fontWeight: '600' }}>Daftar</Text>
      </Pressable>

      <View className="mt-6 p-4 bg-blue-50 rounded-xl">
        <Text className="text-blue-800 text-sm font-medium">Test Accounts:</Text>
        <Text className="text-blue-700 text-xs mt-1">test1@miqra.com / password123</Text>
        <Text className="text-blue-700 text-xs">test2@miqra.com / password123</Text>
      </View>
    </View>
  );
}
