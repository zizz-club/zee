# Zee Discord Bot

A modern, modular Discord bot built with [discord.js](https://discord.js.org/) and Node.js. Designed for easy customization, robust logging, and clean code.

## Features

- **Slash Commands**: Easily add and sync slash commands.
- **Status Rotation**: Display multiple custom statuses, rotating at a configurable interval.
- **Robust Logging**: Colorful, contextual logs for debugging and production.
- **Environment-based Configuration**: Securely manage secrets and settings with `.env` files.
- **Modular Structure**: Commands and utilities are organized for easy maintenance and extension.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or newer
- A Discord bot token ([How to create a bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot))

### Installation
1. **Clone the repository:**
   ```sh
   git clone https://github.com/zizz-club/zee.git
   cd zee
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your Discord credentials:
     ```sh
     cp .env.example .env
     # Edit .env with your token, client ID, etc.
     ```

### Running the Bot
- **Start the bot:**
  ```sh
  npm start
  ```
- **Development mode (auto-restart on changes):**
  ```sh
  npm run dev
  ```

### Syncing Commands
To register or update slash commands with Discord:
```sh
node utility/cmd-handler.js
```
Or use the `/sync` command in Discord (if enabled).

## Customizing Status Rotation
Edit the `BOT_STATUSES` array in `index.js`:
```js
// Example:
globalThis.BOT_STATUSES = [
  { message: 'Online!', status: 'online', type: 4 },
  { message: '/ping', status: 'online', type: 0 },
];
// Set the interval (ms)
globalThis.BOT_STATUS_INTERVAL = 30000;
```
- `type`: 0 = Playing, 1 = Streaming, 2 = Listening, 3 = Watching, 4 = Custom

## Adding Commands
- Add new command files to `commands/utility/` following the structure of `ping.js` or `sync.js`.
- Each command must export both `data` (a `SlashCommandBuilder`) and `execute` (an async function).

## Project Structure
```
zee/
├── commands/
│   └── utility/
│       ├── ping.js
│       └── sync.js
├── utility/
│   ├── cmd-handler.js
│   ├── logger.js
│   └── status.js
├── index.js
├── package.json
├── .env.example
└── ...
```

## Scripts
- `npm start` — Start the bot
- `npm run dev` — Start with auto-reload (nodemon)
- `npm test` — Run tests (if any)
- `node utility/cmd-handler.js` — Sync slash commands

## License
MIT — see [LICENSE](LICENSE)

---

**Made with ❤️ by [zizz.club](https://github.com/zizz-club)**
