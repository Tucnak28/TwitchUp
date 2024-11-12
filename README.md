# TwitchUp

A powerful Twitch automation client supporting multiple user accounts simultaneously. TwitchUp provides advanced features for channel management, automated responses, and integrations with Discord and GPT.

## Features

- **Multi-Account Support**
  - Manage multiple Twitch accounts simultaneously
  - Individual account settings and configurations
  - Real-time connection status monitoring

- **Word Detection System**
  - Custom word triggers and responses
  - Configurable thresholds and cooldowns
  - Automated message repetition

- **TipBot Integration**
  - Automated tip tracking and responses
  - Customizable tip endings
  - Blacklist protection for specific tip amounts
  - Cooldown management

- **Integrations**
  - Discord notifications for events
  - GPT-powered automated chat responses
  - Twitch chat embedding

## Installation

1. Clone the repository:
```bash
git clone https://github.com/tucnak28/twitchup.git
cd twitchup
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your credentials:
```env
DISCORD_TOKEN=your_discord_token
GUILD_ID=your_guild_id
OPENAI_TOKEN=your_openai_token
```

## Dependencies

- discord.js: ^14.15.2
- dotenv: ^16.4.5
- express: ^4.19.2
- openai: ^4.47.1
- tmi.js: ^1.8.5

## Usage

or optimal setup, start the application using start.py


Or start the server using command line:
```bash
node index.js [PORT] [DISCORD_INTEGRATION] [GPT_INTEGRATION]
```

Example:
```bash
node index.js 3069 True True
```

## 🔧 Configuration

- Configure accounts in `accounts.json`
  ```json
  [
    {
        "nickname": "exampleUser1",
        "token": "oauth:exampleToken1"
    },
    {
        "nickname": "exampleUser2",
        "token": "oauth:exampleToken2"
    }]

- Set up word detection rules through the web interface
- Customize TipBot settings via the UI
- Manage Discord notifications in the settings panel

## 🌐 Web Interface

Access the web interface at `http://localhost:3069` (or your configured port) to:
- Manage account connections
- Configure word detection rules
- Set up TipBot parameters
- Monitor active connections

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📝 To Do

- [ ] Connect GPT API for automatic messages
- [ ] Enhance Discord integration features
- [ ] Add more automation capabilities

## ⚖️ License

ISC License
