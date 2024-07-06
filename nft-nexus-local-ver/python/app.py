from flask import Flask, request, jsonify
import json
from flask_cors import CORS
import requests
import time
import os
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)
load_dotenv()

opensea_api_key = "d7bc517c25894772ae915ef729c8a443"
alchemy_api_key = "Fn6XgY7SlhdqnbN09xv5QFenmRxaK0Ej"

delay = 0.4

opensea_headers = {
    "accept": "application/json",
    "X-API-KEY": opensea_api_key
}

alchemy_headers = {"accept": "application/json"}

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
    print(url)
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
        nfts.append([collection, collection_name, identifier, name, img, price, opensea_url, is_verified, is_creator_fees_enforced]) # nft_data_listed
    
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
    print(url)
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
        out.append([name, colle_name, image, fp, opensea_url]) # final
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

# get collections api

def load_collections(cursor, sort, count): # get collections
    if cursor:
        url = f"https://api.opensea.io/api/v2/collections?chain=ethereum&limit={count}&next={cursor}&order_by={sort}"
    else:
        collections = []
        url = f"https://api.opensea.io/api/v2/collections?chain=ethereum&limit={count}&order_by={sort}"
    print(url)
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
    wallet_address = input_data['walletAddress']['walletAddress']
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
    processed_data = {
        'message': 'Data processed successfully',
        'input_data': [wallet_address],
        'output': int(raw_data["result"], 16) / 10**18
    }
    return jsonify(processed_data)


if __name__ == '__main__':
    app.run(port=5001)