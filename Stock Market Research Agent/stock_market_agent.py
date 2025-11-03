from deepagents import create_deep_agent
from langchain_ollama import OllamaLLM
from langchain_core.tools import tool
from dotenv import load_dotenv
import yfinance as yf
import logging
import gradio as gr
import json
import os

logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s"
)

# IMPORT ENV VARIABLES
load_dotenv()


# INITIALIZE LLM
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gpt-oss:20B")
GRADIO_SERVER_NAME = os.getenv("GRADIO_SERVER_NAME", "")
GRADIO_SERVER_PORT = os.getenv("GRADIO_SERVER_PORT", "")


with open("instructions.txt", "r") as f:
    INSTRUCTIONS = f.read()


with open("sub_agents.json", "r") as f:
    SUB_AGENTS = json.load(f)


fundamental_analyst = SUB_AGENTS["fundamental_analyst"]
technical_analyst = SUB_AGENTS["technical_analyst"]
risk_analyst = SUB_AGENTS["risk_analyst"]


# DEFINE TOOLS
sub_agents = [fundamental_analyst, technical_analyst, risk_analyst]


# START AGENT
def _ensure_iterable(x):
    if x is None:
        return []
    if isinstance(x, (list, tuple, set)):
        return x
    return [x]


def run_research(query: str):
    try:
        logging.info(f"Running research agent with query: {query}")

        llm = OllamaLLM(model=OLLAMA_MODEL, temperature=0)

        subs = _ensure_iterable(sub_agents)
        tools = _ensure_iterable(tool)

        logging.debug("subagents after normalize: %s", subs)
        logging.debug("tools after normalize: %s", tools)

        research_agent = create_deep_agent(
            model=llm,
            system_prompt=INSTRUCTIONS,
            subagents=subs,
            tools=tools
        ).with_config({"recursion_limit": int(30)})

        result = research_agent.invoke({
            "messages": [
                {"role": "user", "content": query}
            ]
        }, {"recursion_limit": 30})

        logging.debug("Research agent completed successfully.")
        logging.debug("Final result (raw): %r", result)

        messages = result.get("messages", []) if isinstance(
            result, dict) else []

        if not messages:
            logging.warning("No messages returned from the research agent.")
            return "No response from the research agent."

        # prefer mapping objects or list-of-dicts structure
        last = messages[-1]
        if isinstance(last, dict) and "content" in last:
            return last["content"]
        elif hasattr(last, "content"):
            return last.content
        else:
            logging.error("Unrecognized message format: %r", last)
            return "Error: Invalid response message format."
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
