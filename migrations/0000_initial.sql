-- Create APIs table
CREATE TABLE apis (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  owner_id INTEGER NOT NULL
);

-- Create Chats table
CREATE TABLE chats (
  id INTEGER PRIMARY KEY,
  description TEXT,
  created_at INTEGER NOT NULL
);

-- Create API-Chats relationship table
CREATE TABLE api_chats (
  id TEXT PRIMARY KEY,
  api_id TEXT NOT NULL,
  chat_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (api_id) REFERENCES apis(id),
  FOREIGN KEY (chat_id) REFERENCES chats(id)
);

-- Create indexes
CREATE INDEX idx_apis_name ON apis(name);
CREATE INDEX idx_api_chats_api_id ON api_chats(api_id);
CREATE INDEX idx_api_chats_chat_id ON api_chats(chat_id);
CREATE INDEX idx_apis_owner_id ON apis(owner_id); 