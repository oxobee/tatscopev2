import json


def handler(request):
    try:
        raw = request.body if hasattr(request, 'body') else request.get_data()
        if isinstance(raw, bytes):
            body = json.loads(raw.decode())
        else:
            body = json.loads(raw)
    except Exception:
        return {"statusCode": 400, "headers": {"Content-Type": "application/json"}, "body": json.dumps({"error": "invalid json"})}
    # defer to implementation
    from server_impl.auth_login_impl import do_login
    status, data = do_login(body)
    return {"statusCode": status, "headers": {"Content-Type": "application/json"}, "body": json.dumps(data)}
