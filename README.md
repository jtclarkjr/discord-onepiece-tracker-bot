## Bun Setup and Running Instructions

### 1. Environment Setup
Create a `.env` file in the project root:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
CHANNEL_ID=your_channel_in_guild_id
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Running the Bot

#### Development Mode
```bash
bun dev
```

#### Production Mode
```bash
bun start
```

### 4. Usage

#### `/onepiece` Command

Use the `/onepiece` command in your Discord server to find out how long until the next One Piece episode airs.

Example:
```
/onepiece
```
The bot will reply with the time remaining until the next episode.

#### Automatic Notifications

The bot automatically sends notifications to the configured channel at **11:16 PM JST** (Japan Standard Time) every Sunday, reminding users that a new One Piece episode is about to air. This notification is sent approximately 30 minutes before the episode typically becomes available.
