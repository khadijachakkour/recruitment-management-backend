import { publishEvent } from "../../../src/kafka/producer";
import { Kafka } from "kafkajs";

jest.mock("kafkajs");

describe("publishEvent", () => {
  let mockProducer: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProducer = {
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };
    (Kafka as any).mockImplementation(() => ({
      producer: () => mockProducer,
    }));
  });

  it("connecte, envoie le message et déconnecte le producteur", async () => {
    const topic = "test-topic";
    const message = { foo: "bar" };

    await publishEvent(topic, message);

    expect(mockProducer.connect).toHaveBeenCalled();
    expect(mockProducer.send).toHaveBeenCalledWith({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    expect(mockProducer.disconnect).toHaveBeenCalled();
  });

  it("propage l'erreur si l'envoi échoue", async () => {
    mockProducer.send.mockRejectedValue(new Error("fail"));

    await expect(publishEvent("topic", { a: 1 })).rejects.toThrow("fail");
    expect(mockProducer.disconnect).toHaveBeenCalled();
  });
});