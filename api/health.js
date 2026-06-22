export default function handler(req, res) {
  res.status(200).json({
    status: 'OK',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      CLIENT_URL: process.env.CLIENT_URL,
      HAS_MONGODB_URI: !!process.env.MONGODB_URI,
      MONGODB_URI_PREFIX: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : null,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    }
  });
}
