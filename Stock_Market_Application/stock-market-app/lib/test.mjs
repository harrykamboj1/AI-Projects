import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

const results = await yahooFinance.search("AAPL");

const quote = await yahooFinance.quote('AAPL');

console.log(`The current price of Apple (AAPL) is ${JSON.stringify(quote)}`);
// console.log(`Search results for TCS.NS: ${JSON.stringify(results)}`);