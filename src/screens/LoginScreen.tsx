import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { colors, spacing, typography, globalStyles, shadows } from '../theme';
import { clearDatabase } from '../utils/devUtils';

// Simulated OTP Code for Dev
const MOCK_OTP = "123456";
const DEFAULT_PASSWORD = "otp_mode_password";

const LoginScreen = () => {
    const [step, setStep] = useState<'PHONE' | 'OTP' | 'NAME'>('PHONE');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Send OTP
    const handleSendOtp = async () => {
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            Alert.alert('Error', 'Please enter a valid 10-digit phone number');
            return;
        }
        setLoading(true);
        // Simulate specific delay
        setTimeout(() => {
            setLoading(false);
            setStep('OTP');
            Alert.alert('OTP Sent', `Your OTP is ${MOCK_OTP}`);
        }, 1000);
    };

    // Step 2: Verify OTP and Try Login
    const handleVerifyOtp = async () => {
        if (otp !== MOCK_OTP) {
            Alert.alert('Error', 'Invalid OTP');
            return;
        }

        setLoading(true);
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        const proxyEmail = `${cleanPhone}@settlemate.app`;

        try {
            await signInWithEmailAndPassword(auth, proxyEmail, DEFAULT_PASSWORD);
            // Success - Auth listener handles nav
        } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                // User doesn't exist, proceed to Name step
                setLoading(false);
                setStep('NAME');
            } else {
                setLoading(false);
                Alert.alert('Login Failed', error.message);
            }
        }
    };

    // Step 3: Complete Signup
    const handleCompleteSignup = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        setLoading(true);
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        const proxyEmail = `${cleanPhone}@settlemate.app`;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, proxyEmail, DEFAULT_PASSWORD);
            const user = userCredential.user;

            // Update Auth Profile
            await updateProfile(user, { displayName: name });

            // Create User Document
            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                name: name,
                email: proxyEmail,
                phoneNumber: cleanPhone,
                createdAt: Date.now()
            });

        } catch (error: any) {
            Alert.alert('Signup Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetDb = async () => {
        Alert.alert(
            'Reset Database',
            'This will delete ALL data. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Everything',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await clearDatabase();
                            Alert.alert('Success', 'Database cleared successfully. Please restart/login again.');
                        } catch (e: any) {
                            Alert.alert('Error', e.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Settle Mate</Text>
                <Text style={styles.subtitle}>
                    {step === 'PHONE' && 'Enter your mobile number'}
                    {step === 'OTP' && 'Enter the code sent to you'}
                    {step === 'NAME' && 'What should we call you?'}
                </Text>

                <View style={styles.form}>
                    {step === 'PHONE' && (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Phone Number</Text>
                                <TextInput
                                    style={styles.input}
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                    placeholder="9876543210"
                                    placeholderTextColor={colors.textSecondary}
                                    autoFocus
                                />
                            </View>
                            <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 'OTP' && (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>One-Time Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    placeholder="123456"
                                    placeholderTextColor={colors.textSecondary}
                                    maxLength={6}
                                    autoFocus
                                />
                            </View>
                            <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Login</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 'NAME' && (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Your Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Viral Kathiriya"
                                    placeholderTextColor={colors.textSecondary}
                                    autoFocus
                                />
                            </View>
                            <TouchableOpacity style={styles.button} onPress={handleCompleteSignup} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Complete Signup</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    {step !== 'PHONE' && (
                        <TouchableOpacity onPress={() => { setStep('PHONE'); setOtp(''); }} style={styles.linkContainer}>
                            <Text style={styles.linkText}>Change Number</Text>
                        </TouchableOpacity>
                    )}

                    {/* Developer Option */}
                    {step === 'PHONE' && (
                        <TouchableOpacity onPress={handleResetDb} style={{ marginTop: 40 }}>
                            <Text style={{ color: colors.error, textAlign: 'center', opacity: 0.6 }}>[DEV] Clear Database</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.l,
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: spacing.s,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 18,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
        textAlign: 'center'
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: spacing.l,
    },
    label: {
        marginBottom: spacing.s,
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.m,
        borderRadius: 12,
        fontSize: 24, // Larger for phone/OTP
        color: colors.textPrimary,
        textAlign: 'center',
        letterSpacing: 2
    },
    button: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: spacing.m,
        ...shadows.default
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkContainer: {
        alignItems: 'center',
        padding: spacing.m
    },
    linkText: {
        color: colors.textSecondary,
        fontSize: 14,
    }
});

export default LoginScreen;
