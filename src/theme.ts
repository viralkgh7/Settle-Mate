import { StyleSheet, Platform } from 'react-native';

export const colors = {
    primary: '#6C63FF', // Modern Purple-Blue
    secondary: '#FF6584', // Soft Red/Pink for accents/expenses
    background: '#F8F9FA', // Very light grey, almost white
    surface: '#FFFFFF', // Pure white for cards
    textPrimary: '#2D3436', // Dark Grey
    textSecondary: '#636E72', // Medium Grey
    success: '#00B894', // Teal Green
    error: '#D63031', // Red
    warning: '#FDCE56', // Yellow
    border: '#DFE6E9',
    primaryLight: '#A29BFE', // Lighter shade of primary
    inputBackground: '#F1F2F6',
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const typography = {
    header: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: 0.5,
    },
    subHeader: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    body: {
        fontSize: 16,
        color: colors.textPrimary,
        lineHeight: 24,
    },
    caption: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    }
} as const;

export const shadows = {
    default: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    small: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    }
};

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.m,
        ...shadows.default,
        marginBottom: spacing.m,
    },
    input: {
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        paddingHorizontal: spacing.m,
        paddingVertical: Platform.OS === 'ios' ? spacing.m : spacing.s,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: spacing.m,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: spacing.m,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.small,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 12,
        paddingVertical: spacing.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    }
});
