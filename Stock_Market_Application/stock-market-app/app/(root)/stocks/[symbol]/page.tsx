import TradingViewWidgets from "@/components/TradingViewWidgets";
import WatchListButton from "@/components/WatchListButton";
import {
  BASELINE_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  SYMBOL_INFO_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from "@/lib/constants";
import React from "react";

type StockDetailsParams = {
  params: Promise<{
    symbol: string;
  }>;
};

const StockDetails = async ({ params }: StockDetailsParams) => {
  const { symbol } = await params;
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
  const extractSymbol = symbol.replace(/\.(BSE|BO|NS|NSE)$/i, "").toUpperCase();

  const finalSymbol = "BSE:" + extractSymbol;

  return (
    <div>
      <section className="grid stock-details-container">
        {/* Left column */}
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
          <div className="flex items-center justify-between">
            <WatchListButton
              symbol={symbol.toUpperCase()}
              company={symbol.toUpperCase()}
              isInWatchlist={false}
            />
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
    </div>
  );
};

export default StockDetails;
