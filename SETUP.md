# Setup Guide

## Quick Start

### Backend Setup

1. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Run the server:**
```bash
python main.py
# Or: uvicorn backend.main:app --reload
```

3. **Verify it's running:**
- Open http://localhost:8000/docs to see API documentation
- Health check: http://localhost:8000/health

### Frontend Setup

1. **Install Node dependencies:**
```bash
cd frontend
npm install
```

2. **Configure API URL:**
Edit `frontend/src/services/api.js` and update the base URL:
- For Android emulator: Use `10.0.2.2` instead of `localhost`
- For iOS simulator: Use `localhost`
- For physical device: Use your computer's IP address (e.g., `192.168.1.100`)

3. **Start Expo:**
```bash
npm start
# Or: expo start
```

4. **Run on device:**
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on your phone

## Testing the Flow

1. **Upload Video**: Select a video file from your device
2. **Select Time Range**: Use sliders to choose analysis segment
3. **Calibrate**: 
   - Option A: Enter distance manually
   - Option B: Tap two points and enter distance
4. **Analyze**: Backend processes video automatically
5. **View Results**: See viscosity value and graph
6. **Generate Report**: Download PDF report

## Troubleshooting

### Backend Issues

- **Port already in use**: Change port in `main.py` or kill the process using port 8000
- **Import errors**: Make sure you're in the project root when running, or install as package
- **OpenCV errors**: Ensure opencv-python is installed correctly

### Frontend Issues

- **Cannot connect to backend**: 
  - Check API URL in `api.js`
  - Ensure backend is running
  - For physical device, use computer's IP address, not localhost
  - Check firewall settings
  
- **Video upload fails**:
  - Check file size (should work up to 500MB)
  - Verify backend uploads directory exists
  - Check backend logs for errors

- **Graph not displaying**:
  - Verify graph URL is correct
  - Check if graph file was generated in `backend/static/graphs/`
  - Ensure CORS is configured correctly

## Development Notes

- The viscosity calculation formula is a placeholder - replace with your research methodology
- Height extraction algorithm is simplified - enhance based on your video analysis needs
- For production, add authentication, database storage, and proper error handling
- Consider implementing proper chunked uploads for very large files (>200MB)



