import amqp, {
  type Channel,
  type ChannelModel
} from 'amqplib';

const QUEUE_NAME = 'infraflow.provisioning';

export interface ProvisioningMessage {
  jobId: number;
  requestId: number;
  provider: 'PROXMOX' | 'AWS' | 'AZURE' | 'GCP';
}

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<Channel> => {
  if (channel) {
    return channel;
  }

  const rabbitmqUrl = process.env.RABBITMQ_URL;

  if (!rabbitmqUrl) {
    throw new Error('RABBITMQ_URL is not configured.');
  }

  connection = await amqp.connect(rabbitmqUrl);
  channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, {
    durable: true
  });

  console.log('Connected to RabbitMQ successfully.');

  connection.on('error', (error) => {
    console.error('RabbitMQ connection error:', error);
  });

  connection.on('close', () => {
    console.warn('RabbitMQ connection closed.');
    connection = null;
    channel = null;
  });

  return channel;
};

export const publishProvisioningJob = async (
  message: ProvisioningMessage
): Promise<void> => {
  const rabbitChannel = await connectRabbitMQ();

  const accepted = rabbitChannel.sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify(message)),
    {
      persistent: true,
      contentType: 'application/json'
    }
  );

  if (!accepted) {
    throw new Error('RabbitMQ queue buffer is full.');
  }

  console.log(
    `Provisioning job ${message.jobId} published to RabbitMQ.`
  );
};
