// Navigation types — screens are managed via state in App.tsx
// This avoids react-native-screens Fabric crash on Android

export type MainStackParamList = {
  Home: undefined;
  DebtDetail: { loanId: string };
  Messages: undefined;
};
