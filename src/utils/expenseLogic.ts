import { Expense, User, Group } from '../types';

export interface Balance {
    userId: string;
    amount: number; // positive = owed to them, negative = they owe
}

export interface Settlement {
    fromUserId: string;
    toUserId: string;
    amount: number;
}

export const calculateBalances = (group: Group): Balance[] => {
    const balances: Record<string, number> = {};

    // Initialize 0 for all members
    group.members.forEach(m => (balances[m.id] = 0));

    group.expenses?.forEach(expense => {
        const paidBy = expense.paidBy;
        const amount = expense.amount;

        // Credit the payer
        balances[paidBy] = (balances[paidBy] || 0) + amount;

        // Debit the splitters
        Object.entries(expense.splits).forEach(([memberId, value]) => {
            let oweAmount = 0;

            if (expense.splitType === 'EQUAL') {
                // Value might be 1 (participating) or 0 (not participating)
                // Or if we just store participating members in the map
                // Let's assume keys in 'splits' are participating members
                const numParticipants = Object.keys(expense.splits).length;
                oweAmount = amount / numParticipants;
            } else if (expense.splitType === 'EXACT') {
                oweAmount = value;
            } else if (expense.splitType === 'PERCENT') {
                oweAmount = (amount * value) / 100;
            }

            balances[memberId] = (balances[memberId] || 0) - oweAmount;
        });
    });

    return Object.keys(balances).map(userId => ({
        userId,
        amount: balances[userId],
    }));
};

export const generateSettlements = (balances: Balance[]): Settlement[] => {
    // Deep copy to avoid mutating
    let debtors = balances.filter(b => b.amount < -0.01).sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
    let creditors = balances.filter(b => b.amount > 0.01).sort((a, b) => b.amount - a.amount); // Descending (most positive first)

    const settlements: Settlement[] = [];

    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

        settlements.push({
            fromUserId: debtor.userId,
            toUserId: creditor.userId,
            amount: parseFloat(amount.toFixed(2)),
        });

        debtor.amount += amount;
        creditor.amount -= amount;

        if (Math.abs(debtor.amount) < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return settlements;
};
