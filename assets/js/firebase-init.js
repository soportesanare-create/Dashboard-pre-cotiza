// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsTM0wSU2_zrqNvh1NEcQ9yIsHJOo-Osc",
  authDomain: "sanare-pre-cotiza.firebaseapp.com",
  projectId: "sanare-pre-cotiza",
  storageBucket: "sanare-pre-cotiza.firebasestorage.app",
  messagingSenderId: "113196101634",
  appId: "1:113196101634:web:3f7a7044b6785093c9771b"
};

// Initialize Firebase using compat API (works better without web server)
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  window.db = db;

  window.saveQuoteToFirebase = async function(quoteData) {
    try {
      const docRef = await db.collection("cotizaciones").add({
        ...quoteData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("Cotización guardada exitosamente en Firebase con ID:", docRef.id);
      return true;
    } catch (error) {
      console.error("Error al guardar la cotización en Firebase:", error);
      return false;
    }
  };
} else {
  console.warn("Firebase no está definido. Revisa tu conexión a internet.");
}
