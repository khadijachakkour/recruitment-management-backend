import os
import shutil
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
from app.models.cv_matcher import CVMatcher
import requests
from urllib.parse import urlparse
import consul
from contextlib import asynccontextmanager

# Configuration de la journalisation
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Consul configuration
consul_host = os.getenv("CONSUL_HOST", "localhost")
consul_port = int(os.getenv("CONSUL_PORT", "8500"))
service_host = os.getenv("SERVICE_HOST","host.docker.internal")
service_port = int(os.getenv("PORT", "8000"))
service_id = f"cv-matching-service-{service_port}"

# Lifespan handler for Consul registration and deregistration
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Register service with Consul
    try:
        c = consul.Consul(host=consul_host, port=consul_port)
        c.agent.service.register(
            name="cv-matching-service",
            service_id=service_id,
            address=service_host,
            port=service_port,
            check=consul.Check.http(
                url=f"http://{service_host}:{service_port}/health",
                interval="10s",
                timeout="5s"
            )
        )
        logger.info("cv-matching-service registered with Consul")
    except Exception as e:
        logger.error(f"Failed to register with Consul: {e}")
        raise

    yield  # Application runs here

    # Shutdown: Deregister service from Consul
    try:
        c = consul.Consul(host=consul_host, port=consul_port)
        c.agent.service.deregister(service_id)
        logger.info("cv-matching-service deregistered from Consul")
    except Exception as e:
        logger.error(f"Failed to deregister from Consul: {e}")

app = FastAPI(title="CV Matching Service", version="1.0.0", lifespan=lifespan)

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
    # Validation stricte
    if (not resumes or all(r.strip() == "" for r in resumes)) and not files:
        logger.error("Aucun CV fourni")
        raise HTTPException(status_code=400, detail="Fournissez au moins un CV (PDF ou texte)")
    if files and resumes and any(r.strip() for r in resumes):
        logger.error("CV PDF et texte fournis simultanément")
        raise HTTPException(status_code=400, detail="Fournissez soit des fichiers PDF, soit du texte, pas les deux")

    logger.info("Début du traitement de la requête de classement des CV")

    # Validation des entrées
    if not job_desc.strip():
        logger.error("Description de poste vide")
        raise HTTPException(status_code=400, detail="La description de poste est requise")

    temp_dir = "temp_cvs"
    pdf_paths = None
    url_to_local = {}
    try:
        # Si resumes contient des URLs PDF, les télécharger
        if resumes and all(isinstance(r, str) and r.lower().startswith("http") and r.lower().endswith(".pdf") for r in resumes):
            os.makedirs(temp_dir, exist_ok=True)
            pdf_paths = []
            for idx, url in enumerate(resumes):
                filename = os.path.basename(urlparse(url).path)
                local_path = os.path.join(temp_dir, f"{idx}_{filename}")
                try:
                    with requests.get(url, stream=True, timeout=10) as r:
                        r.raise_for_status()
                        with open(local_path, "wb") as f:
                            for chunk in r.iter_content(chunk_size=8192):
                                f.write(chunk)
                    pdf_paths.append(local_path)
                    url_to_local[local_path] = url
                except Exception as e:
                    logger.error(f"Erreur lors du téléchargement du PDF {url} : {e}")
                    raise HTTPException(status_code=400, detail=f"Impossible de télécharger le PDF: {url}")
            logger.info(f"PDFs téléchargés depuis URLs: {pdf_paths}")
            files = None
        # Gestion des fichiers PDF
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
        ranked_cvs = cv_matcher.rank_cvs(job_desc, resumes, is_pdf=bool(pdf_paths), pdf_paths=pdf_paths, is_scanned=is_scanned)
        logger.info(f"Classement terminé : {len(ranked_cvs)} CV classés")
        # Préparer la réponse
        def get_url_from_path(cv_path):
            if url_to_local and cv_path in url_to_local:
                return url_to_local[cv_path]
            return cv_path
        results = [
            RankingResponse(rank=i + 1, cv=get_url_from_path(cv_path), score=float(score))
            for i, (cv_path, score) in enumerate(ranked_cvs)
        ]
        return results

    except HTTPException as e:
        raise e
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