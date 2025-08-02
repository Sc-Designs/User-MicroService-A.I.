import { v4 as uuidv4 } from "uuid";

const pendingResponses = new Map();

export function setupRpcResponseHandler(subscribeToQueue) {
  subscribeToQueue("send-result", (data, meta) => {
    const correlationId = meta.properties?.correlationId;

    console.log("📥 Response received:", data, "Correlation:", correlationId);

    if (correlationId && pendingResponses.has(correlationId)) {
      const resolve = pendingResponses.get(correlationId);
      pendingResponses.delete(correlationId);
      resolve(data);
    }
  });
}

export function rpcPublish(publishToQueue, queueName, message) {
  return new Promise((resolve) => {
    const correlationId = uuidv4();
    pendingResponses.set(correlationId, resolve);
    publishToQueue(queueName, message, {
      correlationId,
      replyTo: "send-result",
    });
  });
}
