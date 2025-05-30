import axios from "axios";
import Candidature from "../models/candidature";

export async function getCvsAndRank(offerDescription: string, offerId: number) {
  // Récupérer tous les CVs des candidatures pour cette offre
  const candidatures = await Candidature.findAll({ where: { offer_id: offerId } });
  const resumes = candidatures.map((c: any) => c.cv_url);
  if (resumes.length === 0) return [];

  // Envoi correct des URLs de CVs (un champ resumes par URL)
  const params = new URLSearchParams();
  params.append("job_desc", offerDescription);
  params.append("is_scanned", "false");
  resumes.forEach(url => params.append("resumes", url));

  const url = process.env.CV_MATCHING_SERVICE_URL || "http://localhost:8000/api/rank_cvs/";
  const response = await axios.post(
    url,
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return response.data;
}
