import sys
from pathlib import Path

ENGINE_PATH = Path(__file__).resolve().parents[1] / "packages" / "market-engine"
sys.path.insert(0, str(ENGINE_PATH))
