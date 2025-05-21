from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import logging
from utils.preprocessing import segment_cv, extract_text_from_pdf

logger = logging.getLogger(__name__)

class CVMatcher:
    def __init__(self, model_path: str):
        """Initialise le modèle SentenceTransformer."""
        try:
            self.model = SentenceTransformer(model_path)
            logger.info(f"Modèle chargé avec succès depuis {model_path}")
        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle : {e}")
            raise

    def rank_cvs(self, job_desc: str, resumes: list, is_pdf: bool = False, pdf_paths: list = None, is_scanned: bool = False):
        """
        Classe les CV par pertinence pour une description de poste.
        """
        try:
            if is_pdf and pdf_paths:
                resumes = [extract_text_from_pdf(path, is_scanned) for path in pdf_paths]
            
            job_embedding = self.model.encode([job_desc], convert_to_tensor=True, batch_size=32)
            scores = []

            for idx, resume in enumerate(resumes):
                if not resume.strip():
                    logger.warning(f"CV {idx + 1} vide après extraction")
                    scores.append((0.0, idx))
                    continue

                sections = segment_cv(resume)
                section_texts = [
                    sections.get("experience", "") or "",
                    sections.get("skills", "") or "",
                    sections.get("education", "") or ""
                ]

                if not any(section_texts) and sections.get("other", ""):
                    section_texts = [sections["other"][:2048], sections["other"][:2048], sections["other"][:2048]]
                elif not any(section_texts):
                    logger.warning(f"CV {idx + 1} : Toutes les sections sont vides")
                    scores.append((0.0, idx))
                    continue

                section_embeddings = self.model.encode(section_texts, convert_to_tensor=True, batch_size=32)
                norms = np.linalg.norm(section_embeddings.cpu().numpy(), axis=1)
                logger.debug(f"CV {idx + 1} embedding norms: experience={norms[0]:.4f}, skills={norms[1]:.4f}, education={norms[2]:.4f}")

                section_scores = cosine_similarity(
                    job_embedding.cpu().numpy(),
                    section_embeddings.cpu().numpy()
                )[0]
                section_scores = np.clip(section_scores, 0.0, 1.0)
                logger.debug(f"CV {idx + 1} section scores: experience={section_scores[0]:.4f}, skills={section_scores[1]:.4f}, education={section_scores[2]:.4f}")

                final_score = 0.5 * section_scores[0] + 0.4 * section_scores[1] + 0.1 * section_scores[2]
                logger.debug(f"CV {idx + 1} final score: {final_score:.4f}")
                scores.append((final_score, idx))

            ranked_indices = [idx for _, idx in sorted(scores, reverse=True)]
            ranked_cvs = [
                (pdf_paths[i] if is_pdf else resumes[i], scores[i][0])
                for i in ranked_indices
            ]
            return ranked_cvs

        except Exception as e:
            logger.error(f"Erreur lors du classement des CV : {e}")
            raise