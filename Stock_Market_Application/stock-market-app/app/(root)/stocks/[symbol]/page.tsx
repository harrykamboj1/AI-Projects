import TradingViewWidgets from "@/components/TradingViewWidgets";
import WatchListButton from "@/components/WatchListButton";
import { getStockNews } from "@/lib/actions/alphaAdvantage.actions";
import {
  BASELINE_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  SYMBOL_INFO_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from "@/lib/constants";

type StockDetailsParams = {
  params: Promise<{
    symbol: string;
  }>;
};

const StockDetails = async ({ params }: StockDetailsParams) => {
  const { symbol } = await params;
  if (!symbol) {
    return <div>No symbol provided</div>;
  }
  const stockNews = await getStockNews(symbol);
  console.log(stockNews);
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
      {stockNews.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <p className="text-gray-300 flex-grow">{description}</p>

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
