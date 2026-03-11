import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, spacing, typography, globalStyles, shadows } from '../theme';
import { calculateBalances } from '../utils/expenseLogic';
import { formatCurrency } from '../utils/currency';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
    const { groups, currentUser } = useApp();
    const navigation = useNavigation<HomeScreenNavigationProp>();

    const renderGroupItem = ({ item }: { item: any }) => {
        // Calculate user's balance in this group
        const balances = calculateBalances(item);
        const myBalance = balances.find(b => b.userId === currentUser.id)?.amount || 0;

        let balanceText = 'Settled up';
        let balanceColor = colors.textSecondary;

        if (myBalance > 0.01) {
            balanceText = `you are owed ${formatCurrency(myBalance)}`;
            balanceColor = colors.success;
        } else if (myBalance < -0.01) {
            balanceText = `you owe ${formatCurrency(Math.abs(myBalance))}`;
            balanceColor = colors.error;
        }

        return (
            <TouchableOpacity
                style={styles.groupCard}
                onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
            >
                <View style={styles.groupIcon}>
                    <Text style={styles.groupIconText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{item.name}</Text>
                    <Text style={[styles.groupBalance, { color: balanceColor }]}>{balanceText}</Text>
                </View>
                <View style={styles.arrowContainer}>
                    <Text style={styles.arrow}>›</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={styles.greeting}>Hello, {currentUser?.name || 'Mate'}!</Text>
                            <Text style={styles.title}>Settle Mate</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                            <View style={styles.profileIcon}>
                                <Text style={styles.profileIconText}>{currentUser?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Dashboard Summary Card Removed */}

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Your Groups</Text>
                {groups.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No groups yet</Text>
                        <Text style={styles.emptySubText}>Start by creating a group to split expenses with friends.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={groups}
                        keyExtractor={(item) => item.id}
                        renderItem={renderGroupItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateGroup')}
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
        paddingTop: 60, // approximate status bar height + padding
        paddingBottom: 80, // Space for the overlapping card
        paddingHorizontal: spacing.l,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'column',
    },
    greeting: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    summaryContainer: {
        marginTop: -50,
        paddingHorizontal: spacing.l,
        marginBottom: spacing.l,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: spacing.l,
        ...shadows.default,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    summaryAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.success,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.l,
    },
    sectionTitle: {
        ...typography.subHeader,
        marginBottom: spacing.m,
        color: colors.textPrimary,
    },
    listContent: {
        paddingBottom: 100,
    },
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: spacing.m,
        ...shadows.small,
    },
    groupIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    groupIconText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 20,
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    groupBalance: {
        fontSize: 14,
        fontWeight: '600',
    },
    arrowContainer: {
        marginLeft: spacing.s,
    },
    arrow: {
        fontSize: 24,
        color: colors.textSecondary,
        fontWeight: '300',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        marginTop: spacing.xl,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.s,
    },
    emptySubText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 32,
        width: 60,
        height: 60,
        backgroundColor: colors.primary,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.default,
    },
    fabText: {
        color: '#fff',
        fontSize: 32,
        marginTop: -4, // Optical alignment
    },
    profileIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    profileIconText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18
    }
});

export default HomeScreen;
