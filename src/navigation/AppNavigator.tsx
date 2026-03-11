import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { NavigationContainer } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import HomeScreen from '../screens/HomeScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import CameraScreen from '../screens/CameraScreen';
import SettleUpScreen from '../screens/SettleUpScreen';
import LoginScreen from '../screens/LoginScreen';
import AddMemberScreen from '../screens/AddMemberScreen';
import ExpenseDetailScreen from '../screens/ExpenseDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';


const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    const { currentUser, loading } = useApp();

    if (loading) {
        // You might want a better loading screen here
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: { backgroundColor: colors.primary },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                {currentUser ? (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Settle Mate', headerShown: false }} />
                        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Create a group' }} />
                        <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: 'Group Details' }} />
                        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
                        <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} options={{ title: 'Expense Details', headerShown: false }} />
                        <Stack.Screen name="Camera" component={CameraScreen} options={{ title: 'Scan Receipt' }} />
                        <Stack.Screen name="SettleUp" component={SettleUpScreen} options={{ title: 'Settle Up' }} />
                        <Stack.Screen name="AddMember" component={AddMemberScreen} options={{ title: 'Add Member' }} />
                        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
