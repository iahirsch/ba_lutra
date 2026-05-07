import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Companion } from './companion.entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class CompanionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CompanionGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastNewCompanion(companion: Companion): void {
    this.server.emit('companion:created', companion);
  }

  broadcastDeletedCompanion(id: string): void {
    this.server.emit('companion:deleted', { id });
  }
}
