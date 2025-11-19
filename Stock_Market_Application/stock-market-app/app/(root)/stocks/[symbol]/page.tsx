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
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { runResearch } from "@/lib/langchain/stockmarketAgent";

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

  const hanleAIStockRecommendation = async () => {
    // setOpen(true);
    // setLoading(true);
    const result = await runResearch(symbol);
    console.log(result);
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
              onClick={() => hanleAIStockRecommendation()}
              className="bg-green-500 text-base hover:bg-green-500 text-gray-900 w-full rounded h-11 font-semibold cursor-pointer"
            >
              Ask AI (Stock Recommendation)
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="bg-black">
                <DialogTitle>
                  <div className="flex items-center gap-3 border-b pb-4">
                    <div className="p-2 bg-linear-to-r from-yellow-400 to-yellow-600 rounded-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        AI Recommendation
                      </h2>
                    </div>
                  </div>
                </DialogTitle>

                {loading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mb-4" />
                    <p className="text-gray-500">Analyzing market data...</p>
                    <p className=" text-gray-400 text-xl mt-2">
                      This may take a few seconds
                    </p>
                  </div>
                )}
                {error && (
                  <div className="bg-gray-800 border border-red-400 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertCircle className="w-5 h-5" />
                      <p className="font-semibold">
                        Error loading recommendation
                      </p>
                    </div>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                )}
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
