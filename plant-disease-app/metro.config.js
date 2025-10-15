// Enable loading .env values when using Expo CLI
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
module.exports = config;
