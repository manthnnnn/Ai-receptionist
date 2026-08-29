import os
import json
import logging
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-worker")

def run_worker():
    logger.info("LiveKit voice worker ready. In production, connects to LiveKit Room and starts VoiceAssistant.")

if __name__ == "__main__":
    run_worker()
