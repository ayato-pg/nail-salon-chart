# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This appears to be a new, empty directory named "電子カルテ" (Electronic Medical Records) within the broader Claude workspace that contains multiple independent web projects.

## Parent Repository Context

The parent directory (C:\Users\PC-user\Claude) contains several independent projects:

### Active Web Projects

1. **YouTube Translation Chrome Extension** (`YouTube翻訳拡張機能/`)
   - Manifest V3 Chrome extension for real-time YouTube subtitle translation
   - Uses Google Translate API via content script injection
   - No build process required - load unpacked from Chrome extensions page

2. **TODO App with Calendar** (`TODO/todo-app.html`)
   - Single-file HTML application with embedded CSS/JavaScript
   - LocalStorage-based persistence
   - Calendar view and task management features

3. **Strip Rock-Paper-Scissors Game** (`野球拳ゲーム（ざっくり）/`)
   - Interactive janken game with character expression changes
   - 5 stages of progression (0-4 wins) with image swapping
   - LocalStorage for score persistence
   - Currently implemented with placeholder images

4. **Scratch Gallery Game** (`public-archivedwl-741/ゲーム/`)
   - Canvas-based scratch-off game revealing hidden images
   - Point system with upgrades (brush size, multipliers)
   - 5 stages with gallery feature
   - LocalStorage for progress saving

5. **Yahoo Auction Auto-login Extension** (`yahookirikae/yahoo-auction-autologin/`)
   - Chrome extension for managing multiple Yahoo Japan accounts
   - Auto-login functionality with saved credentials
   - Base64 encoded password storage

6. **Ren'Py Visual Novel Game** (`2人の秘密、野球拳。/`)
   - Complete visual novel with strip janken minigame
   - Multi-platform targeting (PC/macOS/Steam Deck/Android/iOS)
   - Ren'Py 8.2 framework

## Development Guidelines

### Common Patterns Across Projects
- All web projects use vanilla JavaScript (no frameworks/bundlers)
- Direct file opening in browser (no server required)
- LocalStorage for client-side data persistence
- No package.json or node_modules - zero dependencies

### Chrome Extension Development
```bash
# Load extension:
1. Open chrome://extensions/
2. Enable Developer mode
3. Click "Load unpacked"
4. Select extension directory
```

### Testing Web Projects
```bash
# Simply open HTML files directly:
# Windows: double-click the HTML file
# Or use file:// protocol in browser
```

## Claude Code Workflow Commands

Based on `claudeコマンド.txt`:

### Essential Commands
- `/init` - Generate CLAUDE.md for project understanding
- `claude --continue` - Continue previous session
- `claude --resume` - Resume specific work
- `claude --dangerously-skip-permissions` - Bypass all permissions

### Workflow Phrases
- "プロジェクトを理解してください" - Request full project analysis at session start
- "進捗とチェンジログ更新してください" - Update progress and changelog at session end
- "ultrathink" - Request deep thinking for complex problems

## Current Directory - Nail Salon PWA System

The `電子カルテ` directory contains a complete Progressive Web App (PWA) electronic medical records system specifically designed for nail salons.

### System Overview
A mobile-first PWA customer relationship management system that manages 300+ customers with:
- Customer information and health records
- Treatment history with camera integration
- Photo gallery with offline support
- Real-time business analytics
- Cross-platform app installation

### Technical Architecture
- **Frontend**: PWA-compliant HTML5, CSS3, JavaScript (ES6+)
- **Data Storage**: LocalStorage + Service Worker caching
- **Image Handling**: Camera API + Base64 compression (20KB limit)
- **Offline Support**: Complete offline functionality
- **App Installation**: Native app-like experience

### PWA Features

1. **Mobile-First Design**
   - Bottom navigation for thumb navigation
   - Touch-friendly 44px+ buttons
   - Pull-to-refresh gestures
   - Responsive card-based UI

2. **Camera Integration**
   - Direct camera access for treatment photos
   - Front/rear camera switching
   - Real-time photo compression
   - Touch shutter controls

3. **Offline Capabilities**
   - Complete offline functionality
   - Service Worker caching
   - Automatic data synchronization
   - Offline indicator

4. **App Installation**
   - Install banner prompt
   - Home screen shortcut
   - Standalone app mode
   - Push notification ready

### Core Business Features

1. **Customer Management (300+ capacity)**
   - Basic information with health records
   - Visit history with photo evidence
   - Search and filtering capabilities
   - Customer detail modals

2. **Treatment Records**
   - Camera-integrated photo capture
   - Service pricing and timing
   - Staff assignment tracking
   - Tag-based organization

3. **Analytics Dashboard**
   - Real-time revenue tracking
   - Customer retention metrics
   - Popular design analysis
   - Monthly performance reports

### File Structure
```
電子カルテ/
├── start-local-server.bat    # Server startup (double-click)
├── start-pwa.html           # PWA startup guide
├── app.html                 # Main PWA application
├── manifest.json            # PWA configuration
├── service-worker.js        # Offline support
├── offline.html             # Offline fallback
├── script.js                # Application logic
├── style.css                # PWA-optimized styles
├── icon-*.png              # App icons (8 sizes)
├── README.md                # User documentation
└── CLAUDE.md               # This file
```

### Quick Start Commands
```bash
# Start PWA server
start-local-server.bat

# Open PWA
http://localhost:8000/app.html

# Install as app
# Click install banner in browser
```

### Development Guidelines
- All functionality works offline-first
- Camera features require HTTPS or localhost
- Data automatically syncs when online
- 300+ customer capacity with 20KB photo compression
- Cross-platform PWA installation supported

### Data Persistence
- **Customer Data**: LocalStorage with automatic backup
- **Treatment Records**: Indexed by customer with photo references  
- **Images**: Compressed Base64 (max 20KB per photo)
- **Cache**: Service Worker manages app shell and resources

## Notes

- All projects prioritize simplicity and immediate usability
- No build processes, transpilation, or bundling
- Direct browser execution without servers
- Focus on practical functionality over complex architectures