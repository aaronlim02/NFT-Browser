import pytest
from flask import Flask, jsonify
from app import app, fetch_floor_prices, notify_user, database_url, get_sales_amount_list, iterate_sales, opensea_headers, get_sales_data, plt
from unittest.mock import patch, Mock, MagicMock
from datetime import datetime
import pandas as pd
import json

# run test with 'pytest' in cmd
# "pytest -k 'test_get_collection_name'"" tests only that test.

# Fixture for creating a test client
@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_get_collection_name(client):
    response = client.post('/get-collection-name', json={'slug': 'pudgypenguins'}) # valid slug should work
    assert response.status_code == 200
    data = response.get_json()
    assert data == "Pudgy Penguins"
    response = client.post('/get-collection-name', json={'slug': 'invalid-slug'}) # invalid slug
    assert response.status_code == 500

def test_get_item_name(client):
    # valid item
    response = client.post('/get-item-name', json={'contract': '0xbd3531da5cf5857e7cfaa92426877b022e612cf8', 'item_id': '1234'})
    assert response.status_code == 200
    data = response.get_json()
    assert data == "Pudgy Penguin #1234"
    # invalid items
    response2 = client.post('/get-item-name', json={'contract': 'fake-contract', 'item_id': '1234'})
    assert response2.status_code == 400
    response3 = client.post('/get-item-name', json={'contract': '0xbd3531da5cf5857e7cfaa92426877b022e612cf8', 'item_id': 'invalid-id'})
    assert response3.status_code == 400

def test_search_wallet_default(client): # test wallet explorer 'everything' mode
    response = client.post('/search-wallet', json={'walletAddress': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'cursor': '', 'mode': 'default'})
    assert response.status_code == 200
    data = response.get_json()
    assert 'output' in data
    assert 'next' in data

def test_search_wallet_listed(client): # test wallet explorer 'listed' mode
    response = client.post('/search-wallet', json={'walletAddress': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'cursor': '', 'mode': 'listed'})
    assert response.status_code == 200
    data = response.get_json()
    assert 'output' in data
    assert 'next' in data

def test_load_gallery_items(client):
    # Valid input data
    data = [
        {"id": 1, "contract_addr": "0xa4871fee6118387959d4c935a91095c99081b7e5", "token_id": "8321"},
        {"id": 2, "contract_addr": "0xa4871fee6118387959d4c935a91095c99081b7e5", "token_id": "6744"}
    ]
    
    response = client.post('/load-gallery-items', json=data)
    
    assert response.status_code == 200
    response_json = response.get_json()
    assert response_json['message'] == 'Data processed successfully'
    assert response_json['input_data'] == data
    assert len(response_json['output']) == 2

# search collections

def test_load_collection_valid(client):
    # Valid collection query, returns results from 'bored'
    data = {
        'collection': 'bored',
        'cursor': None,
        'count': 20,
        'sort': 'seven_day_volume'
    }
    
    response = client.post('/search-collection', json=data)
    
    assert response.status_code == 200
    response_json = response.get_json()
    assert response_json['message'] == 'Data processed successfully'
    assert response_json['input_data'] == ['bored', None]
    assert len(response_json['output']) == 20

def test_load_collection_empty_query(client):
    # Empty collection query, returns results from all collections
    data = {
        'collection': '',
        'cursor': None,
        'count': 10,
        'sort': 'seven_day_volume'
    }
    
    response = client.post('/search-collection', json=data)
    
    assert response.status_code == 200
    response_json = response.get_json()
    assert response_json['message'] == 'Data processed successfully'
    assert response_json['input_data'] == ['', None]
    assert len(response_json['output']) == 10

def test_load_collection_invalid_query(client):
    # Invalid collection query should return nothing in output
    data = {
        'collection': 'non-existent-collection',
        'cursor': None,
        'count': 10,
        'sort': 'seven_day_volume'
    }
    
    response = client.post('/search-collection', json=data)
    
    assert response.status_code == 200
    response_json = response.get_json()
    assert response_json['message'] == 'Data processed successfully'
    assert response_json['input_data'] == ['non-existent-collection', None]
    assert len(response_json['output']) == 0
    assert response_json['next'] is None

# retrieve wallet account

@patch('requests.post')
def test_load_wallet_valid(mock_post, client):
    # Mock the response from the external API
    mock_post.return_value.json.return_value = {
        "result": "0xDE0B6B3A7640000"  # Equivalent to 1 ETH
    }

    data = {'walletAddress': '0x1234567890abcdef1234567890abcdef12345678'}
    response = client.post('/wallet-stats', json=data)
    
    assert response.status_code == 200
    response_json = response.get_json()
    assert response_json['message'] == 'Data processed successfully'
    assert response_json['input_data'] == [data['walletAddress']]
    assert response_json['output'] == 1.0  # 1 ETH in decimal

def test_load_wallet_missing_address(client):
    data = {'walletAddress': None}
    response = client.post('/wallet-stats', json=data)
    
    assert response.status_code == 200
    response_json = response.get_json()
    assert response_json['error'] == 'Please input wallet address in settings!'

@patch('requests.post')
def test_load_wallet_api_error(mock_post, client):
    # Mock the response from the external API to simulate an error
    mock_response = Mock()
    mock_response.status_code = 500
    mock_post.return_value = mock_response

    data = {'walletAddress': '0x1234567890abcdef1234567890abcdef12345678'}
    response = client.post('/wallet-stats', json=data)
    
    response_json = response.get_json()
    # The output should be None or handle as per actual implementation if error occurs
    assert response_json['error'] == "Internal server error, please try again later."

@pytest.fixture
def mock_db():
    # Mocking the database connection and cursor
    with patch('sqlite3.connect') as mock_connect:
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        yield mock_cursor

def test_fetch_floor_prices(mock_db): # test fetching floor prices for notification feature
    # Mock the requests.get method
    with patch('requests.get') as mock_get:
        # Setup mock response for the API request
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'total': {'floor_price': '0.5'}
        }
        mock_get.return_value = mock_response

        # Test if fetch_floor_prices function works as expected
        fetch_floor_prices()

        # Assert if the database interaction happened as expected
        mock_db.execute.assert_called()  # Ensure that database execute method was called
        # Add more asserts to check specific calls and values if necessary


def test_notify_user(mock_db): # expects data to be inserted into user's notifications
    user_id = 1
    collection_slug = 'example-slug'
    collection_name = 'Example Collection'
    set_price = 0.2  # Price to compare against
    floor_price = 0.1  # Simulated fetched floor price

    # Setup the mock database responses for fetching watchlist
    mock_db.fetchall.return_value = [
        (1, user_id, collection_slug, collection_name, set_price)
    ]
    
    # Mock the requests.get method to simulate API response
    with patch('requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'total': {'floor_price': str(floor_price)}
        }
        mock_get.return_value = mock_response

        fixed_now = datetime(2024, 1, 1, 0, 0, 0)
        with patch('app.datetime') as mock_datetime:
            mock_datetime.now.return_value = fixed_now
        
            # Run the function that should execute the SQL commands
            fetch_floor_prices()

            # Check if the correct SQL commands were run
            call_args = mock_db.execute.call_args_list

            # Verify that SELECT query was called to check for existing notifications
            assert call_args[1][0] == (('SELECT * FROM notifications WHERE user_id = ? AND collection_slug = ?', (user_id, collection_slug)))

            # Verify that INSERT query was called to create a new notification
            assert call_args[2][0] == (('UPDATE notifications SET floor_price = ?, updatedAt = ? WHERE user_id = ? AND collection_slug = ?',
                        (floor_price, fixed_now.strftime('%Y-%m-%d %H:%M:%S'), user_id, collection_slug)))

### sales data 

@pytest.fixture
def mock_get():
    with patch('requests.get') as mock:
        yield mock

def test_get_sales_amount_list(mock_get): # expects getting sale data
    # Mock API responses
    mock_response_1 = MagicMock()
    mock_response_1.status_code = 200
    mock_response_1.json.return_value = {
        'asset_events': [
            {
                "event_timestamp": 1638316800,
                "payment": {
                    "quantity": "1000000000000000000",
                    "symbol": "ETH"
                }
            }
        ],
        'next': 'next_cursor_value'
    }
    
    mock_response_2 = MagicMock()
    mock_response_2.status_code = 200
    mock_response_2.json.return_value = {
        'asset_events': [
            {
                "event_timestamp": 1638403200,
                "payment": {
                    "quantity": "2000000000000000000",
                    "symbol": "ETH"
                }
            }
        ],
        'next': ''
    }
    
    # Set up the mock to return different responses on successive calls
    mock_get.side_effect = [mock_response_1, mock_response_2]

    slug = 'example_slug'
    start_time = '2021-12-01T00:00:00Z'
    cursor = ''
    results = []

    # Call the function
    final_results = get_sales_amount_list(slug, start_time, cursor, results)

    # Assertions
    assert len(final_results) == 2
    assert final_results[0] == (datetime.fromtimestamp(1638316800), 1.0, 'ETH')
    assert final_results[1] == (datetime.fromtimestamp(1638403200), 2.0, 'ETH')

    # Ensure requests.get was called with the correct URL
    mock_get.assert_any_call(f"https://api.opensea.io/api/v2/events/collection/{slug}?after={start_time}&event_type=sale&limit=50&next={cursor}", headers=opensea_headers)
    mock_get.assert_any_call(f"https://api.opensea.io/api/v2/events/collection/{slug}?after={start_time}&event_type=sale&limit=50&next=next_cursor_value", headers=opensea_headers)

def test_iterate_sales():
    # Sample sales data
    sales = [
        {
            "event_timestamp": 1638316800,
            "payment": {
                "quantity": "1000000000000000000",
                "symbol": "ETH"
            }
        },
        {
            "event_timestamp": 1638403200,
            "payment": {
                "quantity": "2000000000000000000",
                "symbol": "ETH"
            }
        }
    ]
    
    # Call the function
    result = iterate_sales(sales)
    
    # Assertions
    assert len(result) == 2
    assert result[0] == (datetime.fromtimestamp(1638316800), 1.0, 'ETH')
    assert result[1] == (datetime.fromtimestamp(1638403200), 2.0, 'ETH')

### sales graph

@pytest.fixture
def mock_plt():
    with patch('matplotlib.pyplot') as mock:
        yield mock

@pytest.fixture
def mock_get_sales_data():
    with patch('app.get_sales_data') as mock:
        yield mock

def test_sales_graph(mock_plt, mock_get_sales_data, client): # expects all graphs to be generated
    # Mock sales data
    mock_get_sales_data.return_value = [
        (pd.Timestamp('2023-07-01'), 1.0, 'ETH'),
        (pd.Timestamp('2023-07-02'), 2.0, 'WETH'),
        (pd.Timestamp('2023-07-03'), 1.5, 'ETH')
    ]

    # Mock matplotlib functions
    mock_fig = MagicMock()
    mock_ax = MagicMock()
    mock_plt.subplots.return_value = (mock_fig, mock_ax)
    mock_img = MagicMock()
    mock_img.seek.return_value = None
    mock_img.getvalue.return_value = b'fake_image_data'
    mock_plt.savefig = MagicMock()

    # Make a POST request to the sales-graph endpoint
    response = client.post('/sales-graph/load', json={
        'name': 'Example Collection',
        'slug': 'example_slug',
        'interval': 30
    })

    # Assertions
    assert response.status_code == 200
    response_json = json.loads(response.data)

    # Check that all keys are in the response
    expected_keys = [
        "heatmap", "scatter", "volume",
        "heatmap_no_outlier", "scatter_no_outlier", "volume_no_outlier"
    ]
    assert all(key in response_json for key in expected_keys)

    # Assert that all values for the expected keys are not null
    for key in expected_keys:
        value = response_json.get(key)
        assert value is not None