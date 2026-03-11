import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, spacing, typography, globalStyles, shadows } from '../theme';

type CameraScreenRouteProp = RouteProp<RootStackParamList, 'Camera'>;
type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CameraScreen = () => {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const navigation = useNavigation<CameraScreenNavigationProp>();
    const route = useRoute<CameraScreenRouteProp>();
    const { returnScreen, returnParams } = route.params;

    if (!permission) {
        // Camera permissions are still loading
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
                <Text style={styles.permissionText}>We need your permission to use the camera for scanning receipts.</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                if (photo) {
                    // Navigate back with the URI
                    navigation.navigate(returnScreen, { ...returnParams, receiptUri: photo.uri } as any);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <CameraView style={styles.camera} ref={cameraRef} facing="back">
                <SafeAreaView style={styles.overlay}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>

                    <View style={styles.bottomControls}>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.captureButtonOuter} onPress={takePicture}>
                                <View style={styles.captureButtonInner} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </CameraView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'space-between'
    },
    closeButton: {
        alignSelf: 'flex-start',
        padding: spacing.m,
        marginTop: spacing.s,
        marginLeft: spacing.s
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '300',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4
    },
    bottomControls: {
        paddingBottom: 50,
        alignItems: 'center'
    },
    buttonContainer: {
        alignItems: 'center',
    },
    captureButtonOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    captureButtonInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
    },
    permissionText: {
        ...typography.body,
        textAlign: 'center',
        marginBottom: spacing.l,
        color: colors.textPrimary
    },
    permissionButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.xl,
        borderRadius: 12,
        ...shadows.default,
        marginBottom: spacing.m
    },
    permissionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    cancelButton: {
        padding: spacing.s
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontSize: 16
    }
});

export default CameraScreen;
