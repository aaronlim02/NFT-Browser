from flask import Flask, request, jsonify, send_file
import matplotlib
matplotlib.use('Agg')  # Use a non-GUI backend
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from matplotlib.dates import DateFormatter
import io
import base64
import json
from flask_cors import CORS
import requests
from apscheduler.schedulers.background import BackgroundScheduler
import time
import os
from dotenv import load_dotenv
import sqlite3
from datetime import datetime, timedelta
from flask_socketio import SocketIO, emit
import numpy as np
import pandas as pd
from scipy import stats
import sqlitecloud

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app, origins=["*"], supports_credentials=True)
load_dotenv()

opensea_api_key = "d7bc517c25894772ae915ef729c8a443"
alchemy_api_key = "Fn6XgY7SlhdqnbN09xv5QFenmRxaK0Ej"
#database_url = r"../database/database.sqlite"

delay = 0.0

opensea_headers = {
    "accept": "application/json",
    "X-API-KEY": opensea_api_key
}

alchemy_headers = {"accept": "application/json"}

# get collection name

@app.route('/get-collection-name', methods=['POST'])
def get_collection_name():
    slug = request.json.get('slug')
    if not slug:
        return jsonify({"error": "Slug not provided"}), 400
    try:
        url = f"https://api.opensea.io/api/v2/collections/{slug}"
        response = requests.get(url, headers=opensea_headers)
        print("get name code:", response.status_code)
        data = response.json()
        name = data["name"]
        return jsonify(name)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# get item name

@app.route('/get-item-name', methods=['POST'])
def get_item_name():
    data_input = request.json
    contract = data_input.get('contract')
    item_id = data_input.get("item_id")
    if not contract or not item_id:
        return jsonify({"error": "Item not provided"}), 400
    try:
        url = f"https://api.opensea.io/api/v2/chain/ethereum/contract/{contract}/nfts/{item_id}"
        response = requests.get(url, headers=opensea_headers)
        print("get item code:", response.status_code)
        if response.status_code == 400:
            return jsonify({"error": "Error parsing data, please check your input."}), response.status_code
        if response.status_code == 500:
            return jsonify({"error": "Opensea server error, please trry again later."}), response.status_code
        data = response.json()
        name = data["nft"]["name"]
        return jsonify(name)
    except Exception as e:
        return jsonify({"error": str(e), "status_code": response.status_code})

# get nft from account api

def iterate_get_nfts(nfts_raw): # iterate getting nft out of json
    out = []
    for nft in nfts_raw:
        collection = nft["contract"] # contract address
        identifier = nft["identifier"]
        token_standard = nft["token_standard"]
        name = nft["name"]
        opensea_url = nft["opensea_url"]
        out.append([collection, identifier, token_standard, name, opensea_url]) # nft_data
    return out

def get_nfts_acc(acc, cursor): # get nfts from account
    if cursor:
        url = f"https://api.opensea.io/api/v2/chain/ethereum/account/{acc}/nfts?limit=100&next={cursor}"
    else:
        nfts = []
        url = f"https://api.opensea.io/api/v2/chain/ethereum/account/{acc}/nfts?limit=100"
    response = requests.get(url, headers=opensea_headers)
    print("get nft code:", response.status_code)
    data = response.json()
    if 'next' in data:
        next = data['next']
    else:
        next = False
    nfts_raw = data['nfts']
    nfts = iterate_get_nfts(nfts_raw)
    return (nfts, next)

def iterate_get_listed_nfts(nfts_raw): # iterate getting nft out of json
    nfts = []
    for nft in nfts_raw:
        asset = nft["maker_asset_bundle"]["assets"][0]
        collection = asset["asset_contract"]["address"]
        identifier = asset["token_id"]
        collection_name = asset["collection"]["name"]
        token_standard = asset["asset_contract"]["schema_name"]
        name = asset["name"]
        img = asset["image_url"]
        price = float(nft["current_price"]) / 10**18
        opensea_url = asset["permalink"]
        is_verified = True if asset["collection"]["safelist_request_status"] == "verified" or asset["collection"]["safelist_request_status"] == "approved" else False
        is_creator_fees_enforced = asset["collection"]["is_creator_fees_enforced"]
        nfts.append([name, collection_name, img, collection, identifier, price, opensea_url, is_verified, is_creator_fees_enforced]) # nft_data_listed
    
    min_price_dict = {}
    final = []
    for nft in nfts: # delete duplicate listings, keep only lowest priced one
        id = (nft[0], nft[2])
        if id not in min_price_dict or nft[5] < min_price_dict[id]:
            min_price_dict[id] = nft[5]
            final.append(nft)
    return final

def get_nfts_listed_acc(acc, cursor): # get nfts from acc
    if cursor:
        url = f"https://api.opensea.io//api/v2/orders/ethereum/seaport/listings?cursor={cursor}&limit=50&maker={acc}"
    else:
        nfts = []
        url = f"https://api.opensea.io//api/v2/orders/ethereum/seaport/listings?limit=50&maker={acc}"
    response = requests.get(url, headers=opensea_headers)
    print("get nft code:", response.status_code)
    data = response.json()
    if 'next' in data:
        next = data['next']
    else:
        next = False
    nfts_raw = data['orders']
    nfts = iterate_get_listed_nfts(nfts_raw)
    return (nfts, next)

def alchemy_process(nfts):
    input = []
    for nft in nfts:
        input.append({"contractAddress": nft[0], 
                      "tokenId": nft[1],
                      "tokenType": nft[2]})
        
    url = f"https://eth-mainnet.g.alchemy.com/nft/v3/{alchemy_api_key}/getNFTMetadataBatch"
    payload = {"tokens": input, "refreshCache": False}
    headers = {
        "accept": "application/json",
        "content-type": "application/json"
    }
    response = requests.post(url, json=payload, headers=headers)
    print("get nft addi_data code:", response.status_code)
    data = response.json()
    out = []
    for i in range(len(data["nfts"])):
        nft_data = nfts[i]
        nft_additional_data = data["nfts"][i]
        opensea_metadata = nft_additional_data["contract"]["openSeaMetadata"]

        name = nft_additional_data["name"]
        if not name:
            name = nft_data[3]
        colle_name = opensea_metadata["collectionName"]
        image = nft_additional_data["image"]["cachedUrl"]
        if not image or image[:16] == "https://ipfs.io/":
            image = opensea_metadata["imageUrl"]
        fp = opensea_metadata["floorPrice"]
        opensea_url = nft_data[4]

        url_parts = opensea_url.split("/")
        collection_addr = url_parts[-2]
        identifier = url_parts[-1]
        out.append([name, colle_name, image, collection_addr, identifier, None, opensea_url]) # final; was about to implement verified status checker but no time hence 'None'
    return out

def alchemy_process_2(nfts):
    input = []
    for nft in nfts:
        input.append({"contractAddress": nft[1], 
                      "tokenId": nft[2],
                      "tokenType": nft[3]})
        
    url = f"https://eth-mainnet.g.alchemy.com/nft/v3/{alchemy_api_key}/getNFTMetadataBatch"
    payload = {"tokens": input, "refreshCache": False}
    headers = {
        "accept": "application/json",
        "content-type": "application/json"
    }
    response = requests.post(url, json=payload, headers=headers)
    print("get nft addi_data code:", response.status_code)
    data = response.json()
    out = []
    for i in range(len(data["nfts"])):
        nft_data = nfts[i]
        nft_additional_data = data["nfts"][i]
        opensea_metadata = nft_additional_data["contract"]["openSeaMetadata"]

        name = nft_additional_data["name"]
        if not name:
            name = None
        colle_name = opensea_metadata["collectionName"]
        image = nft_additional_data["image"]["cachedUrl"]
        if not image or image[:16] == "https://ipfs.io/":
            image = opensea_metadata["imageUrl"]
        opensea_url = f"https://opensea.io/assets/ethereum/{nft_data[1]}/{nft_data[2]}"
        
        out.append([nft_data[0], name, colle_name, image, nft_data[1], nft_data[2], opensea_url]) # final
    return out

@app.route('/search-wallet', methods=['POST'])
def search_wallet():
    data = request.get_json()
    # Perform processing with the received data
    wallet_address = data['walletAddress']
    cursor = data['cursor']
    mode = data['mode']
    if mode == "default" or mode == 'everything':
        (nfts, next) = get_nfts_acc(wallet_address, cursor)
        nfts_processed = alchemy_process(nfts)
    elif mode == 'listed':
        (nfts_processed, next) = get_nfts_listed_acc(wallet_address, cursor)
    else:
        (nfts, next) = get_nfts_acc(wallet_address, cursor)
        nfts_processed = alchemy_process(nfts)
    #use alchemy to process nfts
    
    processed_data = {
        'message': 'Data processed successfully',
        'input_data': [wallet_address, cursor, mode],
        'output': nfts_processed,
        'next': next
    }
    return jsonify(processed_data)

# load images and stuff from gallery data
@app.route('/load-gallery-items', methods=['POST'])
def load_gallery_items():
    data = request.get_json()
    # Perform processing with the received data
    nfts = [[nft["id"], nft["contract_addr"], nft["token_id"], None] for nft in data]
    #use alchemy to process nfts
    nfts_processed = alchemy_process_2(nfts)
    processed_data = {
        'message': 'Data processed successfully',
        'input_data': data,
        'output': nfts_processed,
        'next': None
    }
    return jsonify(processed_data)


# get collections api

def load_collections(cursor, sort, count): # get collections
    if cursor:
        url = f"https://api.opensea.io/api/v2/collections?chain=ethereum&limit={count}&next={cursor}&order_by={sort}"
    else:
        collections = []
        url = f"https://api.opensea.io/api/v2/collections?chain=ethereum&limit={count}&order_by={sort}"
    response = requests.get(url, headers=opensea_headers)
    print("load collections code:", response.status_code)
    data = response.json()
    if 'next' in data:
        next = data['next']
    else:
        next = False
    collections_raw = data['collections']
    collections = []
    for collection in collections_raw:
        name = collection["name"]
        slug = collection["collection"]
        image = collection["image_url"]
        category = collection["category"]
        opensea_url = collection["opensea_url"]
        image_banner = collection["banner_image_url"]
        collections.append([name, slug, image, category, opensea_url, image_banner]) # nft_data
    return (collections, next)

def search_collections(collection, cursor, sort): # get collections
    if cursor:
        url = f"https://eth-mainnet.g.alchemy.com/nft/v3/{alchemy_api_key}/searchContractMetadata?query={collection}"
    else:
        url = f"https://eth-mainnet.g.alchemy.com/nft/v3/{alchemy_api_key}/searchContractMetadata?query={collection}"
    print(url)
    response = requests.get(url, headers=alchemy_headers)
    print("search collections code:", response.status_code)
    data = response.json()
    next = None
    collections_raw = data['contracts']
    collections = []
    for collection in collections_raw:
        opensea_metadata = collection["openSeaMetadata"]
        name = opensea_metadata["collectionName"]
        slug = opensea_metadata["collectionSlug"]
        image = opensea_metadata["imageUrl"]
        supply = collection["totalSupply"]
        opensea_url = f"https://opensea.io/collection/{slug}"
        collections.append([name, slug, image, supply, opensea_url, None]) # nft_data
    return (collections, next)

def additional_info(collections):
    out = []
    for collection in collections:
        slug = collection[1]
        url = f"https://api.opensea.io/api/v2/collections/{slug}/stats"
        print(url)
        response = requests.get(url, headers=opensea_headers)
        print("get collections addi_info code:", response.status_code)
        data = response.json()
        out.append(collection + [data["total"], data["intervals"]])
    return out

@app.route('/search-collection', methods=['POST'])
def load_collection():
    data = request.get_json()
    collection = data['collection']
    cursor = data['cursor']
    count = data['count']
    if data['sort'] == '':
        sort = "seven_day_volume"
    else:
        sort = data['sort']
    if collection:
        (collections, next) = search_collections(collection, cursor, sort)
    else:
        (collections, next) = load_collections(cursor, sort, count)
    collections_processed = additional_info(collections)
    processed_data = {
        'message': 'Data processed successfully',
        'input_data': [collection, cursor],
        'output': collections_processed,
        'next': next
    }
    return jsonify(processed_data)

# load account dashboard

@app.route('/wallet-stats', methods=['POST'])
def load_wallet():
    input_data = request.get_json()
    wallet_address = input_data['walletAddress']
    if not wallet_address:
        processed_data = {'error': 'Please input wallet address in settings!'}
        return jsonify(processed_data)
    url = f"https://eth-mainnet.g.alchemy.com/v2/{alchemy_api_key}"
    payload = {
        "id": 1,
        "jsonrpc": "2.0",
        "params": [wallet_address, "latest"],
        "method": "eth_getBalance"
    }
    headers = {
        "accept": "application/json",
        "content-type": "application/json"
    }
    response = requests.post(url, json=payload, headers=headers)
    raw_data = response.json()
    print(raw_data)
    if (response.status_code) == 500:
        return jsonify({'error': 'Internal server error, please try again later.'})
    else:
        processed_data = {
            'message': 'Data processed successfully',
            'input_data': [wallet_address],
            'output': int(raw_data["result"], 16) / 10**18
        }
        return jsonify(processed_data)

# notification feature

## ping every minute for floor price < set price

def fetch_floor_prices():
    try:
        print("Fetching start...")
        conn = sqlitecloud.connect("sqlitecloud://cqjrg3d9ik.sqlite.cloud:8860?apikey=zabyXKNXskraNAGE2Af86sowyOyHGz76mym0lMCyRTo")
        cursor = conn.cursor()
        cursor.execute('USE DATABASE database.sqlite;')

        cursor.execute('SELECT * FROM watchlist')
        collections = cursor.fetchall()
        print(f"Fetched {len(collections)} collections")

        for collection in collections:
            print(collection)
            user_id = collection[1]
            collection_slug = collection[2]
            collection_name = collection[3]
            set_price = collection[4]

            if not set_price:
                print(f"{collection[3]} no set price")
                continue

            url = f'https://api.opensea.io/api/v2/collections/{collection_slug}/stats'
            response = requests.get(url, headers=opensea_headers)
            response_data = response.json()
            floor_price = float(response_data['total']['floor_price'])

            if floor_price < set_price:
                print(f"{collection[3]} below set price")
                notify_user(user_id, collection_slug, collection_name, floor_price)
            else:
                print(f"{collection[3]} at or above set price")

        conn.close()
    except Exception as e:
        print(f"Error fetching floor prices: {e}")

def notify_user(user_id, collection_slug, collection_name, floor_price):
    conn = sqlitecloud.connect("sqlitecloud://cqjrg3d9ik.sqlite.cloud:8860?apikey=zabyXKNXskraNAGE2Af86sowyOyHGz76mym0lMCyRTo")
    cursor = conn.cursor()
    cursor.execute('USE DATABASE database.sqlite;')

    # Check if the notification already exists
    cursor.execute('SELECT * FROM notifications WHERE user_id = ? AND collection_slug = ?', (user_id, collection_slug))
    notification = cursor.fetchone()
    formatted_now_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    if notification:
        # Update the existing notification, only floor_price and updatedAt is updated
        cursor.execute('UPDATE notifications SET floor_price = ?, updatedAt = ? WHERE user_id = ? AND collection_slug = ?',
                       (floor_price, formatted_now_time, user_id, collection_slug))
        print(f"update notification user {user_id}: {collection_name} floor price dropped to {floor_price}")
    else:
        # Insert a new notification
        cursor.execute('INSERT INTO notifications (user_id, collection_slug, collection_name, floor_price, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
                       (user_id, collection_slug, collection_name, floor_price, formatted_now_time, formatted_now_time))
        # Emit WebSocket message for new notification
        socketio.emit('floor-price-notification', {
            'user_id': user_id,
            'collection_slug': collection_slug,
            'collection_name': collection_name,
            'floor_price': floor_price
        })
        print(f"Notify user {user_id}: {collection_name} floor price dropped to {floor_price}")
    
    conn.commit()
    conn.close()

scheduler = BackgroundScheduler()
scheduler.add_job(func=fetch_floor_prices, trigger="interval", minutes=1, id='floor_price_job', replace_existing=True)
scheduler.start()

##

@app.route('/notifications', methods=['GET'])
def get_notifications(user_id):
    try:
        conn = sqlitecloud.connect("sqlitecloud://cqjrg3d9ik.sqlite.cloud:8860?apikey=zabyXKNXskraNAGE2Af86sowyOyHGz76mym0lMCyRTo")
        cursor = conn.cursor()
        cursor.execute('USE DATABASE database.sqlite;')

        cursor.execute('SELECT * FROM notifications WHERE user_id = ?', (user_id,))
        notifications = cursor.fetchall()
        conn.close()

        notifications_list = [
            {
                "id": notification[0],
                "user_id": notification[1],
                "collection_name": notification[3],
                "floor_price": notification[4],
                "createdAt": notification[5],
                "updatedAt": notification[6]
            }
            for notification in notifications
        ]

        return jsonify(notifications_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
###
# sales graph endpoint
###

def iterate_sales(sales):
    out = []
    for sale in sales:
        dt_object = datetime.fromtimestamp(sale["event_timestamp"])
        out.append((dt_object, int(sale["payment"]["quantity"]) / 10**18, sale["payment"]["symbol"]))
    return out

def get_sales_amount_list(slug, start_time, cursor, results):
    url = f"https://api.opensea.io/api/v2/events/collection/{slug}?after={start_time}&event_type=sale&limit=50&next={cursor}"
    response = requests.get(url, headers=opensea_headers)
    print("Sales request status code:", response.status_code)
    data = response.json()
    
    sales = data.get('asset_events', [])
    results.extend(iterate_sales(sales))
    
    next_cursor = data.get('next', '')
    if next_cursor:
        time.sleep(delay)
        get_sales_amount_list(slug, start_time, next_cursor, results)
    return results

def get_sales_data(slug, x_days_ago):
    today = datetime.today().replace(microsecond=0)
    results = get_sales_amount_list(slug, today - timedelta(days=x_days_ago) - timedelta(hours=8), '', [])
    return results

@app.route('/sales-graph/load', methods=['POST'])
def sales_graph():
    data = request.json

    name = data.get("name")
    slug = data.get("slug")
    x_days_ago = data.get("interval")

    """
    # Dummy sales data for demonstration, pls replace with actual api call
    dummy_sales_data = {
        "dates": pd.date_range(start="2022-01-01", periods=1000, freq='D').tolist(),
        "price": np.random.uniform(low=0.1, high=5.0, size=1000).tolist(),
        "currency": np.random.choice(["WETH", "ETH"], size=1000).tolist()
    }
    dates = pd.to_datetime(dummy_sales_data["dates"])
    sales = dummy_sales_data["price"]
    currency = dummy_sales_data["currency"]
    """
    real_sales_data = get_sales_data(slug, x_days_ago)
    dates = [pd.to_datetime(item[0]) for item in real_sales_data]
    sales = [item[1] for item in real_sales_data]
    currency = [item[2] for item in real_sales_data]

    # Data without outliers using z-score method
    z_scores = stats.zscore(sales)
    filtered_indices = np.abs(z_scores) < 2
    sales_data_no_outlier = [item for i, item in enumerate(real_sales_data) if filtered_indices[i]]
    dates_no_outlier = [pd.to_datetime(item[0]) for item in sales_data_no_outlier]
    sales_no_outlier = [item[1] for item in sales_data_no_outlier]
    currency_no_outlier = [item[2] for item in sales_data_no_outlier]

    # Function to create heatmap
    def create_heatmap(dates, sales):

        # Convert dates to NumPy array and then to numeric for histogram
        dates_numeric = np.array([date.value for date in dates])

        # Bins
        x_bins = np.linspace(min(dates_numeric), max(dates_numeric), 100)  # Convert datetime to numeric for histogram
        y_bins = np.linspace(min(sales), max(sales), 40)

        histogram_data, x_edges, y_edges = np.histogram2d(dates_numeric, sales, bins=(x_bins, y_bins))
        fig, ax = plt.subplots(facecolor='#DDDDDD', figsize=(10, 4))
        rotated_data = np.rot90(histogram_data)
        cmap = plt.get_cmap('inferno')
        cmap.set_bad('black')

        norm = mcolors.LogNorm(vmin=0.5, vmax=rotated_data.max())
        heatmap = ax.imshow(rotated_data, cmap=cmap, norm=norm, interpolation='nearest',
                            extent=[min(dates), max(dates), min(sales), max(sales)],
                            aspect='auto', zorder=1)
        cbar = fig.colorbar(heatmap, ax=ax, label='Number of Sales', format='%d')

        major_ticks = [1, 2, 5, 10, 20, 50, 100, 200, 500]
        adjusted_major_ticks = [tick for tick in major_ticks if tick <= rotated_data.max()]
        if rotated_data.max() not in adjusted_major_ticks:
            adjusted_major_ticks.append(rotated_data.max())
        cbar.set_ticks(adjusted_major_ticks)
        cbar.ax.minorticks_on()
        cbar.ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{int(x)}'))

        cbar.outline.set_edgecolor('gray')
        cbar.ax.tick_params(axis='y', color='gray', labelcolor='gray', which='minor', labelsize=0)
        cbar.ax.tick_params(axis='y', color='black', labelcolor='black', which='major')
        ax.tick_params(axis='y', colors='black')
        ax.tick_params(axis='x', colors='black', rotation=15)
        if x_days_ago < 7:
            date_format = DateFormatter('%m-%d %H:%M')
            ax.xaxis.set_major_formatter(date_format)
        ax.set_xlabel('time')
        ax.set_ylabel('price (ETH)')
        plt.tight_layout()

        img = io.BytesIO()
        fig.savefig(img, format='png')
        img.seek(0)
        img_base64 = base64.b64encode(img.getvalue()).decode()
        plt.close(fig)
        return img_base64

    # Function to create scatter plot
    def create_scatter(dates, sales, currency):
        dates_numeric = np.array([date.value for date in dates])

        fig, ax = plt.subplots(facecolor='#DDDDDD', figsize=(10, 4))
        point_size = 9
        color_map = {'WETH': 'red', 'ETH': 'cyan'}
        colors = [color_map[cat] for cat in currency]
        scatter = ax.scatter(dates, sales, c=colors, marker='o',
                             s=point_size, edgecolors='black', linewidths=0.5, zorder=2)
        
        ax.grid(True, linestyle='--', linewidth=0.5, color='gray')

        for label, color in color_map.items():
            ax.scatter([], [], c=color, edgecolors='black', s=point_size, label=label)

        # Calculate and plot the average price line
        df = pd.DataFrame({'dates': dates, 'sales': sales})
        average_prices = df.groupby(pd.Grouper(key='dates', freq='H'))['sales'].mean() if x_days_ago < 7 else df.groupby(df['dates'].dt.date)['sales'].mean()
        average_dates = pd.to_datetime(average_prices.index)

        ax.plot(average_dates, average_prices, color='gray', linestyle='--', linewidth=1.5, label='average')

        # Plot the trendline only if number of data points > 30
        if len(sales) > 30:
            z = np.polyfit(dates_numeric, sales, 1)
            p = np.poly1d(z)
            ax.plot(dates, p(dates_numeric), color='green', linestyle='-', linewidth=1.5, label='trendline')

        legend = ax.legend(frameon=True, loc='best', framealpha=0.5, edgecolor='black')
        legend.get_frame().set_facecolor('#EEEEEE')

        ax.tick_params(axis='y', colors='black')
        ax.tick_params(axis='x', colors='black', rotation=15)
        if x_days_ago < 7:
            date_format = DateFormatter('%m-%d %H:%M')
            ax.xaxis.set_major_formatter(date_format)
        ax.set_xlabel('time')
        ax.set_ylabel('price (ETH)')
        plt.tight_layout()

        img = io.BytesIO()
        fig.savefig(img, format='png')
        img.seek(0)
        img_base64 = base64.b64encode(img.getvalue()).decode()
        plt.close(fig)
        return img_base64

    # Function to create volume bar chart
    def create_volume_chart(dates, sales):
        df = pd.DataFrame({'dates': dates, 'sales': sales})
        df['date'] = df['dates'].dt.date
        if x_days_ago < 7:
            volume_data = df.groupby(pd.Grouper(key='dates', freq='H'))['sales'].sum()
            bar_width = 0.04
            x_label = "Hour"
        else:
            volume_data = df.groupby('date')['sales'].sum()
            bar_width = 1
            x_label = "Date"
        
        fig, ax = plt.subplots(facecolor='#DDDDDD', figsize=(10, 4))
        ax.bar(volume_data.index, volume_data.values, color='gray', width=bar_width, edgecolor='black')
        ax.tick_params(axis='y', colors='black')
        ax.tick_params(axis='x', colors='black', rotation=15)
        if x_days_ago < 7:
            date_format = DateFormatter('%m-%d %H:%M')
            ax.xaxis.set_major_formatter(date_format)
        ax.set_xlabel(x_label)
        ax.set_ylabel('Volume (ETH)')
        plt.tight_layout()

        img = io.BytesIO()
        fig.savefig(img, format='png')
        img.seek(0)
        img_base64 = base64.b64encode(img.getvalue()).decode()
        plt.close(fig)
        return img_base64

    # Create heatmap, scatter, and volume chart for both datasets
    img_heatmap_base64 = create_heatmap(dates, sales)
    img_heatmap_no_outlier_base64 = create_heatmap(dates_no_outlier, sales_no_outlier)
    img_scatter_base64 = create_scatter(dates, sales, currency)
    img_scatter_no_outlier_base64 = create_scatter(dates_no_outlier, sales_no_outlier, currency_no_outlier)
    img_vol_base64 = create_volume_chart(dates, sales)
    img_vol_no_outlier_base64 = create_volume_chart(dates_no_outlier, sales_no_outlier)

    return jsonify({
        "heatmap": img_heatmap_base64,
        "scatter": img_scatter_base64,
        "volume": img_vol_base64,
        "heatmap_no_outlier": img_heatmap_no_outlier_base64,
        "scatter_no_outlier": img_scatter_no_outlier_base64,
        "volume_no_outlier": img_vol_no_outlier_base64
    })

'''
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8080, debug=False) 
    # starts the Flask app and enables WebSocket support through the Flask-SocketIO extension
'''