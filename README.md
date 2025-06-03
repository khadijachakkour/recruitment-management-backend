# Recruitment Management Backend

Ce projet est une architecture microservices pour la gestion du recrutement, incluant la gestion des utilisateurs, des offres, des candidatures, des entretiens, des notifications et le matching de CV.

## Structure du projet

```
.
├── docker-compose.yml
├── candidature-service/
├── company-service/
├── cv-matching-service/
├── entretien-service/
├── notification-service/
├── offer-service/
└── user-service/
```

Chaque dossier correspond à un microservice indépendant.

## Microservices

- **user-service** : Gestion des utilisateurs, profils, authentification (Keycloak).
- **company-service** : Gestion des entreprises et départements.
- **offer-service** : Gestion des offres d'emploi.
- **candidature-service** : Gestion des candidatures et upload de CV/lettres.
- **entretien-service** : Gestion des entretiens d'embauche.
- **notification-service** : Notifications en temps réel lors des événements importants du recrutement.
- **cv-matching-service** : Service Python FastAPI pour le matching et le classement des CV.

## Prérequis

- Node.js (>= 16)
- npm
- Python 3.9+ (pour `cv-matching-service`)
- Docker (optionnel, recommandé pour l'orchestration)
- PostgreSQL (base de données)
- Keycloak (authentification)
- Cloudinary (stockage fichiers, CV, avatars...)

## Installation

1. **Cloner le dépôt**

   ```sh
   git clone <repository-url>
   cd recruitment-management-Backend
   ```

2. **Installer les dépendances Node.js**

   ```sh
   cd user-service && npm install
   cd ../company-service && npm install
   cd ../offer-service && npm install
   cd ../candidature-service && npm install
   cd ../entretien-service && npm install
   cd ../notification-service && npm install
   ```

3. **Installer les dépendances Python**

   ```sh
   cd ../cv-matching-service
   pip install -r requirements.txt
   ```

4. **Lancer les services**
   - Avec Docker Compose :
   ```sh
   docker-compose up --build
   ```
   - Ou manuellement :
     - Lancer chaque service Node.js avec `npm run dev` ou `npm start`
     - Lancer le service Python :
       ```sh
       uvicorn app.main:app --host 0.0.0.0 --port 8000
       ```

## Utilisation

Chaque microservice expose ses propres routes API REST, généralement sous `/api/<ressource>`.

## Développement

- Les services Node.js utilisent TypeScript, Express, Sequelize (PostgreSQL).
- Le service de matching utilise FastAPI (Python).
- L’authentification est centralisée via Keycloak.
- Les fichiers (CV, avatars) sont stockés sur Cloudinary.

## Tests

Chaque service peut inclure ses propres tests (voir dossiers `tests/`).
