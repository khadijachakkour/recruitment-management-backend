import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../app')))
import pytest
from unittest.mock import MagicMock, patch
from models.cv_matcher import CVMatcher

@pytest.fixture
def mock_cv_matcher():
    with patch("models.cv_matcher.SentenceTransformer") as mock_model:
        mock_instance = MagicMock()
        mock_instance.encode.side_effect = lambda texts, **kwargs: MagicMock(
            cpu=lambda: MagicMock(
                numpy=lambda: [[1.0, 2.0, 3.0]] * len(texts)
            )
        )
        mock_model.return_value = mock_instance
        matcher = CVMatcher("fake-model-path")
        yield matcher

@patch("models.cv_matcher.segment_cv", return_value={"experience": "exp", "skills": "skills", "education": "edu"})
def test_rank_cvs_text(mock_segment, mock_cv_matcher):
    resumes = ["CV1 text", "CV2 text"]
    job_desc = "Job description"
    result = mock_cv_matcher.rank_cvs(job_desc, resumes, is_pdf=False)
    assert isinstance(result, list)
    assert len(result) == 2
    assert all(isinstance(score, float) for _, score in result)


@patch("models.cv_matcher.extract_text_from_pdf", return_value="CV PDF text")
@patch("models.cv_matcher.segment_cv", return_value={"experience": "exp", "skills": "skills", "education": "edu"})
def test_rank_cvs_pdf(mock_segment, mock_extract, mock_cv_matcher):
    resumes = ["dummy"]  
    pdf_paths = ["cv1.pdf"]
    job_desc = "Job description"
    result = mock_cv_matcher.rank_cvs(job_desc, resumes, is_pdf=True, pdf_paths=pdf_paths)
    assert isinstance(result, list)
    assert result[0][0] == "cv1.pdf"