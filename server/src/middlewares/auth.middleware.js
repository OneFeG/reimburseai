import admin from "firebase-admin";

import { FIREBASE_CONFIG } from "../../config.js";

let firebaseApp;
if (!admin.apps.length) {
  if (!FIREBASE_CONFIG) {
    throw new Error("FIREBASE_CONFIG is missing");
  }
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(FIREBASE_CONFIG),
  });
} else {
  firebaseApp = admin.app();
}

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "No token provided or invalid format" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await firebaseApp.auth().verifyIdToken(idToken);

    // Attach user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      //picture: decodedToken.picture
    };

    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
