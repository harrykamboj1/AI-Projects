from deepagents import create_deep_agent
from langchain_ollama import OllamaLLM
from langchain_core.tools import tools
from dotenv import load_dotenv
import yfinance as yf
import logging
import gradio as gr
import json
import os
