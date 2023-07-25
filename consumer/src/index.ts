import * as dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

import * as amqp from 'amqplib';
import * as express from 'express';
import * as cron from 'node-cron';

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

  console.log(' [x] Sent processed task %s into processed queue.', message);

  await channel.close();
  await connection.close();
}

async function processTask(task: string) {
  task += ' processed';
  return task;
}

async function receiveAndProcessMessage() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(sendQueueName, {durable: true});

  console.log(
    ' [*] Waiting for messages in %s. To exit, press CTRL+C',
    sendQueueName
  );

  channel.consume(
    sendQueueName,
    async msg => {
      if (msg) {
        const task = JSON.parse(msg.content.toString());
        console.log(' [x] Received', task);

        const processedTask = await processTask(task);
        await sendMessageToQueue(receiveQueueName, processedTask);

        channel.ack(msg);
      }
    },
    {noAck: false}
  );
}

// Schedule the receiveAndProcessMessage function to run every 1 minutes
const task = cron.schedule('* * * * *', () => {
  console.log('Running a task with cron');
  receiveAndProcessMessage().catch((error: unknown) => {
    console.error('Error occurred:', error);
  });
});

console.log('M2 Microservice (Consumer) started.');

app.listen(PORT, () => {
  console.log('Consumer Microservice is listening on port', PORT);
  task.start();
});
