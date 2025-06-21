import os
import time
import logging
from datetime import datetime
from dotenv import load_dotenv
import pandas as pd
from oandapyV20.endpoints.instruments import InstrumentsCandles
# OANDA ki zaroori libraries
from oandapyV20 import API
from oandapyV20.contrib.requests import MarketOrderRequest
from oandapyV20.endpoints import orders  # Yeh line zaroori hai
from oandapyV20.exceptions import V20Error

# --- Step 1: Setup ---

# .env file se saare secrets load karo
load_dotenv()

# Logging setup - har cheez file aur screen par dikhegi
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("runner.log"),
        logging.StreamHandler()
    ]
)

# .env file se OANDA ki details nikalo
OANDA_TOKEN = os.getenv("OANDA_ACCESS_TOKEN")
OANDA_ACCOUNT_ID = os.getenv("OANDA_ACCOUNT_ID")
OANDA_ENV = "practice"

# --- Step 2: Functions ---

# Yeh poora function copy-paste karein

def execute_trade(api_client, account_id, instrument, units):
    """Yeh function OANDA par asli trade daalta hai"""
    logging.info(f"Trade karne ki koshish: {units} units of {instrument}")
    
    order_request_data = MarketOrderRequest(instrument=instrument, units=units).data
    endpoint = orders.OrderCreate(accountID=account_id, data=order_request_data)

    try:
        response = api_client.request(endpoint)
        logging.info(f"OANDA se response mila: {response}")
        
        if 'orderFillTransaction' in response:
            fill_details = response['orderFillTransaction']
            
            # --- YAHAN PAR CODE THEEK KIYA GAYA HAI ---
            # Problem 1: Emoji hata diya
            # Problem 2: Trade ID sahi jagah se uthaya
            trade_id = fill_details.get('tradeOpened', {}).get('tradeID', 'N/A')
            price = fill_details.get('price', 'N/A')
            
            logging.info(f"--- SUCCESS! Trade Filled! ---") # Emoji hata diya
            logging.info(f"Trade ID: {trade_id}, Price: {price}")
            return True
        else:
            logging.warning(f"Order place ho gaya hai, par shayad fill nahi hua. Response: {response}")
            return False

    except V20Error as e:
        logging.error(f"OANDA API mein trade karte time Error: {e}")
        logging.error(f"Error Details: {e.msg}")
    except Exception as e:
        logging.error(f"Koi anjaan error aaya: {e}")
    
    return False

# Yeh poora naya function copy-paste karein
def check_for_trade_signal(api_client, account_id):
    """
    Yeh function Moving Average Crossover strategy ke hisaab se signal check karta hai.
    """
    instrument = "EUR_USD"
    short_window = 20  # Choti Moving Average
    long_window = 50   # Badi Moving Average
    
    logging.info(f"Strategy Check: {instrument} ke liye Moving Average Crossover check kar rahe hain...")

    # OANDA se pichhle 100 candles (bars) ka data maango
    params = {
        "count": 100,
        "granularity": "M1"  # M1 = 1 Minute ki candles. Aap isko "H1" (1 Hour) ya "D" (1 Day) bhi kar sakte hain.
    }
    
    try:
        # API se data lene ka request
        endpoint = InstrumentsCandles(instrument=instrument, params=params)
        api_client.request(endpoint)
        response = endpoint.response

        # Data ko saaf-suthre format (DataFrame) mein daalo
        candles = response.get('candles')
        prices = [float(c['mid']['c']) for c in candles] # Har candle ka closing price
        df = pd.DataFrame(prices, columns=['close'])

        # Moving Averages calculate karo
        df['short_ma'] = df['close'].rolling(window=short_window).mean()
        df['long_ma'] = df['close'].rolling(window=long_window).mean()

        # Sabse aakhri (latest) do candles ka data dekho
        latest_short_ma = df['short_ma'].iloc[-1]
        latest_long_ma = df['long_ma'].iloc[-1]
        
        previous_short_ma = df['short_ma'].iloc[-2]
        previous_long_ma = df['long_ma'].iloc[-2]

        logging.info(f"Latest MAs: Short MA = {latest_short_ma:.5f}, Long MA = {latest_long_ma:.5f}")

        # --- Strategy ka Asli Logic ---
        
        # BUY Signal: Agar pichhli candle mein short MA neeche tha, aur ab upar aa gaya hai
        if previous_short_ma <= previous_long_ma and latest_short_ma > latest_long_ma:
            logging.info(f"BUY SIGNAL MILA! Short MA ne Long MA ko upar ki taraf cross kiya.")
            return (instrument, 100)  # 100 units buy karo

        # SELL Signal: Agar pichhli candle mein short MA upar tha, aur ab neeche aa gaya hai
        elif previous_short_ma >= previous_long_ma and latest_short_ma < latest_long_ma:
            logging.info(f"SELL SIGNAL MILA! Short MA ne Long MA ko neeche ki taraf cross kiya.")
            return (instrument, -100) # 100 units sell karo (-100)

        else:
            logging.info("Koi Crossover nahi hua. Koi Signal Nahi.")
            return (None, None)

    except Exception as e:
        logging.error(f"Strategy check karte waqt error aaya: {e}")
        return (None, None)

def main():
    """Yeh main loop hai jo hamesha chalta rahega."""
    logging.info("--- 24/7 Strategy Runner Shuru ho gaya ---")

    # Check karo ki .env file se details aayi ya nahi
    if not OANDA_TOKEN or not OANDA_ACCOUNT_ID:
        logging.critical("Error: OANDA_ACCESS_TOKEN ya OANDA_ACCOUNT_ID .env file mein nahi mila. Program band ho raha hai.")
        return

    # OANDA API client taiyaar karo
    api_client = API(access_token=OANDA_TOKEN, environment=OANDA_ENV)
    
    last_trade_minute = -5 

    while True:
        try:
            current_minute = datetime.now().minute
            
            if abs(current_minute - last_trade_minute) > 2:
                instrument, units = check_for_trade_signal(api_client, OANDA_ACCOUNT_ID)
                if instrument and units:
                    logging.info(f"Signal confirm! Instrument: {instrument}, Units: {units}")
                    
                    # Trade execute karo, is baar sahi details ke saath
                    trade_success = execute_trade(api_client, OANDA_ACCOUNT_ID, instrument, units)
                    
                    if trade_success:
                        last_trade_minute = current_minute
            
            time.sleep(60)

        except KeyboardInterrupt:
            logging.info("--- Runner band kiya jaa raha hai ---")
            break
        except Exception as e:
            logging.error(f"Main loop mein error: {e}")
            time.sleep(30)

if __name__ == "__main__":
    main()