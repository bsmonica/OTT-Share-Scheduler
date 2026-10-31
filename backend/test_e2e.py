import urllib.request
import json

def post(url, data, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request('http://127.0.0.1:8000' + url, data=json.dumps(data).encode(), headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return {'status_code': e.code, 'detail': json.loads(e.read().decode())['detail']}

def get(url, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request('http://127.0.0.1:8000' + url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def run():
    print("--- STARTING COMPREHENSIVE END-TO-END VERIFICATION ---")
    
    # 1. Login Student
    login_monica = post('/auth/login', {'email': 'monica@college.edu', 'password': 'Password123!'})
    token_m = login_monica['access_token']
    print('[E2E 1] Student logged in:', login_monica['user']['name'])

    # 2. Get Subscriptions & Groups
    groups = get('/groups', token_m)
    subs = get('/subscriptions', token_m)
    print(f'[E2E 2] Student has {len(groups)} groups, {len(subs)} subscriptions')

    # 3. Check live slot availability
    sub_id = subs[0]['id']
    avail = get(f'/bookings/availability?subscription_id={sub_id}&booking_date=2026-10-10', token_m)
    print(f'[E2E 3] Slot availability for {subs[0]["platform_name"]}: {len(avail["slots"])} slots generated')

    # 4. Trigger AI recommendation on booked slot
    rec = post('/scheduler/recommend', {
        'group_id': groups[0]['id'],
        'subscription_id': sub_id,
        'booking_date': '2026-10-10',
        'start_time': '19:00',
        'end_time': '20:00'
    }, token_m)
    print('[E2E 4] AI Scheduler Recommendation response: is_available =', rec['is_requested_available'])

    # 5. Check Notifications
    notifs = get('/notifications', token_m)
    print(f'[E2E 5] Notifications: {notifs["total_count"]} total, {notifs["unread_count"]} unread')

    # 6. Login Admin and check reports
    login_admin = post('/auth/login', {'email': 'admin@college.edu', 'password': 'AdminPassword123!'})
    token_a = login_admin['access_token']
    reports = get('/admin/reports', token_a)
    print(f'[E2E 6] Admin Reports: Users={reports["total_users"]}, Groups={reports["total_groups"]}, Bookings={reports["total_bookings"]}')
    print('       Most used platforms:', [p['platform_name'] for p in reports['most_used_platforms']])
    print('       Popular hours:', [h['hour_slot'] for h in reports['popular_viewing_times']])
    print("--- ALL E2E INTEGRATION FLOWS VERIFIED SUCCESSFULLY! ---")

if __name__ == '__main__':
    run()
