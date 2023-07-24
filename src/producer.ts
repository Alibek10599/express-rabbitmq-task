import dotenv from 'dotenv';
dotenv.config();
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

import express from 'express';
import amqp from 'amqplib';

const app = express();
const sendQueueName = 'task_queue';
const receiveQueueName = 'processed_queue';

app.use(express.json());

async function sendMessageToQueue(queue: string, message: any) {
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

async function receiveMessageFromQueue(queue: string) {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(queue, {durable: true});

  console.log(' [*] Waiting for messages in %s. To exit, press CTRL+C', queue);

  const message = await new Promise<any>(resolve => {
    channel.consume(
      queue,
      msg => {
        if (msg) {
          const task = JSON.parse(msg.content.toString());
          console.log(' [x] Received', task);
          channel.ack(msg);
          resolve(task);
        }
      },
      {noAck: false}
    );
  });

  await channel.close();
  await connection.close();
  return message;
}

app.post('/process', async (req, res) => {
  const task = req.body;

  try {
    await sendMessageToQueue(sendQueueName, task);
    const processedTask = await receiveMessageFromQueue(receiveQueueName);
    res.send(processedTask);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send({message: 'An error occurred during processing.'});
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(
    `M1 Microservice (Producer & Consumer) is listening on port ${port}`
  );
});
