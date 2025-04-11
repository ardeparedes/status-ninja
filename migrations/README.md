# Database Migrations

This directory contains database migrations for Status Ninja Bot.

## Applying Migrations

Run the following command to apply the migrations:

```bash
npx wrangler d1 execute DB --file=./migrations/0000_initial.sql
```

Replace `DB` with your actual database name if different.

### Fresh Migration

If you need to reset your database and start fresh, you can use:

```bash
# Drop all tables first
npx wrangler d1 execute DB --command="DROP TABLE IF EXISTS api_chats; DROP TABLE IF EXISTS apis; DROP TABLE IF EXISTS chats;"

# Then apply the initial migration
npx wrangler d1 execute DB --file=./migrations/0000_initial.sql
```

This will reset the database and recreate it with the proper security schema.

## Migration History

- `0000_initial.sql`: Creates the initial database schema with security features
  - `apis`: Stores API endpoints with name, URL, and owner information
  - `chats`: Stores registered chat information
  - `api_chats`: Stores the relationship between APIs and subscribed chats 