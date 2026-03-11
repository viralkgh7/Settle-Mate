import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const clearDatabase = async () => {
    try {
        const collections = ['users', 'groups'];

        for (const colName of collections) {
            const snapshot = await getDocs(collection(db, colName));
            const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, colName, d.id)));
            await Promise.all(deletePromises);
        }

        // Use a more generic success signal if needed, or just return true
        console.log('Database cleared successfully');
        return true;
    } catch (error) {
        console.error('Error clearing database:', error);
        throw error;
    }
};
