#!/usr/bin/env python3
import os
import sys
import argparse
import logging
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("clinic-voice-server")

def main():
    parser = argparse.ArgumentParser(description="LiveKit Real-Time AI Clinic Voice Receptionist Server")
    parser.add_argument("--dev", action="store_true", help="Run in local development mode with hot reload")
    parser.add_argument("--prod", action="store_true", help="Run in production cluster mode with multi-worker dispatch")
    parser.add_argument("--room", type=str, default="", help="Connect directly to a specific LiveKit room for testing")
    parser.add_argument("--port", type=int, default=8080, help="Port for health checks and status endpoint")

    args = parser.parse_args()

    logger.info("Initializing LiveKit Real-Time AI Telephony Pipeline...")
    logger.info(f"Environment: {'Production' if args.prod else 'Development'}")
    logger.info(f"LiveKit URL: {os.getenv('LIVEKIT_URL', 'ws://localhost:7880')}")
    logger.info(f"Next.js API Base: {os.getenv('NEXTJS_API_BASE', 'http://localhost:3000/api')}")

    from backend.agent.voice_worker import run_worker
    run_worker()

if __name__ == "__main__":
    main()
