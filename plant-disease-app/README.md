# Plant Disease Detection (Expo + Roboflow)

Expo React Native app to detect plant leaf diseases using a Roboflow Classification model.

## Prerequisites
- Node.js LTS
- Expo Go app on your phone
- Roboflow account and API Key

## Setup
1. Install dependencies
```bash
npm install
```
2. Create `.env` from example and fill values
```bash
cp .env.example .env
# Update EXPO_PUBLIC_ROBOFLOW_* values
```
3. Start the Expo dev server
```bash
npm run start
```
4. Open Expo Go, scan the QR, choose a leaf image.

## Roboflow Endpoint
The app posts the raw image bytes to:
```
https://classify.roboflow.com/<MODEL>/<VERSION>?api_key=<API_KEY>
```
Set:
- `EXPO_PUBLIC_ROBOFLOW_MODEL` (e.g., `your-workspace/plant-disease`)
- `EXPO_PUBLIC_ROBOFLOW_VERSION` (e.g., `1`)
- `EXPO_PUBLIC_ROBOFLOW_API_KEY`
