
// Mock Data
const userA = { id: 'A', name: 'Alice', email: 'a@test.com' };
const userB = { id: 'B', name: 'Bob', email: 'b@test.com' };
const userC = { id: 'C', name: 'Charlie', email: 'c@test.com' };

const group = {
    id: 'g1',
    name: 'Test Group',
    members: [userA, userB, userC],
    expenses: [
        // A pays $100, split equally between A and B. B owes A $50.
        {
            id: 'e1',
            paidBy: 'A',
            amount: 100,
            splitType: 'EQUAL',
            splits: { 'A': 1, 'B': 1 },
            createdAt: 1000
        },
        // B pays $100, split equally between B and C. C owes B $50.
        {
            id: 'e2',
            paidBy: 'B',
            amount: 100,
            splitType: 'EQUAL',
            splits: { 'B': 1, 'C': 1 },
            createdAt: 2000
        }
    ]
};

const calculateBalances = (group) => {
    const balances = {};

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

const generateSettlements = (balances) => {
    // Deep copy to avoid mutating
    let debtors = balances.filter(b => b.amount < -0.01).sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
    let creditors = balances.filter(b => b.amount > 0.01).sort((a, b) => b.amount - a.amount); // Descending (most positive first)

    const settlements = [];

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

console.log("--- SCENARIO: A->B ($50), B->C ($50) => A->C ($50) ---");

// Run Calculation
const calculatedBalances = calculateBalances(group);
console.log("Balances (should be A: +50, B: 0, C: -50):");
calculatedBalances.forEach(b => console.log(`${b.userId}: ${b.amount}`));

const settlements = generateSettlements(calculatedBalances);
console.log("\nSettlements (should be C pays A $50):");
settlements.forEach(s => console.log(`${s.fromUserId} pays ${s.toUserId} $${s.amount}`));
