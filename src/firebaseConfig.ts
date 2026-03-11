import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBKUmoh6DXcOlUfbZbBRPeAy9DuwqbmvqU",
    authDomain: "splitwise-5659b.firebaseapp.com",
    projectId: "splitwise-5659b",
    storageBucket: "splitwise-5659b.firebasestorage.app",
    messagingSenderId: "728521358066",
    appId: "1:728521358066:web:6d26ffb96a687cf67dee6b",
    measurementId: "G-673Y49LKH7"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
