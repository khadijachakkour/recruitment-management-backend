import re

def tokenize(text):
    return re.findall(r"\w+|[^\w\s]", text.lower())

def encode(text, vocab, max_len=120):
    tokens = tokenize(text)
    ids = [vocab.get(t, vocab['<UNK>']) for t in tokens]
    if len(ids) > max_len:
        ids = ids[:max_len]
    else:
        ids += [vocab['<PAD>']] * (max_len - len(ids))
    return ids

def decode_sequence(seq, inv_vocab):
    words = []
    for idx in seq:
        if idx == 3:  # <EOS>
            break
        if idx in (0, 2):  # <PAD>, <SOS>
            continue
        words.append(inv_vocab.get(idx, "<UNK>"))
    return " ".join(words)

def format_structured_offer(input_text, generated_text):
    """
    Reformate la description générée pour s'aligner avec une structure professionnelle typique
    """
    def extract(key, default=""):
        match = re.search(rf"\[{key}\]\s*([^\[]+)", input_text, re.IGNORECASE)
        return match.group(1).strip().capitalize() if match else default

    secteur_intro = {
        "technologie": (
            "🚀 Rejoignez un acteur clé de la transformation numérique : intégrez une entreprise technologique innovante, tournée vers l’excellence et l’agilité, où vos compétences techniques seront mises en valeur dans des projets à fort impact."),
        "santé": (
            "💡 Engagez-vous dans un secteur humain et essentiel, en participant activement à l'amélioration des soins "
            "grâce à des solutions médicales innovantes et impactantes.\n"),
        "finance": (
            "🚀 Faites partie d'une institution financière moderne, où l'excellence, la rigueur et la technologie se "
            "combinent pour façonner l'avenir économique.\n")
    }

    profil_dict = {
        "junior": (
            "Vous êtes en début de carrière, animé(e) par l’envie d’apprendre et de relever de nouveaux défis. "
            "Nous recherchons un profil dynamique, curieux et doté d’une réelle capacité d’adaptation pour évoluer dans un environnement stimulant.\n\n"
            " Compétences attendues :\n"
            "- Bon esprit d’équipe et sens de la communication\n"
            "- Forte motivation à monter en compétences\n"
            "- Capacité à s’adapter rapidement à de nouveaux environnements\n"),
        "senior": (
            "Fort(e) d’une expérience significative, vous aspirez à contribuer activement à la réussite de projets stratégiques. "
            "Nous recherchons un(e) expert(e) autonome, orienté(e) résultats, capable de guider et d’influencer les décisions techniques.\n\n"
            " Compétences attendues :\n"
            "- Maîtrise technique avérée dans votre domaine\n"
            "- Leadership naturel et esprit d’initiative\n"
            "- Capacité à accompagner les profils plus juniors et à partager vos connaissances\n")
    }

    avantages_dict = {
        "cdi": (
            "- Stabilité de l’emploi avec une vision à long terme\n"
            "- Rémunération attractive et évolutive\n"
            "- Possibilités de progression de carrière\n"
            "- Accès à des formations et à un accompagnement professionnel continu\n"),
        "cdd": (
            "- Opportunité de développer de nouvelles compétences sur une mission à forte valeur ajoutée\n"
            "- Expérience professionnelle enrichissante dans un environnement stimulant\n"
            "- Rémunération alignée avec le marché\n"
            "- Possibilité d’évolution vers un CDI selon les performances et les besoins\n")
    }

    titre = extract("TITRE")
    secteur = extract("SECTEUR")
    lieu = extract("LIEU")
    contrat = extract("CONTRAT").upper()
    experience = extract("EXPÉRIENCE")

    structured = f"""
📝 Titre du poste : {titre}
📍 Localisation : {lieu}
📅 Type de contrat : {contrat}
💼 Expérience requise : {experience.capitalize() if experience else 'Non spécifiée'}
"""

    if secteur.lower() in secteur_intro:
        structured += f"\n{secteur_intro[secteur.lower()].strip()}\n"

    structured += "\nMissions :\n"
    missions_match = re.search(r"missions\s*[:\-]?\s*(.+?)(profil|avantages|$)", generated_text, re.IGNORECASE | re.DOTALL)

    if missions_match:
        missions_text = missions_match.group(1).strip()
        missions_lines = re.split(r"[-•–—]\s*", missions_text)
        missions_lines = [line.strip().capitalize() for line in missions_lines if line.strip()]
        for line in missions_lines:
            structured += f"• {line.strip()}\n"
    else:
        structured += f"{generated_text.strip()}\n"

    structured += "\n🎯 Profil recherché :\n"
    if experience.lower() in profil_dict:
        profil_text = profil_dict[experience.lower()].strip()
        profil_lines = [line.strip("•-–— ") for line in profil_text.split("\n") if line.strip()]
        for line in profil_lines:
            structured += f"• {line.strip()}\n"
    else:
        structured += "• Expérience et compétences en adéquation avec le poste.\n"

    skills = extract("COMPÉTENCES")
    if skills:
        structured += f"\nCompétences requises :\n• " + "\n• ".join([s.strip() for s in skills.split(",") if s.strip()]) + "\n"

    structured += "\n 📌 Avantages :\n"
    if contrat.lower() in avantages_dict:
        avantages_text = avantages_dict[contrat.lower()].strip()
        avantages_lines = [line.strip("•-–— ") for line in avantages_text.split("\n") if line.strip()]
        for line in avantages_lines:
            structured += f"• {line.strip()}\n"
    else:
        structured += "• À discuter selon le profil.\n"

    structured += "\n📩 Comment postuler ?\nEnvoyez votre CV à l'adresse email de l'entreprise.\nNous étudions chaque candidature avec attention.\n"

    structured += "\nProcessus de recrutement :\n1. 📞 Entretien RH (30 min)\n2. 💻 Test technique\n3. 🤝 Entretien final avec le CTO et l’équipe"

    return structured.strip()