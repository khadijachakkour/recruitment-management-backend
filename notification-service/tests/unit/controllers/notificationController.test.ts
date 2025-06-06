import * as notificationController from "../../../src/controller/notificationController";
import Notification from "../../../src/models/notification";

jest.mock("../../../src/models/notification");

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("notificationController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("retourne 400 si candidatId manquant", async () => {
      const req = { query: {} } as any;
      const res = mockRes();

      await notificationController.getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "candidatId requis" });
    });

    it("retourne les notifications du candidat", async () => {
      const req = { query: { candidatId: "123" } } as any;
      const res = mockRes();
      const notifications = [{ id: 1 }, { id: 2 }];
      (Notification.findAll as jest.Mock).mockResolvedValue(notifications);

      await notificationController.getNotifications(req, res);

      expect(Notification.findAll).toHaveBeenCalledWith({
        where: { candidatId: "123" },
        order: [["createdAt", "DESC"]],
        limit: 20,
      });
      expect(res.json).toHaveBeenCalledWith(notifications);
    });

    it("retourne 500 en cas d'erreur", async () => {
      const req = { query: { candidatId: "123" } } as any;
      const res = mockRes();
      (Notification.findAll as jest.Mock).mockRejectedValue(new Error("fail"));

      await notificationController.getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
    });
  });

  describe("getLastNotification", () => {
    it("retourne 400 si candidatId manquant", async () => {
      const req = { query: {} } as any;
      const res = mockRes();

      await notificationController.getLastNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "candidatId requis" });
    });

    it("retourne la dernière notification", async () => {
      const req = { query: { candidatId: "123" } } as any;
      const res = mockRes();
      const notification = { id: 1 };
      (Notification.findOne as jest.Mock).mockResolvedValue(notification);

      await notificationController.getLastNotification(req, res);

      expect(Notification.findOne).toHaveBeenCalledWith({
        where: { candidatId: "123" },
        order: [["createdAt", "DESC"]],
      });
      expect(res.json).toHaveBeenCalledWith(notification);
    });

    it("retourne 404 si aucune notification trouvée", async () => {
      const req = { query: { candidatId: "123" } } as any;
      const res = mockRes();
      (Notification.findOne as jest.Mock).mockResolvedValue(null);

      await notificationController.getLastNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Aucune notification trouvée" });
    });

    it("retourne 500 en cas d'erreur", async () => {
      const req = { query: { candidatId: "123" } } as any;
      const res = mockRes();
      (Notification.findOne as jest.Mock).mockRejectedValue(new Error("fail"));

      await notificationController.getLastNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
    });
  });

  describe("countUnreadNotifications", () => {
    it("retourne 400 si candidatId manquant", async () => {
      const req = { query: {} } as any;
      const res = mockRes();

      await notificationController.countUnreadNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "candidatId requis" });
    });

    it("retourne le nombre de notifications non lues", async () => {
      const req = { query: { candidatId: "123" } } as any;
      const res = mockRes();
      (Notification.count as jest.Mock).mockResolvedValue(5);

      await notificationController.countUnreadNotifications(req, res);

      expect(Notification.count).toHaveBeenCalledWith({
        where: { candidatId: "123", read: false },
      });
      expect(res.json).toHaveBeenCalledWith({ unreadCount: 5 });
    });

    it("retourne 500 en cas d'erreur", async () => {
      const req = { query: { candidatId: "123" } } as any;
      const res = mockRes();
      (Notification.count as jest.Mock).mockRejectedValue(new Error("fail"));

      await notificationController.countUnreadNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
    });
  });

  describe("markAllAsRead", () => {
    it("retourne 400 si candidatId manquant", async () => {
      const req = { body: {} } as any;
      const res = mockRes();

      await notificationController.markAllAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "candidatId requis" });
    });

    it("marque toutes les notifications comme lues", async () => {
      const req = { body: { candidatId: "123" } } as any;
      const res = mockRes();
      (Notification.update as jest.Mock).mockResolvedValue([1]);

      await notificationController.markAllAsRead(req, res);

      expect(Notification.update).toHaveBeenCalledWith(
        { read: true },
        { where: { candidatId: "123", read: false } }
      );
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("retourne 500 en cas d'erreur", async () => {
      const req = { body: { candidatId: "123" } } as any;
      const res = mockRes();
      (Notification.update as jest.Mock).mockRejectedValue(new Error("fail"));

      await notificationController.markAllAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
    });
  });
});