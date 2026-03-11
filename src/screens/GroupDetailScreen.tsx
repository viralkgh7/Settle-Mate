import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { calculateBalances, generateSettlements } from '../utils/expenseLogic';
import { colors, spacing, typography, globalStyles, shadows } from '../theme';
import { formatCurrency } from '../utils/currency';

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;
type GroupDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GroupDetail'>;

const GroupDetailScreen = () => {
    const route = useRoute<GroupDetailRouteProp>();
    const navigation = useNavigation<GroupDetailNavigationProp>();
    const { groupId } = route.params;
    const { getGroup, currentUser } = useApp();

    const group = getGroup(groupId);

    if (!group) return <View style={globalStyles.center}><Text>Group not found</Text></View>;

    const balances = calculateBalances(group);
    const settlements = generateSettlements(balances);

    const renderExpenseItem = ({ item }: { item: any }) => {
        const isPayer = item.paidBy === currentUser.id;
        const payerName = group.members.find(m => m.id === item.paidBy)?.name || 'Unknown';

        // Calculate user's share/involvement
        let userAmount = 0;
        let userAction = ''; // 'you lent', 'you borrowed', 'not involved'

        if (isPayer) {
            // How much did I lend? (Total - my share)
            // My share:
            let myShare = 0;
            if (item.splitType === 'EQUAL') {
                myShare = item.splits[currentUser.id] ? item.amount / Object.keys(item.splits).length : 0;
            } else if (item.splitType === 'PERCENT') {
                myShare = (item.amount * (item.splits[currentUser.id] || 0) / 100);
            } else {
                myShare = item.splits[currentUser.id] || 0;
            }
            userAmount = item.amount - myShare;
            userAction = 'you lent';
        } else {
            // How much do I owe?
            if (item.splitType === 'EQUAL') {
                userAmount = item.splits[currentUser.id] ? item.amount / Object.keys(item.splits).length : 0;
            } else if (item.splitType === 'PERCENT') {
                userAmount = (item.amount * (item.splits[currentUser.id] || 0) / 100);
            } else {
                userAmount = item.splits[currentUser.id] || 0;
            }
            userAction = 'you borrowed';
        }

        // Round tiny amounts to 0
        if (userAmount < 0.01) userAction = 'not involved';

        // Format date manually since Hermes doesn't support toLocaleDateString
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let date: Date;
        const rawDate = item.createdAt;
        if (rawDate && typeof rawDate === 'object' && 'toDate' in rawDate) {
            date = rawDate.toDate();
        } else if (rawDate && typeof rawDate === 'object' && 'seconds' in rawDate) {
            date = new Date(rawDate.seconds * 1000);
        } else if (rawDate) {
            date = new Date(rawDate);
        } else {
            date = new Date();
        }
        const dateMonth = !isNaN(date.getTime()) ? MONTHS[date.getMonth()] : '';
        const dateDay = !isNaN(date.getTime()) ? date.getDate() : '';

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ExpenseDetail', { groupId, expenseId: item.id })}
                style={styles.expenseItem}
            >
                <View style={styles.dateBox}>
                    <Text style={styles.dateMonth}>{dateMonth}</Text>
                    <Text style={styles.dateDay}>{dateDay}</Text>
                </View>
                <View style={styles.expenseIcon}>
                    <Text style={styles.expenseIconText}>🧾</Text>
                </View>
                <View style={styles.expenseContent}>
                    <Text style={styles.expenseDesc}>{item.description}</Text>
                    <Text style={styles.expensePayer}>
                        {isPayer ? 'You' : payerName} paid {formatCurrency(item.amount)}
                    </Text>
                </View>
                <View style={styles.expenseAmount}>
                    <Text style={[
                        styles.amountText,
                        { color: userAction === 'not involved' ? colors.textSecondary : (isPayer ? colors.success : colors.secondary) }
                    ]}>
                        {userAction}
                    </Text>
                    {userAction !== 'not involved' && (
                        <Text style={[styles.amountVal, { color: isPayer ? colors.success : colors.secondary }]}>
                            {formatCurrency(userAmount)}
                        </Text>
                    )}
                </View>
            </TouchableOpacity >
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>

                    <View>
                        <Text style={styles.groupName}>{group.name}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AddMember', { groupId })}>
                            <Text style={styles.addMemberLink}>+ Add Member</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.settleButton}
                        onPress={() => navigation.navigate('SettleUp', { groupId })}
                    >
                        <Text style={styles.settleButtonText}>Settle Up</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Settlements Summary */}
            {settlements.length > 0 && (
                <View style={styles.settlementContainer}>
                    <Text style={styles.sectionTitle}>Balances</Text>
                    <View style={styles.settlementList}>
                        {settlements.map((s, index) => {
                            const fromName = group.members.find(m => m.id === s.fromUserId)?.name || 'Unknown';
                            const toName = group.members.find(m => m.id === s.toUserId)?.name || 'Unknown';
                            const isUserInvolved = s.fromUserId === currentUser.id || s.toUserId === currentUser.id;

                            if (!isUserInvolved) return null; // Only show my balances for cleaner UI? Or show all. Let's show all for transparency but highlight mine.

                            return (
                                <View key={index} style={[styles.settlementRow, isUserInvolved && styles.mySettlement]}>
                                    <View style={styles.avatarSmall}><Text style={styles.avatarText}>{fromName.charAt(0)}</Text></View>
                                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                                        <Text style={styles.settlementText}>
                                            <Text style={{ fontWeight: 'bold' }}>{s.fromUserId === currentUser.id ? 'You' : fromName}</Text> owes <Text style={{ fontWeight: 'bold' }}>{s.toUserId === currentUser.id ? 'You' : toName}</Text>
                                        </Text>
                                    </View>
                                    <Text style={[styles.settlementAmount, { color: s.fromUserId === currentUser.id ? colors.secondary : colors.success }]}>
                                        {formatCurrency(s.amount)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            <FlatList
                data={group.expenses?.sort((a, b) => b.createdAt - a.createdAt)}
                keyExtractor={(item) => item.id}
                renderItem={renderExpenseItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No expenses yet</Text>
                        <Text style={styles.emptySub}>Tap the + button to add one.</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddExpense', { groupId })}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.primary,
        paddingTop: 50,
        paddingBottom: spacing.l,
        paddingHorizontal: spacing.m,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: spacing.s,
        marginRight: spacing.s,
    },
    backText: {
        fontSize: 24,
        color: '#fff',
    },
    groupName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff'
    },
    addMemberLink: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 2
    },
    settleButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    settleButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    listContent: {
        padding: spacing.m,
        paddingBottom: 100
    },
    settlementContainer: {
        margin: spacing.m,
        marginTop: -spacing.m,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: spacing.m,
        ...shadows.small,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: spacing.s,
        textTransform: 'uppercase'
    },
    settlementList: {
        gap: 8,
    },
    settlementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4
    },
    mySettlement: {
        // Highlight logic if needed
    },
    avatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textPrimary
    },
    settlementText: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    settlementAmount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    expenseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.m,
        backgroundColor: '#fff',
        padding: spacing.m,
        borderRadius: 16,
        ...shadows.small,
    },
    dateBox: {
        alignItems: 'center',
        marginRight: spacing.m,
        width: 36,
    },
    dateMonth: {
        fontSize: 10,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        fontWeight: 'bold'
    },
    dateDay: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary
    },
    expenseIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    expenseIconText: {
        fontSize: 20,
    },
    expenseContent: {
        flex: 1
    },
    expenseDesc: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary
    },
    expensePayer: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2
    },
    expenseAmount: {
        alignItems: 'flex-end',
        marginLeft: spacing.s
    },
    amountText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2
    },
    amountVal: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center'
    },
    emptyText: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4
    },
    emptySub: {
        color: colors.textSecondary,
        fontSize: 14
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 32,
        width: 60,
        height: 60,
        backgroundColor: colors.secondary, // Use secondary color for actions inside group
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.default,
    },
    fabText: {
        color: '#fff',
        fontSize: 32,
        marginTop: -4
    },
});

export default GroupDetailScreen;
