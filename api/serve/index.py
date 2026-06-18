import json
import urllib.parse


def _parse_path(request):
    path = None
    if hasattr(request, 'path'):
        path = request.path
    elif hasattr(request, 'url'):
        path = request.url
    elif hasattr(request, 'headers') and request.headers:
        path = request.headers.get('x-now-original-path') or request.headers.get('x-forwarded-path')
    if not path:
        return ''
    p = urllib.parse.urlparse(path).path
    if '/api/' in p:
        return p.split('/api/', 1)[1].strip('/')
    if p.startswith('/api'):
        return p[len('/api'):].lstrip('/')
    return p.lstrip('/')


def _json_resp(status, obj):
    return {"statusCode": status, "headers": {"Content-Type": "application/json"}, "body": json.dumps(obj)}


def handler(request):
    action = _parse_path(request)
    method = getattr(request, 'method', None) or (request.headers.get('x-now-method') if hasattr(request, 'headers') else None)
    if not method and hasattr(request, 'get_data'):
        method = 'GET'
    try:
        if action.startswith('auth_register') and method == 'POST':
            raw = request.body if hasattr(request, 'body') else request.get_data()
            if isinstance(raw, bytes):
                body = json.loads(raw.decode())
            else:
                body = json.loads(raw)
            from server_impl.auth_register_impl import do_register
            status, data = do_register(body)
            return _json_resp(status, data)
        if action.startswith('auth_login') and method == 'POST':
            raw = request.body if hasattr(request, 'body') else request.get_data()
            if isinstance(raw, bytes):
                body = json.loads(raw.decode())
            else:
                body = json.loads(raw)
            from server_impl.auth_login_impl import do_login
            status, data = do_login(body)
            return _json_resp(status, data)
        if action.startswith('auth_me') and method in ('GET', 'POST'):
            headers = getattr(request, 'headers', {})
            auth = headers.get('authorization') or headers.get('Authorization')
            from server_impl.auth_me_impl import do_me
            status, data = do_me(auth)
            return _json_resp(status, data)
    except Exception as e:
        return _json_resp(500, {"error": "internal", "detail": str(e)})
    return _json_resp(404, {"error": "not found"})
