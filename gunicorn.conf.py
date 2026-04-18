# Gunicorn configuration — auto-loaded from the backend directory
# timeout must exceed the LLM API call duration (~44s)
timeout = 300
keepalive = 5
workers = 4
worker_class = 'uvicorn.workers.UvicornWorker'
bind = '0.0.0.0:8000'
accesslog = '/home/admin/twinbuddy/logs/gunicorn_access.log'
errorlog = '/home/admin/twinbuddy/logs/gunicorn_error.log'
