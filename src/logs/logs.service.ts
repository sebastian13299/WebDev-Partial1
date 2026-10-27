import { randomUUID } from 'node:crypto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { SqliteService } from '../sqlite/sqlite.service';

export class Log {
  id: string;
  action: string;
  request_body: string | null;
  datetime: string;
}

// HTTP methods that are stored in the logs table
export const LOG_ACTIONS = ['GET', 'PUT', 'POST', 'DELETE'];

@Injectable()
export class LogsService implements OnModuleInit {
  constructor(private readonly sqlite: SqliteService) {}

  // Create the logs table on startup if it does not exist yet
  onModuleInit() {
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS log (
        id TEXT PRIMARY KEY NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('GET', 'PUT', 'POST', 'DELETE')),
        request_body TEXT,
        datetime TEXT NOT NULL
      )
    `);
  }

  create(action: string, body: unknown) {
    // Only store the body when the request has one
    const requestBody =
      body && typeof body === 'object' && Object.keys(body).length > 0
        ? JSON.stringify(body)
        : null;

    // The datetime comes from the back-end, not from the database
    const datetime = new Date().toISOString();

    this.sqlite.run(
      'INSERT INTO log (id, action, request_body, datetime) VALUES (?, ?, ?, ?)',
      [randomUUID(), action, requestBody, datetime],
    );
  }

  findAll() {
    return this.sqlite.all<Log>('SELECT * FROM log ORDER BY datetime');
  }
}
