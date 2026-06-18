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


def _handle_request(request):
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


def app(environ, start_response):
    class Req:
        pass

    req = Req()
    req.method = environ.get('REQUEST_METHOD', 'GET')
    # headers
    headers = {}
    for k, v in environ.items():
        if k.startswith('HTTP_'):
            hn = k[5:].replace('_', '-').title()
            headers[hn] = v
    # content headers
    if 'CONTENT_TYPE' in environ:
        headers['Content-Type'] = environ['CONTENT_TYPE']
    if 'CONTENT_LENGTH' in environ:
        headers['Content-Length'] = environ['CONTENT_LENGTH']
    req.headers = headers
    # path
    req.path = environ.get('RAW_URI') or environ.get('PATH_INFO') or ''
    # body
    try:
        length = int(environ.get('CONTENT_LENGTH', '0') or 0)
    except Exception:
        length = 0
    if length:
        body = environ['wsgi.input'].read(length)
    else:
        body = environ['wsgi.input'].read() or b''
    req.body = body
    req.get_data = lambda: req.body

    resp = _handle_request(req)
    status = resp.get('statusCode', 200)
    body = resp.get('body', '')
    headers = resp.get('headers', {})
    start_response(f"{status} OK", list(headers.items()))
    if isinstance(body, str):
        body = body.encode()
    return [body]
