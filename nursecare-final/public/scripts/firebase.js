// Firebase configuration and initialization using browser-compatible syntax
const firebaseConfig = {
    apiKey: "AIzaSyDYLSWuG7aMJ9WeMKXuGe9_ZWgQhqVpYAE",
    authDomain: "healthcare-inventory-demo.firebaseapp.com",
    projectId: "healthcare-inventory-demo",
    storageBucket: "healthcare-inventory-demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase (using traditional approach for compatibility)
let app, db, auth;

// Function to initialize Firebase
function initFirebase() {
    if (typeof firebase !== 'undefined') {
        app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        console.log("Firebase initialized successfully");
    } else {
        console.error("Firebase SDK not loaded");
    }
}

// Helper functions for Firebase operations
const firebaseHelper = {
    initFirebase: initFirebase,
    
    auth: {
        login: async function(email, password) {
            try {
                if (!auth) return { success: false, error: "Firebase not initialized" };
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                return { success: true, user: userCredential.user };
            } catch (error) {
                console.error("Error logging in:", error);
                return { success: false, error: error.message };
            }
        },
        
        register: async function(email, password, userData) {
            try {
                if (!auth || !db) return { success: false, error: "Firebase not initialized" };
                
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                
                await db.collection('users').add({
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    ...userData,
                    createdAt: new Date()
                });
                
                return { success: true, user: userCredential.user };
            } catch (error) {
                console.error("Error registering:", error);
                return { success: false, error: error.message };
            }
        },
        
        getCurrentUser: function() {
            return auth ? auth.currentUser : null;
        }
    },
    
    db: {
        getDoc: async function(collectionName, docId) {
            try {
                if (!db) return { success: false, error: "Firebase not initialized" };
                
                const docRef = db.collection(collectionName).doc(docId);
                const docSnap = await docRef.get();
                
                if (docSnap.exists) {
                    return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
                }
                return { success: false, error: "Document does not exist" };
            } catch (error) {
                console.error(`Error getting document from ${collectionName}:`, error);
                return { success: false, error: error.message };
            }
        },
        
        getCollection: async function(collectionName, queryParams) {
            try {
                if (!db) return { success: false, error: "Firebase not initialized" };
                
                let queryRef = db.collection(collectionName);
                
                if (queryParams) {
                    queryParams.forEach(function(q) {
                        queryRef = queryRef.where(q.field, q.operator, q.value);
                    });
                }
                
                const snapshot = await queryRef.get();
                const data = snapshot.docs.map(function(doc) {
                    return { id: doc.id, ...doc.data() };
                });
                
                return { success: true, data };
            } catch (error) {
                console.error(`Error getting collection ${collectionName}:`, error);
                return { success: false, error: error.message };
            }
        },
        
        addDoc: async function(collectionName, data) {
            try {
                if (!db) return { success: false, error: "Firebase not initialized" };
                
                const docRef = await db.collection(collectionName).add({
                    ...data,
                    createdAt: new Date()
                });
                
                return { success: true, id: docRef.id };
            } catch (error) {
                console.error(`Error adding document to ${collectionName}:`, error);
                return { success: false, error: error.message };
            }
        },
        
        updateDoc: async function(collectionName, docId, data) {
            try {
                if (!db) return { success: false, error: "Firebase not initialized" };
                
                const docRef = db.collection(collectionName).doc(docId);
                await docRef.update({
                    ...data,
                    updatedAt: new Date()
                });
                
                return { success: true };
            } catch (error) {
                console.error(`Error updating document in ${collectionName}:`, error);
                return { success: false, error: error.message };
            }
        }
    }
};

// Dummy data for development when Firebase can't be reached
const dummyData = {
    inventory: {
        items: [
            { id: 1, name: 'Hanskar (S)', category: 'Hlífðarbúnaður', currentStock: 300, unit: 'kassar', minRequired: 100, averageUsage: 10, lastRestocked: '2024-02-28', status: 'Góð staða', stockPercentage: 85 },
            { id: 2, name: 'Hanskar (M)', category: 'Hlífðarbúnaður', currentStock: 400, unit: 'kassar', minRequired: 150, averageUsage: 15, lastRestocked: '2024-02-28', status: 'Góð staða', stockPercentage: 85 },
            { id: 3, name: 'Hanskar (L)', category: 'Hlífðarbúnaður', currentStock: 150, unit: 'kassar', minRequired: 50, averageUsage: 5, lastRestocked: '2024-02-28', status: 'Góð staða', stockPercentage: 85 },
            { id: 4, name: 'Andlitsgrímur', category: 'Hlífðarbúnaður', currentStock: 200, unit: 'kassar', minRequired: 300, averageUsage: 40, lastRestocked: '2024-01-15', status: 'Viðvörun', stockPercentage: 20 }
        ]
    },
    staff: {
        nurses: [
            { id: 1, name: 'Sara Jónsdóttir', role: 'Hjúkrunarfræðingur', shift: 'Morgun', wing: 'A', status: 'available', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nurse1' },
            { id: 2, name: 'Mikael Kristjánsson', role: 'Sjúkraliði', shift: 'Kvöld', wing: 'B', status: 'available', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nurse2' }
        ]
    }
};

// Add to window object for global access
window.firebaseHelper = firebaseHelper;
window.dummyData = dummyData;

// Initialize Firebase when the script loads
document.addEventListener('DOMContentLoaded', function() {
    initFirebase();
});