import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

const nonJsonRpcRoutingKey = 'non-json-rpc-2';
const nonJsonSubmoduleRpcRoutingKey = 'non-json-rpc-submodule';

describe('Rabbit Controller RPC', () => {
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
      exchange: 'exchange2',
      routingKey: 'rpc-2',
      payload: {
        request: 'val',
      },
    });

    expect(response).toEqual({
      data: { echo: { request: 'val' } },
      error: null,
    });
  });

  it('intercepted RPC handler should receive a transformed RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'intercepted-rpc-2',
    });

    expect(response).toEqual({
      data: { transformed: { message: 42 } },
      error: null,
    });
  });

  it('guarded RPC handler should receive a RPC error response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'guarded-rpc-2',
      payload: 41,
    });

    expect(response).toMatchObject({ data: null, error: expect.any(Object) });
  });

  it('guarded RPC handler should receive a RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'guarded-rpc-2',
      payload: 42,
    });

    expect(response).toEqual({ data: { message: 'success' }, error: null });
  });

  it('piped RPC handler should receive a RPC error response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'piped-rpc-2',
      payload: 41,
    });

    expect(response).toMatchObject({ data: null, error: expect.any(Object) });
  });

  it('piped RPC handler should receive a RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'piped-rpc-2',
      payload: 42,
    });

    expect(response).toEqual({ data: { message: 42 }, error: null });
  });

  it('piped RPC handler should receive a RPC error response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'piped-param-rpc-2',
      payload: 41,
    });

    expect(response).toMatchObject({ data: null, error: expect.any(Object) });
  });

  it('piped RPC handler should receive a RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'piped-param-rpc-2',
      payload: 42,
    });

    expect(response).toEqual({ data: { message: 42 }, error: null });
  });

  it('error reply RPC handler with non-JSON message should return an RPC error response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'error-reply-rpc-2',
      payload: Buffer.from('{a:'),
    });

    expect(response).toMatchObject({ data: null, error: expect.any(Object) });
  });

  it('non-JSON RPC handler with should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
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
      exchange: 'exchange2',
      routingKey: nonJsonRpcRoutingKey,
      payload: Buffer.alloc(0),
    });

    expect(response).toEqual({ data: { echo: '' }, error: null });
  });

  it('non-JSON RPC handler with unparsable message should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: nonJsonRpcRoutingKey,
      payload: Buffer.from('{a:'),
    });

    expect(response).toEqual({ data: { echo: '{a:' }, error: null });
  });

  it('hash wildcard RPC handler should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'hash-wildcard-rpc.some-end',
    });

    expect(response).toEqual({
      data: {
        message: 'success-hash-wildcard-rpc.#',
      },
      error: null,
    });
  });

  it('star wildcard RPC handler should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'star-wildcard-rpc.middle.end',
    });

    expect(response).toEqual({
      data: {
        message: 'success-star-wildcard-rpc.*.end',
      },
      error: null,
    });
  });

  it('SUBMODULE: regular RPC handler should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'rpc-submodule',
      payload: {
        request: 'val',
      },
    });

    expect(response).toEqual({
      data: { echo: { request: 'val' } },
      error: null,
    });
  });

  it('SUBMODULE: intercepted RPC handler should receive a transformed RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'intercepted-rpc-submodule',
    });

    expect(response).toEqual({
      data: { transformed: { message: 42 } },
      error: null,
    });
  });

  it('SUBMODULE: guarded RPC handler should receive a RPC error response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'guarded-rpc-submodule',
      payload: 41,
    });

    expect(response).toMatchObject({ data: null, error: expect.any(Object) });
  });

  it('SUBMODULE: guarded RPC handler should receive a RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'guarded-rpc-submodule',
      payload: 42,
    });

    expect(response).toEqual({ data: { message: 'success' }, error: null });
  });

  it('SUBMODULE: piped RPC handler should receive a RPC error response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'piped-rpc-submodule',
      payload: 41,
    });

    expect(response).toMatchObject({ data: null, error: expect.any(Object) });
  });

  it('SUBMODULE: piped RPC handler should receive a RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'piped-rpc-submodule',
      payload: 42,
    });

    expect(response).toEqual({ data: { message: 42 }, error: null });
  });

  it('SUBMODULE: piped RPC handler should receive a RPC error response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'piped-param-rpc-submodule',
      payload: 41,
    });

    expect(response).toMatchObject({ data: null, error: expect.any(Object) });
  });

  it('SUBMODULE: piped RPC handler should receive a RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'piped-param-rpc-submodule',
      payload: 42,
    });

    expect(response).toEqual({ data: { message: 42 }, error: null });
  });

  it('SUBMODULE: error reply RPC handler with non-JSON message should return an RPC error response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'error-reply-rpc-submodule',
      payload: Buffer.from('{a:'),
    });

    expect(response).toMatchObject({ data: null, error: expect.any(Object) });
  });

  it('SUBMODULE: non-JSON RPC handler with should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: nonJsonSubmoduleRpcRoutingKey,
      payload: {
        request: 'val',
      },
    });

    expect(response).toEqual({
      data: { echo: { request: 'val' } },
      error: null,
    });
  });

  it('SUBMODULE: non-JSON RPC handler with undefined message should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: nonJsonSubmoduleRpcRoutingKey,
      payload: Buffer.alloc(0),
    });

    expect(response).toEqual({ data: { echo: '' }, error: null });
  });

  it('SUBMODULE: non-JSON RPC handler with unparsable message should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: nonJsonSubmoduleRpcRoutingKey,
      payload: Buffer.from('{a:'),
    });

    expect(response).toEqual({ data: { echo: '{a:' }, error: null });
  });

  it('SUBMODULE: hash wildcard RPC handler should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'hash-wildcard-rpc-submodule.some-end',
    });

    expect(response).toEqual({
      data: {
        message: 'success-hash-wildcard-rpc-submodule.#',
      },
      error: null,
    });
  });

  it('SUBMODULE: star wildcard RPC handler should receive a valid RPC response', async () => {
    const response = await amqpConnection.request({
      exchange: 'exchange2',
      routingKey: 'star-wildcard-rpc-submodule.middle.end',
    });

    expect(response).toEqual({
      data: {
        message: 'success-star-wildcard-rpc-submodule.*.end',
      },
      error: null,
    });
  });
});
