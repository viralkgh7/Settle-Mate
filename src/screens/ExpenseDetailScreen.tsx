import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';
import { colors, spacing, typography, shadows } from '../theme';
import { formatCurrency } from '../utils/currency';

type ExpenseDetailRouteProp = RouteProp<RootStackParamList, 'ExpenseDetail'>;

const ExpenseDetailScreen = () => {
    const route = useRoute<ExpenseDetailRouteProp>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { groupId, expenseId } = route.params;
    const { getGroup, currentUser } = useApp();

    const group = getGroup(groupId);
    const expense = group?.expenses.find(e => e.id === expenseId);

    if (!group || !expense) {
        return (
            <View style={styles.center}>
                <Text>Expense not found</Text>
            </View>
        );
    }

    const payer = group.members.find(m => m.id === expense.paidBy);

    // Format date manually since Hermes doesn't support toLocaleDateString
    const formatDate = (createdAt: any): string => {
        try {
            let d: Date;
            if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
                d = createdAt.toDate(); // Firestore Timestamp
            } else if (createdAt && typeof createdAt === 'object' && 'seconds' in createdAt) {
                d = new Date(createdAt.seconds * 1000); // Firestore Timestamp as plain object
            } else if (createdAt) {
                d = new Date(createdAt);
            } else {
                return '';
            }
            if (isNaN(d.getTime())) return '';
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        } catch {
            return '';
        }
    };
    const dateStr = formatDate(expense.createdAt);

    // Calculate who owes what
    // This logic mimics calculating balances but just for this one expense transaction
    const getBreakdown = () => {
        const lines: { text: string; amount: number; isMe: boolean }[] = [];

        Object.entries(expense.splits).forEach(([memberId, splitVal]) => {
            const member = group.members.find(m => m.id === memberId);
            if (!member) return;

            let oweAmount = 0;
            if (expense.splitType === 'EQUAL') {
                const numParticipants = Object.keys(expense.splits).length;
                oweAmount = expense.amount / numParticipants;
            } else if (expense.splitType === 'EXACT') {
                oweAmount = splitVal;
            } else if (expense.splitType === 'PERCENT') {
                oweAmount = (expense.amount * splitVal) / 100;
            }

            // Who owes whom?
            // The person (memberId) owes the Payer (expense.paidBy)
            // If the person IS the payer, they don't 'owe' themselves in this context, 
            // but for "Full Details" usually we show "A paid $X and owes $Y" effectively meaning their share.

            // User request: "A paid x amount and owes y amount", "B owes z amount"

            if (memberId === expense.paidBy) {
                // The payer "owes" their share to themselves (effectively their consumption)
                // But typically we say "A paid $100 and lent $50"
                // Or "A paid $100 and her share is $50"

                // Let's stick to "User owes Payer" terminology or generic "User's share"
                lines.push({
                    text: `${memberId === currentUser.id ? 'You' : member.name} owes ${formatCurrency(oweAmount)} (share)`,
                    amount: oweAmount,
                    isMe: memberId === currentUser.id
                });
            } else {
                lines.push({
                    text: `${memberId === currentUser.id ? 'You' : member.name} owes ${payer?.id === currentUser.id ? 'You' : payer?.name}`,
                    amount: oweAmount,
                    isMe: memberId === currentUser.id
                });
            }
        });

        return lines;
    };

    const breakdown = getBreakdown();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Expense Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.mainCard}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>🧾</Text>
                    </View>
                    <Text style={styles.description}>{expense.description}</Text>
                    <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
                    <Text style={styles.date}>
                        Added by {payer?.id === currentUser.id ? 'You' : payer?.name} on {dateStr}
                    </Text>

                    {expense.receiptImageUrl && (
                        <Image source={{ uri: expense.receiptImageUrl }} style={styles.receiptImage} />
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Breakdown</Text>
                    <View style={styles.breakdownList}>
                        <View style={styles.payerRow}>
                            <View style={styles.avatarSmall}>
                                <Text style={styles.avatarText}>{payer?.name.charAt(0)}</Text>
                            </View>
                            <Text style={styles.breakdownText}>
                                <Text style={{ fontWeight: 'bold' }}>{payer?.id === currentUser.id ? 'You' : payer?.name}</Text> paid {formatCurrency(expense.amount)}
                            </Text>
                        </View>

                        {breakdown.map((item, index) => (
                            <View key={index} style={styles.breakdownRow}>
                                <Text style={[styles.breakdownText, item.isMe && styles.boldText]}>
                                    {item.text}
                                </Text>
                                <Text style={[styles.breakdownAmount, item.isMe && styles.boldText]}>
                                    {formatCurrency(item.amount)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        backgroundColor: colors.primary,
        paddingTop: 50,
        paddingBottom: spacing.m,
        paddingHorizontal: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shadows.small
    },
    backButton: {
        padding: spacing.s
    },
    backText: {
        color: '#fff',
        fontSize: 24
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    content: {
        padding: spacing.m
    },
    mainCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: spacing.l,
        alignItems: 'center',
        ...shadows.default,
        marginBottom: spacing.l
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.m
    },
    iconText: {
        fontSize: 30
    },
    description: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.s,
        textAlign: 'center'
    },
    amount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: spacing.m
    },
    date: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        alignSelf: 'stretch'
    },
    receiptImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginTop: spacing.m,
        resizeMode: 'cover'
    },
    section: {
        marginBottom: spacing.l
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: spacing.m,
        textTransform: 'uppercase'
    },
    breakdownList: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: spacing.m,
        ...shadows.small
    },
    payerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.m,
        paddingBottom: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    avatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m
    },
    avatarText: {
        fontWeight: 'bold',
        color: colors.textPrimary
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8
    },
    breakdownText: {
        fontSize: 14,
        color: colors.textPrimary,
        flex: 1
    },
    breakdownAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary
    },
    boldText: {
        fontWeight: 'bold',
        color: colors.primary
    }
});

export default ExpenseDetailScreen;
