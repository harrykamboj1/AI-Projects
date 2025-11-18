import SearchCommand from "@/components/SearchCommand";
import { searchStocks } from "@/lib/actions/alphaAdvantage.actions";
import { Star } from "lucide-react";
import React from "react";

const WatchListPage = async () => {
  const watchList = [];
  const initialStocks = await searchStocks();

  if (watchList.length !== 0) {
    return (
      <section className="flex justify-center container gap-8 flex-col items-center md:mt-10 p-6 text-center">
        <div className="flex flex-col items-center justify-center text-center">
          <Star className="h-16 w-16 text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">
            Your Watchlist is empty
          </h2>
          <p className="text-gray-500 mb-6 max-w-md">
            Add stocks to your watchlist to keep track of them here.
          </p>
        </div>
        <SearchCommand initialStocks={initialStocks} />
      </section>
    );
  }
  return (
    <section className="watchlist">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="watchlist-title">Watchlist</h2>
          <SearchCommand initialStocks={initialStocks} />
        </div>
        {/* WatchlistTable */}
      </div>
    </section>
  );
};

export default WatchListPage;
