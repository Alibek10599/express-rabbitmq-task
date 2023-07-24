import dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

import express from 'express';
import amqp from 'amqplib';

const app = express();
const sendQueueName = 'task_queue';

app.use(express.json());

async function sendMessageToQueue(queue: string, message: string) {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(queue, {durable: true});
  await channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });

  console.log(' [x] Sent', message);

  await channel.close();
  await connection.close();
}

app.post('/process', async (req, res) => {
  const task = req.body;

  try {
    await sendMessageToQueue(sendQueueName, task);
    res.send(task);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send({message: 'An error occurred during processing.'});
  }
});

app.listen(PORT, () => {
  console.log(`M1 Microservice (Producer) is listening on port ${PORT}`);
});
