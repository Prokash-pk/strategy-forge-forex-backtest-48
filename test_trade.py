# Filename: test_trade.py
import requests
import json

# --- Aapki Demo Account Details ---
ACCOUNT_ID = "101-003-29878284-002"
ACCESS_TOKEN = "8c389f5c256d410b9816eed0a32fe12c-13280dfbbf43a500eb29248a88325454"
# ------------------------------------

API_URL = "https://api-fxpractice.oanda.com"
order_endpoint = f"{API_URL}/v3/accounts/{ACCOUNT_ID}/orders"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {ACCESS_TOKEN}"
}

order_data = {
    "order": {
        "units": "1",           # Sirf 1 unit ka test trade
        "instrument": "EUR_USD",
        "timeInForce": "FOK",   # Fill Or Kill
        "type": "MARKET",
        "positionFill": "DEFAULT"
    }
}

print(f"--- OANDA Test Trade Shuru ---")
print(f"Account ID: {ACCOUNT_ID}")
print(f"Instrument: EUR_USD, Units: 1")

try:
    print("\nOANDA server ko request bhej rahe hain...")
    response = requests.post(order_endpoint, headers=headers, data=json.dumps(order_data))
    
    # Response ka status code check karein
    if response.status_code >= 200 and response.status_code < 300:
        response_data = response.json()
        print("\n--- ✅ SUCCESS! OANDA se response mil gaya ---")
        print(json.dumps(response_data, indent=2))
        
        if 'orderFillTransaction' in response_data:
            print("\nCONFIRMATION: Trade successfully execute ho gaya hai!")
        else:
            print("\nCONFIRMATION: Order place ho gaya hai, par shayad fill nahi hua. Response check karein.")
            
    else:
        print(f"\n--- ❌ FAILURE! OANDA se Error Aaya ---")
        print(f"Status Code: {response.status_code}")
        print(f"Error Details: {response.text}")

except Exception as e:
    print(f"\n--- ❌ SCRIPT MEIN ERROR! ---")
    print(f"Error: {e}")
    print("Please check your internet connection and that the 'requests' library is installed.")