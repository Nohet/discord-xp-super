import Database from 'better-sqlite3'

export default function checkTables(databaseName: string): void {
    const db = new Database(databaseName)

    db.exec(`CREATE TABLE IF NOT EXISTS levels (
            userID TEXT NOT NULL,
            guildID TEXT NOT NULL,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 0,
            lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (userID, guildID)
        );`)
    db.exec(`CREATE TABLE IF NOT EXISTS rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guildID TEXT NOT NULL,
            lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP
        );`)
    db.exec(`CREATE TABLE IF NOT EXISTS reward_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rewardId INTEGER NOT NULL,
            level INTEGER NOT NULL,
            roleId TEXT NOT NULL,
            FOREIGN KEY (rewardId) REFERENCES rewards(id) ON DELETE CASCADE
        );`)

    db.close()
}