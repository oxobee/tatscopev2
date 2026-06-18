import json


def json_response(obj, status=200):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(obj),
    }


def handler(request):
    try:
        raw = request.body if hasattr(request, 'body') else request.get_data()
        if isinstance(raw, bytes):
            body = json.loads(raw.decode())
        else:
            body = json.loads(raw)
    except Exception:
        return json_response({"error": "invalid json"}, status=400)
    from server_impl.auth_register_impl import do_register
    status, data = do_register(body)
    return json_response(data, status=status)
