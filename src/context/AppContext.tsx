import React, { createContext, useContext, useState, useEffect } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { AppContextType, Group, User, Expense } from '../types';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, setDoc } from 'firebase/firestore';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch additional user details from Firestore (like phoneNumber)
                try {
                    const userDoc = await import('firebase/firestore').then(({ getDoc, doc }) => getDoc(doc(db, 'users', user.uid)));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setCurrentUser({
                            id: user.uid,
                            name: userData.name || user.displayName || 'Me',
                            email: userData.email || user.email || '',
                            phoneNumber: userData.phoneNumber || user.phoneNumber || undefined
                        });
                    } else {
                        // Fallback using auth data
                        setCurrentUser({
                            id: user.uid,
                            name: user.displayName || 'Me',
                            email: user.email || '',
                            phoneNumber: user.phoneNumber || undefined
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    // Fallback
                    setCurrentUser({
                        id: user.uid,
                        name: user.displayName || 'Me',
                        email: user.email || '',
                        phoneNumber: user.phoneNumber || undefined
                    });
                }
            } else {
                setCurrentUser(null);
                setGroups([]);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Groups Listener (Only when logged in)
    useEffect(() => {
        if (!currentUser) return;

        const q = query(collection(db, 'groups'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedGroups: Group[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Group));

            // Client-side filtering: Only show groups where currentUser is a member
            const myGroups = loadedGroups.filter(g =>
                g.members && g.members.some(m => m.id === currentUser.id)
            );

            setGroups(myGroups);

            // Check for pending invites (Phone number match but ID mismatch)
            // We do this check after loading. If we find a match, we update Firestore.
            // This might trigger another snapshot, but since we update ID to match, it won't loop.
            // Check for pending invites (Phone number match but ID mismatch)
            if (currentUser.phoneNumber) {
                const cleanCurrentPhone = currentUser.phoneNumber.replace(/\D/g, '');

                loadedGroups.forEach(async (group) => {
                    const pendingMember = group.members.find(m => {
                        const cleanMemberPhone = m.phoneNumber ? m.phoneNumber.replace(/\D/g, '') : '';

                        console.log(`Checking match for group ${group.name}: Current(${cleanCurrentPhone}) vs Member(${cleanMemberPhone}) - Name: ${m.name}`);

                        // Robust Matching:
                        // 1. Strip non-digits
                        // 2. Compare last 10 digits (ignores country codes like 91 vs 1, or leading 0)
                        const getLast10 = (str: string) => str.length >= 10 ? str.slice(-10) : str;

                        const phoneMatch = cleanMemberPhone.length >= 10 && cleanCurrentPhone.length >= 10 &&
                            getLast10(cleanMemberPhone) === getLast10(cleanCurrentPhone);

                        // Fallback: Name match (exact, case-insensitive) if phone is missing on one side? 
                        // Risky, but if "Viral Kathiriya" matches "Viral Kathiriya", it's likely them.
                        const nameMatch = m.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim();

                        return (phoneMatch || nameMatch) && m.id !== currentUser.id;
                    });

                    if (pendingMember) {
                        console.log(`Found pending invite/old account for group ${group.name} (Member: ${pendingMember.name})`);

                        // 1. Update Members
                        const updatedMembers = group.members.map(m =>
                            m.id === pendingMember.id ? { ...m, ...currentUser, id: currentUser.id } : m
                        );

                        // 2. Update Expenses (re-link paidBy and splits)
                        const updatedExpenses = group.expenses.map(e => {
                            let newExpense = { ...e };
                            // Update Payer
                            if (e.paidBy === pendingMember.id) {
                                newExpense.paidBy = currentUser.id;
                            }
                            // Update Splits
                            if (newExpense.splits && newExpense.splits[pendingMember.id] !== undefined) {
                                const val = newExpense.splits[pendingMember.id];
                                const newSplits = { ...newExpense.splits };
                                delete newSplits[pendingMember.id];
                                // If currentUser already has a split (rare collision), add to it? Or overwrite? 
                                // Taking safer bet: overwrite or add.
                                newSplits[currentUser.id] = (newSplits[currentUser.id] || 0) + val;
                                newExpense.splits = newSplits;
                            }
                            return newExpense;
                        });

                        // 3. Save to Firestore
                        const groupRef = doc(db, 'groups', group.id);
                        try {
                            await updateDoc(groupRef, {
                                members: updatedMembers,
                                expenses: updatedExpenses
                            });
                            console.log('Successfully merged pending user into group.');
                        } catch (err) {
                            console.error('Error merging pending user:', err);
                        }
                    }
                });
            }

        }, (error) => {
            console.error("Error fetching groups: ", error);
        });

        return unsubscribe;
    }, [currentUser]);

    const addGroup = async (name: string, members: User[]) => {
        if (!currentUser) return;

        // Helper to remove undefined values recursively
        const sanitize = (obj: any): any => {
            if (Array.isArray(obj)) {
                return obj.map(v => sanitize(v));
            } else if (obj !== null && typeof obj === 'object') {
                return Object.keys(obj).reduce((acc, key) => {
                    if (obj[key] !== undefined) {
                        acc[key] = sanitize(obj[key]);
                    }
                    return acc;
                }, {} as any);
            }
            return obj;
        };

        const rawGroupData = {
            name,
            members: [currentUser, ...members],
            expenses: [],
            createdAt: Date.now()
        };

        const newGroupData = sanitize(rawGroupData);

        try {
            await addDoc(collection(db, 'groups'), newGroupData);
        } catch (e) {
            console.error("Error adding group: ", e);
        }
    };

    const addExpense = async (groupId: string, expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
        const groupIndex = groups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;

        const newExpense: Expense = {
            ...expenseData,
            id: uuidv4(), // We can use uuid or let firestore generate ID if it was a subcollection
            createdAt: Date.now(),
        };

        // Sanitize to remove undefined values (Firestore rejects undefined)
        Object.keys(newExpense).forEach(key => {
            if ((newExpense as any)[key] === undefined) {
                delete (newExpense as any)[key];
            }
        });

        const groupRef = doc(db, 'groups', groupId);
        // We need to update the 'expenses' array field in the document
        // Firestore requires retrieving the current array and appending, or using arrayUnion (if unique)
        // With objects, arrayUnion checks full equality. It's safer to read-modify-write or keep expenses as subcollection.
        // For this "Clone" keeping it simple with array update is fine for small scale.

        try {
            const updatedExpenses = [...(groups[groupIndex].expenses || []), newExpense];
            await updateDoc(groupRef, {
                expenses: updatedExpenses
            });
        } catch (e) {
            console.error("Error adding expense: ", e);
        }
    };

    const addMemberToGroup = async (groupId: string, newMembers: User[]) => {
        const groupIndex = groups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;

        const group = groups[groupIndex];
        const updatedMembers = [...group.members];

        // Filter out duplicates just in case
        newMembers.forEach(newMember => {
            if (!updatedMembers.some(m => m.id === newMember.id)) {
                updatedMembers.push(newMember);
            }
        });

        const groupRef = doc(db, 'groups', groupId);
        try {
            await updateDoc(groupRef, {
                members: updatedMembers
            });
            console.log('Successfully added members to group.');
        } catch (e) {
            console.error("Error adding members to group: ", e);
        }
    };

    const getGroup = (id: string) => groups.find((g) => g.id === id);

    // Casting currentUser to User for context type, but handling null in logic
    // The AppNavigator handles guarding pages, so inside app currentUser is likely User
    // But we should update type to allow null if we want to be strict.
    // For now, casting "as User" when passing to value if we are sure, or updating Type.
    // Let's update Type to accept null or partial? 
    // Actually, AppNavigator only renders children when currentUser is truthy.

    return (
        <AppContext.Provider value={{ groups, currentUser: currentUser as User, loading, addGroup, addExpense, getGroup, addMemberToGroup }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
