from langchain_core.tools import tool
import json
import os
import yfinance as yf
import logging
from langchain_community.tools import BraveSearch
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s"
)

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "").strip()

web_search = None

tavily_client = TavilyClient(api_key=TAVILY_API_KEY)


def web_search_function(query: str):
    return tavily_client.search(query=query, max_results=5)


web_search = web_search_function


@tool
def getStockPrice(symbol: str) -> str:
    """Get the current stock price and other details for a given stock symbol."""
    try:
        stock = yf.Ticker(symbol)
        logging.info(stock)
        info = stock.info
        hist = stock.history(period="1mo")
        if hist.empty:
            return json.dumps({"error": f"Could not retrieve data for {symbol}"})
        current_price = hist['Close'].iloc[-1]
        result = {
            "symbol": symbol,
            "current_price": round(current_price, 2),
            "company_name": info.get('longName', symbol),
            "market_cap": info.get('marketCap', 0),
            "pe_ratio": info.get('trailingPE', 'N/A'),
            "52_week_high": info.get('fiftyTwoWeekHigh', 0),
            "52_week_low": info.get('fiftyTwoWeekLow', 0)
        }
        return json.dumps(result, indent=2)
    except Exception as e:
        logging.error(f"Error fetching stock data for {symbol}: {e}")
        return f"Error fetching stock data for {symbol}: {e}"


def getFinancialStatement(symbol: str) -> str:
    """Retrieve key financial statement data."""
    try:
        stock = yf.Ticker(symbol)
        financials = stock.financials
        balance_sheet = stock.balance_sheet
        latest_year = financials.columns[0]

        return json.dumps(
            {
                "symbol": symbol,
                "period": str(latest_year.year),
                "revenue": (
                    float(financials.loc["Total Revenue", latest_year])
                    if "Total Revenue" in financials.index
                    else "N/A"
                ),
                "net_income": (
                    float(financials.loc["Net Income", latest_year])
                    if "Net Income" in financials.index
                    else "N/A"
                ),
                "total_assets": (
                    float(balance_sheet.loc["Total Assets", latest_year])
                    if "Total Assets" in balance_sheet.index
                    else "N/A"
                ),
                "total_debt": (
                    float(balance_sheet.loc["Total Debt", latest_year])
                    if "Total Debt" in balance_sheet.index
                    else "N/A"
                ),
            },
            indent=2,
        )
    except Exception as e:
        logging.error(f"Error fetching financial statement for {symbol}: {e}")
        return f"Error fetching financial statement for {symbol}: {e}"


@tool
def searchMarketTrend(topic: str) -> str:
    """Search for market trends and analysis on a specific topic using Brave or Tavily Search."""
    if not web_search:
        return json.dumps({"error": "No search provider configured"})

    try:
        search_query = f"{topic} market analysis trends 2024 2025 and future investment outlook forecast"
        results = web_search(search_query)

        return json.dumps({
            "topic": topic,
            "search_query": search_query,
            "trend_results": results
        }, indent=2)

    except Exception as e:
        return json.dumps({"error": f"Failed to search trends: {str(e)}"})


@tool
def searchFinancialNews(company_name: str, symbol: str) -> str:
    """Search for recent financial news about a company using Tavily Search.
    Call this tool ONLY ONCE per query, unless specifically asked for additional news.
    If news results are already available, do not call again."""
    if not web_search:
        return json.dumps({"error": "No search provider configured"})

    try:
        query = f"{company_name} {symbol} financial news stock earnings latest"
        results = web_search(query)
        return json.dumps({
            "symbol": symbol,
            "company": company_name,
            "results": results
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def getTechnicalIndicators(symbol: str, period: str = "3mo") -> str:
    """Get and calculate technical indicators for a given stock symbol over a specified period."""
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period=period)
        if hist.empty:
            return json.dumps({"error": f"No historical data for {symbol}"})

        hist["SMA_20"] = hist["Close"].rolling(window=20).mean()
        hist["SMA_50"] = hist["Close"].rolling(window=50).mean()

        delta = hist["Close"].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))

        latest = hist.iloc[-1]
        latest_rsi = rsi.iloc[-1]

        return json.dumps(
            {
                "symbol": symbol,
                "current_price": round(latest["Close"], 2),
                "sma_20": round(latest["SMA_20"], 2),
                "sma_50": round(latest["SMA_50"], 2),
                "rsi": round(latest_rsi, 2),
                "volume": int(latest["Volume"]),
                "trend_signal": (
                    "bullish"
                    if latest["Close"] > latest["SMA_20"] > latest["SMA_50"]
                    else "bearish"
                ),
            },
            indent=2,
        )
    except Exception as e:
        logging.error(f"Error initializing ticker for {symbol}: {e}")
        return f"Error initializing ticker for {symbol}: {e}"
