# TOFAUTI Market Worker

The demo worker currently runs in-process with FastAPI so local development requires no Redis or second process. `WarRoomRuntime` is the worker boundary: it owns provider subscription, engine execution, snapshot creation, setup tracking, and event publication.

For production, this directory is the home for a standalone worker that will use the same runtime and publish to Redis/PostgreSQL. The API and engines will not need to change when that process is introduced.
