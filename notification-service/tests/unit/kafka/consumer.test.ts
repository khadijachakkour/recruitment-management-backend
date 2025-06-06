import { kafkaConsumer } from "../../../src/kafka/consumer";
import Notification from "../../../src/models/notification";
import { Kafka } from "kafkajs";

jest.mock("kafkajs");
jest.mock("../../../src/models/notification");

describe("kafkaConsumer", () => {
  let mockIo: any;
  let mockConsumer: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock io
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    // Mock Kafka consumer
    mockConsumer = {
      connect: jest.fn(),
      subscribe: jest.fn(),
      run: jest.fn(),
    };
    (Kafka as any).mockImplementation(() => ({
      consumer: () => mockConsumer,
    }));
  });

  it("consomme un message entretien_planifie et enregistre une notification", async () => {
    const fakeEvent = {
      candidatId: "c1",
      offer_title: "Développeur",
      date: "2024-06-01T10:30:00Z",
      recruteurName: "Alice",
      companyName: "ACME",
      type: "Visio",
      jitsiUrl: "https://jitsi.test/room",
    };
    const fakeMessage = {
      value: Buffer.from(JSON.stringify(fakeEvent)),
    };
    const eachMessage = async ({ topic, message }: any) => {
      await mockConsumer.run.mock.calls[0][0].eachMessage({ topic, message });
    };

    (Notification.create as jest.Mock).mockResolvedValue({ id: 1, ...fakeEvent, message: "msg" });

    await kafkaConsumer(mockIo);

    // Simule la réception d'un message
    await eachMessage({ topic: "entretien_planifie", message: fakeMessage });

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        candidatId: "c1",
        message: expect.stringContaining("Votre entretien pour le poste"),
        url: "https://jitsi.test/room",
        read: false,
      })
    );
    expect(mockIo.to).toHaveBeenCalledWith("c1");
    expect(mockIo.emit).toHaveBeenCalledWith("notification", expect.objectContaining({ id: 1 }));
  });

  it("consomme un message candidature_refusee", async () => {
    const fakeEvent = { candidatId: "c2", offer_title: "Designer" };
    const fakeMessage = { value: Buffer.from(JSON.stringify(fakeEvent)) };
    const eachMessage = async ({ topic, message }: any) => {
      await mockConsumer.run.mock.calls[0][0].eachMessage({ topic, message });
    };
    (Notification.create as jest.Mock).mockResolvedValue({ id: 2, ...fakeEvent, message: "msg" });

    await kafkaConsumer(mockIo);
    await eachMessage({ topic: "candidature_refusee", message: fakeMessage });

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        candidatId: "c2",
        message: expect.stringContaining("nous sommes au regret"),
        read: false,
      })
    );
    expect(mockIo.to).toHaveBeenCalledWith("c2");
    expect(mockIo.emit).toHaveBeenCalledWith("notification", expect.objectContaining({ id: 2 }));
  });

  it("consomme un message candidature_acceptee", async () => {
    const fakeEvent = { candidatId: "c3", offer_title: "Chef de projet" };
    const fakeMessage = { value: Buffer.from(JSON.stringify(fakeEvent)) };
    const eachMessage = async ({ topic, message }: any) => {
      await mockConsumer.run.mock.calls[0][0].eachMessage({ topic, message });
    };
    (Notification.create as jest.Mock).mockResolvedValue({ id: 3, ...fakeEvent, message: "msg" });

    await kafkaConsumer(mockIo);
    await eachMessage({ topic: "candidature_acceptee", message: fakeMessage });

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        candidatId: "c3",
        message: expect.stringContaining("Félicitations"),
        read: false,
      })
    );
    expect(mockIo.to).toHaveBeenCalledWith("c3");
    expect(mockIo.emit).toHaveBeenCalledWith("notification", expect.objectContaining({ id: 3 }));
  });

  it("gère les erreurs lors de la création de notification", async () => {
    const fakeEvent = { candidatId: "c4" };
    const fakeMessage = { value: Buffer.from(JSON.stringify(fakeEvent)) };
    const eachMessage = async ({ topic, message }: any) => {
      await mockConsumer.run.mock.calls[0][0].eachMessage({ topic, message });
    };
    (Notification.create as jest.Mock).mockRejectedValue(new Error("fail"));

    await kafkaConsumer(mockIo);
    await eachMessage({ topic: "candidature_acceptee", message: fakeMessage });

    expect(Notification.create).toHaveBeenCalled();
  });
});