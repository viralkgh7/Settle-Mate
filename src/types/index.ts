export interface User {
    id: string;
    name: string;
    email?: string;
    phoneNumber?: string; // For contacts integration
}

export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENT';

export interface Expense {
    id: string;
    groupId: string;
    description: string;
    amount: number;
    paidBy: string; // User ID
    splitType: SplitType;
    splits: Record<string, number>; // UserID -> Value (Amount for EXACT, Percentage for PERCENT, or share for EQUAL)
    createdAt: number;
    receiptImageUrl?: string;
}

export interface Group {
    id: string;
    name: string;
    members: User[];
    expenses: Expense[]; // Or keep expenses separate and filter by groupId
}

export interface AppState {
    groups: Group[];
    currentUser: User; // The device owner
}

export interface AppContextType extends AppState {
    loading: boolean;
    addGroup: (name: string, members: User[]) => void;
    addExpense: (groupId: string, expense: Omit<Expense, 'id' | 'createdAt'>) => void;
    addMemberToGroup: (groupId: string, members: User[]) => Promise<void>;
    getGroup: (id: string) => Group | undefined;
}

export type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    CreateGroup: undefined;
    GroupDetail: { groupId: string };
    AddExpense: { groupId: string; receiptUri?: string };
    ExpenseDetail: { groupId: string; expenseId: string };
    AddMember: { groupId: string };
    Profile: undefined;
    SettleUp: { groupId: string };
    Camera: { returnScreen: keyof RootStackParamList; returnParams?: any };
};


