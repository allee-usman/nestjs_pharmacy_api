export default () => ({
    port: parseInt(process.env.PORT ?? '3000', 10),

    database: {
        uri: process.env.MONGODB_URI,
    },

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET,
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    },
});