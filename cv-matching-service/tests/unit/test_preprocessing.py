import pytest
from unittest.mock import patch, MagicMock
from app.utils.preprocessing import clean_and_anonymize_text, extract_text_from_pdf, segment_cv

def test_clean_and_anonymize_text():
    text = "Contact: 0612345678, mail: test@mail.com, site: https://test.com"
    cleaned = clean_and_anonymize_text(text)
    assert "0612345678" not in cleaned
    assert "test@mail.com" not in cleaned
    assert "https://test.com" not in cleaned

@patch("app.utils.preprocessing.pdfplumber.open")
def test_extract_text_from_pdf_text(mock_pdfplumber):
    # Simule un PDF non scanné avec du texte
    mock_pdf = MagicMock()
    mock_pdf.pages = [MagicMock(extract_text=lambda: "Ceci est un CV.")]
    mock_pdfplumber.return_value.__enter__.return_value = mock_pdf
    result = extract_text_from_pdf("dummy.pdf", is_scanned=False)
    assert "Ceci est un CV." in result

@patch("app.utils.preprocessing.pdfplumber.open")
@patch("app.utils.preprocessing.pytesseract.image_to_string", return_value="Texte OCR")
def test_extract_text_from_pdf_scanned(mock_ocr, mock_pdfplumber):
    # Simule un PDF scanné (pas de texte, OCR utilisé)
    mock_page = MagicMock()
    mock_page.extract_text.return_value = None
    mock_page.to_image.return_value = MagicMock(original="fake_image")
    mock_pdf = MagicMock()
    mock_pdf.pages = [mock_page]
    mock_pdfplumber.return_value.__enter__.return_value = mock_pdf
    result = extract_text_from_pdf("dummy.pdf", is_scanned=True)
    assert "Texte OCR" in result

@patch("app.utils.preprocessing.spacy.load")
@patch("app.utils.preprocessing.detect", return_value="fr")
def test_segment_cv(mock_detect, mock_spacy_load):
    # Simule un modèle spaCy qui segmente en phrases
    mock_nlp = MagicMock()
    mock_sent = MagicMock()
    mock_sent.text = "Expérience professionnelle chez X en 2020."
    mock_nlp.return_value = MagicMock(sents=[mock_sent])
    mock_spacy_load.return_value = mock_nlp.return_value
    text = "Expérience professionnelle chez X en 2020."
    result = segment_cv(text)
    assert "expérience" in result["experience"].lower()