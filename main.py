import os
import sys
import time
import threading
from kivy.app import App
from kivy.uix.label import Label
from kivy.core.window import Window
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.graphics import Color, RoundedRectangle
from kivy.clock import Clock
from kivy.utils import platform
from kivy.animation import Animation
import speech_recognition as sr

# --- Voice Activation Core ---
class VoiceActivator:
    def __init__(self):
        self.listening = False
        self.hotword = "hey spidy"
        self.connection_status = "Disconnected"
        self.recognizer = sr.Recognizer()
        
    def detect_hotword(self):
        """Background thread for hotword detection"""
        try:
            with sr.Microphone() as source:
                print("🔊 Hotword detector ready...")
                self.recognizer.adjust_for_ambient_noise(source)
                while True:
                    audio = self.recognizer.listen(source, phrase_time_limit=3)
                    try:
                        text = self.recognizer.recognize_google(audio).lower()
                        if self.hotword in text:
                            self.activate_assistant()
                    except sr.UnknownValueError:
                        pass
                    except sr.RequestError as e:
                        print(f"API error: {e}")
        except Exception as e:
            print(f"Hotword error: {e}")

    def say(self, text):
        """Text-to-speech output"""
        print(f"Assistant: {text}")
        if platform == 'android':
            from jnius import autoclass
            TextToSpeech = autoclass('android.speech.tts.TextToSpeech')
            Context = autoclass('android.content.Context')
            tts = TextToSpeech(Context(), None)
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, None)
        else:
            import pyttsx3
            engine = pyttsx3.init()
            engine.say(text)
            engine.runAndWait()

    def take_command(self):
        """Listen for user command"""
        try:
            with sr.Microphone() as source:
                print("Listening for command...")
                self.recognizer.adjust_for_ambient_noise(source)
                audio = self.recognizer.listen(source, timeout=5)
                try:
                    command = self.recognizer.recognize_google(audio).lower()
                    print(f"User said: {command}")
                    return command
                except sr.UnknownValueError:
                    self.say("Sorry, I didn't catch that")
                    return None
        except Exception as e:
            print(f"Command error: {e}")
            return None

    def handle_command(self, command):
        """Process user commands"""
        if not command:
            return
            
        self.say(f"Processing command: {command}")
        # Add your command handling logic here
        if 'hello' in command:
            self.say("Hello there! How can I help you?")
        elif 'time' in command:
            self.say(f"The current time is {time.strftime('%I:%M %p')}")
        else:
            self.say("I'm not sure how to handle that command yet")

    def activate_assistant(self):
        """Show floating widget and respond to voice"""
        self.listening = True
        print("🕷️ Spidy activated!")
        
        # Visual feedback with animation
        app = App.get_running_app()
        if app and hasattr(app, 'icon'):
            anim = Animation(opacity=0.5, duration=0.5) + Animation(opacity=1, duration=0.5)
            anim.repeat = True
            anim.start(app.icon)
            
            Clock.schedule_once(lambda dt: self.start_interaction(), 1)

    def start_interaction(self):
        """Begin voice interaction sequence"""
        self.say("How can I help?")
        command = self.take_command()
        if command:
            self.handle_command(command)

# --- Styled Floating Widget ---
class FloatingIcon(App):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.icon = None
        
    def build(self):
        # Window settings
        Window.size = (300, 400) if platform == 'android' else (300, 400)
        Window.clearcolor = (0.1, 0.1, 0.1, 0.8)
        Window.borderless = True
        
        # Main layout
        main_layout = FloatLayout()
        
        # Background with rounded corners
        with main_layout.canvas.before:
            Color(0.1, 0.1, 0.1, 0.9)
            RoundedRectangle(size=Window.size, pos=main_layout.pos, radius=[20,])
        
        # Content layout
        content = BoxLayout(orientation='vertical', 
                          spacing=10,
                          padding=20,
                          size_hint=(1, 1))
        
        # App icon/title (store reference for animation)
        self.icon = Label(text='🕷', 
                        font_size=80,
                        size_hint=(1, 0.4),
                        color=(0, 0.8, 0.2, 1))
        
        # Status label
        self.activator = VoiceActivator()
        status = Label(text=f"Status: {self.activator.connection_status}",
                      font_size=18,
                      size_hint=(1, 0.2),
                      color=(0.9, 0.9, 0.9, 1))
        
        # Update status periodically
        def update_status(dt):
            status.text = f"Status: {self.activator.check_phone_connection()}"
        Clock.schedule_interval(update_status, 2)
        
        # Action button
        action_btn = Button(text='Activate Voice',
                          size_hint=(1, 0.2),
                          background_normal='',
                          background_color=(0, 0.6, 0.2, 1))
        action_btn.bind(on_press=lambda x: self.activator.activate_assistant())
        
        # Add widgets
        content.add_widget(self.icon)
        content.add_widget(status)
        content.add_widget(action_btn)
        main_layout.add_widget(content)
        
        return main_layout

# --- Android Service Integration ---
if platform == 'android':
    from android import AndroidService
    service = AndroidService('Spidy Service', 'running')
    service.start('service started')

# --- Main Control ---
if __name__ == '__main__':
    # Android permissions
    if platform == 'android':
        from android.permissions import request_permissions, Permission
        request_permissions([
            Permission.RECORD_AUDIO,
            Permission.READ_PHONE_STATE,
            Permission.INTERNET
        ])
    
    activator = VoiceActivator()
    
    # Initial connection check
    activator.check_phone_connection()
    
    # Start services
    threading.Thread(target=activator.detect_hotword, daemon=True).start()
    
    # Start the app
    FloatingIcon().run()
