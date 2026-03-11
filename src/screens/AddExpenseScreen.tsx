import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, Modal, Platform, StatusBar } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { RootStackParamList, SplitType } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, globalStyles, shadows } from '../theme';
import { formatCurrency } from '../utils/currency';

type AddExpenseRouteProp = RouteProp<RootStackParamList, 'AddExpense'>;

const AddExpenseScreen = () => {
    const route = useRoute<AddExpenseRouteProp>();
    const { groupId, receiptUri } = route.params;
    const { getGroup, addExpense, currentUser } = useApp();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const group = getGroup(groupId);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [payerId, setPayerId] = useState(currentUser?.id || '');
    const [splitType, setSplitType] = useState<SplitType>('EQUAL');
    const [splits, setSplits] = useState<Record<string, number>>({});

    // Initialize splits when group loads
    React.useEffect(() => {
        if (group && Object.keys(splits).length === 0) {
            setPayerId(currentUser.id);
            // Default: Everyone included
            const initialSplits: Record<string, number> = {};
            group.members.forEach(m => initialSplits[m.id] = 1);
            setSplits(initialSplits);
        }
    }, [group]);

    if (!group) return <Text>Group not found</Text>;

    const [payerModalVisible, setPayerModalVisible] = useState(false);

    const handleSave = () => {
        if (!description.trim() || !amount.trim()) {
            Alert.alert('Error', 'Please enter description and amount');
            return;
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        // Validate Splits
        if (splitType === 'EXACT') {
            const sum = Object.values(splits).reduce((a, b) => a + b, 0);
            if (Math.abs(sum - numAmount) > 0.05) {
                Alert.alert('Error', `The split amounts (${formatCurrency(sum)}) must equal the total (${formatCurrency(numAmount)})`);
                return;
            }
        } else if (splitType === 'PERCENT') {
            const sum = Object.values(splits).reduce((a, b) => a + b, 0);
            if (Math.abs(sum - 100) > 0.1) {
                Alert.alert('Error', `The percentages (${sum}%) must equal 100%`);
                return;
            }
        } else if (splitType === 'EQUAL') {
            if (Object.keys(splits).length === 0) {
                Alert.alert('Error', 'Select at least one person to split with');
                return;
            }
        }

        addExpense(groupId, {
            description,
            amount: numAmount,
            paidBy: payerId,
            splitType,
            splits,
            groupId, // Include groupId
            receiptImageUrl: receiptUri,
        });

        navigation.goBack();
    };

    const getPayerName = () => {
        if (payerId === currentUser.id) return 'you';
        const member = group.members.find(m => m.id === payerId);
        return member ? member.name : 'Unknown';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButtonIcon}>
                    <Text style={styles.closeIconText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Expense</Text>
                <View style={{ width: 30 }} />
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.mainInputContainer}>
                    <View style={styles.iconPlaceholder}>
                        <Text style={styles.iconText}>📝</Text>
                    </View>
                    <TextInput
                        style={styles.descInput}
                        placeholder="Description"
                        value={description}
                        onChangeText={setDescription}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.amountContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                        style={styles.amountMainInput}
                        placeholder="0.00"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={[styles.card, styles.paddedCard]}>
                    <Text style={styles.label}>Paid by</Text>
                    <TouchableOpacity
                        style={styles.payerSelector}
                        onPress={() => setPayerModalVisible(true)}
                    >
                        <View style={styles.avatarSmall}>
                            <Text style={styles.avatarText}>{getPayerName().charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.payerText}>
                            <Text style={{ fontWeight: 'bold' }}>{getPayerName()}</Text>
                        </Text>
                        <Text style={styles.changeText}>Change</Text>
                    </TouchableOpacity>
                </View>

                {/* Receipt Section */}
                <View style={[styles.card, styles.paddedCard]}>
                    <Text style={styles.label}>Receipt</Text>
                    {receiptUri ? (
                        <View style={styles.receiptPreview}>
                            <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
                            <TouchableOpacity onPress={() => navigation.navigate('Camera', { returnScreen: 'AddExpense', returnParams: { groupId } })}>
                                <Text style={styles.retakeText}>Retake</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.cameraButton}
                            onPress={() => navigation.navigate('Camera', { returnScreen: 'AddExpense', returnParams: { groupId } })}
                        >
                            <Text style={styles.cameraButtonText}>📸 Scan Receipt</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Split Type Selector */}
                <View style={styles.splitSection}>
                    <Text style={styles.sectionHeader}>Split into</Text>
                    <View style={styles.tabContainer}>
                        {(['EQUAL', 'EXACT', 'PERCENT'] as SplitType[]).map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.tab, splitType === type && styles.activeTab]}
                                onPress={() => {
                                    setSplitType(type);
                                    const newSplits: Record<string, number> = {};
                                    if (type === 'EQUAL') {
                                        group.members.forEach(m => newSplits[m.id] = 1);
                                    } else {
                                        group.members.forEach(m => newSplits[m.id] = 0);
                                    }
                                    setSplits(newSplits);
                                }}
                            >
                                <Text style={[styles.tabText, splitType === type && styles.activeTabText]}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.membersList}>
                    {group.members.map(member => (
                        <View key={member.id} style={styles.memberRow}>
                            <TouchableOpacity
                                style={styles.memberCheck}
                                onPress={() => {
                                    if (splitType === 'EQUAL') {
                                        const newSplits = { ...splits };
                                        if (newSplits[member.id]) {
                                            delete newSplits[member.id];
                                        } else {
                                            newSplits[member.id] = 1;
                                        }
                                        setSplits(newSplits);
                                    }
                                }}
                            >
                                <View style={styles.avatarRow}>
                                    <Text style={styles.avatarRowText}>{member.name.charAt(0)}</Text>
                                </View>
                                <Text style={styles.memberName}>
                                    {member.name}
                                    {member.id === currentUser.id ? ' (You)' : ''}
                                </Text>
                                {splitType === 'EQUAL' && (
                                    <View style={[styles.checkbox, splits[member.id] ? styles.checked : null]}>
                                        {splits[member.id] && <Text style={styles.checkMark}>✓</Text>}
                                    </View>
                                )}
                            </TouchableOpacity>

                            {splitType !== 'EQUAL' && (
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.amountInput}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={splits[member.id] ? splits[member.id].toString() : ''}
                                        onChangeText={(val) => {
                                            setSplits(prev => ({
                                                ...prev,
                                                [member.id]: parseFloat(val) || 0
                                            }));
                                        }}
                                    />
                                    {splitType === 'PERCENT' && <Text style={styles.suffix}>%</Text>}
                                    {splitType === 'EXACT' && <Text style={styles.suffix}>₹</Text>}
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Expense</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={payerModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPayerModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Who paid?</Text>
                        <ScrollView>
                            {group.members.map(member => (
                                <TouchableOpacity
                                    key={member.id}
                                    style={styles.payerOption}
                                    onPress={() => {
                                        setPayerId(member.id);
                                        setPayerModalVisible(false);
                                    }}
                                >
                                    <View style={styles.payerOptionRow}>
                                        <View style={styles.avatarSmall}>
                                            <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
                                        </View>
                                        <Text style={[
                                            styles.payerOptionText,
                                            payerId === member.id && styles.selectedPayerText
                                        ]}>
                                            {member.name} {member.id === currentUser.id ? '(You)' : ''}
                                        </Text>
                                    </View>
                                    {payerId === member.id && <Text style={styles.checkIcon}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setPayerModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    scrollContainer: {
        padding: spacing.m,
    },
    mainInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.m,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: spacing.s,
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.inputBackground,
        borderRadius: 8,
        marginRight: spacing.s
    },
    iconText: {
        fontSize: 20
    },
    descInput: {
        flex: 1,
        fontSize: 18,
        color: colors.textPrimary,
        padding: spacing.s
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.l
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginRight: 4
    },
    amountMainInput: {
        fontSize: 48,
        fontWeight: 'bold',
        color: colors.textPrimary,
        minWidth: 100,
        textAlign: 'center'
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: spacing.m,
        ...shadows.small
    },
    paddedCard: {
        padding: spacing.m
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: spacing.s,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    payerSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.s,
    },
    avatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    },
    payerText: {
        fontSize: 16,
        color: colors.textPrimary,
        flex: 1,
    },
    changeText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    cameraButton: {
        padding: spacing.m,
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: colors.border
    },
    cameraButtonText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    receiptPreview: {
        alignItems: 'center',
        flexDirection: 'row'
    },
    receiptImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: spacing.m
    },
    retakeText: {
        color: colors.error,
        fontWeight: 'bold'
    },
    splitSection: {
        marginBottom: spacing.m,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.m
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        padding: 4
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#fff',
        ...shadows.small
    },
    tabText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textSecondary
    },
    activeTabText: {
        color: colors.primary
    },
    membersList: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: spacing.m,
        ...shadows.small
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    memberCheck: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarRow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m
    },
    avatarRowText: {
        fontWeight: 'bold',
        color: colors.textPrimary
    },
    memberName: {
        fontSize: 16,
        color: colors.textPrimary,
        flex: 1
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center'
    },
    checked: {
        backgroundColor: colors.success,
        borderColor: colors.success
    },
    checkMark: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    amountInput: {
        minWidth: 50,
        textAlign: 'right',
        fontSize: 16,
        paddingVertical: 4,
        color: colors.textPrimary
    },
    suffix: {
        marginLeft: 4,
        color: colors.textSecondary
    },
    footer: {
        padding: spacing.m,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: colors.border
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: 16,
        alignItems: 'center',
        ...shadows.small
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalContent: {
        backgroundColor: '#fff',
        height: '60%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: colors.textPrimary
    },
    payerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        justifyContent: 'space-between'
    },
    payerOptionRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    payerOptionText: {
        fontSize: 16,
        color: colors.textPrimary,
    },
    selectedPayerText: {
        color: colors.primary,
        fontWeight: 'bold'
    },
    checkIcon: {
        fontSize: 18,
        color: colors.primary,
        fontWeight: 'bold'
    },
    closeButton: {
        marginTop: 16,
        alignItems: 'center',
        padding: 16
    },
    closeButtonText: {
        color: colors.error,
        fontSize: 16,
        fontWeight: 'bold'
    }
});

export default AddExpenseScreen;
