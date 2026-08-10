import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'owner' or 'worker'
  const [assignedWarehouseId, setAssignedWarehouseId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up
  const signup = async (email, password, role, warehouseId = null) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role: role,
      warehouseId: warehouseId
    });
    
    setUserRole(role);
    setAssignedWarehouseId(warehouseId);
    return user;
  };

  // Login
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Logout
  const logout = () => {
    return signOut(auth);
  };

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch role and warehouse from Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setAssignedWarehouseId(data.warehouseId);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setUserRole(null);
        setAssignedWarehouseId(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    assignedWarehouseId,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
