import "chart.js/auto";
import { useState, useEffect, useMemo } from "react";
import { Doughnut, Line } from "react-chartjs-2";

const COINGECKO_HEADERS = {
  "x-cg-demo-api-key": "CG-k31KWE6Zzxn1fzFKFX1kiqhp",
};

const RANGE_TO_DAYS = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "6M": 180,
  "1Y": 365,
};

const CHART_COIN_IDS = ["ethereum", "bitcoin", "tether"];

function formatChartAxisLabel(timestamp, daysRange) {
  const d = new Date(timestamp);
  if (daysRange <= 1) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (daysRange <= 7) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  if (daysRange <= 30) {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** % change from first sample so BTC, ETH & USDT share one comparable scale (zoomed to movement). */
function toPercentChangeFromStart(prices) {
  if (!Array.isArray(prices) || !prices.length) return [];
  const base = prices[0];
  if (typeof base !== "number" || base <= 0) return prices.map(() => 0);
  return prices.map((p) =>
    typeof p === "number" && p > 0 ? ((p / base) - 1) * 100 : 0,
  );
}

const Main = () => {
  const [activeRange, setActiveRange] = useState("1W");
  const [prices, setPrices] = useState([]);
  const [chartSeries, setChartSeries] = useState({
    labels: [],
    ethereum: [],
    bitcoin: [],
    tether: [],
  });
  const [selectedCoins, setSelectedCoins] = useState([
    "bitcoin",
    "ethereum",
    "tether",
  ]);
  const handleSelectedCoinChange = (index, coinType) => {
    setSelectedCoins((prev) => {
      const updated = [...prev];
      updated[index] = coinType;
      return updated;
    });
  };

  const [exchange, setExchange] = useState({});
  const [sellCoin, setSellCoin] = useState("bitcoin");
  const [buyCoin, setBuyCoin] = useState("ethereum");
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,terra-luna,solana,tether,cardano,avalanche&order=market_cap_desc&per_page=7&page=1&sparkline=false&price_change_percentage=24h",
          {
            headers: COINGECKO_HEADERS,
          },
        );
         
        const data = await res.json();
        setPrices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching prices:", err);
        setPrices([]);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const days = RANGE_TO_DAYS[activeRange] ?? 7;

    const fetchMarketCharts = async () => {
      try {
        const results = await Promise.all(
          CHART_COIN_IDS.map((id) =>
            fetch(
              `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
              { headers: COINGECKO_HEADERS },
            ).then((r) => r.json()),
          ),
        );

        const [ethPrices, btcPrices, usdtPrices] = results.map(
          (j) => (Array.isArray(j.prices) ? j.prices : []),
        );

        const len = Math.min(
          ethPrices.length,
          btcPrices.length,
          usdtPrices.length,
        );

        if (!len) {
          setChartSeries({
            labels: [],
            ethereum: [],
            bitcoin: [],
            tether: [],
          });
          return;
        }

        const labels = ethPrices.slice(0, len).map(([t]) =>
          formatChartAxisLabel(t, days),
        );

        setChartSeries({
          labels,
          ethereum: ethPrices.slice(0, len).map(([, p]) => p),
          bitcoin: btcPrices.slice(0, len).map(([, p]) => p),
          tether: usdtPrices.slice(0, len).map(([, p]) => p),
        });
      } catch (err) {
        console.error("Error fetching chart history:", err);
        setChartSeries({
          labels: [],
          ethereum: [],
          bitcoin: [],
          tether: [],
        });
      }
    };

    fetchMarketCharts();
  }, [activeRange]);


  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano,tether,avalanche&vs_currencies=usd,eur,inr",
          {
            headers: COINGECKO_HEADERS,
          }
        );
  
        const data = await res.json();
        setExchange(data);
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
        setExchange({});
      }
    };
  
    fetchRates();
  }, []);
  

  

  const lineData = useMemo(
    () => ({
      labels: chartSeries.labels,
      datasets: [
        {
          label: "Ethereum",
          data: toPercentChangeFromStart(chartSeries.ethereum),
          borderColor: "#2f87f4",
          backgroundColor: "rgba(47, 135, 244, 0.12)",
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 7,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#2f87f4",
          pointBorderWidth: 2,
          tension: 0.35,
          fill: false,
        },
        {
          label: "Bitcoin",
          data: toPercentChangeFromStart(chartSeries.bitcoin),
          borderColor: "#d02134",
          backgroundColor: "rgba(208, 33, 52, 0.15)",
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 7,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#d02134",
          pointBorderWidth: 2,
          tension: 0.35,
          fill: false,
        },
        {
          label: "Tether",
          data: toPercentChangeFromStart(chartSeries.tether),
          borderColor: "rgba(50, 253, 94, 0.93)",
          backgroundColor: "rgba(50, 253, 94, 0.15)",
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 7,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "rgba(50, 253, 94, 0.93)",
          pointBorderWidth: 2,
          tension: 0.35,
          fill: false,
        },
      ],
    }),
    [chartSeries],
  );

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            padding: 18,
            color: "#111827",
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#6b7280",
          bodyColor: "#111827",
          bodySpacing: 8,
          borderColor: "#e5e7eb",
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: (context) => {
              const idx = context.dataIndex;
              const pct = context.parsed?.y;
              const label = context.dataset.label;
              let raw;
              if (label === "Ethereum") raw = chartSeries.ethereum[idx];
              else if (label === "Bitcoin") raw = chartSeries.bitcoin[idx];
              else raw = chartSeries.tether[idx];
              const usd =
                typeof raw === "number"
                  ? `$${raw.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  : "—";
              const pctStr =
                typeof pct === "number"
                  ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`
                  : "—";
              return `${label}: ${usd} (${pctStr} vs start)`;
            },
          },
        },
      },
      scales: {
        x: {
          offset: true,
          grid: { display: false, drawBorder: true },
          border: { display: true },
          ticks: {
            color: "#6b7280",
            font: { size: 11 },
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            autoSkipPadding: 4,
          },
        },
        y: {
          grace: "12%",
          grid: { color: "rgba(148, 163, 184, 0.25)", drawBorder: true },
          border: { display: true },
          ticks: {
            color: "#6b7280",
            callback: (value) => {
              const n = Number(value);
              return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
            },
          },
        },
      },
    }),
    [chartSeries],
  );
  const labels = prices.map((coin) => coin.name);
  const marketCaps = prices.map((coin) => coin.market_cap);
  const doughnutData = {
    labels: labels,
    datasets: [
      {
        label: "Market Value Distribution",
        data: marketCaps,
        backgroundColor: [
          "rgba(54, 162, 235, 0.7)",
                "rgba(255, 99, 132, 0.7)",
                "rgba(75, 192, 192, 0.7)",
                "rgba(0, 1, 8, 0.7)",
                "rgba(153, 102, 255, 0.7)",
                "rgba(255, 159, 64, 0.7)",
                "rgba(201, 203, 207, 0.7)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
    },
    cutout: "45%",
  };

  const SearchIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-400"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
  const CalendarIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-500"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
  return (
    <div>
      <section>
        <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-700">
                {["1D", "1W", "1M", "6M", "1Y"].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setActiveRange(duration)}
                    aria-pressed={duration === activeRange}
                    className={`rounded px-3 py-1 transition-colors ${
                      duration === activeRange
                        ? "border border-blue-500 bg-white text-blue-700 shadow-sm"
                        : "text-slate-700"
                    }`}
                    type="button"
                  >
                    {duration}
                  </button>
                ))}
                <button
                  type="button"
                  className="ml-1 rounded px-2 py-1 text-slate-700 hover:bg-white"
                  aria-label="Select date"
                >
                  <CalendarIcon />
                </button>
              </div>

              
            </div>

            <div className="h-80 md:h-[26rem] min-h-[20rem]">
              <Line data={lineData} options={lineOptions} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Portfolio
                  </h3>
                  <p className="text-sm text-slate-500">
                    Total value:{" "}
                    <span className="font-semibold text-slate-900">$1000</span>
                  </p>
                </div>
                <div className="h-40">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Exchange Coins
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 items-center gap-3">
                    <span className="text-amber-500">Sell</span>
                    <select
                      className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700"
                      value={sellCoin}
                      onChange={(e) => setSellCoin(e.target.value)}
                    >
                      <option value="bitcoin">Bitcoin</option>
                      <option value="ethereum">Ethereum</option>
                      <option value="tether">Tether</option>
                      <option value="solana">Solana</option>
                      <option value="cardano">Cardano</option>
                      <option value="avalanche">Avalanche</option>
                    </select>
                    <input
                      type="text"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-slate-600 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
                    <span className="text-emerald-500">Buy</span>
                    <select
                      className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700"
                      value={buyCoin}
                      onChange={(e) => setBuyCoin(e.target.value)}
                    >
                      <option value="ethereum">Ethereum</option>
                      <option value="bitcoin">Bitcoin</option>
                      <option value="tether">Tether</option>
                      <option value="solana">Solana</option>
                      <option value="cardano">Cardano</option>
                      <option value="avalanche">Avalanche</option>
                    </select>
                    <input
                      type="text"
                      value={buyAmount}
                      readOnly
                      placeholder="Result"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-slate-600 placeholder:text-slate-400 bg-slate-50"
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-md bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700 mt-2"
                    onClick={() => {
                      const sellRate = exchange?.[sellCoin]?.usd;
                      const buyRate = exchange?.[buyCoin]?.usd;
                      const amount = parseFloat(sellAmount);

                      if (!sellRate || !buyRate || isNaN(amount) || amount <= 0) {
                        setBuyAmount("");
                        return;
                      }

                      const result = (amount * sellRate) / buyRate;
                      setBuyAmount(result.toFixed(6));
                    }}
                  >
                    Exchange
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-5 text-lg font-semibold text-slate-900">
              Cryptocurrency by
              <br />
              market cap
            </h3>
            <div className="space-y-4">
              {Array.isArray(prices) &&
                prices.map((coin) => {
                  const change24h =
                    typeof coin.price_change_percentage_24h === "number"
                      ? coin.price_change_percentage_24h
                      : null;
                  const isNegative = change24h !== null && change24h < 0;

                  return (
                    <div
                      key={coin.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {coin.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Mkt.Cap{" "}
                          {typeof coin.market_cap === "number"
                            ? `$${coin.market_cap.toLocaleString()}`
                            : "-"}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isNegative ? "text-amber-500" : "text-emerald-500"
                        }`}
                      >
                        {change24h === null ? "-" : `${change24h.toFixed(2)}%`}
                      </span>
                    </div>
                  );
                })}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default Main;
