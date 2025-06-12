// Import React hooks
const { useState, useEffect } = React;

// Destructure Material-UI components
const {
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  createTheme,
  ThemeProvider
} = MaterialUI;

// Destructure speech recognition
const { useSpeechRecognition, SpeechRecognition } = ReactSpeechRecognition;

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
    mobile: 'sms:',
    commands: ['text *', 'message *']
  }
};

function App() {
  const [botResponse, setBotResponse] = useState('');
  const [pulse, setPulse] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);

  useEffect(() => {
    // Check if browser is mobile
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  // Generate commands dynamically
  const generateCommands = () => {
    return Object.entries(APP_LINKS).flatMap(([app, config]) => {
      return config.commands.map(command => ({
        command,
        callback: (param) => handleAppLaunch(app, param, command),
        isFuzzyMatch: true,
        matchInterim: true
      }));
    });
  };

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition({ commands: generateCommands() });

  const speak = (text) => {
    setBotResponse(text);
    if (speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  };

  const handleAppLaunch = (app, param, originalCommand) => {
    const appConfig = APP_LINKS[app];
    let url = '';
    
    // Handle special parameters
    if (originalCommand.includes('*')) {
      if (app === 'phone') url = `tel:${param}`;
      else if (app === 'messages') url = `sms:${param}`;
      else if (app === 'maps') url = `https://www.google.com/maps/search/${encodeURIComponent(param)}`;
      else if (app === 'whatsapp') url = `https://wa.me/${param}`;
      else if (app === 'youtube') url = `https://youtube.com/results?search_query=${encodeURIComponent(param)}`;
      else if (app === 'spotify') url = `https://open.spotify.com/search/${encodeURIComponent(param)}`;
    } else {
      url = isMobile ? appConfig.mobile : appConfig.web || appConfig.mobile;
    }

    speak(`Opening ${app} ${param ? `for ${param}` : ''}`);
    launchApp(url);
  };

  const launchApp = (url) => {
    // Try native launch
    if (window.Capacitor?.Plugins?.App) {
      window.Capacitor.Plugins.App.openUrl({ url });
    } 
    // Fallback for web
    else {
      window.open(url, '_blank');
    }
  };

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      setPulse(false);
    } else {
      resetTranscript();
      setBotResponse('');
      SpeechRecognition.startListening({ continuous: true });
      setPulse(true);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <Box className="App">
        <Paper elevation={3} className="chat-container">
          <Typography variant="h4" className="spidy-title">Spidy Chatbot</Typography>
          <Typography variant="body1">Your browser doesn't support speech recognition. Try Chrome or Edge.</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box className="App">
      <Paper elevation={3} className={`chat-container ${pulse ? 'pulse' : ''}`}>
        <Typography variant="h4" className="spidy-title">Spidy Chatbot</Typography>
        <Typography variant="body2" className="connection-status">
          {listening ? 'Listening...' : 'Tap microphone to speak'}
        </Typography>
        
        <div className="spidy-icon">🕷️</div>
        
        <Box className="transcript-box">
          <Typography>{transcript || 'Your voice commands will appear here...'}</Typography>
        </Box>
        
        {botResponse && (
          <Box className="bot-response">
            <Typography>{botResponse}</Typography>
          </Box>
        )}
        
        <Button
          variant="contained"
          color={listening ? "secondary" : "primary"}
          onClick={toggleListening}
          startIcon={listening ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {listening ? 'Stop Listening' : 'Start Listening'}
        </Button>
        
        <Box className="supported-apps">
          <Typography variant="subtitle2">Supported Apps:</Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mt={1} justifyContent="center">
            {Object.keys(APP_LINKS).map(app => (
              <Chip 
                key={app} 
                label={app} 
                color="primary"
                onClick={() => speak(`Say 'open ${app}' or '${APP_LINKS[app].commands[0]}'`)}
                style={{ margin: '4px', cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#4caf50',
    },
    secondary: {
      main: '#f44336',
    },
  },
});

// Render the app
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);