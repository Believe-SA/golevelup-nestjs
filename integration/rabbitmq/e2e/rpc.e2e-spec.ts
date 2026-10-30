import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { randomUUID } from 'crypto';

const nonJsonRpcRoutingKey = 'non-json-rpc';

describe('Rabbit RPC', () => {
  let app: INestApplication;
  let amqpConnection: AmqpConnection;

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    amqpConnection = app.get<AmqpConnection>(AmqpConnection);
    await app.init();
  });

  it('regular RPC handler should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange1',
      routingKey: 'rpc',
      payload: {
        request: 'val',
      },
    });

    expect(response).toEqual({
      data: { echo: { request: 'val' } },
      error: null,
    });
  });

  it('multiple RPC handler should receive a valid RPC response in parallel', async () => {
    const correlationId = randomUUID();
    const firstResponse = await amqpConnection.request({
      exchange: 'exchange1',
      routingKey: 'delay-rpc',
      correlationId,
      headers: { 'X-Request-ID': randomUUID() },
      payload: {
        request: 'first request',
        delay: 1000,
      },
    });
    const secondResponse = await amqpConnection.request({
      exchange: 'exchange1',
      routingKey: 'delay-rpc',
      correlationId,
      headers: { 'X-Request-ID': randomUUID() },
      payload: {
        request: 'second request',
        delay: 20,
      },
    });

    expect(firstResponse).toEqual({
      data: { echo: { request: 'first request' } },
      error: null,
    });
    expect(secondResponse).toEqual({
      data: { echo: { request: 'second request' } },
      error: null,
    });
  });

  it('intercepted RPC handler should receive a transformed RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange1',
      routingKey: 'intercepted-rpc',
    });

    expect(response).toEqual({
      data: { transformed: { message: 42 } },
      error: null,
    });
  });

  it('error reply RPC handler with non-JSON message should return an RPC error response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange1',
      routingKey: 'error-reply-rpc',
      payload: Buffer.from('{a:'),
    });

    expect(response).toMatchObject({ data: null, error: expect.any(Object) });
  });

  it('non-JSON RPC handler with should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange1',
      routingKey: nonJsonRpcRoutingKey,
      payload: {
        request: 'val',
      },
    });

    expect(response).toEqual({
      data: { echo: { request: 'val' } },
      error: null,
    });
  });

  it('non-JSON RPC handler with undefined message should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange1',
      routingKey: nonJsonRpcRoutingKey,
      payload: Buffer.alloc(0),
    });

    expect(response).toEqual({ data: { echo: '' }, error: null });
  });

  it('non-JSON RPC handler with unparsable message should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange1',
      routingKey: nonJsonRpcRoutingKey,
      payload: Buffer.from('{a:'),
    });

    expect(response).toEqual({ data: { echo: '{a:' }, error: null });
  });
});
