import sys
import os

# Ajoute le dossier racine du projet au PYTHONPATH pour les imports absolus
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
