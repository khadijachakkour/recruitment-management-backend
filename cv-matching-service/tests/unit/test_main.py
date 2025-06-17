import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../app')))
import io
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_cv_matcher(monkeypatch):
    mock = MagicMock()
    mock.rank_cvs.return_value = [
        ("temp_cvs/0_cv1.pdf", 0.9),
        ("temp_cvs/1_cv2.pdf", 0.8)
    ]
    monkeypatch.setattr("main.cv_matcher", mock)
    yield

def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"
    assert resp.json()["model_loaded"] is True

def test_rank_cvs_missing_job_desc():
    resp = client.post("/api/rank_cvs/", data={})
    assert resp.status_code == 422  # Erreur de validation FastAPI

def test_rank_cvs_no_files_no_resumes():
    resp = client.post("/api/rank_cvs/", data={"job_desc": "test"})
    assert resp.status_code == 400
    assert "Fournissez au moins un CV" in resp.json()["detail"]

def test_rank_cvs_files_and_resumes():
    data = {
        "job_desc": "test",
        "resumes": ["CV text"],
        "is_scanned": False,  # Booléen, pas une chaîne
    }
    files = [
        ("files", ("cv1.pdf", io.BytesIO(b"PDFDATA"), "application/pdf"))
    ]
    resp = client.post("/api/rank_cvs/", data=data, files=files)
    assert resp.status_code == 400
    assert "soit des fichiers PDF, soit du texte" in resp.json()["detail"]

def test_rank_cvs_non_pdf_file():
    data = {
        "job_desc": "test",
        "is_scanned": False,
    }
    files = [
        ("files", ("cv1.txt", io.BytesIO(b"not a pdf"), "text/plain"))
    ]
    resp = client.post("/api/rank_cvs/", data=data, files=files)
    assert resp.status_code == 400
    assert "Seuls les fichiers PDF" in resp.json()["detail"]

def test_rank_cvs_valid_resumes_text():
    data = {
        "job_desc": "test job",
        "resumes": ["CV1 text", "CV2 text"],  # Liste de chaînes
        "is_scanned": False,
    }
    resp = client.post("/api/rank_cvs/", data=data)
    assert resp.status_code == 200
    result = resp.json()
    assert isinstance(result, list)
    assert result[0]["rank"] == 1
    assert "cv" in result[0]
    assert "score" in result[0]

@patch("main.requests.get")
def test_rank_cvs_valid_resumes_pdf_urls(mock_get):
    # Mock du téléchargement PDF
    mock_resp = MagicMock()
    mock_resp.__enter__.return_value = mock_resp
    mock_resp.iter_content.return_value = [b"PDFDATA"]
    mock_resp.raise_for_status.return_value = None
    mock_get.return_value = mock_resp

    data = {
        "job_desc": "test job",
        "resumes": ["http://example.com/cv1.pdf", "http://example.com/cv2.pdf"],
        "is_scanned": False,
    }
    resp = client.post("/api/rank_cvs/", data=data)
    assert resp.status_code == 200
    result = resp.json()
    assert result[0]["cv"].startswith("http://example.com/") or result[0]["cv"].endswith(".pdf")

def test_rank_cvs_valid_pdf_files(tmp_path):
    data = {
        "job_desc": "test job",
        "is_scanned": False,
    }
    files = [
        ("files", ("cv1.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf")),
        ("files", ("cv2.pdf", io.BytesIO(b"%PDF-1.4 test2"), "application/pdf")),
    ]
    resp = client.post("/api/rank_cvs/", data=data, files=files)
    assert resp.status_code == 200
    result = resp.json()
    assert result[0]["cv"].endswith(".pdf")
    assert result[0]["rank"] == 1

def test_rank_cvs_empty_job_desc():
    data = {
        "job_desc": "   ",
        "resumes": ["CV1"],
        "is_scanned": False,
    }
    resp = client.post("/api/rank_cvs/", data=data)
    assert resp.status_code == 400
    assert "description de poste est requise" in resp.json()["detail"]

def test_rank_cvs_exception_handling(monkeypatch):
    def raise_exception(*args, **kwargs):
        raise Exception("Erreur interne")
    monkeypatch.setattr("main.cv_matcher.rank_cvs", raise_exception)
    data = {
        "job_desc": "test job",
        "resumes": ["CV1 text"],
        "is_scanned": False,
    }
    resp = client.post("/api/rank_cvs/", data=data)
    assert resp.status_code == 500
    assert "Erreur interne" in resp.json()["detail"]

@patch("os.remove")
@patch("os.rmdir")
def test_rank_cvs_cleanup_temp_files(mock_rmdir, mock_remove):
    data = {
        "job_desc": "test job",
        "is_scanned": False,
    }
    files = [
        ("files", ("cv1.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf")),
    ]
    resp = client.post("/api/rank_cvs/", data=data, files=files)
    assert resp.status_code == 200
    assert mock_remove.called or mock_rmdir.called

def test_rank_cvs_is_scanned_flag():
    data = {
        "job_desc": "test job",
        "resumes": ["CV1 text", "CV2 text"],
        "is_scanned": True,  # Test avec True
    }
    resp = client.post("/api/rank_cvs/", data=data)
    assert resp.status_code == 200
    result = resp.json()
    assert isinstance(result, list)
    assert result[0]["rank"] == 1