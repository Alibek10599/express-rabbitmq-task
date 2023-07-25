import * as dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

import * as amqp from 'amqplib';
import * as express from 'express';

const app = express();
const sendQueueName = 'task_queue';
const receiveQueueName = 'processed_queue';

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

async function receiveAndProcessMessage() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(receiveQueueName, {durable: true});

  console.log(
    ' [*] Waiting for messages in %s. To exit, press CTRL+C',
    receiveQueueName
  );

  channel.consume(
    receiveQueueName,
    async msg => {
      if (msg) {
        const task = JSON.parse(msg.content.toString());
        console.log(' [x] Received %s from processed queue.', task);

        channel.ack(msg);
      }
    },
    {noAck: false}
  );
}

app.post('/process', async (req, res) => {
  const { data } = req.body;

  try {
    await sendMessageToQueue(sendQueueName, data);
    res.send(`Your task ${data} will be processed soon.`);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send({message: 'An error occurred during processing.'});
  }
});

app.listen(PORT, () => {
  console.log(`M1 Microservice (Producer) is listening on port ${PORT}`);
});

setInterval(receiveAndProcessMessage, 16000);