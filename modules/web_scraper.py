import requests
from bs4 import BeautifulSoup
import yfinance as yf

def scrape_recent_news():
    url = "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    try:
        resp = requests.get(url)
        soup = BeautifulSoup(resp.content, features="xml")
        items = soup.findAll('item')
        return [{'title': i.title.text, 'link': i.link.text, 'pubDate': i.pubDate.text} for i in items[:15]]
    except Exception: return []

def get_stock_data(category):
    import yfinance as yf
    
    categories = {
        '국내 주식': ['005930.KS', '000660.KS', '373220.KS', '207940.KS', '005380.KS'], # 삼성전자, SK하이닉스, LG엔솔, 삼바, 현대차
        '미국 주식': ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL']
    }
    
    symbols = categories.get(category, ['AAPL'])
    results = []
    
    for s in symbols:
        try:
            t = yf.Ticker(s)
            info = t.info
            name = info.get('shortName', s)
            price = info.get('currentPrice', info.get('regularMarketPrice', 0))
            if not price:
                h = t.history(period="1d")
                if not h.empty:
                    price = round(h['Close'].iloc[-1], 2)
            
            mc = info.get('marketCap', 0)
            if mc > 0:
                if 'KS' in s or 'KQ' in s:
                    mc_str = f"{mc / 1_000_000_000_000:.1f}조 원"
                else:
                    mc_str = f"${mc / 1_000_000_000:.1f}B"
            else:
                mc_str = "N/A"
                
            results.append({
                'symbol': s.replace('.KS', ''), 
                'name': name, 
                'price': price, 
                'market_cap': mc_str
            })
        except:
            pass
            
    return results
