import os
import shutil
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware  # Ajout de l'import
from typing import List
from pydantic import BaseModel
from models.cv_matcher import CVMatcher

# Configuration de la journalisation
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="CV Matching Service", version="1.0.0")

# Ajout du middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

# Initialiser le modèle au démarrage
model_path = os.getenv("MODEL_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "cv_offer_matching_model_binary_final"))
try:
    cv_matcher = CVMatcher(model_path)
except Exception as e:
    logger.error(f"Erreur lors du chargement du modèle : {e}")
    raise HTTPException(status_code=500, detail="Erreur lors de l'initialisation du modèle")

class RankingResponse(BaseModel):
    rank: int
    cv: str
    score: float

@app.post("/api/rank_cvs/", response_model=List[RankingResponse])
async def rank_cvs(
    job_desc: str = Form(...),
    files: List[UploadFile] = File(None),
    resumes: List[str] = Form(None),
    is_scanned: bool = Form(False)
):
    """
    Classe les CV en fonction de leur pertinence pour une description de poste.
    Accepte des CV sous forme de fichiers PDF ou de texte brut.
    """
    logger.info("Début du traitement de la requête de classement des CV")

    # Validation des entrées
    if not job_desc.strip():
        logger.error("Description de poste vide")
        raise HTTPException(status_code=400, detail="La description de poste est requise")
    
    if not files and not resumes:
        logger.error("Aucun CV fourni")
        raise HTTPException(status_code=400, detail="Fournissez au moins un CV (PDF ou texte)")
    
    if files and resumes:
        logger.error("CV PDF et texte fournis simultanément")
        raise HTTPException(status_code=400, detail="Fournissez soit des fichiers PDF, soit du texte, pas les deux")

    # Gestion des fichiers PDF
    temp_dir = "temp_cvs"
    pdf_paths = None
    try:
        if files:
            os.makedirs(temp_dir, exist_ok=True)
            pdf_paths = []
            for file in files:
                if not file.filename.lower().endswith(".pdf"):
                    logger.error(f"Fichier non PDF : {file.filename}")
                    raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")
                pdf_path = os.path.join(temp_dir, file.filename)
                with open(pdf_path, "wb") as f:
                    shutil.copyfileobj(file.file, f)
                pdf_paths.append(pdf_path)
            logger.info(f"Fichiers PDF téléversés : {pdf_paths}")
        
        # Classer les CV
        ranked_cvs = cv_matcher.rank_cvs(job_desc, resumes, is_pdf=bool(files), pdf_paths=pdf_paths, is_scanned=is_scanned)
        logger.info(f"Classement terminé : {len(ranked_cvs)} CV classés")

        # Préparer la réponse
        results = [
            RankingResponse(rank=i + 1, cv=cv_path, score=float(score))
            for i, (cv_path, score) in enumerate(ranked_cvs)
        ]
        return results

    except Exception as e:
        logger.error(f"Erreur lors du classement : {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Nettoyer les fichiers temporaires
        if pdf_paths:
            for pdf_path in pdf_paths:
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)
            if os.path.exists(temp_dir) and not os.listdir(temp_dir):
                os.rmdir(temp_dir)
                logger.info("Répertoire temporaire supprimé")

@app.get("/health")
async def health_check():
    """Vérifie l'état du service."""
    return {"status": "healthy", "model_loaded": cv_matcher is not None}
