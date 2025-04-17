import { Request, Response } from "express";
import { getUserProfile, updateUserProfile, saveCvUrl, saveAvatarUrl } from "../services/profileService";
import { getUserIdFromToken } from "../services/keycloakService";
import cloudinary from "../utils/cloudinary";
import streamifier from "streamifier";
import { PDFDocument } from "pdf-lib";

// Récupérer le profil du candidat
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    console.log(userId);
    if (!userId) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }

    const profile = await getUserProfile(userId);
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du profil", error });
  }
};


// Mettre à jour le profil
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }

    const updatedProfile = await updateUserProfile(userId, req.body);
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du profil", error });
  }
};




interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// 📄 Utilitaire : compresser un fichier PDF
const compressPdf = async (buffer: Buffer): Promise<Buffer> => {
  const pdfDoc = await PDFDocument.load(buffer);
  const copiedPages = await pdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
  const newPdf = await PDFDocument.create();

  copiedPages.forEach((page) => {
    const { width, height } = page.getSize();
    page.setSize(width * 0.9, height * 0.9); // réduction des dimensions (compression légère)
    newPdf.addPage(page);
  });

  return Buffer.from(await newPdf.save());

};

// 📤 Uploader le CV
export const uploadCv = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Aucun fichier reçu" });
      return;
    }

    const fileBuffer = req.file.buffer;
    const fileType = req.file.mimetype;

    let bufferToUpload = fileBuffer;

    // ⚠️ Compresser uniquement si c'est un PDF
    if (fileType === "application/pdf") {
      bufferToUpload = await compressPdf(fileBuffer);
    }

    // Uploader sur Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "raw", folder: "cvs" },
      async (error, result) => {
        if (error || !result) {
          res.status(500).json({ message: "Échec de l'upload sur Cloudinary", error });
          return;
        }

        // Sauvegarder l'URL dans la base
        await saveCvUrl(userId, result.secure_url);
        res.status(200).json({ message: "CV uploadé avec succès", url: result.secure_url });
      }
    );

    // Stream buffer vers Cloudinary
    streamifier.createReadStream(bufferToUpload).pipe(uploadStream);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'upload du CV", error });
  }
};


export const uploadAvatar = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(400).json({ message: "Données manquantes" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: "Aucun fichier reçu" });
      return;
    }
    const profile = await getUserProfile(userId);
    const oldAvatarUrl = profile.avatar_url;
    const oldPublicId = oldAvatarUrl ? oldAvatarUrl.split("/").pop()?.split(".")[0] : undefined;

    const streamUpload = (): Promise<{ secure_url: string }> => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "avatars",
            public_id: oldPublicId || undefined, // Remplacer l'ancien fichier avec le même public_id si disponible, sinon laisser vide
            resource_type: "image",
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        if (!req.file) {
          res.status(400).json({ message: "Aucun fichier reçu" });
          return;
        }
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    };

    const result  = await streamUpload();
    const avatarUrl = result.secure_url;

    await saveAvatarUrl(userId, avatarUrl);

    res.status(200).json({ avatar_url: avatarUrl });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l’upload de l’avatar", error });
  }
};


const extractCloudinaryPublicId = (url: string): string | null => {
  const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)\./);
  return matches ? matches[1] : null;
};


//Suppression image profile
export const deleteAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }
    const profile = await getUserProfile(userId);

    if (!profile.avatar_url) {
       res.status(400).json({ message: "Aucun avatar à supprimer." });
       return;
    }

    const publicId = extractCloudinaryPublicId(profile.avatar_url); // à créer

    if (publicId) {
      const result = await cloudinary.uploader.destroy(publicId);
            console.log(result);

    }

    await saveAvatarUrl(userId, null); // mets avatar_url à null en BDD
    res.status(200).json({ message: "Avatar supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur suppression avatar", error });
  }
};

//Suppression cv
export const deleteCv = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }
    const profile = await getUserProfile(userId);

    if (!profile.cv_url) {
       res.status(400).json({ message: "Aucun CV à supprimer." });
       return;
    }

    const publicId = extractCloudinaryPublicId(profile.cv_url); // à créer
    console.log(publicId);
    if (publicId) {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(result);
    }

    await saveCvUrl(userId, null); // mets cv_url à null en BDD
    res.status(200).json({ message: "CV supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur suppression CV", error });
  }
};