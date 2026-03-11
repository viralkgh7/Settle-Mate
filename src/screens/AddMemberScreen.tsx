import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Modal, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { User, RootStackParamList } from '../types';
import * as Contacts from 'expo-contacts';
import { colors, spacing, typography, globalStyles, shadows } from '../theme';

type AddMemberRouteProp = RouteProp<RootStackParamList, 'AddMember'>;

const AddMemberScreen = () => {
    const route = useRoute<AddMemberRouteProp>();
    const { groupId } = route.params;
    const { getGroup, addMemberToGroup, currentUser } = useApp();
    const navigation = useNavigation();

    const group = getGroup(groupId);
    const [membersToAdd, setMembersToAdd] = useState<User[]>([]);

    // Contacts State
    const [modalVisible, setModalVisible] = useState(false);
    const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    if (!group) return <Text>Group not found</Text>;

    const fetchContacts = async () => {
        setLoadingContacts(true);
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
                sort: Contacts.SortTypes.FirstName
            });

            if (data.length > 0) {
                setContacts(data.filter(c => c.name)); // Only contacts with names
                setModalVisible(true);
            } else {
                Alert.alert('No Contacts', 'No contacts found on this device.');
            }
        } else {
            Alert.alert('Permission denied', 'We need access to your contacts to add friends.');
        }
        setLoadingContacts(false);
    };

    const addMember = (contact: Contacts.Contact) => {
        const phoneNumber = contact.phoneNumbers && contact.phoneNumbers[0] ? contact.phoneNumbers[0].number : undefined;

        const newMember: User = {
            id: (contact as any).id || Date.now().toString(),
            name: contact.name,
            phoneNumber: phoneNumber
        };

        // Check if already in the group (existing members or in pending list)
        if (group.members.some(m => m.name === newMember.name) || membersToAdd.some(m => m.name === newMember.name)) {
            Alert.alert('Duplicate', `${newMember.name} is already in the group or added list.`);
            return;
        }

        setMembersToAdd([...membersToAdd, newMember]);
        setModalVisible(false);
        setSearchQuery(''); // Reset search
    };

    const handleAddMembers = async () => {
        if (membersToAdd.length === 0) {
            Alert.alert('Error', 'Please select at least one member to add');
            return;
        }
        await addMemberToGroup(groupId, membersToAdd);
        navigation.goBack();
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phoneNumbers && c.phoneNumbers.some(p => p.number?.includes(searchQuery)))
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButtonIcon}>
                    <Text style={styles.closeIconText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Members</Text>
                <View style={{ width: 30 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.groupContext}>Adding to {group.name}</Text>
                </View>

                <View style={styles.membersSection}>
                    <FlatList
                        data={membersToAdd}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.memberItem}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                                </View>
                                <Text style={styles.memberName}>{item.name}</Text>
                                <TouchableOpacity onPress={() => setMembersToAdd(membersToAdd.filter(m => m.id !== item.id))}>
                                    <Text style={styles.removeText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No new members selected yet</Text>
                            </View>
                        }
                        ListFooterComponent={
                            <TouchableOpacity style={styles.addMemberButton} onPress={fetchContacts} disabled={loadingContacts}>
                                {loadingContacts ? (
                                    <ActivityIndicator color={colors.primary} />
                                ) : (
                                    <>
                                        <View style={styles.addIconCircle}>
                                            <Text style={styles.addIconText}>+</Text>
                                        </View>
                                        <Text style={styles.addMemberText}>Select from Contacts</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        }
                    />
                </View>

                {membersToAdd.length > 0 && (
                    <TouchableOpacity style={styles.createButton} onPress={handleAddMembers}>
                        <Text style={styles.createButtonText}>Add {membersToAdd.length} Members</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Contacts Modal - Reuse Styles */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select a Friend</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.searchBox}>
                            <Text>🔍</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <FlatList
                            data={filteredContacts}
                            keyExtractor={(item) => (item as any).id || item.name}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.contactItem} onPress={() => addMember(item)}>
                                    <View style={styles.contactAvatar}>
                                        <Text style={styles.contactAvatarText}>{item.name.charAt(0)}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.contactName}>{item.name}</Text>
                                        {item.phoneNumbers && item.phoneNumbers[0] && (
                                            <Text style={styles.contactPhone}>{item.phoneNumbers[0].number}</Text>
                                        )}
                                    </View>
                                    <Text style={styles.addContactText}>Add</Text>
                                </TouchableOpacity>
                            )}
                        />
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
    content: {
        flex: 1,
        padding: spacing.m
    },
    sectionHeader: {
        marginBottom: spacing.m
    },
    groupContext: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center'
    },
    membersSection: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: spacing.m,
        ...shadows.small,
        marginBottom: spacing.m
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m
    },
    avatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary
    },
    memberName: {
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '500',
        flex: 1
    },
    removeText: {
        color: colors.textSecondary,
        fontSize: 18,
        padding: 4
    },
    emptyContainer: {
        padding: spacing.l,
        alignItems: 'center'
    },
    emptyText: {
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: 10
    },
    addMemberButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 8,
        justifyContent: 'center'
    },
    addIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: colors.primary
    },
    addIconText: {
        color: colors.primary,
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: -2
    },
    addMemberText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16
    },
    createButton: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: 16,
        alignItems: 'center',
        ...shadows.default
    },
    createButtonText: {
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
        backgroundColor: colors.background,
        height: '90%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.m
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary
    },
    closeButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600'
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: spacing.s,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.s,
        fontSize: 16,
        color: colors.textPrimary
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: spacing.s
    },
    contactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m
    },
    contactAvatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textSecondary
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary
    },
    contactPhone: {
        fontSize: 12,
        color: colors.textSecondary
    },
    addContactText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 14
    }
});

export default AddMemberScreen;
