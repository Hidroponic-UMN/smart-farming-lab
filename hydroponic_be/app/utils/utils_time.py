from datetime import datetime, timezone
from zoneinfo import ZoneInfo

tz_jakarta = ZoneInfo("Asia/Jakarta")
def convert_to_jakarta(dt: datetime):
    return dt.astimezone(tz_jakarta)

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)