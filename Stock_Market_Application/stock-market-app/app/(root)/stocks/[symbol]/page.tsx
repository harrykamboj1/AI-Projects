"use client";
import TradingViewWidgets from "@/components/TradingViewWidgets";
import { Button } from "@/components/ui/button";
import WatchListButton from "@/components/WatchListButton";
import { Circles } from "react-loader-spinner";
import { getStockNews } from "@/lib/actions/alphaAdvantage.actions";
import {
  BASELINE_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  SYMBOL_INFO_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from "@/lib/constants";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  IndianRupee,
  Info,
  Loader2,
  Newspaper,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { runResearch } from "@/lib/langchain/stockmarketAgent";
import { parseAndNormalize } from "@/lib/utils";
import { StockAnalysisResponse } from "@/lib/types";

type StockDetailsParams = {
  params: Promise<{
    symbol: string;
  }>;
};

const StockDetails = ({ params }: StockDetailsParams) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stockNews, setStockNews] = useState([]);
  const [finalSymbol, setFinalSymbol] = useState("");
  const [symbol, setSymbol] = useState("");
  const [recommendation, setRecommendation] =
    useState<StockAnalysisResponse | null>(null);

  const handleAIStockRecommendation = async () => {
    setError("");
    setRecommendation(null);
    setOpen(true);
    setLoading(true);

    try {
      const result = await runResearch(symbol);

      if (result != null) {
        const cleanJson = result
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();

        if (cleanJson?.startsWith("Error")) {
          setError(result);
          setLoading(false);
          return;
        }
        try {
          const parsedData = JSON.parse(cleanJson);

          const typedData = parsedData as StockAnalysisResponse;

          setRecommendation(typedData);
        } catch (e: any) {
          console.error("JSON Parse Error:", e);
          setError(
            "Failed to process AI response. The model returned invalid JSON."
          );
        }

        setLoading(false);
      }
    } catch (err) {
      setError(typeof err === "string" ? err : "An unexpected error occurred");
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { symbol } = await params;
      if (!symbol) {
        return;
      }
      setSymbol(symbol);
      const news = await getStockNews(symbol);
      setStockNews(news);
      const extractSymbol = symbol
        .replace(/\.(BSE|BO|NS|NSE)$/i, "")
        .toUpperCase();
      setFinalSymbol("BSE:" + extractSymbol);
    };

    fetchData();
  }, [params]);

  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  if (!finalSymbol) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Circles
          height="80"
          width="80"
          color="#4fa94d"
          ariaLabel="circles-loading"
          visible={true}
        />
      </div>
    );
  }

  return (
    <div>
      <section className="grid stock-details-container">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TradingViewWidgets
            scriptUrl={`${scriptUrl}symbol-info.js`}
            config={SYMBOL_INFO_WIDGET_CONFIG(finalSymbol)}
            height={170}
          />

          <TradingViewWidgets
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(finalSymbol)}
            className="custom-chart"
            height={600}
          />

          <TradingViewWidgets
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(finalSymbol)}
            className="custom-chart"
            height={600}
          />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between ">
            <WatchListButton
              symbol={symbol.toUpperCase()}
              company={symbol.toUpperCase()}
              isInWatchlist={false}
            />
          </div>
          <div className="flex items-center justify-between">
            <Button
              onClick={() => handleAIStockRecommendation()}
              className="bg-green-500 text-base hover:bg-green-500 text-gray-900 w-full rounded h-11 font-semibold cursor-pointer"
            >
              Ask AI (Stock Recommendation)
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="bg-zinc-950 border-zinc-800  w-full overflow-x-auto max-h-[90vh] overflow-y-auto text-zinc-100 p-0">
                {/* 1. HEADER SECTION */}
                <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 p-6">
                  <DialogTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-linear-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl">
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                          {recommendation
                            ? recommendation.company
                            : "AI Market Analysis"}
                        </h2>
                        {recommendation && (
                          <p className="text-sm text-zinc-400 font-mono mt-1">
                            {recommendation.symbol}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price Tag (Only shows when data is ready) */}
                    {recommendation && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          ₹{recommendation.snapshot.current_price}
                        </div>
                        <div
                          className={`flex items-center justify-end gap-1 text-sm font-medium ${
                            recommendation.technicals.trend_signal === "bullish"
                              ? "text-green-400"
                              : recommendation.technicals.trend_signal ===
                                "bearish"
                              ? "text-red-400"
                              : "text-yellow-400"
                          }`}
                        >
                          {recommendation.technicals.trend_signal ===
                          "bullish" ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : recommendation.technicals.trend_signal ===
                            "bearish" ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <Activity className="w-4 h-4" />
                          )}
                          {recommendation.technicals.trend_signal.toUpperCase()}
                        </div>
                      </div>
                    )}
                  </DialogTitle>
                </div>

                <div className="p-6 space-y-8">
                  {/* 2. LOADING STATE */}
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
                      <div className="text-center space-y-1">
                        <p className="text-lg font-medium text-zinc-200">
                          Analyzing market data...
                        </p>
                        <p className="text-sm text-zinc-500">
                          Reading charts, news, and fundamentals
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 3. ERROR STATE */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-400">
                          Analysis Failed
                        </h3>
                        <p className="text-sm text-red-300/80 mt-1">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* 4. DATA DISPLAY (The Main Content) */}
                  {!loading && !error && recommendation && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                      {/* A. Key Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard
                          label="Market Cap"
                          value={formatCompactNumber(
                            recommendation.snapshot.market_cap
                          )}
                          icon={
                            <IndianRupee className="w-4 h-4 text-zinc-400" />
                          }
                        />
                        <MetricCard
                          label="P/E Ratio"
                          value={recommendation.snapshot.pe_ratio.toFixed(2)}
                          icon={<Activity className="w-4 h-4 text-zinc-400" />}
                        />
                        <MetricCard
                          label="52W High"
                          value={`₹${recommendation.snapshot["52_week_high"]}`}
                          highlight="text-green-400"
                        />
                        <MetricCard
                          label="Target Price"
                          value={
                            recommendation.recommendation.target_price.startsWith(
                              "$"
                            )
                              ? recommendation.recommendation.target_price.replace(
                                  "$",
                                  "₹"
                                )
                              : `₹${recommendation.recommendation.target_price}`
                          }
                          highlight="text-yellow-400"
                        />
                      </div>

                      {/* B. Investment Thesis (Hero Section) */}
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-yellow-500" />
                          Investment Thesis
                        </h3>
                        <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
                          {recommendation.investment_thesis}
                        </p>
                        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                          <span className="text-sm text-zinc-500">
                            Recommendation
                          </span>
                          <span
                            className={`px-4 py-1 rounded-full text-sm font-bold ${
                              recommendation.recommendation.verdict
                                .toLowerCase()
                                .includes("buy")
                                ? "bg-green-500/20 text-green-400"
                                : recommendation.recommendation.verdict
                                    .toLowerCase()
                                    .includes("sell")
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {recommendation.recommendation.verdict.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                            Technical Indicators
                          </h3>
                          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                              <span className="text-zinc-400 text-sm">
                                RSI (14)
                              </span>
                              <span className="font-mono font-medium">
                                {recommendation.technicals.rsi}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                              <span className="text-zinc-400 text-sm">
                                SMA 50
                              </span>
                              <span className="font-mono font-medium">
                                ₹{recommendation.technicals.sma_50}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 italic leading-relaxed">
                              {recommendation.technicals.analysis}
                            </p>
                          </div>
                        </div>

                        {/* C2. Risk Factors */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                            Risk Assessment
                          </h3>
                          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                            <ul className="space-y-3">
                              {recommendation.risks.financial_risks
                                .slice(0, 3)
                                .map((risk, i) => (
                                  <li
                                    key={i}
                                    className="flex gap-3 text-sm text-zinc-300"
                                  >
                                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                    {risk}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* D. Recent News */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                          <Newspaper className="w-4 h-4" /> Recent News Context
                        </h3>
                        <div className="grid gap-3">
                          {recommendation.news.slice(0, 3).map((item, i) => (
                            <a
                              key={i}
                              target="_blank"
                              href={item.url !== "" ? item.url : "#"}
                              className="group block bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800 rounded-lg p-4 transition-colors"
                            >
                              <h4 className="text-zinc-200 font-medium group-hover:text-yellow-400 transition-colors truncate">
                                {item.title}
                              </h4>
                              <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                                {item.summary}
                              </p>
                            </a>
                          ))}
                        </div>
                      </div>

                      <div className="bg-black rounded-lg text-yellow-200">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 flex items-start gap-4">
                          <Info className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-yellow-400">
                              Disclaimer
                            </h3>
                            <p className="text-sm text-yellow-300/80 mt-1">
                              Disclaimer: This is an AI-generated recommendation
                              based on available data. Please conduct your own
                              research and consult with a financial advisor
                              before making investment decisions.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <TradingViewWidgets
            scriptUrl={`${scriptUrl}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(finalSymbol)}
            height={400}
          />

          <TradingViewWidgets
            scriptUrl={`${scriptUrl}symbol-profile.js`}
            config={COMPANY_PROFILE_WIDGET_CONFIG(finalSymbol)}
            height={440}
          />

          <TradingViewWidgets
            scriptUrl={`${scriptUrl}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(finalSymbol)}
            height={464}
          />
        </div>
      </section>
      {stockNews.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {stockNews.map((newsItem: any, index: number) => (
            <NewsCard
              key={index}
              title={newsItem.title}
              description={newsItem.description}
              url={newsItem.url}
            />
          ))}
        </section>
      )}
    </div>
  );
};

export default StockDetails;

function NewsCard({ title, description, url }: any) {
  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col gap-4 border border-gray-700 hover:border-gray-500">
      <h2 className="text-yellow-400 text-xl font-bold">{title}</h2>
      <p className="text-gray-300 ">{description}</p>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline font-medium"
      >
        Read more →
      </a>
    </div>
  );
}

const MetricCard = ({ label, value, icon, highlight }: any) => (
  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
    <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-1">
      {icon}
      {label}
    </div>
    <div className={`text-lg font-semibold ${highlight || "text-zinc-200"}`}>
      {value}
    </div>
  </div>
);

const formatCompactNumber = (number: number) => {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
};
