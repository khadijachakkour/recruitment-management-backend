import express, { Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import Consul from "consul";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], 
  })
);

const consul = new Consul({
  host: process.env.CONSUL_HOST || "localhost",
  port: Number(process.env.CONSUL_PORT) || 8500,
});

const SERVICE_MAP: Record<string, string[]> = {
  "user-service": ["/api/users", "/api/admin"],
  "company-service": ["/api/companies"],
  "offer-service": ["/api/offers"],
  "notification-service": ["/api/notifications"],
  "candidature-service": ["/api/candidatures"],
  "entretien-service": ["/api/entretiens"],
  "cv-matching-service": ["/api/cv-matching"],
};

// --- Implémentation du cache Consul ---
let serviceCache: Record<string, any> = {};
const CACHE_TTL = 10 * 1000; 

async function refreshServiceCache() {
  try {
    serviceCache = await consul.agent.service.list();
  } catch (err) {
    console.error("Erreur lors du rafraîchissement du cache Consul :", err);
  }
}

// Démarre le rafraîchissement périodique
refreshServiceCache();
setInterval(refreshServiceCache, CACHE_TTL);

//utiliser car gateway et les microservices sont en local
function getServiceUrlFromCache(serviceName: string): string | null {
  console.log("Service Cache:", serviceCache);
  const service = Object.values(serviceCache).find(
    (svc: any) => svc.Service === serviceName
  );
  if (service) {
    //remplace host.docker.internal par localhost pour la gateway locale
    const address =
      service.Address === "host.docker.internal" ? "localhost" : service.Address;
    console.log(`Service ${serviceName} trouvé : http://${address}:${service.Port}`);
    return `http://${address}:${service.Port}`;
  }
  console.log(`Service ${serviceName} non trouvé dans le cache`);
  return null;
}

// Middleware dynamique pour chaque service utilisant le cache
Object.entries(SERVICE_MAP).forEach(([serviceName, routePrefixes]) => {
  routePrefixes.forEach((routePrefix) => {
    const proxy = createProxyMiddleware({
      target: "",
      changeOrigin: true,
      router: (req) => {
        const target = getServiceUrlFromCache(serviceName);
        if (!target) {
          throw new Error(`Service ${serviceName} indisponible`);
        }
        return target;
      },
      pathRewrite: {}, 
    });

    app.use((req, res, next) => {
      if (req.url.startsWith(routePrefix)) {
        console.log(`[GATEWAY] ${req.method} ${req.originalUrl} → ${serviceName}`);
        proxy(req, res, next);
      } else {
        next();
      }
    });
  });
});


// Endpoint de test
app.get("/", (req, res) => {
  res.send("API Gateway is running");
});

const PORT = Number(process.env.GATEWAY_PORT) || 3001;
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});