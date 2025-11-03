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
def run_research(query: str):
    """Run the deep stock market research agent and return the final message content with debug logging."""
    try:
        logging.info(f"Running research agent with query: {query}")

        llm = OllamaLLM(model=OLLAMA_MODEL, temperature=0)

        research_agent = create_deep_agent(
            model=llm,
            system_prompt=INSTRUCTIONS,
            subagents=sub_agents,
            tools=tool
        ).with_config({"recursion_limit": int(30)})

        result = research_agent.invoke({
            "messages": [
                {
                    "role": "user",
                    "content": query
                }
            ]
        }, {"recursion_limit": 30})

        logging.debug("Research agent completed successfully.")
        logging.debug(f"Final result: {result}")

        messages = result.get("messages", [])
        output_text = ""

        if not messages:
            logging.warning("No messages returned from the research agent.")
            output_text = "No response from the research agent."
        elif hasattr(messages[-1], "content"):
            output_text = messages[-1].content
            logging.debug(
                f"Output content from object: {output_text}")
        else:
            logging.error("Unrecognized message format.")
            output_text = "Error: Invalid response message format."

        return output_text
    except Exception as e:
        logging.error(f"Error running research agent: {e}")
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
