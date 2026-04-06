import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import DebtDetailScreen from './screens/DebtDetailScreen';
import MessagesScreen from './screens/MessagesScreen';
import { COLORS, FONT_SIZES } from './constants/theme';
import { t } from './i18n/translations';

export type MainStackParamList = {
  Home: undefined;
  DebtDetail: { loanId: string };
  Messages: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.textOnPrimary,
        headerTitleStyle: { fontWeight: '600', fontSize: FONT_SIZES.lg },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DebtDetail"
        component={DebtDetailScreen}
        options={{ title: t('debt_detail_title') }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: t('messages_title') }}
      />
    </Stack.Navigator>
  );
}
