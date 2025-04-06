import multer from "multer";
const storage = multer.memoryStorage(); // stocke le fichier en mémoire pour Cloudinary
const upload = multer({ storage });

export default upload;
