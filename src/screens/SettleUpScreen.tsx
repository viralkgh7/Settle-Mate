import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, StatusBar, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../types';
import { calculateBalances, generateSettlements, Settlement } from '../utils/expenseLogic';
import { colors, spacing, typography, globalStyles, shadows } from '../theme';

type SettleUpRouteProp = RouteProp<RootStackParamList, 'SettleUp'>;

const SettleUpScreen = () => {
    const route = useRoute<SettleUpRouteProp>();
    const { groupId } = route.params;
    const { getGroup, addExpense, currentUser } = useApp();
    const navigation = useNavigation();

    const group = getGroup(groupId);
    if (!group) return <Text>Group not found</Text>;

    const balances = calculateBalances(group);
    const settlements = generateSettlements(balances);

    // Filter settlements where current user Owes money
    const myDebts = settlements.filter(s => s.fromUserId === currentUser.id);

    const handleSettle = (settlement: Settlement) => {
        const toUser = group.members.find(m => m.id === settlement.toUserId);

        Alert.alert(
            'Record Payment',
            `Mark that you paid ₹${settlement.amount.toFixed(2)} to ${toUser?.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        addExpense(groupId, {
                            description: 'Payment',
                            amount: settlement.amount,
                            paidBy: currentUser.id,
                            splitType: 'EXACT',
                            splits: { [settlement.toUserId]: settlement.amount },
                            groupId,
                            receiptImageUrl: undefined
                        });
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButtonIcon}>
                    <Text style={styles.closeIconText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settle Up</Text>
                <View style={{ width: 30 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.subHeader}>Who are you paying?</Text>

                <FlatList
                    data={myDebts}
                    keyExtractor={(item) => item.toUserId}
                    renderItem={({ item }) => {
                        const toUser = group.members.find(m => m.id === item.toUserId);
                        return (
                            <TouchableOpacity style={styles.userCard} onPress={() => handleSettle(item)}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{toUser?.name.charAt(0)}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.userName}>{toUser?.name}</Text>
                                    <Text style={styles.amount}>You owe ₹{item.amount.toFixed(2)}</Text>
                                </View>
                                <View style={styles.payButton}>
                                    <Text style={styles.payButtonText}>Pay</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyIcon}>🎉</Text>
                            <Text style={styles.emptyText}>You are all settled up!</Text>
                            <Text style={styles.emptySub}>You don't owe anyone in this group.</Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: spacing.m,
        paddingBottom: spacing.m,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    closeButtonIcon: {
        padding: spacing.s,
    },
    closeIconText: {
        fontSize: 24,
        color: colors.textPrimary,
        fontWeight: '300'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary
    },
    content: {
        flex: 1,
        padding: spacing.m
    },
    subHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: spacing.m,
        textTransform: 'uppercase'
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: spacing.m,
        ...shadows.small
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.secondary, // Use secondary for paying debts (red-ish usually implies debt, but here it's nice)
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 2
    },
    amount: {
        color: colors.error,
        fontWeight: '600'
    },
    payButton: {
        marginLeft: spacing.m,
        backgroundColor: colors.success,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        ...shadows.small
    },
    payButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    },
    empty: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: spacing.m
    },
    emptyText: {
        color: colors.textPrimary,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: spacing.s
    },
    emptySub: {
        color: colors.textSecondary,
        fontSize: 16
    }
});

export default SettleUpScreen;
