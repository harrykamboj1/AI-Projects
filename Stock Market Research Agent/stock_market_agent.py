from deepagents import create_deep_agent
from langchain_ollama import ChatOllama
from langchain_core.tools import tool
from dotenv import load_dotenv
import yfinance as yf
import logging
import gradio as gr
import json
import os
from tools import *


logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s"
)

# IMPORT ENV VARIABLES
load_dotenv()


# INITIALIZE LLM
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gpt-oss:20b")
GRADIO_SERVER_NAME = os.getenv("GRADIO_SERVER_NAME", "")
GRADIO_SERVER_PORT = os.getenv("GRADIO_SERVER_PORT", "")


with open("instructions.txt", "r") as f:
    INSTRUCTIONS = f.read()


with open("sub_agents.json", "r") as f:
    SUB_AGENTS = json.load(f)


fundamental_analyst = SUB_AGENTS["fundamental_analyst"]
technical_analyst = SUB_AGENTS["technical_analyst"]
risk_analyst = SUB_AGENTS["risk_analyst"]


# DEFINE SUB AGENTS
sub_agents = [fundamental_analyst, technical_analyst, risk_analyst]


# DEFINE TOOLS
tools = [getStockPrice, getFinancialStatement, getTechnicalIndicators]
if web_search:
    tools.extend([searchFinancialNews, searchMarketTrend])

# START AGENT


def _to_placeholder(obj):
    try:
        return {"__class__": type(obj).__name__, "module": type(obj).__module__}
    except Exception:
        return str(obj)


def run_research(query: str):
    try:
        logging.info(f"Running research agent with query: {query}")

        llm = ChatOllama(model=OLLAMA_MODEL, temperature=0)

        # subs = _to_placeholder(sub_agents)
        # tools = _to_placeholder(tool)

        # logging.debug("subagents after normalize: %s", subs)
        # logging.debug("tools after normalize: %s", tools)

        research_agent = create_deep_agent(
            model=llm,
            system_prompt=INSTRUCTIONS,
            subagents=sub_agents,
            tools=tools
        ).with_config({"recursion_limit": int(30)})

        result = research_agent.invoke({
            "messages": [
                {"role": "user", "content": query}
            ]
        }, {"recursion_limit": 100})

        logging.debug("Research agent completed successfully.")
        logging.debug("Final result (raw): %r", result)

        messages = result.get("messages", []) if isinstance(
            result, dict) else []

        output_text = ""

        if not messages:
            logging.warning(
                "No messages returned in result.")
            output_text = "Error: No response messages received."
        elif isinstance(messages[-1], dict):
            output_text = messages[-1].get("content", "")
            logging.debug(
                f"Output content from dict: {output_text}")
        elif hasattr(messages[-1], "content"):
            output_text = messages[-1].content
            logging.debug(
                f"Output content from object: {output_text}")
        else:
            logging.error("Unrecognized message format.")
            output_text = "Error: Invalid response message format."

        file_output = ""
        if "files" in result:
            file_output += "\n\n=== Generated Research Files ===\n"
            for filename, content in result["files"].items():
                preview = content[:500] + \
                    "..." if len(content) > 500 else content
                file_output += f"\n**{filename}**\n{preview}\n"
                logging.debug(
                    f"File: {filename}, Preview: {preview[:100]}")

        return output_text + file_output
    except Exception as e:
        logging.exception("Error running research agent")
        return f"Error: {e}"


GRADIO_SERVER_NAME = os.environ.get("GRADIO_SERVER_NAME", "0.0.0.0")
GRADIO_SERVER_PORT = int(os.environ.get("GRADIO_SERVER_PORT", 7860))


with gr.Blocks() as demo:
    gr.Markdown("# Stock Market Research Agent")

    query_input = gr.Textbox(
        label="Enter your stock market research query:",
        placeholder="e.g., Analyze the potential of Tesla stock for long-term investment.",
        lines=2
    )

    run_button = gr.Button("Run Research Agent")

    output_area = gr.Markdown(
        label="Research Agent Output:"
    )

    run_button.click(
        fn=run_research,
        inputs=[query_input],
        outputs=[output_area],
    )
demo.launch(server_name=GRADIO_SERVER_NAME,
            server_port=GRADIO_SERVER_PORT)
