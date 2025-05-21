CV Matching Service
Microservice FastAPI pour classer les CV en fonction de leur pertinence pour une description de poste.
Prérequis

Docker (optionnel, pour le déploiement conteneurisé)
Python 3.9+
Tesseract OCR et Poppler installés (pour l'extraction PDF)

Installation

Cloner le dépôt :
git clone <repository-url>
cd cv-matching-service


Installer les dépendances :
pip install -r requirements.txt


Copier le modèle entraîné dans app/cv_offer_matching_model_binary_final.

Lancer l'application localement :
uvicorn app.main:app --host 0.0.0.0 --port 8000



Utilisation avec Docker

Construire l'image Docker :
docker build -t cv-matching-service .


Lancer le conteneur :
docker run -p 8000:8000 -v $(pwd)/cv_offer_matching_model_binary_final:/app/cv_offer_matching_model_binary_final cv-matching-service



API Endpoints

POST /rank_cvs/

Description : Classe les CV par pertinence.
Paramètres :
job_desc (str) : Description de poste.
files (List[UploadFile], optionnel) : Fichiers PDF des CV.
resumes (List[str], optionnel) : CV sous forme de texte brut.
is_scanned (bool, optionnel) : Indique si les PDF sont scannés (OCR requis).


Réponse : Liste des CV classés avec leurs scores.
Exemple :curl -X POST "http://localhost:8000/rank_cvs/" \
  -F "job_desc=Ingénieur logiciel avec 5 ans d'expérience en Python et AWS." \
  -F "files=@cv1.pdf" \
  -F "files=@cv2.pdf"




GET /health

Description : Vérifie l'état du service.
Réponse : {"status": "healthy", "model_loaded": true}



Déploiement

Copiez le dossier du modèle entraîné (cv_offer_matching_model_binary_final) dans le conteneur ou le répertoire de l'application.
Configurez une variable d'environnement MODEL_PATH si le modèle est stocké ailleurs.

Notes

Les CV PDF doivent être lisibles (textuels ou scannés avec OCR).
Le modèle prend en charge le français et l'anglais.
Ajustez les mots-clés et les poids des sections dans cv_matcher.py selon vos besoins.

