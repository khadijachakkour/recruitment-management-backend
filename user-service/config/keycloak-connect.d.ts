import { Request } from "express";
import { Keycloak } from "keycloak-connect"; 
declare global {
  namespace Express {
    interface Request {
      kauth: Keycloak.KeycloakContext; 
    }
  }
}
