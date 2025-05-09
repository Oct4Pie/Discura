import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import config from '../config';
import { User, UserAdapter } from '../models/adapters/user.adapter';
import { logger } from '../utils/logger';

// Extend the Discord profile type to ensure our type definitions match
interface DiscordProfile {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

export const setupPassport = () => {
  // Discord OAuth2 strategy
  passport.use(new DiscordStrategy({
    clientID: config.discord.clientId,
    clientSecret: config.discord.clientSecret,
    callbackURL: config.discord.callbackUrl,
    scope: ['identify', 'email', 'bot']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Cast profile to our extended type
      const discordProfile = profile as unknown as DiscordProfile;
      
      // Find or create user using our adapter
      const user = await UserAdapter.createFromDiscord({
        id: discordProfile.id,
        username: discordProfile.username,
        discriminator: discordProfile.discriminator,
        avatar: discordProfile.avatar,
        email: discordProfile.email
      });
      
      if (!user) {
        logger.error(`Failed to create or update user: ${discordProfile.username}`);
        return done(new Error('Failed to create or update user'), undefined);
      }
      
      logger.info(`Authenticated user: ${discordProfile.username}`);
      // The user object from our adapter is now compatible with Express.User through our type definitions
      return done(null, user as Express.User);
    } catch (err) {
      logger.error('Error in Discord auth strategy:', err);
      return done(err as Error, undefined);
    }
  }));

  // Serialize user to the session
  passport.serializeUser((user: Express.User, done) => {
    // Use id from the user object
    done(null, user.id); 
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await UserAdapter.findById(id);
      // Cast the user object to Express.User to ensure type compatibility
      done(null, user as Express.User | null);
    } catch (err) {
      done(err, null);
    }
  });
};
