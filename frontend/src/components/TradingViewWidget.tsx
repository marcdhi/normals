import { useEffect, useRef } from "react";

let tvScriptLoadingPromise: Promise<void> | null;

type TradingViewWidgetProps = {
    symbol: string; // e.g. "PYTH:SOLUSD"
    interval?: string; // e.g. "D", "60", "1"
    theme?: "light" | "dark";
    timezone?: string; // e.g. "Etc/UTC", "America/New_York"
    containerId?: string;
};

export default function TradingViewWidget({
    symbol,
    interval = "D",
    theme = "light",
    timezone = "Etc/UTC",
    containerId = "tradingview",
}: TradingViewWidgetProps) {
    const onLoadScriptRef = useRef<null | (() => void)>(null);

    useEffect(() => {
        onLoadScriptRef.current = createWidget;

        if (!tvScriptLoadingPromise) {
            tvScriptLoadingPromise = new Promise((resolve) => {
                const script = document.createElement("script");
                script.id = "tradingview-widget-loading-script";
                script.src = "https://s3.tradingview.com/tv.js";
                script.type = "text/javascript";
                script.onload = () => resolve();

                document.head.appendChild(script);
            });
        }

        tvScriptLoadingPromise.then(
            () => onLoadScriptRef.current && onLoadScriptRef.current()
        );

        return () => {
            onLoadScriptRef.current = null;
        };

        function createWidget() {
            if (document.getElementById(containerId) && (window as any).TradingView) {
                new (window as any).TradingView.widget({
                    autosize: true,
                    symbol,
                    interval,
                    timezone,
                    theme,
                    style: "1",
                    locale: "en",
                    toolbar_bg: "#f1f3f6",
                    enable_publishing: false,
                    allow_symbol_change: true,
                    container_id: containerId,
                });
            }
        }
    }, [symbol, interval, theme, timezone, containerId]);

    return (
        <div className="tradingview-widget-container w-full h-96 min-h-[400px]">
            <div id={containerId} className="w-full h-full" />
        </div>
    );
}
