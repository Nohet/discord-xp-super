# Discord XP Super

Short description: **A lightweight and easy-to-use XP framework for Discord bots, using SQLite and written in TypeScript.**

This project is based on [discord-xp](https://github.com/MrAugu/discord-xp) and incorporates parts of its code under the MIT license. Full credit goes to the original authors for their contributions.

## Installation

```sh
npm install discord-xp-super
```

or

```sh
yarn add discord-xp-super
```

## Setting up

```javascript
const { DiscordXp } = require("discord-xp-super")

// Set your desired database name
DiscordXp.setDatabase("xp.db")
```

## Links
<ul>
<li><a href="https://github.com/Nohet/discord-xp-super">Github</a></li>
</ul>

## Methods

### `DiscordXp.setDatabase(dbPath)`
Sets up the SQLite database.

- `dbPath` (string): A valid SQLite database path.

### `DiscordXp.createRoleReward(guildId, level, roleId)`
Creates a role reward for a specific level.

- `guildId` (string): Discord guild ID.
- `level` (number): Level to associate with the role reward.
- `roleId` (string): Role ID to assign.

Returns `RoleReward` object if successful, otherwise `false`.

### `DiscordXp.deleteRoleReward(guildId, level)`
Deletes a role reward for a given level.

- `guildId` (string): Discord guild ID.
- `level` (number): Level for which the reward will be deleted.

Returns `true` if successful, otherwise `false`.

### `DiscordXp.fetchRoleReward(guildId, level)`
Fetches the role reward for a given level.

- `guildId` (string): Discord guild ID.
- `level` (number): Level to fetch the reward for.

Returns `RoleReward` object if found, otherwise `false`.

### `DiscordXp.cleanDatabase(client, guildId)`
Removes users from the database if they are no longer in the guild.

- `client` (any): The Discord client instance.
- `guildId` (string): Discord guild ID.

Returns an array of deleted user IDs.

### `DiscordXp.createUser(userId, guildId)`
Creates a user entry in the database.

- `userId` (string): Discord user ID.
- `guildId` (string): Discord guild ID.

Returns `UserLevel` object if successful, otherwise `false`.

### `DiscordXp.deleteUser(userId, guildId)`
Deletes a user from the database.

- `userId` (string): Discord user ID.
- `guildId` (string): Discord guild ID.

Returns `UserLevel` object if successful, otherwise `false`.

### `DiscordXp.appendXp(userId, guildId, xp)`
Adds XP to a user.

- `userId` (string): Discord user ID.
- `guildId` (string): Discord guild ID.
- `xp` (number): Amount of XP to add.

Returns `true` if the user levels up, otherwise `false`.

### `DiscordXp.appendLevel(userId, guildId, levels)`
Adds levels to a user.

- `userId` (string): Discord user ID.
- `guildId` (string): Discord guild ID.
- `levels` (number): Number of levels to add.

Returns updated `UserLevel` object if successful, otherwise `false`.

### `DiscordXp.setXp(userId, guildId, xp)`
Sets the XP for a user.

- `userId` (string): Discord user ID.
- `guildId` (string): Discord guild ID.
- `xp` (number): XP value to set.

Returns updated `UserLevel` object if successful, otherwise `false`.

### `DiscordXp.setLevel(userId, guildId, level)`
Sets the level for a user.

- `userId` (string): Discord user ID.
- `guildId` (string): Discord guild ID.
- `level` (number): Level to set.

Returns updated `UserLevel` object if successful, otherwise `false`.

### `DiscordXp.fetch(userId, guildId, fetchPosition)`
Fetches the user’s XP and level.

- `userId` (string): Discord user ID.
- `guildId` (string): Discord guild ID.
- `fetchPosition` (boolean, optional): Whether to fetch the user’s leaderboard position.

Returns `UserLevel` object if successful, otherwise `false`.

### `DiscordXp.subtractXp(userId, guildId, xp)`
Subtracts XP from a user.

- `userId` (string): Discord user ID.
- `guildId` (string): Discord guild ID.
- `xp` (number): Amount of XP to subtract.

Returns updated `UserLevel` object if successful, otherwise `false`.


## Contributing

If you want to contribute to the library, fork the repository and create a pull request.

## License

This project is licensed under the **MIT** license.

## Author

- Nohet

