import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { signInEmail, signUpEmail } from '@/services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const doSignIn = async () => {
    try {
      await signInEmail(email.trim(), password);
      Alert.alert('Masuk', 'Berhasil login.');
    } catch (e:any) {
      const errorMessage = e?.message || e?.toString() || 'Unknown error';
      Alert.alert('Gagal Masuk', errorMessage);
    }
  };

  const doSignUp = async () => {
    try {
      await signUpEmail(email.trim(), password);
      Alert.alert('Daftar', 'Akun berhasil dibuat! Silakan login.');
    } catch (e:any) {
      const errorMessage = e?.message || e?.toString() || 'Unknown error';
      if (errorMessage.includes('Anonymous sign-ins are disabled')) {
        Alert.alert('Gagal Daftar', 'Signup dinonaktifkan. Gunakan akun test:\ntest1@miqra.com / password123');
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
      <Pressable onPress={doSignIn} className="bg-primary rounded-xl px-4 py-3 mt-4">
        <Text className="text-white text-center font-medium">Masuk</Text>
      </Pressable>
      <Pressable onPress={doSignUp} className="bg-forest rounded-xl px-4 py-3 mt-3">
        <Text className="text-white text-center font-medium">Daftar</Text>
      </Pressable>
      
      <View className="mt-6 p-4 bg-blue-50 rounded-xl">
        <Text className="text-blue-800 text-sm font-medium">Test Accounts:</Text>
        <Text className="text-blue-700 text-xs mt-1">test1@miqra.com / password123</Text>
        <Text className="text-blue-700 text-xs">test2@miqra.com / password123</Text>
      </View>
    </View>
  );
}
