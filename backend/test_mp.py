import requests

token = 'APP_USR-3690100384507084-041421-e2103fff4c833950884a07490ea3506d-3335977677'
preference_data = {
    'items': [
        {
            'title': 'Prueba',
            'quantity': 1,
            'unit_price': 1.00,
            'currency_id': 'USD'
        }
    ],
    'back_urls': {
        'success': 'http://localhost:5173/packages',
        'failure': 'http://localhost:5173/packages',
        'pending': 'http://localhost:5173/packages'
    },
    'external_reference': 'test_local'
}
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}
resp = requests.post('https://api.mercadopago.com/checkout/preferences', json=preference_data, headers=headers, timeout=30)
print(resp.status_code)
print(resp.text)
