# Country registry: World Bank economy code, region, and FX ticker/pair for
# the initial demo set. `wb_code` is the World Bank 3-letter economy code
# (matches ISO 3166-1 alpha-3 for all countries below). `fx_ticker` is the
# Yahoo Finance ticker quoting "USD per 1 unit of local currency"; USD itself
# has no FX ticker since it is the base currency.

COUNTRIES = [
    {"code": "USA", "name": "United States", "region": "North America", "wb_code": "USA", "fx_ticker": None, "fx_pair": None},
    {"code": "DEU", "name": "Germany", "region": "Europe", "wb_code": "DEU", "fx_ticker": "EURUSD=X", "fx_pair": "EUR / USD"},
    {"code": "FRA", "name": "France", "region": "Europe", "wb_code": "FRA", "fx_ticker": "EURUSD=X", "fx_pair": "EUR / USD"},
    {"code": "GBR", "name": "United Kingdom", "region": "Europe", "wb_code": "GBR", "fx_ticker": "GBPUSD=X", "fx_pair": "GBP / USD"},
    {"code": "ITA", "name": "Italy", "region": "Europe", "wb_code": "ITA", "fx_ticker": "EURUSD=X", "fx_pair": "EUR / USD"},
    {"code": "ESP", "name": "Spain", "region": "Europe", "wb_code": "ESP", "fx_ticker": "EURUSD=X", "fx_pair": "EUR / USD"},
    {"code": "NLD", "name": "Netherlands", "region": "Europe", "wb_code": "NLD", "fx_ticker": "EURUSD=X", "fx_pair": "EUR / USD"},
    {"code": "CHE", "name": "Switzerland", "region": "Europe", "wb_code": "CHE", "fx_ticker": "CHFUSD=X", "fx_pair": "CHF / USD"},
    {"code": "SWE", "name": "Sweden", "region": "Europe", "wb_code": "SWE", "fx_ticker": "SEKUSD=X", "fx_pair": "SEK / USD"},
    {"code": "NOR", "name": "Norway", "region": "Europe", "wb_code": "NOR", "fx_ticker": "NOKUSD=X", "fx_pair": "NOK / USD"},
    {"code": "POL", "name": "Poland", "region": "Europe", "wb_code": "POL", "fx_ticker": "PLNUSD=X", "fx_pair": "PLN / USD"},
    {"code": "RUS", "name": "Russia", "region": "Europe", "wb_code": "RUS", "fx_ticker": "RUBUSD=X", "fx_pair": "RUB / USD"},
    {"code": "TUR", "name": "Turkey", "region": "Europe", "wb_code": "TUR", "fx_ticker": "TRYUSD=X", "fx_pair": "TRY / USD"},
    {"code": "CHN", "name": "China", "region": "Asia", "wb_code": "CHN", "fx_ticker": "CNYUSD=X", "fx_pair": "CNY / USD"},
    {"code": "JPN", "name": "Japan", "region": "Asia", "wb_code": "JPN", "fx_ticker": "JPYUSD=X", "fx_pair": "JPY / USD"},
    {"code": "IND", "name": "India", "region": "Asia", "wb_code": "IND", "fx_ticker": "INRUSD=X", "fx_pair": "INR / USD"},
    {"code": "KOR", "name": "South Korea", "region": "Asia", "wb_code": "KOR", "fx_ticker": "KRWUSD=X", "fx_pair": "KRW / USD"},
    {"code": "IDN", "name": "Indonesia", "region": "Asia", "wb_code": "IDN", "fx_ticker": "IDRUSD=X", "fx_pair": "IDR / USD"},
    {"code": "SGP", "name": "Singapore", "region": "Asia", "wb_code": "SGP", "fx_ticker": "SGDUSD=X", "fx_pair": "SGD / USD"},
    {"code": "THA", "name": "Thailand", "region": "Asia", "wb_code": "THA", "fx_ticker": "THBUSD=X", "fx_pair": "THB / USD"},
    {"code": "VNM", "name": "Vietnam", "region": "Asia", "wb_code": "VNM", "fx_ticker": "VNDUSD=X", "fx_pair": "VND / USD"},
    {"code": "AUS", "name": "Australia", "region": "Oceania", "wb_code": "AUS", "fx_ticker": "AUDUSD=X", "fx_pair": "AUD / USD"},
    {"code": "NZL", "name": "New Zealand", "region": "Oceania", "wb_code": "NZL", "fx_ticker": "NZDUSD=X", "fx_pair": "NZD / USD"},
    {"code": "CAN", "name": "Canada", "region": "North America", "wb_code": "CAN", "fx_ticker": "CADUSD=X", "fx_pair": "CAD / USD"},
    {"code": "MEX", "name": "Mexico", "region": "North America", "wb_code": "MEX", "fx_ticker": "MXNUSD=X", "fx_pair": "MXN / USD"},
    {"code": "BRA", "name": "Brazil", "region": "South America", "wb_code": "BRA", "fx_ticker": "BRLUSD=X", "fx_pair": "BRL / USD"},
    {"code": "ARG", "name": "Argentina", "region": "South America", "wb_code": "ARG", "fx_ticker": "ARSUSD=X", "fx_pair": "ARS / USD"},
    {"code": "ZAF", "name": "South Africa", "region": "Africa", "wb_code": "ZAF", "fx_ticker": "ZARUSD=X", "fx_pair": "ZAR / USD"},
    {"code": "NGA", "name": "Nigeria", "region": "Africa", "wb_code": "NGA", "fx_ticker": "NGNUSD=X", "fx_pair": "NGN / USD"},
    {"code": "EGY", "name": "Egypt", "region": "Africa", "wb_code": "EGY", "fx_ticker": "EGPUSD=X", "fx_pair": "EGP / USD"},
    {"code": "SAU", "name": "Saudi Arabia", "region": "Middle East", "wb_code": "SAU", "fx_ticker": "SARUSD=X", "fx_pair": "SAR / USD"},
]

# US 10-year Treasury yield is the only bond series with a reliable free
# daily ticker; other countries stay null until a comparable source is added.
BOND_YIELD_TICKERS = {
    "USA": "^TNX",
}


def get_country_config(code: str) -> dict | None:
    code = code.upper()
    return next((c for c in COUNTRIES if c["code"] == code), None)


def list_country_configs() -> list[dict]:
    return COUNTRIES
