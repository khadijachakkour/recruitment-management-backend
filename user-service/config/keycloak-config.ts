import Keycloak from "keycloak-connect";
import session from "express-session";
import path from "path";

const memoryStore = new session.MemoryStore();

// Charger la configuration depuis keycloak.json
const keycloakConfigPath = path.join(__dirname, "keycloak.json");

const keycloak = new Keycloak({ store: memoryStore }, keycloakConfigPath);

export { keycloak, memoryStore };
