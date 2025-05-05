# Discura

Discura is a platform that lets you create and manage Discord bots powered by Large Language Models (LLMs). It runs locally and provides an intuitive web interface for configuring, deploying, and monitoring your bots.

## Features

- **Discord Integration**: Seamlessly connect with Discord's API to create interactive bots
- **LLM Integration**: Connect to OpenAI, Anthropic, Google, or custom LLM providers
- **Bot Personality**: Customize your bot's personality, traits, and backstory
- **Image Generation**: Enable image generation capabilities powered by DALL-E, Stability AI, or Midjourney
- **Knowledge Management**: (Coming Soon) Add custom knowledge sources to make your bot more informed
- **Tools & Functions**: (Coming Soon) Give your bot access to external tools and data sources

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or remote)
- Discord Application & Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/discura.git
cd discura
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install common dependencies
cd ../common
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the backend directory
   - Add your Discord client ID and secret
   - Set your MongoDB connection string

4. Build the project:
```bash
# From the project root
./build.sh
```

5. Start the application:
```bash
# Start MongoDB (if running locally)
mongod --dbpath /path/to/data/directory

# Start the backend
cd backend
npm start

# In another terminal, start the frontend
cd frontend
npm run dev
```

6. Open your browser and navigate to http://localhost:5173

## Usage

1. Log in with your Discord account
2. Create a new bot by connecting to a Discord application
3. Configure your bot's personality and LLM settings
4. Start your bot and invite it to your Discord server

## Docker Deployment

You can also use Docker to deploy Discura:

```bash
docker-compose -f docker/docker-compose.yml up -d
```

## Architecture

Discura consists of three main components:

- **Backend**: Node.js/Express server that handles authentication, bot management, and Discord integration
- **Frontend**: React application providing the user interface
- **Common**: Shared TypeScript types and utilities

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
