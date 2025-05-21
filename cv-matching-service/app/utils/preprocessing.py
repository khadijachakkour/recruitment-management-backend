import re
import spacy
import pdfplumber
import pytesseract
from PIL import Image
from langdetect import detect, DetectorFactory
from fuzzywuzzy import fuzz
import logging
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
logger = logging.getLogger(__name__)

# Fixer la graine pour langdetect
DetectorFactory.seed = 0

# Charger les modèles spaCy
nlp_models = {
    "fr": spacy.load("fr_core_news_sm"),
    "en": spacy.load("en_core_web_sm")
}

def clean_and_anonymize_text(text: str) -> str:
    """Nettoie et anonymise le texte en supprimant les informations sensibles."""
    try:
        text = re.sub(r'\b\d{10}\b', '', text)  # Supprimer numéros de téléphone
        text = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', '', text)  # Supprimer emails
        text = re.sub(r'https?://\S+|www\.\S+|com/\S+', '', text)  # Supprimer URLs
        text = re.sub(r'\s+', ' ', text)  # Normaliser espaces
        return text.replace('\n', ' ').replace('\r', ' ').strip()
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage du texte : {e}")
        return text

def extract_text_from_pdf(pdf_path: str, is_scanned: bool = False) -> str:
    """Extrait le texte d'un PDF, avec prise en charge des PDF scannés via OCR."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            text = " ".join(page.extract_text() or "" for page in pdf.pages)
            if text.strip() and not is_scanned:
                cleaned_text = clean_and_anonymize_text(text)
                logger.info(f"[PDF] Extrait textuel de {pdf_path} : {cleaned_text[:100]}...")
                return cleaned_text
            text = ""
            for page in pdf.pages:
                img = page.to_image()
                text += pytesseract.image_to_string(img.original, lang='fra+eng') + " "
        
        cleaned_text = clean_and_anonymize_text(text)
        logger.info(f"[PDF] Extrait OCR de {pdf_path} : {cleaned_text[:100]}...")
        if not cleaned_text.strip():
            logger.warning(f"Texte extrait vide pour {pdf_path}")
        return cleaned_text
    except Exception as e:
        logger.error(f"Erreur extraction PDF {pdf_path} : {e}")
        return ""

def segment_cv(text: str) -> dict:
    """Segmente un CV en sections (expérience, compétences, éducation, autre)."""
    try:
        if not text.strip():
            return {"experience": "", "skills": "", "education": "", "other": ""}

        french_indicators = [
            "depuis", "actuellement", "diplôme", "école", "entreprise", "poste",
            "responsabilités", "projet", "janvier", "février", "mars", "avril",
            "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre",
            "décembre"
        ]

        try:
            lang = detect(text)
        except:
            lang = "fr"
        text_lower = text.lower()
        french_score = sum(1 for word in french_indicators if word in text_lower)
        if lang == "en" and french_score >= 2:
            lang = "fr"
        if lang not in ["fr", "en"]:
            lang = "fr" if french_score >= 1 else "en"

        nlp = nlp_models.get(lang, nlp_models["fr"])
        text = re.sub(r'\s*([.,;])\s*', r'\1 ', text)
        doc = nlp(text)
        sections = {"experience": [], "skills": [], "education": [], "other": []}
        current_section = "other"
        last_was_education = False

        experience_keywords = [
            "expérience", "éxpérience", "expériences professionnelles", "parcours professionnel",
            "professional experience", "emploi", "postes", "expérience :", "work experience",
            "employment history"
        ]
        skills_keywords = [
            "compétences", "competences", "skills", "aptitudes", "expertise", "abilities",
            "compétences :", "qualifications", "technical skills", "compétency",
            "compétences professionnelles"
        ]
        education_keywords = [
            "formation", "éducation", "education", "diplôme", "études", "formation :",
            "université", "university", "degree", "academic background", "training", "formations"
        ]

        for sent in doc.sents:
            sent_text = sent.text.lower().strip()
            if any(fuzz.ratio(sent_text, k) > 80 or sent_text.startswith(k) or k in sent_text for k in experience_keywords):
                current_section = "experience"
                sections[current_section].append(sent.text)
                last_was_education = False
                continue
            elif any(fuzz.ratio(sent_text, k) > 80 or sent_text.startswith(k) or k in sent_text for k in skills_keywords):
                current_section = "skills"
                sections[current_section].append(sent.text)
                last_was_education = False
                continue
            elif any(fuzz.ratio(sent_text, k) > 80 or sent_text.startswith(k) or k in sent_text for k in education_keywords):
                current_section = "education"
                sections[current_section].append(sent.text)
                last_was_education = True
                continue

            if current_section in ["experience", "skills", "education"]:
                sections[current_section].append(sent.text)
                last_was_education = (current_section == "education")
                continue

            if re.search(r'\b(compétence|skill|aptitude|expertise)\b', sent_text) or \
               (len(sent_text.split()) < 20 and "," in sent_text and not re.search(r'\d{4}', sent_text)):
                sections["skills"].append(sent.text)
                last_was_education = False
                continue

            if any(k in sent_text for k in [
                "master", "licence", "bachelor", "phd", "doctorat", "diplôme", "certificat",
                "université", "university", "école", "institute", "academy", "bts"
            ]) or re.search(r'\bbts\b', sent_text) or last_was_education:
                sections["education"].append(sent.text)
                last_was_education = True
            else:
                sections["other"].append(sent.text)
                last_was_education = False

        skills_sentences = sections["skills"][:]
        sections["skills"] = []
        for sent in skills_sentences:
            sent_text = sent.lower().strip()
            if any(k in sent_text for k in [
                "master", "licence", "bachelor", "phd", "doctorat", "diplôme", "certificat",
                "université", "university", "école", "institute", "academy", "bts"
            ]) or re.search(r'\bbts\b', sent_text):
                sections["education"].append(sent)
            else:
                sections["skills"].append(sent)

        result = {k: " ".join(v)[:2048] for k, v in sections.items()}
        if not result["experience"] and result["other"]:
            other_sentences = result["other"].split(". ")
            experience_sentences = [s for s in other_sentences if re.search(r'\d{4}\s*-\s*(?:\d{4}|présent|present)', s, re.IGNORECASE)]
            result["experience"] = " ".join(experience_sentences)[:2048]
            result["other"] = " ".join([s for s in other_sentences if s not in experience_sentences])[:2048]

        logger.debug(f"Segmentation pour CV (langue détectée : {lang}):")
        for section, text in result.items():
            logger.debug(f"{section}: {text[:100]}..." if text else f"{section}: Vide")
        return result
    except Exception as e:
        logger.error(f"Erreur lors de la segmentation du CV : {e}")
        return {"experience": text[:2048], "skills": "", "education": "", "other": ""}