import Database from 'better-sqlite3'
import { UserLevel, RoleReward, ComputedLeaderboardUser } from '../interfaces/interfaces'
import checkTables from '../database/tables'


function ensureUserExists() {
    return function (
        _: any,
        __: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value

        descriptor.value = function (...args: any[]) {
            const [userId, guildId] = args


            const userExists = DiscordXp.db.prepare(
                'SELECT * FROM levels WHERE userID = ? AND guildID = ?'
            ).get(userId, guildId)


            if (!userExists) {
                DiscordXp.db.prepare(
                    'INSERT INTO levels (userID, guildID, xp, level, lastUpdated) VALUES (?, ?, 0, 0, CURRENT_TIMESTAMP)'
                ).run(userId, guildId)
            }


            return originalMethod.apply(this, args)
        }

        return descriptor
    }
}

class DiscordXp {
    static db: Database.Database

    /**
     * @param {string} [dbPath] - A valid SQLite database path.
     */
    static setDatabase(dbPath: string): void {
        if (!dbPath) throw new TypeError('A database path was not provided.')
        this.db = new Database(dbPath)
        checkTables(dbPath)

        this.db.pragma('journal_mode = WAL')
        this.db.pragma('foreign_keys = ON')
    }

    /**
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [level] - level.
     * @param {string} [roleId] - Level for which the reward will be created.
     */
    static createRoleReward(guildId: string, level: number, roleId: string): RoleReward | boolean {
        if (!guildId) throw new TypeError('A guild id was not provided.')
        if (!level) throw new TypeError('A level was not provided.')
        if (!roleId) throw new TypeError('A role id was not provided.')

        try {

            const guildExists = this.db.prepare('SELECT guildID FROM rewards WHERE guildID = ?').get(guildId)


            if (!guildExists) {
                this.db.prepare('INSERT INTO rewards (guildID) VALUES (?)').run(guildId)
            }


            const rewardExists = this.db.prepare('SELECT * FROM role_rewards WHERE guildID = ? AND level = ?')
                .get(guildId, level)

            if (rewardExists) return false


            const result = this.db.prepare(
                'INSERT INTO role_rewards (guildID, level, roleId) VALUES (?, ?, ?)'
            ).run(guildId, level, roleId)

            if (result.changes > 0) {
                return {
                    guildID: guildId,
                    level: level,
                    roleId: roleId
                }
            }
            return false
        } catch (e) {
            console.log(`Failed to create role reward: ${e}`)
            return false
        }
    }

    /**
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [level] - Level for which the reward will be deleted.
     */
    static deleteRoleReward(guildId: string, level: number): boolean {
        if (!guildId) throw new TypeError('A guild id was not provided.')
        if (!level) throw new TypeError('A level was not provided.')

        try {

            this.db.prepare('UPDATE rewards SET lastUpdated = CURRENT_TIMESTAMP WHERE guildID = ?').run(guildId)


            const result = this.db.prepare(
                'DELETE FROM role_rewards WHERE guildID = ? AND level = ?'
            ).run(guildId, level)

            return result.changes > 0
        } catch (e) {
            console.log(`Failed to delete role reward: ${e}`)
            return false
        }
    }

    /**
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [level] - Level for which the reward will be fetched.
     */
    static fetchRoleReward(guildId: string, level: number): RoleReward | boolean {
        if (!guildId) throw new TypeError('A guild id was not provided.')
        if (!level) throw new TypeError('A level was not provided.')

        try {
            const reward = this.db.prepare(
                'SELECT * FROM role_rewards WHERE guildID = ? AND level = ?'
            ).get(guildId, level)

            if (!reward) return false
            return reward as RoleReward
        } catch (e) {
            console.log(`Failed to fetch role reward: ${e}`)
            return false
        }
    }

    /**
     * @param {any} [client] - Your Discord.Client.
     * @param {string} [guildId] - The guild which entries should be cleaned.
     */
    static async cleanDatabase(client: any, guildId: string): Promise<string[]> {
        if (!client) throw new TypeError('A client was not provided.')
        if (!guildId) throw new TypeError('A guild id was not provided.')

        const users = this.db.prepare('SELECT userID FROM levels WHERE guildID = ?').all(guildId) as { userID: string }[]
        const deletedUsers: string[] = []

        for (const user of users) {
            try {
                await client.users.fetch(user.userID)
            } catch (error) {
                deletedUsers.push(user.userID)
                this.db.prepare('DELETE FROM levels WHERE userID = ? AND guildID = ?').run(user.userID, guildId)
            }
        }

        return deletedUsers
    }

    /**
     * Remember that the user is automatically added to the database when using other methods, e.g., appendXp.
     * @param {string} [userId] - Discord user ID.
     * @param {string} [guildId] - Discord guild ID.
     */
    static createUser(userId: string, guildId: string): UserLevel | boolean {
        if (!userId) throw new TypeError('An user id was not provided.')
        if (!guildId) throw new TypeError('A guild id was not provided.')

        try {

            const user = this.db.prepare('SELECT * FROM levels WHERE userID = ? AND guildID = ?').get(userId, guildId)
            if (user) return false


            const result = this.db.prepare(
                'INSERT INTO levels (userID, guildID, xp, level, lastUpdated) VALUES (?, ?, 0, 0, CURRENT_TIMESTAMP)'
            ).run(userId, guildId)

            if (result.changes > 0) {
                return {
                    userID: userId,
                    guildID: guildId,
                    xp: 0,
                    level: 0,
                    lastUpdated: new Date().toISOString()
                }
            }
            return false
        } catch (e) {
            console.log(`Failed to create user: ${e}`)
            return false
        }
    }

    /**
     * @param {string} [userId] - Discord user id.
     * @param {string} [guildId] - Discord guild id.
     */
    static deleteUser(userId: string, guildId: string): UserLevel | boolean {
        if (!userId) throw new TypeError('An user id was not provided.')
        if (!guildId) throw new TypeError('A guild id was not provided.')

        try {

            const user = this.db.prepare('SELECT * FROM levels WHERE userID = ? AND guildID = ?').get(userId, guildId) as UserLevel
            if (!user) return false


            const result = this.db.prepare('DELETE FROM levels WHERE userID = ? AND guildID = ?').run(userId, guildId)

            if (result.changes > 0) {
                return user
            }
            return false
        } catch (e) {
            console.log(`Failed to delete user: ${e}`)
            return false
        }
    }

    /**
     * @param {string} [userId] - Discord user id.
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [xp] - Amount of xp to append.
     */
    @ensureUserExists()
    static appendXp(userId: string, guildId: string, xp: number): boolean {
        if (!userId) throw new TypeError('An user id was not provided.')
        if (!guildId) throw new TypeError('A guild id was not provided.')
        if (xp <= 0 || !xp || isNaN(parseInt(String(xp)))) throw new TypeError('An amount of xp was not provided/was invalid.')

        try {

            const user = this.db.prepare('SELECT * FROM levels WHERE userID = ? AND guildID = ?').get(userId, guildId) as UserLevel


            const oldLevel = user.level
            const newXp = user.xp + parseInt(String(xp), 10)
            const newLevel = Math.floor(0.1 * Math.sqrt(newXp))


            this.db.prepare(
                'UPDATE levels SET xp = ?, level = ?, lastUpdated = CURRENT_TIMESTAMP WHERE userID = ? AND guildID = ?'
            ).run(newXp, newLevel, userId, guildId)

            return newLevel > oldLevel
        } catch (e) {
            console.log(`Failed to append xp: ${e}`)
            return false
        }
    }

    /**
     * @param {string} [userId] - Discord user id.
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [levels] - Amount of levels to append.
     */
    @ensureUserExists()
    static appendLevel(userId: string, guildId: string, levels: number): UserLevel | boolean {
        if (!userId) throw new TypeError('An user id was not provided.')
        if (!guildId) throw new TypeError('A guild id was not provided.')
        if (!levels) throw new TypeError('An amount of levels was not provided.')

        try {

            const user = this.db.prepare('SELECT * FROM levels WHERE userID = ? AND guildID = ?').get(userId, guildId) as UserLevel


            const newLevel = user.level + parseInt(String(levels), 10)
            const newXp = newLevel * newLevel * 100


            this.db.prepare(
                'UPDATE levels SET xp = ?, level = ?, lastUpdated = CURRENT_TIMESTAMP WHERE userID = ? AND guildID = ?'
            ).run(newXp, newLevel, userId, guildId)


            return {
                ...user,
                level: newLevel,
                xp: newXp,
                lastUpdated: new Date().toISOString()
            }
        } catch (e) {
            console.log(`Failed to append level: ${e}`)
            return false
        }
    }

    /**
     * @param {string} [userId] - Discord user id.
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [xp] - Amount of xp to set.
     */
    @ensureUserExists()
    static setXp(userId: string, guildId: string, xp: number): UserLevel | boolean {
        if (!userId) throw new TypeError('An user id was not provided.')
        if (!guildId) throw new TypeError('A guild id was not provided.')
        if (xp <= 0 || !xp || isNaN(parseInt(String(xp)))) throw new TypeError('An amount of xp was not provided/was invalid.')

        try {

            const user = this.db.prepare('SELECT * FROM levels WHERE userID = ? AND guildID = ?').get(userId, guildId) as UserLevel


            const newXp = parseInt(String(xp), 10)
            const newLevel = Math.floor(0.1 * Math.sqrt(newXp))


            this.db.prepare(
                'UPDATE levels SET xp = ?, level = ?, lastUpdated = CURRENT_TIMESTAMP WHERE userID = ? AND guildID = ?'
            ).run(newXp, newLevel, userId, guildId)


            return {
                ...user,
                xp: newXp,
                level: newLevel,
                lastUpdated: new Date().toISOString()
            }
        } catch (e) {
            console.log(`Failed to set xp: ${e}`)
            return false
        }
    }

    /**
     * @param {string} [userId] - Discord user id.
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [level] - A level to set.
     */
    @ensureUserExists()
    static setLevel(userId: string, guildId: string, level: number): UserLevel | boolean {
        if (!userId) throw new TypeError('An user id was not provided.')
        if (!guildId) throw new TypeError('A guild id was not provided.')
        if (!level) throw new TypeError('A level was not provided.')

        try {

            const user = this.db.prepare('SELECT * FROM levels WHERE userID = ? AND guildID = ?').get(userId, guildId) as UserLevel


            const newLevel = parseInt(String(level), 10)
            const newXp = newLevel * newLevel * 100


            this.db.prepare(
                'UPDATE levels SET xp = ?, level = ?, lastUpdated = CURRENT_TIMESTAMP WHERE userID = ? AND guildID = ?'
            ).run(newXp, newLevel, userId, guildId)


            return {
                ...user,
                level: newLevel,
                xp: newXp,
                lastUpdated: new Date().toISOString()
            }
        } catch (e) {
            console.log(`Failed to set level: ${e}`)
            return false
        }
    }

    /**
     * @param {string} [userId] - Discord user id.
     * @param {string} [guildId] - Discord guild id.
     * @param {boolean} [fetchPosition] - Whether to fetch the user's position.
     */
    @ensureUserExists()
    static fetch(userId: string, guildId: string, fetchPosition: boolean = false): UserLevel | boolean {
        if (!userId) throw new TypeError('An user id was not provided.')
        if (!guildId) throw new TypeError('A guild id was not provided.')

        try {

            const user = this.db.prepare('SELECT * FROM levels WHERE userID = ? AND guildID = ?').get(userId, guildId) as UserLevel

            if (fetchPosition) {

                const positionQuery = this.db.prepare(`
          SELECT COUNT(*) AS position
          FROM levels
          WHERE guildID = ? AND xp > (SELECT xp FROM levels WHERE userID = ? AND guildID = ?)
        `).get(guildId, userId, guildId) as { position: number }

                user.position = positionQuery.position + 1
            }


            user.cleanXp = user.xp - this.xpFor(user.level)
            user.cleanNextLevelXp = this.xpFor(user.level + 1) - this.xpFor(user.level)

            return user
        } catch (e) {
            console.log(`Failed to fetch user: ${e}`)
            return false
        }
    }

    /**
     * @param {string} [userId] - Discord user id.
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [xp] - Amount of xp to subtract.
     */
    @ensureUserExists()
    static subtractXp(userId: string, guildId: string, xp: number): UserLevel | boolean {
        if (!userId) throw new TypeError('An user id was not provided.')
        if (!guildId) throw new TypeError('A guild id was not provided.')
        if (xp <= 0 || !xp || isNaN(parseInt(String(xp)))) throw new TypeError('An amount of xp was not provided/was invalid.')

        try {

            const user = this.db.prepare('SELECT * FROM levels WHERE userID = ? AND guildID = ?').get(userId, guildId) as UserLevel


            const newXp = Math.max(0, user.xp - parseInt(String(xp), 10))
            const newLevel = Math.floor(0.1 * Math.sqrt(newXp))


            this.db.prepare(
                'UPDATE levels SET xp = ?, level = ?, lastUpdated = CURRENT_TIMESTAMP WHERE userID = ? AND guildID = ?'
            ).run(newXp, newLevel, userId, guildId)


            return {
                ...user,
                xp: newXp,
                level: newLevel,
                lastUpdated: new Date().toISOString()
            }
        } catch (e) {
            console.log(`Failed to subtract xp: ${e}`)
            return false
        }
    }

    /**
     * @param {string} [userId] - Discord user id.
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [levels] - Amount of levels to subtract.
     */
    @ensureUserExists()
    static subtractLevel(userId: string, guildId: string, levels: number): UserLevel | boolean {
        if (!userId) throw new TypeError('An user id was not provided.')
        if (!guildId) throw new TypeError('A guild id was not provided.')
        if (!levels) throw new TypeError('An amount of levels was not provided.')

        try {

            const user = this.db.prepare('SELECT * FROM levels WHERE userID = ? AND guildID = ?').get(userId, guildId) as UserLevel


            const newLevel = Math.max(0, user.level - parseInt(String(levels), 10))
            const newXp = newLevel * newLevel * 100


            this.db.prepare(
                'UPDATE levels SET xp = ?, level = ?, lastUpdated = CURRENT_TIMESTAMP WHERE userID = ? AND guildID = ?'
            ).run(newXp, newLevel, userId, guildId)


            return {
                ...user,
                level: newLevel,
                xp: newXp,
                lastUpdated: new Date().toISOString()
            }
        } catch (e) {
            console.log(`Failed to subtract levels: ${e}`)
            return false
        }
    }

    /**
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [limit] - Amount of maximum entries to return.
     */
    static fetchLeaderboard(guildId: string, limit: number): UserLevel[] {
        if (!guildId) throw new TypeError('A guild id was not provided.')
        if (!limit) throw new TypeError('A limit was not provided.')

        try {
            const leaderboard = this.db.prepare(
                'SELECT * FROM levels WHERE guildID = ? ORDER BY xp DESC LIMIT ?'
            ).all(guildId, limit) as UserLevel[]

            return leaderboard
        } catch (e) {
            console.log(`Failed to fetch leaderboard: ${e}`)
            return []
        }
    }

    /**
     * @param {any} [client] - Your Discord.Client.
     * @param {UserLevel[]} [leaderboard] - The output from 'fetchLeaderboard' function.
     * @param {boolean} [fetchUsers] - Whether to fetch users that aren't cached.
     */
    static async computeLeaderboard(client: any, leaderboard: UserLevel[], fetchUsers: boolean = false): Promise<ComputedLeaderboardUser[]> {
        if (!client) throw new TypeError('A client was not provided.')
        if (!leaderboard) throw new TypeError('A leaderboard was not provided.')

        if (leaderboard.length < 1) return []

        const computedArray: ComputedLeaderboardUser[] = []

        if (fetchUsers) {
            for (const key of leaderboard) {
                try {
                    const user = await client.users.fetch(key.userID) || { username: 'Unknown', discriminator: '0000' }
                    computedArray.push({
                        ...key,
                        position: leaderboard.findIndex(i => i.guildID === key.guildID && i.userID === key.userID) + 1,
                        username: user.username,
                        discriminator: user.discriminator
                    })
                } catch (error) {
                    computedArray.push({
                        ...key,
                        position: leaderboard.findIndex(i => i.guildID === key.guildID && i.userID === key.userID) + 1,
                        username: 'Unknown',
                        discriminator: '0000'
                    })
                }
            }
        } else {
            leaderboard.forEach(key => {
                const user = client.users.cache.get(key.userID)
                computedArray.push({
                    ...key,
                    position: leaderboard.findIndex(i => i.guildID === key.guildID && i.userID === key.userID) + 1,
                    username: user ? user.username : 'Unknown',
                    discriminator: user ? user.discriminator : '0000'
                })
            })
        }

        return computedArray
    }

    /**
     * @param {number} [targetLevel] - Xp required to reach that level.
     */
    static xpFor(targetLevel: number): number {
        if (isNaN(targetLevel) || isNaN(parseInt(String(targetLevel), 10))) {
            throw new TypeError('Target level should be a valid number.')
        }

        targetLevel = parseInt(String(targetLevel), 10)

        if (targetLevel < 0) {
            throw new RangeError('Target level should be a positive number.')
        }

        return targetLevel * targetLevel * 100
    }

    /**
     * @param {string} [guildId] - Discord guild id.
     */
    static deleteGuild(guildId: string): boolean {
        if (!guildId) throw new TypeError('A guild id was not provided.')

        try {

            const transaction = this.db.transaction(() => {

                this.db.prepare('DELETE FROM role_rewards WHERE guildID = ?').run(guildId)


                this.db.prepare('DELETE FROM rewards WHERE guildID = ?').run(guildId)


                this.db.prepare('DELETE FROM levels WHERE guildID = ?').run(guildId)
            })


            transaction()
            return true
        } catch (e) {
            console.log(`Failed to delete guild: ${e}`)
            return false
        }
    }
}

export default DiscordXp