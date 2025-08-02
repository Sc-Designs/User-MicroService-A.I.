import amqp from "amqplib";

let connection, channel;

async function connect() {
  if (connection && channel) return channel;
  try {
    connection = await amqp.connect(process.env.RABBIT_URL);
    channel = await connection.createChannel();
    console.log("🐇 RabbitMQ Connected Successfully");
    return channel;
  } catch (err) {
    console.error("❌ Failed to connect to RabbitMQ:", err);
  }
}

async function subscribeToQueue(queueName, callback) {
  const ch = await connect();
  await ch.assertQueue(queueName);

  ch.consume(queueName, (message) => {
    if (!message || !message.content) {
      console.error("❌ Empty or malformed message received");
      return;
    }

    const content = JSON.parse(message.content.toString());

    callback(content, message);

    ch.ack(message);
  });
}

// Normal publish
async function publishToQueue(queueName, data, options = {}) {
  const ch = await connect();
  await ch.assertQueue(queueName);
  ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), options);
}

export { connect, subscribeToQueue, publishToQueue };
