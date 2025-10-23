import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import TreeView from './TreeView';
import { colors } from '@/theme/colors';

// Test component to show different tree stages
export default function TreeTestScreen() {
  const testCases = [
    { days: 1, stage: 'sprout', description: 'Sprout (1-2 days)' },
    { days: 5, stage: 'sapling', description: 'Sapling (3-9 days)' },
    { days: 15, stage: 'young', description: 'Young (10-29 days)' },
    { days: 50, stage: 'mature', description: 'Mature (30-99 days)' },
    {
      days: 100,
      stage: 'ancient',
      description: 'Ancient (100+ days) - SPECIAL!',
    },
    {
      days: 150,
      stage: 'ancient',
      description: 'Ancient (150 days) - LEGENDARY!',
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        Tree Stage Test
      </Text>

      {testCases.map((testCase, index) => (
        <View
          key={index}
          style={{
            marginBottom: 30,
            alignItems: 'center',
            backgroundColor: colors.surface,
            padding: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            {testCase.description}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.text.secondary,
              marginBottom: 15,
            }}
          >
            {testCase.days} days streak
          </Text>

          <TreeView
            currentStreakDays={testCase.days}
            brokeYesterday={false}
            size={120}
            enableTransition={false}
          />

          {testCase.stage === 'ancient' && (
            <Text
              style={{
                fontSize: 12,
                color: '#FFD700',
                fontWeight: 'bold',
                marginTop: 10,
                textAlign: 'center',
              }}
            >
              👑 LEGENDARY ACHIEVEMENT! 👑
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
