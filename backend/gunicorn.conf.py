bind = "127.0.0.1:8001"
workers = 4
worker_class = "sync"
timeout = 120
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
worker_tmp_dir = "/dev/shm"
