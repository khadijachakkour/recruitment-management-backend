from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import pickle
from app.model import TransformerModel
from app.utils import encode, decode_sequence
import torch.nn.functional as F
from app.utils import encode, decode_sequence, format_structured_offer


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Charger vocabulaire
with open("vocab/input_vocab.pkl", "rb") as f:
    input_vocab = pickle.load(f)
with open("vocab/target_vocab.pkl", "rb") as f:
    target_vocab = pickle.load(f)
inv_target_vocab = {v: k for k, v in target_vocab.items()}

# Charger modèle
model = TransformerModel(len(input_vocab), len(target_vocab))
model.load_state_dict(torch.load("model_weights/best_model.pt", map_location=device))
model.to(device)
model.eval()

class OfferInput(BaseModel):
    titre: str
    secteur: str
    lieu: str
    contrat: str
    competences: str
    experience: str

def generate_description(input_text, max_len=100):
    src_tensor = torch.tensor([encode(input_text, input_vocab)]).to(device)
    generated = [target_vocab['<SOS>']]

    for _ in range(max_len):
        tgt_tensor = torch.tensor([generated]).to(device)
        with torch.no_grad():
            output = model(src_tensor, tgt_tensor)
        logits = output[0, -1] / 0.8  # température
        top_k = 10
        top_k_probs, top_k_idx = torch.topk(logits, top_k)
        probs = F.softmax(top_k_probs, dim=-1)
        next_token_id = top_k_idx[torch.multinomial(probs, 1)].item()

        generated.append(next_token_id)
        if next_token_id == target_vocab['<EOS>']:
            break

    return decode_sequence(generated, inv_target_vocab)

@app.post("/api/GenerateDescription")
def generate_offer(data: OfferInput):
    input_text = (
        f"[TITRE] {data.titre} "
        f"[SECTEUR] {data.secteur} "
        f"[LIEU] {data.lieu} "
        f"[CONTRAT] {data.contrat} "
        f"[COMPÉTENCES] {data.competences} "
        f"[EXPÉRIENCE] {data.experience}"
    ).lower()

    description = generate_description(input_text)
    structured = format_structured_offer(input_text, description)
    return {"description": structured}
