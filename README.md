# Video Viscosity Analysis App

Research-grade mobile application for analyzing liquid viscosity from video recordings.

## Project Structure

```
video_analysis/
├── backend/                 # FastAPI backend
│   ├── main.py             # FastAPI app entry point
│   ├── core/               # Core configuration
│   │   └── config.py
│   ├── routers/            # API endpoints
│   │   ├── upload.py
│   │   ├── frames.py
│   │   ├── calibrate.py
│   │   ├── analyze.py
│   │   └── report.py
│   ├── services/           # Business logic
│   │   ├── video_service.py
│   │   ├── calibration_service.py
│   │   ├── analysis_service.py
│   │   └── report_service.py
│   ├── utils/              # Utility functions
│   │   ├── file_utils.py
│   │   └── math_utils.py
│   ├── static/             # Static files (graphs, results)
│   │   ├── results/
│   │   └── graphs/
│   └── uploads/            # Temporary video storage
│
└── frontend/               # React Native mobile app
    ├── src/
    │   ├── screens/        # App screens
    │   │   ├── UploadScreen.jsx
    │   │   ├── VideoTrimScreen.jsx
    │   │   ├── CalibrationChoiceScreen.jsx
    │   │   ├── CalibrationManualScreen.jsx
    │   │   ├── CalibrationTapScreen.jsx
    │   │   ├── ResultsScreen.jsx
    │   │   └── ReportScreen.jsx
    │   ├── components/     # Reusable components
    │   │   ├── VideoUploader.jsx
    │   │   ├── VideoPlayerTrim.jsx
    │   │   ├── SvgPointSelector.jsx
    │   │   └── GraphViewer.jsx
    │   ├── services/        # API service
    │   │   └── api.js
    │   ├── store/          # State management
    │   │   └── analysisStore.js
    │   └── utils/          # Utilities
    │       └── validators.js
    ├── App.js              # Main app component
    ├── package.json
    └── app.json
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
python main.py
# Or using uvicorn directly:
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# Or using yarn:
yarn install
```

3. Update API URL in `src/services/api.js` if needed:
```javascript
const API_BASE_URL = 'http://YOUR_BACKEND_IP:8000/api/v1';
```

4. Start the Expo development server:
```bash
npm start
# Or:
expo start
```

5. Run on device/emulator:
- Press `a` for Android
- Press `i` for iOS
- Scan QR code with Expo Go app on your phone

## Features

### Backend
- ✅ Chunked video upload support (>200MB)
- ✅ Automatic first frame extraction
- ✅ Pixel-to-centimeter calibration (manual & tap-based)
- ✅ Height extraction from video frames
- ✅ Linear regression analysis
- ✅ Viscosity calculation
- ✅ Matplotlib graph generation
- ✅ PDF report generation

### Frontend
- ✅ Video file picker with progress indicator
- ✅ Video player with time range selection
- ✅ Two-point tap calibration with SVG overlay
- ✅ Manual distance entry
- ✅ Results display with graph viewer
- ✅ PDF report download

## API Endpoints

- `POST /api/v1/upload-video` - Upload video (chunked)
- `GET /api/v1/video-frame/{video_id}` - Get first frame image
- `POST /api/v1/analyze/select-time-range` - Select analysis time range
- `POST /api/v1/calibration/manual` - Manual calibration
- `POST /api/v1/calibration/tap` - Tap-based calibration
- `POST /api/v1/analyze` - Perform viscosity analysis
- `GET /api/v1/report/{video_id}` - Download PDF report

## Workflow

1. **Upload Video**: User selects and uploads video file
2. **Select Time Range**: User plays video and selects analysis range
3. **Calibrate**: User chooses manual or tap-based calibration
4. **Analyze**: Backend processes video and calculates viscosity
5. **View Results**: Display viscosity value and graph
6. **Generate Report**: Download PDF with analysis results

## Notes

- The viscosity calculation formula in `analysis_service.py` is a placeholder. Replace it with your actual research methodology.
- The height extraction algorithm in `extract_height_from_frame()` is simplified. Enhance it based on your specific video analysis requirements.
- For production, update CORS settings in `backend/main.py` to restrict origins.
- Consider adding authentication and database storage for production use.

## Technology Stack

**Backend:**
- FastAPI
- OpenCV
- NumPy, SciPy
- Matplotlib
- ReportLab

**Frontend:**
- React Native
- Expo
- Zustand (state management)
- React Navigation
- react-native-svg











