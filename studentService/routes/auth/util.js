const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const axios = require("axios");
const { ROLES } = require("../../../consts");
const fs = require("fs"); 
const path = require("path");

dotenv.config();

const jku = process.env.JWKS_URL || "http://localhost:5001/.well-known/jwks.json";

async function fetchJWKS(url) {
  try {
    const response = await axios.get(url); // Calls http://localhost:5000/.well-known/jwks.json
    return response.data.keys;
  } catch (error) {
    console.error("Error fetching JWKS:", error.message);
    throw new Error("Could not fetch public keys from Auth Service");
  }
}

function getPublicKeyFromJWKS(kid, keys) {
  const key = keys.find((k) => k.kid === kid);

  if (!key) {
    throw new Error("Unable to find a signing key that matches the 'kid'");
  }

  return `-----BEGIN PUBLIC KEY-----\n${key.n}\n-----END PUBLIC KEY-----`;
}

async function verifyJWTWithJWKS(token) {
  try {
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader) {
      return null;
    }

    const { kid } = decodedHeader.header;

    const keys = await fetchJWKS(jku);

    const publicKey = getPublicKeyFromJWKS(kid, keys);

    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
    return decoded;

  } catch (error) {
    console.error("DEBUG ERROR:", error.message);
    return null;
  }
}

// Role-based Access Control Middleware
function verifyRole(requiredRoles) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: "No token provided" });

      const token = authHeader.split(" ")[1];
      const decoded = await verifyJWTWithJWKS(token); 

      // FIX: Check if 'decoded' exists before reading '.roles'
      if (!decoded || !decoded.roles) {
        return res.status(403).json({ message: "Invalid token: Roles not found" });
      }

      const hasRole = requiredRoles.some(role => decoded.roles.includes(role));
      if (!hasRole) {
        return res.status(403).json({ message: "Access denied: Insufficient permissions" });
      }
      if(decoded){
        req.user = decoded; 
        next();
      }
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
}

function restrictStudentToOwnData(req, res, next) {

  if (!req.user || !req.user.roles) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.user.roles.includes(ROLES.PROFESSOR)) {
    return next();
  }

  // If the user is a student, their 'id' in the token must match the ':student_id' in the URL
  if (req.user.roles.includes(ROLES.STUDENT) && req.user.id !== Number(req.params.student_id)) {
    return res.status(403).json({ message: "Access denied: You can only view your own records" });
  }
  next();
}

module.exports = {
  verifyRole,
  restrictStudentToOwnData,
};
