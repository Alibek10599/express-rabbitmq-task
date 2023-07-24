import dotenv from 'dotenv';
dotenv.config();
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

import amqp from 'amqplib';

const sendQueueName = 'processed_queue';
const receiveQueueName = 'task_queue';

async function sendMessageToQueue(queue: string, message: any) {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(queue, {durable: true});
  await channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });

  console.log(' [x] Sent processed task', message);

  await channel.close();
  await connection.close();
}

async function processTask(task: any) {
  task += ' processed';
  return task;
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
        console.log(' [x] Received', task);

        const processedTask = await processTask(task);
        await sendMessageToQueue(sendQueueName, processedTask);

        channel.ack(msg);
      }
    },
    {noAck: false}
  );
}

receiveAndProcessMessage().catch(error => {
  console.error('Error occurred:', error);
});

console.log('M2 Microservice (Consumer) started.');
