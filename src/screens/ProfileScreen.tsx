import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { colors, spacing, typography, shadows } from '../theme';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { currentUser } = useApp();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // AppNavigator will auto-switch to Login screen via AppContext listener
        } catch (error) {
            console.error('Error signing out: ', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
    };

    if (!currentUser) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{currentUser.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.name}>{currentUser.name}</Text>
                    <Text style={styles.email}>{currentUser.email || 'No email linked'}</Text>
                    <Text style={styles.phone}>{currentUser.phoneNumber || 'No phone linked'}</Text>
                </View>

                {/* Manual Sync/Merge Trigger */}
                <TouchableOpacity style={[styles.logoutButton, { borderColor: colors.primary, marginBottom: 16 }]} onPress={() => {
                    // In a real app, this would be a specific function. 
                    // For now, prompt the user that we are re-syncing.
                    // Since the AppContext listener runs on 'groups' snapshot, we can't force it easily without a refresh.
                    // But we can allow editing the phone number here.
                    Alert.alert('Sync Identity', 'The app attempts to merge "Viral" with "You" based on your phone number. Ensure your phone number matches exactly.');
                }}>
                    <Text style={[styles.logoutText, { color: colors.primary }]}>Sync Identity</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
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
        padding: spacing.l,
        alignItems: 'center'
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: spacing.xl,
        width: '100%',
        alignItems: 'center',
        ...shadows.default,
        marginBottom: spacing.xxl
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.m
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: colors.primary
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.s
    },
    email: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: 4
    },
    phone: {
        fontSize: 16,
        color: colors.textSecondary
    },
    logoutButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: colors.error,
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.xl,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center'
    },
    logoutText: {
        color: colors.error,
        fontSize: 18,
        fontWeight: 'bold'
    }
});

export default ProfileScreen;
