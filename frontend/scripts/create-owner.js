import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Very simple dotenv parser for the script
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
  measurementId: envVars.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const createOwner = async () => {
  try {
    console.log('Creating owner Shashank Raj (shashankraj7604@gmail.com)...');
    // Using a default password, you should change this immediately after logging in!
    const userCredential = await createUserWithEmailAndPassword(auth, 'shashankraj7604@gmail.com', 'admin1234');
    const user = userCredential.user;
    
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role: 'owner',
      name: 'Shashank Raj'
    });
    
    console.log('✅ Owner created successfully! Email: shashankraj7604@gmail.com | Password: admin1234');
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
       console.log('✅ Owner account already exists in Firebase.');
       process.exit(0);
    } else {
       console.error('❌ Failed to create owner:', error);
       process.exit(1);
    }
  }
};

createOwner();
