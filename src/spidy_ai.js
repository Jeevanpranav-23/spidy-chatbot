import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button, Box, Typography, Paper, CircularProgress, Chip } from '@mui/material';
import './App.css';

// Common app deep links
const APP_LINKS = {
  youtube: {
    web: 'https://youtube.com',
    mobile: 'youtube://',
    commands: ['open youtube', 'play * on youtube']
  },
  spotify: {
    web: 'https://open.spotify.com',
    mobile: 'spotify://',
    commands: ['open spotify', 'play * on spotify']
  },
  whatsapp: {
    web: 'https://web.whatsapp.com',
    mobile: 'whatsapp://',
    commands: ['open whatsapp', 'message * on whatsapp']
  },
  maps: {
    web: 'https://maps.google.com',
    mobile: 'geo://',
    commands: ['open maps', 'navigate to *']
  },
  phone: {
    mobile: 'tel:',
    commands: ['call *', 'dial *']
  },
  messages: {
    mobile: 'sms://',
    commands: ['text *', 'message *']
  }
};

function App() {
  // ... (previous state remains)

  // Generate commands dynamically
  const generateCommands = () => {
    return Object.entries(APP_LINKS).flatMap(([app, config]) => {
      return config.commands.map(command => ({
        command,
        callback: (param) => handleAppLaunch(app, param, command),
        isFuzzyMatch: true
      }));
    });
  };

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition({ commands: generateCommands() });

  const handleAppLaunch = (app, param, originalCommand) => {
    const appConfig = APP_LINKS[app];
    let url = '';
    
    // Handle special parameters
    if (originalCommand.includes('*')) {
      if (app === 'phone') url = `tel:${param}`;
      else if (app === 'messages') url = `sms:${param}`;
      else if (app === 'maps') url = `geo:0,0?q=${encodeURIComponent(param)}`;
      else if (app === 'whatsapp') url = `whatsapp://send?phone=${param}`;
      else if (app === 'youtube') url = `https://youtube.com/results?search_query=${encodeURIComponent(param)}`;
      else if (app === 'spotify') url = `spotify://search:${encodeURIComponent(param)}`;
    } else {
      url = window.Capacitor ? appConfig.mobile : appConfig.web || appConfig.mobile;
    }

    speak(`Opening ${app} ${param ? `for ${param}` : ''}`);
    launchApp(url);
  };

  const launchApp = (url) => {
    // Try native launch first
    if (window.Capacitor?.Plugins?.App) {
      window.Capacitor.Plugins.App.openUrl({ url });
    } 
    // Fallback for web
    else if (url.startsWith('http')) {
      window.open(url, '_blank');
    }
    // Fallback for mobile web
    else {
      window.location.href = url;
    }
  };

  // ... (rest of the component remains same, including render)

  return (
    <Box className="App">
      <Paper elevation={3} className={`chat-container ${pulse ? 'pulse' : ''}`}>
        {/* ... (previous UI remains) */}
        
        <Box className="supported-apps">
          <Typography variant="subtitle2">Supported Apps:</Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
            {Object.keys(APP_LINKS).map(app => (
              <Chip 
                key={app} 
                label={app} 
                color="primary"
                onClick={() => speak(`Say 'open ${app}' or '${APP_LINKS[app].commands[0]}'`)}
              />
            ))}
          </Box>
        </Box>

        {/* ... (rest of UI) */}
      </Paper>
    </Box>
  );
}