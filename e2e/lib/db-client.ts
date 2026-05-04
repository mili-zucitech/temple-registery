import mysql from 'mysql2/promise';

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: mysql.SslOptions;
}

export class DbClient {
  private connection: mysql.Connection | null = null;

  constructor(private config: DbConfig) {}

  async connect(): Promise<void> {
    const ssl = this.config.ssl ?? {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false,
    };
    this.connection = await mysql.createConnection({ ...this.config, ssl });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  async execute<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.connection) {
      throw new Error('Database not connected. Call connect() first.');
    }
    const [rows] = await this.connection.execute(sql, params);
    return rows as T[];
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.connection) {
      throw new Error('Database not connected. Call connect() first.');
    }
    const [rows] = await this.connection.query(sql, params);
    return rows as T[];
  }

  async transaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
    if (!this.connection) {
      throw new Error('Database not connected. Call connect() first.');
    }
    
    await this.connection.beginTransaction();
    try {
      const result = await fn(this);
      await this.connection.commit();
      return result;
    } catch (error) {
      await this.connection.rollback();
      throw error;
    }
  }

  async getOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const rows = await this.execute<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }
}
