import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { colors } from '@/theme/colors';

type DailyGoalSettingProps = {
  currentGoal: number;
  onGoalChange: (newGoal: number) => void;
  isLoading?: boolean;
};

const PRESET_GOALS = [1, 5, 10, 15];

export function DailyGoalSetting({
  currentGoal,
  onGoalChange,
  isLoading = false,
}: DailyGoalSettingProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customGoal, setCustomGoal] = useState(currentGoal.toString());

  const handlePresetSelect = (goal: number) => {
    onGoalChange(goal);
    setIsCustomMode(false);
  };

  const handleCustomSubmit = () => {
    const goal = parseInt(customGoal);
    if (isNaN(goal) || goal < 1 || goal > 100) {
      Alert.alert(
        'Target Tidak Valid',
        'Target harian harus antara 1-100 ayat'
      );
      return;
    }
    onGoalChange(goal);
    setIsCustomMode(false);
  };

  const handleCustomCancel = () => {
    setCustomGoal(currentGoal.toString());
    setIsCustomMode(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Target Harian</Text>
      
      <View style={styles.hadithContainer}>
        <Text style={styles.hadithText}>
          "Amalan yang paling dicintai oleh Allah adalah yang paling kontinu (dilakukan terus-menerus), meskipun sedikit."
        </Text>
        <Text style={styles.hadithSource}>— HR. Bukhari & Muslim</Text>
      </View>

      <Text style={styles.currentGoal}>
        Target saat ini: <Text style={styles.goalValue}>{currentGoal} ayat/hari</Text>
      </Text>

      {!isCustomMode ? (
        <View style={styles.presetContainer}>
          <Text style={styles.subtitle}>Pilih target harian:</Text>
          <View style={styles.presetGrid}>
            {PRESET_GOALS.map((goal) => (
              <Pressable
                key={goal}
                style={[
                  styles.presetButton,
                  currentGoal === goal && styles.presetButtonActive,
                ]}
                onPress={() => handlePresetSelect(goal)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    currentGoal === goal && styles.presetButtonTextActive,
                  ]}
                >
                  {goal} ayat
                </Text>
              </Pressable>
            ))}
          </View>
          
          <Pressable
            style={styles.customButton}
            onPress={() => setIsCustomMode(true)}
            disabled={isLoading}
          >
            <Text style={styles.customButtonText}>Custom (isi sendiri)</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.customContainer}>
          <Text style={styles.subtitle}>Masukkan target custom:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={customGoal}
              onChangeText={setCustomGoal}
              keyboardType="numeric"
              placeholder="Masukkan jumlah ayat"
              maxLength={3}
            />
            <Text style={styles.inputSuffix}>ayat/hari</Text>
          </View>
          <View style={styles.customActions}>
            <Pressable
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCustomCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleCustomSubmit}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>Simpan</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  hadithContainer: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  hadithText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
  hadithSource: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  currentGoal: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 16,
  },
  goalValue: {
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  presetContainer: {
    gap: 16,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetButton: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: colors.primary,
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  presetButtonTextActive: {
    color: colors.white,
  },
  customButton: {
    backgroundColor: colors.secondary + '20',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  customButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  customContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 12,
  },
  inputSuffix: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  customActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray[100],
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});
