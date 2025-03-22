interface UserLevel {
    id?: number
    userID: string
    guildID: string
    xp: number
    level: number
    lastUpdated: string
    position?: number
    cleanXp?: number
    cleanNextLevelXp?: number
}

interface RoleReward {
    id?: number
    guildID: string
    level: number
    roleId: string
}

interface ComputedLeaderboardUser extends UserLevel {
    position: number
    username: string
    discriminator: string
}

export { UserLevel, RoleReward, ComputedLeaderboardUser }